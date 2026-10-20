import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { ResourceItem, ReportItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ReportModalProps {
  resource: ResourceItem | null;
  onClose: () => void;
}

const REPORT_REASONS = [
  'ลิงก์เสีย / ไม่สามารถเข้าถึงสื่อได้',
  'ละเมิดลิขสิทธิ์ / สิทธิบัตรทางปัญญา',
  'เนื้อหาไม่เหมาะสม / หยาบคาย / มีความรุนแรง',
  'ข้อมูลไม่ถูกต้อง / บิดเบือนข้อเท็จจริง',
  'สแปม / การค้าหรือโฆษณาแอบแฝง',
  'หมวดหมู่วิชาไม่ตรงกับเนื้อหา',
  'อื่นๆ',
];

export const ReportModal: React.FC<ReportModalProps> = ({ resource, onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนทำการรายงานเนื้อหา', 'info');
      return;
    }

    setIsLoading(true);
    const newDocRef = doc(collection(db, 'reports'));
    const path = `reports/${newDocRef.id}`;

    const reportData: ReportItem = {
      id: newDocRef.id,
      resourceId: resource.id,
      resourceTitle: resource.title,
      reportedByUid: user.uid,
      reportedByEmail: user.email || '',
      reason,
      details: details.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(newDocRef, reportData);
      showToast('ส่งรายงานเนื้อหาให้ผู้ดูแลระบบตรวจสอบเรียบร้อยแล้ว ขอบคุณที่ร่วมดูแลชุมชน', 'success');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">รายงานเนื้อหาที่ไม่เหมาะสม</h3>
              <p className="text-xs text-rose-100">ช่วยแจ้งเตือนทีมงานเพื่อดำเนินการตรวจสอบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-400 font-medium block">สื่อที่รายงาน:</span>
            <span className="font-bold text-gray-800 line-clamp-1 mt-0.5">{resource.title}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              เหตุผลในการรายงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              placeholder="ระบุข้อสังเกตหรือลิงก์ที่มีปัญหาเพิ่มเติม..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-60 flex items-center gap-2"
            >
              {isLoading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการรายงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
