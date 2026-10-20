import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { signInWithGoogle, signUpWithEmail, loginWithEmail, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMsg('');
    setResetSent(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    }
    if (code.includes('email-already-in-use')) {
      return 'อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบหรือใช้รหัสผ่านลืม';
    }
    if (code.includes('weak-password')) {
      return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    }
    if (code.includes('invalid-email')) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (code.includes('popup-closed-by-user')) {
      return 'คุณปิดหน้าต่างการเข้าสู่ระบบก่อนดำเนินการเสร็จสิ้น';
    }
    return error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
          setIsLoading(false);
          return;
        }
        await loginWithEmail(email.trim(), password);
        showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับครับ/ค่ะ', 'success');
        handleClose();
      } else if (mode === 'register') {
        if (!displayName.trim() || !email.trim() || !password) {
          setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, displayName.trim());
        showToast('สมัครสมาชิกสำเร็จ ระบบได้ส่งอีเมลยืนยันตัวตนไปยังกล่องจดหมายของคุณแล้ว', 'success');
        handleClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('กรุณากรอกอีเมลที่ใช้สมัคร');
          setIsLoading(false);
          return;
        }
        await resetPassword(email.trim());
        setResetSent(true);
        showToast('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว', 'success');
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      showToast('เข้าสู่ระบบด้วยบัญชี Google สำเร็จ', 'success');
      handleClose();
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 p-6 text-white text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">
            {mode === 'login' && 'เข้าสู่ระบบคลังปัญญา'}
            {mode === 'register' && 'สร้างบัญชีสมาชิกใหม่'}
            {mode === 'forgot' && 'รีเซ็ตรหัสผ่าน'}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            {mode === 'login' && 'เข้าสู่ระบบเพื่อเข้าถึงรายการโปรดและร่วมแบ่งปันความรู้'}
            {mode === 'register' && 'ร่วมเป็นส่วนหนึ่งของชุมชนแห่งการเรียนรู้'}
            {mode === 'forgot' && 'ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ'}
          </p>
        </div>

        {/* Tab switcher for login / register */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>
        )}

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">ส่งอีเมลเรียบร้อยแล้ว</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto mb-6">
                เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง <strong className="text-gray-800">{email}</strong> แล้ว กรุณาตรวจสอบกล่องข้อความหรือโฟลเดอร์สแปม
              </p>
              <button
                onClick={() => {
                  setMode('login');
                  setResetSent(false);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    ชื่อ-นามสกุล หรือชื่อที่ใช้แสดง
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น ครูสมชาย หรือ นศ.วิชัย"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      รหัสผ่าน (Password)
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg('');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md"
                      aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'เข้าสู่ระบบ'}
                      {mode === 'register' && 'ยืนยันการสมัครสมาชิก'}
                      {mode === 'forgot' && 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  ย้อนกลับไปหน้าเข้าสู่ระบบ
                </button>
              )}
            </form>
          )}

          {/* Social Sign-in Divider */}
          {mode !== 'forgot' && !resetSent && (
            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-xs text-gray-400 uppercase font-medium">หรือ</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full mt-4 py-2.5 px-4 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center gap-3 transition shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
