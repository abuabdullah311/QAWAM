import React, { useState } from 'react';
import { supabase } from '../library/supabaseClient';
import { User, Lock, Loader2 } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: () => void;
}

export function Auth({ onLoginSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (signUpError) {
         setError(signUpError.message);
         setLoading(false);
         return;
      }

      if (data.user) {
         if (data.session) {
            // Auto login after sign up if session is present
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', data.user.id);
            onLoginSuccess();
         } else {
            setSuccessMsg('تم التسجيل بنجاح، يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب (إذا كان تأكيد البريد مفعلاً)');
            setLoading(false);
         }
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
          
        onLoginSuccess();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd] p-4 sm:p-6 font-['Almarai',-apple-system,BlinkMacSystemFont,sans-serif]" dir="rtl">
      {/* Brand logo area */}
      <div className="mb-8 flex flex-col items-center">
         <span className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm font-serif mb-2">قَوَام</span>
         <span className="text-sm text-slate-500 font-medium tracking-wide uppercase">Qawam Finance</span>
      </div>

      <div className="max-w-[400px] w-full bg-white/80 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200/50 p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-bold text-slate-900 mb-2 leading-tight tracking-tight">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h2>
          <p className="text-slate-500 text-[15px] font-medium">
            {isSignUp ? 'أنشئ حسابك للبدء في استخدام قوام' : 'مرحباً بك في لوحة تحكم قوام'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-slate-600 px-1">اسم المستخدم</label>
              <div className="relative group">
                <div className="absolute inset-y-0 end-0 flex items-center justify-center w-12 pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <User size={18} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  required={isSignUp}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 py-3.5 pe-12 ps-4 rounded-xl border border-slate-200 focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all duration-200 outline-none text-[16px] text-slate-900 shadow-sm"
                  placeholder="اسم المستخدم"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-slate-600 px-1">البريد الإلكتروني</label>
            <div className="relative group">
              <div className="absolute inset-y-0 end-0 flex items-center justify-center w-12 pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                <User size={18} strokeWidth={1.5} />
              </div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 py-3.5 pe-12 ps-4 rounded-xl border border-slate-200 focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all duration-200 outline-none text-[16px] text-slate-900 shadow-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-slate-600 px-1">كلمة المرور</label>
            <div className="relative group">
              <div className="absolute inset-y-0 end-0 flex items-center justify-center w-12 pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                <Lock size={18} strokeWidth={1.5} />
              </div>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 py-3.5 pe-12 ps-4 rounded-xl border border-slate-200 focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all duration-200 outline-none text-[16px] text-slate-900 shadow-sm font-sans tracking-widest"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50/50 backdrop-blur-md border border-red-200/50 text-red-600 rounded-xl text-[14px] text-center font-medium shadow-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300">
              {error === 'Invalid login credentials' ? 'بيانات الدخول غير صحيحة' : error === 'User already registered' ? 'البريد الإلكتروني مسجل مسبقاً' : error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50/50 backdrop-blur-md border border-emerald-200/50 text-emerald-600 rounded-xl text-[14px] text-center font-medium shadow-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-[16px] mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
           <button
             type="button"
             onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
             }}
             className="text-[14px] font-semibold text-[#007AFF] hover:text-[#005bb5] transition-colors py-2 px-4 rounded-full hover:bg-blue-50/50 active:scale-95"
           >
             {isSignUp ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ قم بإنشائه الآن'}
           </button>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="mt-10 text-center space-y-1 opacity-70">
         <p className="text-[13px] text-slate-500 font-medium">مؤمن ومحمي بواسطة Supabase</p>
         <p className="text-[12px] text-slate-400">الإصدار 1.0.0</p>
      </div>
    </div>
  );
}
