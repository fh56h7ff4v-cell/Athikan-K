import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Settings as SettingsIcon,
  FileText,
  Trash2,
  EyeOff,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ExternalLink,
  Clock,
  UserCheck,
  UserX,
  History,
  Save,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ReportItem, UserProfile, ModerationLogItem, ResourceItem } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isModerator } = useAuth();
  const { settings, updateSettings, addCategory, removeCategory } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'settings' | 'logs'>('reports');

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Users state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Logs state
  const [logs, setLogs] = useState<ModerationLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Settings form state
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(settings.isAnnouncementActive);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Confirm delete modal state
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'resource' | 'report';
    targetId: string;
    resourceTitle?: string;
  }>({ isOpen: false, type: 'resource', targetId: '' });

  // Sync settings when loaded
  useEffect(() => {
    setSiteTitle(settings.siteTitle);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement);
    setIsAnnouncementActive(settings.isAnnouncementActive);
  }, [settings]);

  // Log an action to moderationLogs
  const addModerationLog = async (action: string, targetType: 'resource' | 'user' | 'settings', targetId: string, details: string) => {
    if (!user) return;
    const logDocRef = doc(collection(db, 'moderationLogs'));
    const logItem: ModerationLogItem = {
      id: logDocRef.id,
      action,
      targetType,
      targetId,
      details,
      performedByUid: user.uid,
      performedByEmail: user.email || '',
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(logDocRef, logItem);
    } catch (e) {
      console.warn('Log write note:', e);
    }
  };

  // 1. Fetch Reports
  useEffect(() => {
    if (!isAdmin && !isModerator) return;
    const path = 'reports';
    const unsub = onSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as ReportItem);
        // sort by createdAt desc
        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setReports(list);
        setReportsLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
        setReportsLoading(false);
      }
    );
    return () => unsub();
  }, [isAdmin, isModerator]);

  // 2. Fetch Users
  useEffect(() => {
    if (!isAdmin && !isModerator) return;
    const fetchUsers = async () => {
      const path = 'users';
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map((d) => d.data() as UserProfile);
        setUsersList(list);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [isAdmin, isModerator]);

  // 3. Fetch Moderation Logs
  useEffect(() => {
    if (!isAdmin && !isModerator) return;
    const path = 'moderationLogs';
    const unsub = onSnapshot(
      collection(db, 'moderationLogs'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as ModerationLogItem);
        list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
        setLogs(list);
        setLogsLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
        setLogsLoading(false);
      }
    );
    return () => unsub();
  }, [isAdmin, isModerator]);

  // Handler: Resolve or Dismiss Report
  const handleUpdateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const reportRef = doc(db, 'reports', reportId);
    const path = `reports/${reportId}`;
    try {
      await updateDoc(reportRef, {
        status,
        resolvedAt: new Date().toISOString(),
        resolvedBy: user?.uid || 'admin',
      });
      await addModerationLog(
        `report_${status}`,
        'resource',
        reportId,
        `ปรับสถานะรายงานเป็น ${status === 'resolved' ? 'ดำเนินการแล้ว' : 'ยกเลิกคำขอ'}`
      );
      showToast(`อัปเดตสถานะรายงานเป็น "${status === 'resolved' ? 'แก้ไขแล้ว' : 'ปฏิเสธ'}" สำเร็จ`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Handler: Hide or Unhide Resource
  const handleToggleHideResource = async (resourceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'hidden' ? 'published' : 'hidden';
    const resRef = doc(db, 'resources', resourceId);
    const path = `resources/${resourceId}`;
    try {
      await updateDoc(resRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await addModerationLog(
        newStatus === 'hidden' ? 'hide_resource' : 'publish_resource',
        'resource',
        resourceId,
        `เปลี่ยนสถานะการแสดงผลเป็น ${newStatus}`
      );
      showToast(`เปลี่ยนสถานะสื่อเป็น "${newStatus === 'hidden' ? 'ซ่อน' : 'เผยแพร่'}" สำเร็จ`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Handler: Delete Resource
  const handleDeleteResource = async (resourceId: string) => {
    const resRef = doc(db, 'resources', resourceId);
    const path = `resources/${resourceId}`;
    try {
      await deleteDoc(resRef);
      await addModerationLog('delete_resource', 'resource', resourceId, 'ลบสื่อการเรียนรู้ออกจากฐานข้อมูลถาวร');
      showToast('ลบสื่อการเรียนรู้สำเร็จแล้ว', 'success');
      setConfirmDeleteModal({ isOpen: false, type: 'resource', targetId: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Handler: Toggle User Role & Status
  const handleUpdateUser = async (targetUid: string, updates: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', targetUid);
    const path = `users/${targetUid}`;
    try {
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // If making admin, update admins collection
      if (updates.role === 'admin') {
        const u = usersList.find((x) => x.uid === targetUid);
        if (u) {
          await setDoc(doc(db, 'admins', targetUid), {
            email: u.email,
            grantedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }

      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, ...updates } : u))
      );

      await addModerationLog('update_user', 'user', targetUid, `อัปเดตข้อมูลผู้ใช้: ${JSON.stringify(updates)}`);
      showToast('บันทึกการเปลี่ยนแปลงสถานะผู้ใช้งานสำเร็จ', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingSettings(true);
    try {
      await updateSettings(
        {
          siteTitle: siteTitle.trim(),
          siteDescription: siteDescription.trim(),
          announcement: announcement.trim(),
          isAnnouncementActive,
        },
        user.uid
      );
      await addModerationLog('update_settings', 'settings', 'general', 'แก้ไขการตั้งค่าเว็บไซต์และคำประกาศ');
      showToast('บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว', 'success');
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !user) return;
    try {
      await addCategory(newCatName.trim(), user.uid);
      await addModerationLog('add_category', 'settings', 'general', `เพิ่มหมวดหมู่ใหม่: ${newCatName.trim()}`);
      setNewCatName('');
      showToast(`เพิ่มหมวดหมู่ "${newCatName.trim()}" เรียบร้อยแล้ว`, 'success');
    } catch {
      showToast('ไม่สามารถเพิ่มหมวดหมู่ได้', 'error');
    }
  };

  const handleRemoveCategory = async (cat: string) => {
    if (!user) return;
    if (confirm(`คุณต้องการลบหมวดหมู่ "${cat}" หรือไม่?`)) {
      try {
        await removeCategory(cat, user.uid);
        await addModerationLog('remove_category', 'settings', 'general', `ลบหมวดหมู่: ${cat}`);
        showToast(`ลบหมวดหมู่ "${cat}" สำเร็จ`, 'info');
      } catch {
        showToast('ไม่สามารถลบหมวดหมู่ได้', 'error');
      }
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">แผงควบคุมผู้ดูแลระบบ (Admin Dashboard)</h1>
              <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                {isAdmin ? 'Super Admin' : 'Moderator'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              ตรวจสอบรายงานเนื้อหา จัดการสิทธิ์สมาชิก และตั้งค่าเว็บไซต์แบบ Real-time
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[11px] text-gray-400 block font-medium">รายงานที่รอตรวจ</span>
            <span className="text-lg font-bold text-amber-400">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[11px] text-gray-400 block font-medium">สมาชิกทั้งหมด</span>
            <span className="text-lg font-bold text-sky-400">{usersList.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>รายงานเนื้อหา ({reports.filter((r) => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>ตั้งค่าเว็บไซต์ & หมวดหมู่</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>บันทึกการทำงาน (Audit Logs)</span>
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">รายการสื่อที่ถูกรายงานโดยสมาชิก</h2>
            <span className="text-xs text-gray-500">
              พบทั้งหมด {reports.length} รายการ
            </span>
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center text-gray-400">กำลังโหลดรายการรายงาน...</div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800 text-base">ไม่มีรายการรายงานในขณะนี้</h3>
              <p className="text-xs text-gray-500">ชุมชนการเรียนรู้มีความสงบเรียบร้อย</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`bg-white rounded-2xl p-5 border shadow-xs space-y-3 transition ${
                    report.status === 'pending'
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-gray-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 mr-2">
                        {report.reason}
                      </span>
                      <span className="text-xs text-gray-400">
                        รายงานเมื่อ {new Date(report.createdAt).toLocaleString('th-TH')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          report.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : report.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {report.status === 'pending' && 'รอการตรวจสอบ'}
                        {report.status === 'resolved' && 'ดำเนินการแล้ว'}
                        {report.status === 'dismissed' && 'ปฏิเสธคำขอ'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">สื่อเป้าหมาย:</p>
                    <h3 className="text-sm font-bold text-gray-900">{report.resourceTitle}</h3>
                    {report.details && (
                      <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                        <strong>รายละเอียด:</strong> {report.details}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 pt-1">
                      ผู้รายงาน: {report.reportedByEmail || report.reportedByUid}
                    </p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleHideResource(report.resourceId, 'published')}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> ซ่อนสื่อนี้
                    </button>

                    <button
                      onClick={() =>
                        setConfirmDeleteModal({
                          isOpen: true,
                          type: 'resource',
                          targetId: report.resourceId,
                          resourceTitle: report.resourceTitle,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบสื่อถาวร
                    </button>

                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                          className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition"
                        >
                          ปฏิเสธคำขอ
                        </button>
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                        >
                          ทำเครื่องหมายว่าจัดการแล้ว
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">จัดการข้อมูลและบทบาทของสมาชิก</h2>
              <p className="text-xs text-gray-500">
                กำหนดสิทธิ์สมาชิก (Member, Moderator, Admin) หรือระงับบัญชีผู้ใช้งาน
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ อีเมล หรือบทบาท..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-4">สมาชิก</th>
                  <th className="py-3 px-4">อีเมล</th>
                  <th className="py-3 px-4">บทบาทปัจจุบัน</th>
                  <th className="py-3 px-4">สถานะบัญชี</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((m) => (
                  <tr key={m.uid} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      {m.photoURL ? (
                        <img
                          src={m.photoURL}
                          alt={m.displayName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                          {(m.displayName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-gray-900 block">{m.displayName}</span>
                        <span className="text-[10px] text-gray-400">{m.uid.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{m.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateUser(m.uid, { role: e.target.value as any })}
                        disabled={!isAdmin && m.role === 'admin'}
                        className="py-1 px-2 rounded-lg bg-gray-50 border border-gray-200 font-semibold text-gray-700 focus:outline-hidden"
                      >
                        <option value="member">สมาชิก (Member)</option>
                        <option value="moderator">ผู้ช่วยดูแล (Moderator)</option>
                        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          m.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.status === 'active' ? 'ปกติ (Active)' : 'ระงับ (Suspended)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateUser(m.uid, { status: 'suspended' })}
                          className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold"
                        >
                          ระงับบัญชี
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUser(m.uid, { status: 'active' })}
                          className="px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold"
                        >
                          ปลดระงับ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & CATEGORIES */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Site Config */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              การตั้งค่าข้อมูลเว็บไซต์และคำประกาศ
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อเว็บไซต์</label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">คำอธิบายเว็บไซต์</label>
                <textarea
                  rows={2}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">ข้อความประกาศหน้าแรก</label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnnouncementActive}
                      onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>เปิดแสดงประกาศ</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </form>
          </div>

          {/* Categories Management (Add / Delete live without code) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              จัดการหมวดหมู่วิชา (เพิ่ม/ลบได้ทันที)
            </h2>
            <p className="text-xs text-gray-500">
              หมวดหมู่ทั้งหมดจะอัปเดตไปยังตัวกรองและฟอร์มโพสต์สื่อของทุกคนทันที
            </p>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="ชื่อหมวดหมู่วิชาใหม่..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </form>

            {/* List of categories */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {settings.categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/70 hover:bg-blue-50/50 transition"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-800">{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="p-1 text-gray-400 hover:text-rose-600 transition rounded-md"
                    title="ลบหมวดหมู่นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODERATION AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              ประวัติการดำเนินงานของผู้ดูแลระบบ (Audit Trail)
            </h2>
            <span className="text-xs text-gray-400">บันทึกอัตโนมัติ ห้ามแก้ไข</span>
          </div>

          {logsLoading ? (
            <div className="py-8 text-center text-gray-400 text-xs">กำลังโหลดบันทึก...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">ยังไม่มีบันทึกการดำเนินงาน</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                      <span className="text-gray-500 font-medium">{log.details}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">
                      ดำเนินการโดย: {log.performedByEmail} (ID: {log.targetId})
                    </span>
                  </div>

                  <span className="text-gray-400 whitespace-nowrap text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-gray-900">ยืนยันการลบสื่อถาวร?</h3>
              <p className="text-xs text-gray-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบสื่อ{' '}
                <strong className="text-gray-800">"{confirmDeleteModal.resourceTitle}"</strong>{' '}
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal({ isOpen: false, type: 'resource', targetId: '' })}
                className="py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteResource(confirmDeleteModal.targetId)}
                className="py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-md"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
