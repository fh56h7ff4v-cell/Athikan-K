import React from 'react';
import {
  FileText,
  Video,
  Globe,
  Presentation,
  BookOpen,
  Eye,
  Heart,
  Share2,
  Flag,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  User,
} from 'lucide-react';
import { ResourceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorited: boolean;
  onToggleFavorite: (resource: ResourceItem) => void;
  onOpenDetail: (resource: ResourceItem) => void;
  onEdit?: (resource: ResourceItem) => void;
  onDelete?: (resource: ResourceItem) => void;
  onReport?: (resource: ResourceItem) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  onToggleFavorite,
  onOpenDetail,
  onEdit,
  onDelete,
  onReport,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const isOwner = Boolean(user && user.uid === resource.authorId);
  const canManage = isOwner || isAdmin;

  // Icon selector based on media type
  const getTypeIcon = (type: string) => {
    if (type.includes('วิดีโอ')) return <Video className="w-4 h-4 text-rose-500" />;
    if (type.includes('เอกสาร') || type.includes('PDF')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (type.includes('สไลด์')) return <Presentation className="w-4 h-4 text-amber-500" />;
    if (type.includes('เว็บไซต์') || type.includes('บทความ')) return <Globe className="w-4 h-4 text-emerald-500" />;
    return <BookOpen className="w-4 h-4 text-indigo-500" />;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resource.url || window.location.href);
      showToast('คัดลอกลิงก์สื่อเรียบร้อยแล้ว', 'success');
    } else {
      showToast('ลิงก์สื่อ: ' + (resource.url || window.location.href), 'info');
    }
  };

  const formattedDate = resource.createdAt
    ? new Date(resource.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div
      onClick={() => onOpenDetail(resource)}
      className="group bg-white rounded-2xl border border-blue-100 hover:border-blue-300 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      <div>
        {/* Card Header Media/Thumbnail */}
        <div className="relative h-44 bg-gradient-to-tr from-slate-100 to-blue-50 overflow-hidden flex items-center justify-center">
          {resource.thumbnailUrl ? (
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-blue-300 group-hover:scale-110 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shadow-inner">
                {getTypeIcon(resource.resourceType)}
              </div>
              <span className="text-[11px] font-semibold text-blue-400 mt-2">
                {resource.resourceType}
              </span>
            </div>
          )}

          {/* Media Type Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[11px] font-semibold text-gray-800 shadow-xs">
            {getTypeIcon(resource.resourceType)}
            <span>{resource.resourceType.split(' ')[0]}</span>
          </div>

          {/* Hidden status badge */}
          {resource.status === 'hidden' && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs">
              ซ่อนอยู่ (Hidden)
            </div>
          )}

          {/* Favorite heart action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource);
            }}
            className={`absolute bottom-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md active:scale-90 ${
              isFavorited
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:bg-white'
            }`}
            aria-label={isFavorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Card Content Body */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Category & Level Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
              {resource.category}
            </span>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {resource.educationLevel}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {resource.title}
          </h3>

          {/* Description Excerpt */}
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between text-xs text-gray-500">
        {/* Author info */}
        <div className="flex items-center gap-2 min-w-0">
          {resource.authorPhoto ? (
            <img
              src={resource.authorPhoto}
              alt={resource.authorName}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px] flex items-center justify-center shrink-0">
              {(resource.authorName || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="truncate max-w-[100px] sm:max-w-[120px] font-medium text-gray-700">
            {resource.authorName || 'ผู้แบ่งปัน'}
          </span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-400" title="ยอดเข้าชม">
            <Eye className="w-3.5 h-3.5" />
            {resource.viewCount || 0}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400" title="รายการโปรด">
            <Heart className="w-3.5 h-3.5" />
            {resource.favoriteCount || 0}
          </span>

          {/* Actions toolbar */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
            <button
              onClick={handleShare}
              className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-white transition"
              title="แชร์ลิงก์"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {canManage && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(resource);
                }}
                className="p-1 text-gray-400 hover:text-amber-600 rounded-md hover:bg-white transition"
                title="แก้ไขข้อมูลสื่อ"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {canManage && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(resource);
                }}
                className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-white transition"
                title="ลบสื่อ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!isOwner && onReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(resource);
                }}
                className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-white transition"
                title="รายงานเนื้อหาไม่เหมาะสม"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
