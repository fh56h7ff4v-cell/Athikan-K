import React, { useEffect, useState } from 'react';
import { Heart, BookOpen, Trash2, ExternalLink } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ResourceCard } from './ResourceCard';
import { ResourceItem, FavoriteItem } from '../types';

interface FavoritesViewProps {
  onOpenDetail: (res: ResourceItem) => void;
  onToggleFavorite: (res: ResourceItem) => void;
  onGoHome: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onOpenDetail,
  onToggleFavorite,
  onGoHome,
}) => {
  const { user } = useAuth();
  const [favoriteResources, setFavoriteResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavoriteResources([]);
      setLoading(false);
      return;
    }

    const path = 'favorites';
    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const favItems = snapshot.docs.map((d) => d.data() as FavoriteItem);
        // Fetch matching resources from resources collection
        const resourcePromises = favItems.map(async (fav) => {
          try {
            const docSnap = await getDoc(doc(db, 'resources', fav.resourceId));
            if (docSnap.exists()) {
              return docSnap.data() as ResourceItem;
            }
          } catch (e) {
            console.warn('Resource fetch error in favorites:', e);
          }
          return null;
        });

        const resolved = (await Promise.all(resourcePromises)).filter(Boolean) as ResourceItem[];
        setFavoriteResources(resolved);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 font-medium">กำลังโหลดรายการโปรดของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 fill-white" />
            <h1 className="text-xl sm:text-2xl font-bold">รายการโปรดที่บันทึกไว้</h1>
          </div>
          <p className="text-xs sm:text-sm text-rose-100">
            คลังสื่อที่คุณบันทึกไว้สำหรับอ่านหรือเรียนรู้ซ้ำ ซิงค์ข้อมูลอัตโนมัติทุกอุปกรณ์
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-center">
          <span className="text-xs text-rose-100 block">ทั้งหมด</span>
          <span className="text-xl font-black">{favoriteResources.length}</span>
        </div>
      </div>

      {favoriteResources.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-gray-800 text-base">ยังไม่มีรายการโปรด</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              เมื่อคุณพบสื่อการเรียนรู้ บทความ หรือใบงานที่น่าสนใจ ให้กดไอคอนรูปหัวใจเพื่อบันทึกไว้ที่นี่
            </p>
          </div>
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-md"
          >
            ไปสำรวจคลังความรู้
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isFavorited={true}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
