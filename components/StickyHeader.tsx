import React from 'react';
import { DashboardMetrics, AppStep, Language, UserProfile } from '../types';
import { Users, Globe, LogOut, Sparkles, CreditCard, List, BarChart3, Eye, RotateCcw, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface StickyHeaderProps {
  salary: number;
  metrics: DashboardMetrics;
  onReset: () => void;
  currentStep: AppStep;
  visitorCount: number;
  lang: Language;
  setLang: (l: Language) => void;
  isLive: boolean;
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onGoToWizard?: () => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ 
  salary, 
  metrics, 
  onReset, 
  currentStep,
  visitorCount,
  lang,
  setLang,
  isLive,
  currentUser,
  onLogout,
  onOpenAdmin,
  onGoToWizard,
  ...props
}) => {
  const t = TRANSLATIONS[lang];
  const savingsPercentage = salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0;
  
  const [isEditingUsername, setIsEditingUsername] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState(currentUser?.username || '');
  const [isSavingUsername, setIsSavingUsername] = React.useState(false);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim() === currentUser?.username) {
      setIsEditingUsername(false);
      return;
    }
    setIsSavingUsername(true);
    try {
      // Import supabase dynamically or import it at the top. We need it to run the RPC.
      // Easiest is to fire the RPC directly.
      const { supabase } = await import('../library/supabaseClient');
      const { error } = await supabase.rpc('update_username', {
        user_id_param: currentUser.id,
        new_username: newUsername.trim()
      });
      if (error) throw error;
      
      // Ideally we would update the state in App.tsx, but since we rely on the parent state, 
      // we can just force a reload or pass an onUpdateUser function. 
      // For simplicity, we just reload the page or optimistically update if we had an onUpdateUser callback.
      // We don't have an onUpdateUser callback, so we'll just reload the page to refresh session state.
      window.location.reload();
    } catch (err: any) {
      alert('خطأ في تحديث اسم المستخدم: ' + err.message);
      setIsSavingUsername(false);
    }
  };

  const steps = [
    { id: AppStep.SALARY, label: t.step1, icon: CreditCard },
    { id: AppStep.WIZARD, label: t.stepWizard, icon: Plus },
    { id: AppStep.ADVISOR, label: t.advisorStep, icon: Sparkles },
    { id: AppStep.EXPENSES, label: t.step2, icon: List },
    { id: AppStep.DASHBOARD, label: t.step3, icon: BarChart3 },
  ];

  return (
    <div className="sticky top-0 z-50 pt-2 pb-2 px-4 bg-white/70 backdrop-blur-[20px] saturate-[1.8] border-b border-slate-900/5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-4 transition-all duration-300">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        
        {/* Row 1: Logo & Icons */}
        <div className="flex items-center justify-between w-full h-10">
           {/* Logo */}
           <div className="flex items-center pb-1 gap-2 shrink-0">
              <img 
                src="/logo.png" 
                alt="Qawam Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} 
              />
           </div>

           {/* Visitor Count (Centered) */}
           <div className="flex-1 flex justify-center px-2">
               <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50/80 border border-slate-200/60 px-2.5 py-1 rounded-[8px] flex-shrink-0" title={lang === 'ar' ? 'زيارات الموقع' : 'Page Views'}>
                  <Eye size={14} strokeWidth={2} className="opacity-60 text-[#007AFF]" />
                  <div className="flex items-baseline gap-1">
                     <span className="text-[12px] font-bold font-mono tabular-nums tracking-tight text-slate-700">{visitorCount.toLocaleString()}</span>
                     <span className="text-[10px] opacity-70 font-medium hidden sm:inline">{lang === 'ar' ? 'زيارة' : 'Views'}</span>
                  </div>
               </div>
           </div>

           {/* Action Icons */}
           <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
              {/* Language Toggle */}
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3 gap-1.5 h-9 shrink-0 rounded-full hover:bg-slate-100 flex items-center justify-center text-[13px] font-bold text-slate-700 transition-colors active:scale-95 border border-transparent hover:border-slate-200" title={lang === 'ar' ? 'English' : 'العربية'}>
                 <Globe size={16} strokeWidth={1.5} className="opacity-70" />
                 <span className="leading-none pt-[1px] font-sans tracking-wide">{lang === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              {/* Wizard */}
              {onGoToWizard && (
                <button onClick={() => onGoToWizard()} className="w-9 h-9 shrink-0 rounded-full hover:bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] transition-colors active:scale-95" title={lang === 'ar' ? 'العودة للمعالج' : 'Wizard'}>
                   <Sparkles size={18} strokeWidth={1.5} />
                </button>
              )}
              
              {/* Reset Data */}
              <button onClick={onReset} className="w-9 h-9 shrink-0 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors active:scale-95" title={t.reset}>
                 <RotateCcw size={18} strokeWidth={1.5} className="rotate-180" />
              </button>

              <div className="w-[1px] h-5 bg-slate-200 mx-1.5 hidden md:block"></div>

              {/* Admin Tools */}
              {currentUser.role === 'admin' && (
                 <button onClick={onOpenAdmin} className="w-9 h-9 shrink-0 rounded-full hover:bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] transition-colors active:scale-95" title={lang === 'ar' ? 'إدارة المستخدمين' : 'Users Admin'}>
                    <Users size={18} strokeWidth={1.5} />
                 </button>
              )}

              {/* Logout */}
              <button onClick={onLogout} className="w-9 h-9 shrink-0 rounded-full hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors active:scale-95" title={lang === 'ar' ? 'خروج' : 'Logout'}>
                 <LogOut size={18} strokeWidth={1.5} className="rtl:rotate-180" />
              </button>
           </div>
        </div>

        {/* Row 2: User Info, Session & Visitors */}
        <div className="flex items-center justify-between w-full bg-slate-50/80 border border-slate-200/60 rounded-[14px] px-3 py-1 mt-0 shadow-sm overflow-x-auto hide-scrollbar">
           <div className="flex items-center gap-2.5 text-[12px] font-medium min-w-max">
              {isEditingUsername ? (
                 <form onSubmit={handleSaveUsername} className="flex items-center gap-1.5 bg-white p-1 rounded-[8px] border border-slate-200 shadow-sm">
                   <input
                     type="text"
                     value={newUsername}
                     onChange={e => setNewUsername(e.target.value)}
                     className="w-[120px] text-[12px] font-medium px-2 py-1 outline-none rounded-[6px]"
                     placeholder="اسم المستخدم"
                     autoFocus
                   />
                   <button type="submit" disabled={isSavingUsername} className="text-[#34C759] hover:bg-[#34C759]/10 p-1 rounded-[6px] transition-colors disabled:opacity-50">
                     {isSavingUsername ? <div className="w-3.5 h-3.5 border-2 border-[#34C759] border-t-transparent rounded-full animate-spin" /> : '✓'}
                   </button>
                   <button type="button" onClick={() => { setIsEditingUsername(false); setNewUsername(currentUser?.username || ''); }} className="text-slate-400 hover:bg-slate-100 p-1 rounded-[6px] transition-colors">
                     ✕
                   </button>
                 </form>
              ) : (
                 <div className="flex items-center gap-1.5 group">
                   <span className="text-slate-800 font-semibold">{currentUser.username || currentUser.email}</span>
                   <button onClick={() => setIsEditingUsername(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#007AFF] transition-all" title="تعديل اسم المستخدم">
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                   </button>
                 </div>
              )}
              <span className={`px-2 py-0.5 rounded-[6px] inline-flex items-center w-max font-bold tracking-wide text-[10px] ${currentUser.role === 'admin' ? 'text-[#007AFF] bg-[#007AFF]/10 border border-[#007AFF]/20' : 'text-slate-700 bg-slate-200/50 border border-slate-300/50'}`}>
                {currentUser.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'System Admin') : (lang === 'ar' ? 'مستخدم' : 'User')}
              </span>
              <div className="w-[1px] h-3 bg-slate-300"></div>
              <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                 <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.5)] animate-pulse' : 'bg-slate-300'}`}></span>
                 {lang === 'ar' ? 'جلسة نشطة' : 'Active Session'}
              </div>
           </div>
        </div>

        {/* Bottom Progress Bar: Steps & Metrics */}
        <div className="relative flex flex-col items-center justify-center w-full">
            {/* Step Progress Container */}
            <div className="w-full flex justify-center md:justify-center overflow-x-auto pb-1 pt-1 px-1 hide-scrollbar">
                <div className="flex items-center justify-between md:justify-center w-full max-w-2xl px-2 gap-1 sm:gap-4 relative">
                    {/* Background Progress Line */}
                    <div className="absolute start-10 end-10 top-5 h-[2px] bg-slate-200/50 rounded-full -z-10"></div>
                    
                    {/* Active Progress Line */}
                    <div 
                       className="absolute start-10 top-5 h-[2px] bg-[#007AFF] rounded-full -z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                       style={{ width: `calc(${(currentStep - 1) / (steps.length - 1)} * (100% - 5rem))` }}
                    ></div>

                    {steps.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const Icon = step.icon;
                        
                        return (
                        <div key={step.id} className="flex flex-col items-center relative z-10">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isActive 
                                ? 'bg-[#007AFF] text-white shadow-[0_2px_10px_rgba(0,122,255,0.3)] scale-[1.05]' 
                                : isCompleted
                                ? 'bg-[#007AFF] text-white'
                                : 'bg-slate-100 text-slate-400 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                            }`}>
                                <Icon size={18} strokeWidth={1.5} />
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-semibold mt-2 whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-[#007AFF]' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    )})}
                </div>
            </div>

            {/* Mini Metrics (Only on Dashboard) - Absolute positioned on Desktop so it doesn't break centering */}
            <div className={`mt-3 lg:mt-0 lg:absolute lg:end-2 lg:top-1/2 lg:-translate-y-1/2 flex items-center gap-3 md:gap-5 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${currentStep === AppStep.DASHBOARD ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 lg:translate-y-0 scale-95 lg:pointer-events-none hidden lg:flex'}`}>
                 <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t.remaining}</div>
                    <div className={`font-bold font-mono tracking-tight text-[15px] tabular-nums ${metrics.remainingSalary < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                        {metrics.remainingSalary.toLocaleString()}
                    </div>
                 </div>
                 <div className="w-[1px] h-6 bg-slate-200"></div>
                 <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t.savingsRate}</div>
                    <div className="font-bold font-mono tracking-tight text-[15px] tabular-nums text-emerald-500">%{savingsPercentage}</div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};