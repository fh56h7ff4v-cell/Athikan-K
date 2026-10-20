import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { SearchAndFilters } from './components/SearchAndFilters';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { CreateResourceModal } from './components/CreateResourceModal';
import { AuthModal } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { FavoritesView } from './components/FavoritesView';
import { MyResourcesView } from './components/MyResourcesView';
import { AdminDashboard } from './components/AdminDashboard';
import { ResourceItem, FavoriteItem } from './types';
import { INITIAL_SEED_RESOURCES } from './lib/seedData';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Heart,
  PlusCircle,
  HelpCircle,
  Shield,
  Search,
  RefreshCw,
} from 'lucide-react';

function MainApp() {
  const { user, isAdmin, isModerator } = useAuth();
  const { showToast } = useToast();

  // Navigation tab: 'home' | 'favorites' | 'my-resources' | 'admin'
  const [currentTab, setCurrentTab] = useState('home');

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Favorites state for current user
  const [favoriteMap, setFavoriteMap] = useState<Map<string, string>>(new Map()); // resourceId -> favoriteId

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedLevel, setSelectedLevel] = useState('ทั้งหมด');
  const [selectedType, setSelectedType] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'favorites'>('latest');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);

  const [detailModalResource, setDetailModalResource] = useState<ResourceItem | null>(null);
  const [reportingResource, setReportingResource] = useState<ResourceItem | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);

  // 1. Subscribe to public resources
  useEffect(() => {
    const path = 'resources';
    const unsub = onSnapshot(
      collection(db, 'resources'),
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as ResourceItem);
        setResources(items);
        setLoadingResources(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setLoadingResources(false);
      }
    );

    return () => unsub();
  }, []);

  // 2. Subscribe to user's favorites
  useEffect(() => {
    if (!user) {
      setFavoriteMap(new Map());
      return;
    }

    const path = 'favorites';
    const unsub = onSnapshot(
      collection(db, 'favorites'),
      (snapshot) => {
        const map = new Map<string, string>();
        snapshot.docs.forEach((d) => {
          const data = d.data() as FavoriteItem;
          if (data.userId === user.uid) {
            map.set(data.resourceId, d.id);
          }
        });
        setFavoriteMap(map);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsub();
  }, [user]);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (resource: ResourceItem) => {
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด', 'info');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    const favDocId = `${user.uid}_${resource.id}`;
    const isFav = favoriteMap.has(resource.id);
    const favRef = doc(db, 'favorites', favDocId);
    const resRef = doc(db, 'resources', resource.id);

    try {
      if (isFav) {
        // Delete favorite
        await deleteDoc(favRef);
        // decrement favoriteCount
        await updateDoc(resRef, {
          favoriteCount: increment(-1),
          updatedAt: new Date().toISOString(),
        });
        showToast('ลบออกจากรายการโปรดแล้ว', 'info');
      } else {
        // Add favorite
        const newFav: FavoriteItem = {
          id: favDocId,
          userId: user.uid,
          resourceId: resource.id,
          resourceTitle: resource.title,
          resourceCategory: resource.category,
          resourceType: resource.resourceType,
          createdAt: new Date().toISOString(),
        };
        await setDoc(favRef, newFav);
        // increment favoriteCount
        await updateDoc(resRef, {
          favoriteCount: increment(1),
          updatedAt: new Date().toISOString(),
        });
        showToast('บันทึกลงรายการโปรดเรียบร้อยแล้ว', 'success');
      }
    } catch (err: any) {
      showToast('ไม่สามารถบันทึกรายการโปรดได้ กรุณาลองใหม่', 'error');
    }
  };

  // Seed sample educational resources
  const handleSeedData = async () => {
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนทำการนำเข้าข้อมูลตัวอย่าง', 'info');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    setIsSeeding(true);
    try {
      for (const item of INITIAL_SEED_RESOURCES) {
        const newDocRef = doc(collection(db, 'resources'));
        const resourceItem: ResourceItem = {
          ...item,
          id: newDocRef.id,
          authorId: user.uid,
          authorName: user.displayName || item.authorName,
          authorEmail: user.email || item.authorEmail,
          authorPhoto: user.photoURL || '',
        };
        await setDoc(newDocRef, resourceItem);
      }
      showToast('เพิ่มสื่อการเรียนรู้ตัวอย่าง 6 รายการสำเร็จแล้ว!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => {
        // Only show published resources, or author's own hidden items, or admin
        if (r.status === 'hidden') {
          if (!user || (r.authorId !== user.uid && !isAdmin && !isModerator)) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ทั้งหมด' && r.category !== selectedCategory) {
          return false;
        }

        // Education level filter
        if (selectedLevel !== 'ทั้งหมด' && r.educationLevel !== selectedLevel) {
          return false;
        }

        // Resource type filter
        if (selectedType !== 'ทั้งหมด' && r.resourceType !== selectedType) {
          return false;
        }

        // Search text
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(query);
          const matchDesc = r.description.toLowerCase().includes(query);
          const matchCat = r.category.toLowerCase().includes(query);
          const matchAuthor = (r.authorName || '').toLowerCase().includes(query);
          return matchTitle || matchDesc || matchCat || matchAuthor;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'views') {
          return (b.viewCount || 0) - (a.viewCount || 0);
        }
        if (sortBy === 'favorites') {
          return (b.favoriteCount || 0) - (a.favoriteCount || 0);
        }
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [resources, user, isAdmin, isModerator, selectedCategory, selectedLevel, selectedType, searchTerm, sortBy]);

  const favoriteIdsSet = useMemo(() => new Set(favoriteMap.keys()), [favoriteMap]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-white to-blue-50/30 text-gray-800 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuthModal={(mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenCreateModal={() => {
          setEditingResource(null);
          setCreateModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* VIEW: HOME / DISCOVER */}
        {currentTab === 'home' && (
          <div className="space-y-8">
            {/* Search, Hero Banner & Filters */}
            <SearchAndFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalResults={filteredResources.length}
            />

            {/* Resource Grid / Loading / Empty States */}
            {loadingResources ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse"
                  >
                    <div className="h-44 bg-gray-200 rounded-xl" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-10 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-dashed border-blue-200 space-y-5 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-bold text-gray-800 text-lg">ไม่พบสื่อการเรียนรู้ที่ตรงกับเงื่อนไข</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    ลองค้นหาด้วยคำอื่น เปลี่ยนตัวกรองหมวดหมู่วิชา หรือร่วมเป็นคนแรกที่แบ่งปันสื่อในหัวข้อนี้
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('ทั้งหมด');
                      setSelectedLevel('ทั้งหมด');
                      setSelectedType('ทั้งหมด');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs sm:text-sm transition"
                  >
                    ล้างการค้นหา
                  </button>

                  <button
                    onClick={() => {
                      if (!user) {
                        showToast('กรุณาเข้าสู่ระบบก่อนโพสต์สื่อ', 'info');
                        setAuthModalMode('login');
                        setAuthModalOpen(true);
                        return;
                      }
                      setEditingResource(null);
                      setCreateModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>แบ่งปันสื่อใหม่</span>
                  </button>

                  {/* Seed Starter button if database is totally empty */}
                  {resources.length === 0 && (
                    <button
                      onClick={handleSeedData}
                      disabled={isSeeding}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isSeeding ? 'กำลังโหลดข้อมูล...' : 'โหลดตัวอย่าง 6 สื่อคุณภาพ'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isFavorited={favoriteIdsSet.has(resource.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetail={(res) => setDetailModalResource(res)}
                    onEdit={(res) => {
                      setEditingResource(res);
                      setCreateModalOpen(true);
                    }}
                    onDelete={async (res) => {
                      if (confirm(`คุณต้องการลบสื่อ "${res.title}" หรือไม่?`)) {
                        try {
                          await deleteDoc(doc(db, 'resources', res.id));
                          showToast('ลบสื่อเรียบร้อยแล้ว', 'info');
                        } catch {
                          showToast('ไม่สามารถลบสื่อได้', 'error');
                        }
                      }
                    }}
                    onReport={(res) => setReportingResource(res)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: FAVORITES */}
        {currentTab === 'favorites' && (
          <FavoritesView
            onOpenDetail={(res) => setDetailModalResource(res)}
            onToggleFavorite={handleToggleFavorite}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {/* VIEW: MY RESOURCES */}
        {currentTab === 'my-resources' && (
          <MyResourcesView
            onOpenCreate={() => {
              setEditingResource(null);
              setCreateModalOpen(true);
            }}
            onOpenDetail={(res) => setDetailModalResource(res)}
            onEdit={(res) => {
              setEditingResource(res);
              setCreateModalOpen(true);
            }}
            onDelete={async (res) => {
              if (confirm(`คุณต้องการลบสื่อ "${res.title}" หรือไม่?`)) {
                try {
                  await deleteDoc(doc(db, 'resources', res.id));
                  showToast('ลบสื่อเรียบร้อยแล้ว', 'info');
                } catch {
                  showToast('ไม่สามารถลบสื่อได้', 'error');
                }
              }
            }}
            onToggleFavorite={handleToggleFavorite}
            favoriteIds={favoriteIdsSet}
          />
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-blue-100 py-10 text-gray-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">คลังปัญญา (KlangPanya)</p>
              <p className="text-[11px] text-gray-400">
                แพลตฟอร์มคลังความรู้และการแบ่งปันเพื่อสังคมแห่งการเรียนรู้
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>เชื่อมต่อกับ Cloud Firestore & Firebase Auth</span>
            <span>•</span>
            <span>รองรับนักเรียน นักศึกษา และครูทุกสังกัด</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <CreateResourceModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingResource(null);
        }}
        editItem={editingResource}
      />

      <ResourceDetailModal
        resource={detailModalResource}
        onClose={() => setDetailModalResource(null)}
        isFavorited={Boolean(detailModalResource && favoriteIdsSet.has(detailModalResource.id))}
        onToggleFavorite={handleToggleFavorite}
        onEdit={(res) => {
          setEditingResource(res);
          setCreateModalOpen(true);
        }}
        onDelete={async (res) => {
          if (confirm(`คุณต้องการลบสื่อ "${res.title}" หรือไม่?`)) {
            try {
              await deleteDoc(doc(db, 'resources', res.id));
              showToast('ลบสื่อเรียบร้อยแล้ว', 'info');
              setDetailModalResource(null);
            } catch {
              showToast('ไม่สามารถลบสื่อได้', 'error');
            }
          }
        }}
        onReport={(res) => setReportingResource(res)}
      />

      <ReportModal
        resource={reportingResource}
        onClose={() => setReportingResource(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
