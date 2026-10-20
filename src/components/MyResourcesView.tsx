import React, { useEffect, useState } from 'react';
import { FileText, PlusCircle, Edit3, Trash2, Eye, Heart, ExternalLink } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ResourceCard } from './ResourceCard';
import { ResourceItem } from '../types';

interface MyResourcesViewProps {
  onOpenCreate: () => void;
  onOpenDetail: (res: ResourceItem) => void;
  onEdit: (res: ResourceItem) => void;
  onDelete: (res: ResourceItem) => void;
  onToggleFavorite: (res: ResourceItem) => void;
  favoriteIds: Set<string>;
}

export const MyResourcesView: React.FC<MyResourcesViewProps> = ({
  onOpenCreate,
  onOpenDetail,
  onEdit,
  onDelete,
  onToggleFavorite,
  favoriteIds,
}) => {
  const { user } = useAuth();
  const [myResources, setMyResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMyResources([]);
      setLoading(false);
      return;
    }

    const path = 'resources';
    const q = query(collection(db, 'resources'), where('authorId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as ResourceItem);
        items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setMyResources(items);
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
        <p className="text-sm text-gray-500 font-medium">กำลังโหลดผลงานของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-bold">สื่อและผลงานของฉัน</h1>
          </div>
          <p className="text-xs sm:text-sm text-blue-100">
            จัดการ แก้ไข หรือติดตามสถิติการเข้าชมสื่อการเรียนรู้ที่คุณได้แบ่งปัน
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-800 font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>แบ่งปันสื่อใหม่</span>
        </button>
      </div>

      {myResources.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-gray-800 text-base">คุณยังไม่ได้แบ่งปันสื่อใดๆ</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              ร่วมเป็นผู้ให้ในสังคมแห่งการเรียนรู้ แบ่งปันสไลด์ ใบงาน คลิปสอน หรือบทความดีๆ ให้แก่เพื่อนๆ และคุณครู
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-md"
          >
            เริ่มแบ่งปันสื่อชิ้นแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isFavorited={favoriteIds.has(resource.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
