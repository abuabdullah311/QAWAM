import React, { useState } from 'react';
import { supabase } from '../library/supabaseClient';
import { Loader2, Globe, Info, X } from 'lucide-react';
import { Language } from '../types';

interface AuthProps {
  onLoginSuccess: () => void;
  lang?: Language;
  setLang?: (lang: Language) => void;
}

export function Auth({ onLoginSuccess, lang = 'ar', setLang }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isRtl = lang === 'ar';

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
            setSuccessMsg(isRtl ? 'تم التسجيل بنجاح، يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب (إذا كان تأكيد البريد مفعلاً)' : 'Registration successful! Please check your email to confirm your account (if enabled).');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd] p-4 font-['Almarai',-apple-system,BlinkMacSystemFont,sans-serif]" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-4 start-4 sm:top-6 sm:start-6 z-50">
        <button 
          onClick={() => setShowInfoModal(true)} 
          className="w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors active:scale-95" 
          title={isRtl ? 'عن المنصة' : 'About Platform'}
        >
           <Info size={20} className="opacity-80" strokeWidth={1.5} />
        </button>
      </div>
      
      {setLang && (
        <div className="absolute top-4 end-4 sm:top-6 sm:end-6 z-50">
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
            className="px-4 gap-2 h-10 bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-full flex items-center justify-center text-[14px] font-bold text-slate-700 hover:bg-white hover:text-slate-900 transition-colors active:scale-95" 
            title={lang === 'ar' ? 'English' : 'العربية'}
          >
             <Globe size={18} strokeWidth={1.5} className="opacity-70" />
             <span className="leading-none pt-[1px]">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      )}

      {/* Brand logo area */}
      <div className="mb-6 flex flex-col items-center max-w-[90vw] mx-auto text-center px-4">
         <img 
            src="/logo.png" 
            alt={isRtl ? "شعار قوام" : "Qawam Logo"} 
            className="h-16 w-auto object-contain mb-3"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} 
         />
         <div className="flex flex-col items-center gap-1 opacity-90 transition-all hover:opacity-100">
             <div className="text-[#057a55] font-diwani text-[22px] md:text-[26px] font-bold leading-relaxed tracking-wider antialiased" dir="rtl">
                ﴿وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا﴾
             </div>
             {!isRtl && (
                <div className="text-[#057a55] text-[13px] italic font-serif leading-relaxed mt-1 mb-1 max-w-sm px-2">
                   "And [they are] those who, when they spend, do so not excessively or sparingly but are ever, between that, [justly] moderate"
                </div>
             )}
             <div className="text-slate-400 text-[10px]">
                {isRtl ? 'سورة الفرقان، الآية 67' : 'Surah Al-Furqan, Ayah 67'}
             </div>
         </div>
      </div>

      <div className="max-w-[400px] w-full bg-white/80 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200/50 p-5 sm:p-6">
        <div className="text-center mb-5">
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight tracking-tight">
            {isSignUp ? (isRtl ? 'إنشاء حساب جديد' : 'Create an Account') : (isRtl ? 'تسجيل الدخول' : 'Sign In')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-slate-600 px-1">{isRtl ? 'اسم المستخدم' : 'Username'}</label>
              <div className="relative">
                <input
                  type="text"
                  required={isSignUp}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all duration-200 outline-none text-[16px] text-slate-900 shadow-sm"
                  placeholder={isRtl ? 'اسم المستخدم' : 'Username'}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-slate-600 px-1">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <div className="relative">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all duration-200 outline-none text-[16px] text-slate-900 shadow-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[12px] font-semibold text-slate-600 px-1">{isRtl ? 'كلمة المرور' : 'Password'}</label>
            <div className="relative">
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all duration-200 outline-none text-[16px] text-slate-900 shadow-sm font-sans tracking-widest"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50/50 backdrop-blur-md border border-red-200/50 text-red-600 rounded-xl text-[14px] text-center font-medium shadow-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300">
              {error === 'Invalid login credentials' ? (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials') : error === 'User already registered' ? (isRtl ? 'البريد الإلكتروني مسجل مسبقاً' : 'User already registered') : error}
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
            className="w-full bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-[15px] mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? (isRtl ? 'إنشاء حساب جديد' : 'Create Account') : (isRtl ? 'تسجيل الدخول' : 'Sign In'))}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
           <button
             type="button"
             onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
             }}
             className="text-[14px] font-semibold text-[#007AFF] hover:text-[#005bb5] transition-colors py-2 px-4 rounded-full hover:bg-blue-50/50 active:scale-95"
           >
             {isSignUp ? (isRtl ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign in') : (isRtl ? 'ليس لديك حساب؟ قم بإنشائه الآن' : 'Don\'t have an account? Create one')}
           </button>
        </div>
      </div>
      
      {showInfoModal && (
        <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 pb-20 sm:pb-4" dir={isRtl ? "rtl" : "ltr"}>
          <div className="bg-white max-w-sm w-full rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-6 relative animate-in fade-in slide-in-from-bottom-4">
             <button 
                onClick={() => setShowInfoModal(false)}
                className={`absolute top-4 ${isRtl ? 'start-4' : 'end-4'} w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors`}
             >
                <X size={18} strokeWidth={2} />
             </button>
             
             <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-1">
                   <Info size={24} strokeWidth={1.5} />
                </div>
             </div>
             
             <h3 className="text-xl font-bold text-center text-slate-900 mb-2 mt-2">
               {isRtl ? 'عن منصة قوام' : 'About Qawam'}
             </h3>
             <p className="text-[14px] text-slate-600 text-center leading-relaxed mb-6 font-medium">
               {isRtl ? 'منصة قوام تهدف إلى تقديم تجربة سهلة ومبتكرة لإدارة أموالك ومصاريفك بكفاءة. وتساعدك في التخطيط المالي وتتبع مصروفاتك للوصول إلى استقرار مالي بكل يسر وسهولة.' : 'Qawam platform aims to provide an easy and innovative experience to manage your money and expenses efficiently. It helps you in financial planning and tracking expenses to reach financial stability effortlessly.'}
             </p>
             <button
               onClick={() => setShowInfoModal(false)}
               className="w-full bg-[#007AFF] text-white py-3 rounded-xl font-semibold hover:bg-[#0062cc] transition-colors"
             >
               {isRtl ? 'موافق' : 'Got it'}
             </button>
          </div>
        </div>
      )}

      {/* Footer text */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-900/5 py-1 px-4 shadow-[0_-1px_3px_rgba(0,0,0,0.02)] z-40 flex justify-center items-center transition-all">
        <div className="flex items-center gap-2.5 text-[12px] text-slate-500 font-medium bg-transparent px-2 py-0.5 rounded-full my-1">
           <span>{isRtl ? 'تطوير' : 'Developed by'}</span>
           <a href="https://www.linkedin.com/in/ahmed-alshareef-innovation" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity flex items-center">
             <img 
               src="/ashareef_logo.png" 
               alt="Logo" 
               className="h-10 object-contain ml-1" 
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
               }}
             />
           </a>
        </div>
      </footer>
    </div>
  );
}
