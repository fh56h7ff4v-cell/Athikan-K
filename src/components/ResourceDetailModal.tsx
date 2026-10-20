import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Heart,
  Share2,
  Flag,
  Edit3,
  Trash2,
  Calendar,
  Eye,
  User,
  BookOpen,
  Layers,
  ChevronRight,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { ResourceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ResourceDetailModalProps {
  resource: ResourceItem | null;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (resource: ResourceItem) => void;
  onEdit?: (resource: ResourceItem) => void;
  onDelete?: (resource: ResourceItem) => void;
  onReport?: (resource: ResourceItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  isFavorited,
  onToggleFavorite,
  onEdit,
  onDelete,
  onReport,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (resource?.id) {
      // Increment view counter silently
      const ref = doc(db, 'resources', resource.id);
      updateDoc(ref, {
        viewCount: increment(1),
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        // Non-blocking if fails
        console.warn('View count update error:', err);
      });
    }
  }, [resource?.id]);

  if (!resource) return null;

  const isOwner = Boolean(user && user.uid === resource.authorId);
  const canManage = isOwner || isAdmin;

  // Helper to detect YouTube video embeds
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const youtubeEmbed = getYouTubeEmbedUrl(resource.url || '');

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resource.url || window.location.href);
      showToast('คัดลอกลิงก์เรียบร้อยแล้ว', 'success');
    }
  };

  const formattedDate = resource.createdAt
    ? new Date(resource.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header Bar with Breadcrumb */}
        <div className="px-5 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto py-1">
            <span className="font-medium text-gray-700 whitespace-nowrap">คลังความรู้</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-blue-600 font-medium whitespace-nowrap">{resource.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-xs text-gray-400 font-medium">
              {resource.title}
            </span>
          </nav>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition shrink-0 ml-3"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* Media / Video Preview */}
          {youtubeEmbed ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md">
              <iframe
                src={youtubeEmbed}
                title={resource.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : resource.thumbnailUrl ? (
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 shadow-inner flex items-center justify-center">
              <img
                src={resource.thumbnailUrl}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          {/* Badges & Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {resource.category}
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              {resource.educationLevel}
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
              {resource.resourceType}
            </span>
            {resource.status === 'hidden' && (
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                สถานะ: ซ่อนเนื้อหา (เฉพาะผู้สร้างหรือแอดมิน)
              </span>
            )}
          </div>

          {/* Resource Title */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-snug">
            {resource.title}
          </h2>

          {/* Author and Date Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80">
            <div className="flex items-center gap-3">
              {resource.authorPhoto ? (
                <img
                  src={resource.authorPhoto}
                  alt={resource.authorName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {(resource.authorName || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {resource.authorName || 'สมาชิกผู้แบ่งปัน'}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {resource.viewCount || 0} ครั้ง
                  </span>
                </div>
              </div>
            </div>

            {/* Favorite & Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(resource)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs ${
                  isFavorited
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-white border border-gray-200 text-gray-700 hover:text-rose-500 hover:border-rose-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
                <span>{isFavorited ? 'บันทึกแล้ว' : 'บันทึกเป็นรายการโปรด'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition shadow-xs"
                title="คัดลอกลิงก์แชร์"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              รายละเอียดและคำอธิบายสื่อ
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200/60">
              {resource.description}
            </div>
          </div>

          {/* Resource Link / File Access Section */}
          {resource.url && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-sky-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs uppercase font-bold text-sky-300 tracking-wider">
                  ลิงก์เข้าถึงสื่อการเรียนรู้ต้นฉบับ
                </p>
                <p className="text-xs text-blue-100 max-w-lg truncate">
                  {resource.url}
                </p>
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm shadow-md transition whitespace-nowrap active:scale-95"
              >
                <span>เปิดดูสื่อ / ดาวน์โหลด</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Management or Report Action Footnote */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">การจัดการ:</span>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(resource);
                      }}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> แก้ไขสื่อ
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onClose();
                        onDelete(resource);
                      }}
                      className="text-rose-600 hover:underline flex items-center gap-1 font-medium ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบสื่อ
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isOwner && onReport && (
              <button
                onClick={() => {
                  onClose();
                  onReport(resource);
                }}
                className="text-gray-400 hover:text-rose-600 flex items-center gap-1 font-medium transition"
              >
                <Flag className="w-3.5 h-3.5" />
                รายงานเนื้อหาไม่เหมาะสม
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
