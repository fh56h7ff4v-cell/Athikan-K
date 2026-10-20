import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Image, BookOpen, Layers, Video, AlertCircle, Sparkles } from 'lucide-react';
import { ResourceItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ResourceItem | null;
  onSuccess?: () => void;
}

// Preset cover suggestions by subject
const SUGGESTED_THUMBNAILS = [
  { label: 'คอมพิวเตอร์ / โค้ด', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  { label: 'คณิตศาสตร์', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
  { label: 'วิทยาศาสตร์', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80' },
  { label: 'ภาษา / หนังสือ', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80' },
  { label: 'ศิลปะ / ดีไซน์', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80' },
];

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  editItem,
  onSuccess,
}) => {
  const { user, userProfile } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'hidden'>('published');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setDescription(editItem.description || '');
      setCategory(editItem.category || settings.categories[0]);
      setEducationLevel(editItem.educationLevel || settings.educationLevels[0]);
      setResourceType(editItem.resourceType || settings.resourceTypes[0]);
      setUrl(editItem.url || '');
      setThumbnailUrl(editItem.thumbnailUrl || '');
      setStatus(editItem.status || 'published');
    } else {
      setTitle('');
      setDescription('');
      setCategory(settings.categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
      setEducationLevel(settings.educationLevels[0] || 'ทุกระดับชั้น');
      setResourceType(settings.resourceTypes[0] || 'เอกสาร / ใบงาน (PDF/Doc)');
      setUrl('');
      setThumbnailUrl('');
      setStatus('published');
    }
    setErrorMsg('');
  }, [editItem, isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อ');
      return;
    }

    if (title.trim().length < 3) {
      setErrorMsg('ชื่อสื่อต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (description.trim().length < 5) {
      setErrorMsg('คำอธิบายสื่อต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return;
    }

    if (!url.trim()) {
      setErrorMsg('กรุณาระบุลิงก์เข้าถึงสื่อการเรียนรู้');
      return;
    }

    setIsLoading(true);

    try {
      if (editItem) {
        // Edit existing resource
        const resourceRef = doc(db, 'resources', editItem.id);
        const path = `resources/${editItem.id}`;
        try {
          await updateDoc(resourceRef, {
            title: title.trim(),
            description: description.trim(),
            category,
            educationLevel,
            resourceType,
            url: url.trim(),
            thumbnailUrl: thumbnailUrl.trim(),
            status,
            updatedAt: new Date().toISOString(),
          });
          showToast('บันทึกการแก้ไขสื่อการเรียนรู้สำเร็จ', 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        // Create new resource
        const newDocRef = doc(collection(db, 'resources'));
        const path = `resources/${newDocRef.id}`;
        const newResource: ResourceItem = {
          id: newDocRef.id,
          title: title.trim(),
          description: description.trim(),
          category,
          educationLevel,
          resourceType,
          url: url.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          authorId: user.uid,
          authorName: userProfile?.displayName || user.displayName || 'สมาชิกคลังปัญญา',
          authorEmail: user.email || '',
          authorPhoto: user.photoURL || '',
          status,
          viewCount: 0,
          favoriteCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(newDocRef, newResource);
          showToast('โพสต์แบ่งปันสื่อการเรียนรู้เรียบร้อยแล้ว ขอบคุณที่ร่วมสร้างสรรค์สังคมแห่งการเรียนรู้', 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editItem ? 'แก้ไขข้อมูลสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
              </h2>
              <p className="text-xs text-blue-100">
                กรอกข้อมูลสื่อให้ครบถ้วนเพื่อให้นักเรียนและคุณครูค้นหาได้ง่าย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              ชื่อสื่อการเรียนรู้ หรือหัวข้อบทเรียน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น สรุปสูตรคณิตศาสตร์ ม.ปลาย หรือ คู่มือการเขียนโปรแกรมไพธอนเบื้องต้น"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Category & Education Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {settings.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                ระดับชั้นเป้าหมาย <span className="text-rose-500">*</span>
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {settings.educationLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resource Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                ประเภทของสื่อ <span className="text-rose-500">*</span>
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {settings.resourceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                สถานะการแสดงผล
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="published">เผยแพร่สาธารณะ (Published)</option>
                <option value="hidden">ซ่อนไว้ชั่วคราว (Hidden / Draft)</option>
              </select>
            </div>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
              ลิงก์สื่อการเรียนรู้ (URL) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://... ลิงก์ Google Drive, YouTube, Canva, หรือเว็บไซต์ต้นทาง"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              รองรับลิงก์ YouTube (แสดงเครื่องเล่นอัตโนมัติ), ลิงก์ไฟล์ PDF จาก Google Drive/One Drive, หรือเว็บไซต์บทความ
            </p>
          </div>

          {/* Thumbnail URL & Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-blue-500" />
                รูปภาพหน้าปก / ตัวอย่างสื่อ (Thumbnail URL)
              </label>
              <span className="text-[11px] text-gray-400">เว้นว่างได้ถ้าไม่มี</span>
            </div>
            <input
              type="url"
              placeholder="https://... ลิงก์รูปภาพหน้าปก"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
            />

            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> เลือกภาพปกสำเร็จรูป:
              </span>
              {SUGGESTED_THUMBNAILS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => setThumbnailUrl(sug.url)}
                  className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-blue-100 text-[11px] text-gray-600 hover:text-blue-700 transition"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              คำอธิบายรายละเอียด เนื้อหา และข้อแนะนำในการเรียนรู้ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="อธิบายว่าสื่อนี้เกี่ยวกับอะไร เหมาะกับใคร มีหัวข้ออะไรบ้าง..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Submit button bar */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-60 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : editItem ? (
                'บันทึกการแก้ไข'
              ) : (
                'เผยแพร่สื่อการเรียนรู้'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
