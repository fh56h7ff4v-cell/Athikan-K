import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Heart,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  FileText,
  MailCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuthModal: (initialMode?: 'login' | 'register') => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuthModal,
  onOpenCreateModal,
}) => {
  const { user, userProfile, isAdmin, isModerator, signOut, resendVerificationEmail } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSendingVerify, setIsSendingVerify] = useState(false);

  const handleResendVerify = async () => {
    setIsSendingVerify(true);
    try {
      await resendVerificationEmail();
      showToast('ส่งลิงก์ยืนยันตัวตนไปยังอีเมลของคุณเรียบร้อยแล้ว กรุณาตรวจสอบในกล่องจดหมาย', 'success');
    } catch {
      showToast('เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน กรุณาลองใหม่อีกครั้งภายหลัง', 'error');
    } finally {
      setIsSendingVerify(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
      setIsUserMenuOpen(false);
      if (currentTab === 'favorites' || currentTab === 'my-resources' || currentTab === 'admin') {
        setCurrentTab('home');
      }
    } catch {
      showToast('ไม่สามารถออกจากระบบได้', 'error');
    }
  };

  const navLinks = [
    { id: 'home', label: 'คลังความรู้', icon: BookOpen },
    { id: 'favorites', label: 'รายการโปรด', icon: Heart, requireAuth: true },
    { id: 'my-resources', label: 'สื่อของฉัน', icon: FileText, requireAuth: true },
    ...(isAdmin || isModerator
      ? [{ id: 'admin', label: 'แผงควบคุมแอดมิน', icon: ShieldCheck, badge: 'Admin' }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
      {/* Announcement Banner */}
      {settings.isAnnouncementActive && settings.announcement && (
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2">
          <span className="bg-white/20 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide">
            ประกาศ
          </span>
          <span className="truncate max-w-4xl">{settings.announcement}</span>
        </div>
      )}

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                  คลังปัญญา
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Education Hub
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                แหล่งแบ่งปันความรู้เพื่อครูและนักเรียน
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.requireAuth && !user) {
                      showToast('กรุณาเข้าสู่ระบบเพื่อใช้งานส่วนนี้', 'info');
                      onOpenAuthModal('login');
                      return;
                    }
                    setCurrentTab(link.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action & User Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Create Resource Button */}
            <button
              onClick={() => {
                if (!user) {
                  showToast('กรุณาเข้าสู่ระบบก่อนโพสต์แบ่งปันความรู้', 'info');
                  onOpenAuthModal('login');
                  return;
                }
                onOpenCreateModal();
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden xs:inline">แบ่งปันความรู้</span>
              <span className="xs:hidden">โพสต์</span>
            </button>

            {/* Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition"
                  aria-label="เมนูผู้ใช้งาน"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20">
                      {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate">
                      {userProfile?.displayName || user.displayName || 'สมาชิก'}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium">
                      {isAdmin ? 'ผู้ดูแลระบบ' : isModerator ? 'ผู้ช่วยดูแล' : 'สมาชิก'}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">เข้าสู่ระบบด้วย</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.displayName || userProfile?.displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>

                      {/* Email verified indicator */}
                      {!user.emailVerified && user.providerData.some(p => p.providerId === 'password') && (
                        <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-[11px] text-amber-800 leading-tight mb-1.5">
                            ยังไม่ได้ยืนยันอีเมล
                          </p>
                          <button
                            onClick={handleResendVerify}
                            disabled={isSendingVerify}
                            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                          >
                            <MailCheck className="w-3.5 h-3.5" />
                            {isSendingVerify ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('my-resources');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-blue-50/70 hover:text-blue-600 text-left"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        สื่อและผลงานของฉัน
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('favorites');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-blue-50/70 hover:text-blue-600 text-left"
                      >
                        <Heart className="w-4 h-4 text-gray-400" />
                        รายการโปรดที่บันทึกไว้
                      </button>
                      {(isAdmin || isModerator) && (
                        <button
                          onClick={() => {
                            setCurrentTab('admin');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-amber-700 hover:bg-amber-50 text-left font-medium"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          จัดการระบบ (Admin Dashboard)
                        </button>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 transition"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              aria-label="เปิดเมนูมือถือ"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.requireAuth && !user) {
                    showToast('กรุณาเข้าสู่ระบบก่อนใช้งาน', 'info');
                    onOpenAuthModal('login');
                    setIsMobileMenuOpen(false);
                    return;
                  }
                  setCurrentTab(link.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          {!user && (
            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenAuthModal('login');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-medium border border-blue-300 text-blue-700 rounded-xl"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => {
                  onOpenAuthModal('register');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-medium bg-blue-600 text-white rounded-xl"
              >
                สมัครสมาชิก
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
