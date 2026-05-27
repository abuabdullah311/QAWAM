import React from 'react';
import { DashboardMetrics, AppStep, Language, UserProfile } from '../types';
import { RotateCcw, Users, Globe, LogOut, Shield, Sparkles, CreditCard, Receipt, BarChart3 } from 'lucide-react';
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
  
  const steps = [
    { id: AppStep.SALARY, label: t.step1, icon: CreditCard },
    { id: AppStep.WIZARD, label: t.stepWizard, icon: Sparkles },
    { id: AppStep.ADVISOR, label: t.advisorStep, icon: Sparkles },
    { id: AppStep.EXPENSES, label: t.step2, icon: Receipt },
    { id: AppStep.DASHBOARD, label: t.step3, icon: BarChart3 },
  ];

  return (
    <div className="sticky top-0 z-50 pt-4 pb-4 px-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50 mb-8 transition-all duration-300">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        
        {/* Apple-styled Pill Header */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-2xl md:rounded-[2rem] p-3 md:p-2 md:pr-4 md:pl-2 flex flex-col md:flex-row items-center justify-between transition-all duration-300 relative gap-3">
           
           {/* Top/Center (Logo Area & Visitors) - On Mobile it's top, on Desktop it's absolute center */}
           <div className="flex items-center justify-between md:justify-center w-full md:w-max px-2 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bg-white/50 md:backdrop-blur-sm md:py-1.5 md:rounded-full md:border md:border-slate-100/50 md:shadow-sm shrink-0 gap-2 sm:gap-4 md:gap-3">
              {/* Logo Fallback */}
              <div className="flex items-center pb-1">
                 <span className="text-2xl md:text-2xl font-black text-slate-800 tracking-tighter drop-shadow-sm font-serif">قَوَام</span>
              </div>

              <div className="hidden md:block w-px h-6 bg-slate-200/80"></div>
              
              <div className="flex flex-col items-center justify-center bg-slate-50 md:bg-transparent rounded-lg px-3 md:px-0 py-1 md:py-0 border border-slate-100/60 md:border-none shadow-sm md:shadow-none">
                 <div className="flex items-center gap-1 text-xs font-black text-slate-700" title={lang === 'ar' ? 'زيارات الموقع' : 'Page Views'}>
                    <Users size={12} className="text-slate-400" />
                    {visitorCount.toLocaleString()}
                 </div>
                 <span className="text-[9px] text-slate-400 font-medium mt-0.5">{lang === 'ar' ? 'زيارة' : 'Views'}</span>
              </div>
           </div>

           {/* Mobile Bottom Row / Desktop Sides */}
           <div className="flex items-center justify-between w-full md:w-full md:contents border-t border-slate-200/60 pt-3 md:border-t-0 md:pt-0 shrink-0">
              
              {/* Right Side (User Info & Sessions - RTL Start) */}
              <div className="flex flex-col text-start justify-center flex-1 h-full px-1">
                 <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center w-max font-bold mb-1 ${currentUser.role === 'admin' ? 'text-indigo-600 bg-indigo-50 border border-indigo-100/50' : 'text-slate-600 bg-slate-100 border border-slate-200/50'}`}>
                   {currentUser.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'System Admin') : (lang === 'ar' ? 'مستخدم' : 'User')}
                 </span>
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium whitespace-nowrap pl-1 px-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`}></span>
                    {lang === 'ar' ? 'جلسة نشطة' : 'Active Session'}
                 </div>
              </div>

              {/* Left Side (Action Icons - RTL End) */}
              <div className="flex items-center gap-1 flex-1 justify-end h-full relative z-10 w-full sm:w-auto pr-1 md:pr-0">
                 <div className="flex items-center gap-1 bg-slate-50/50 p-1 md:p-1 rounded-xl md:rounded-full border border-slate-100 shadow-sm flex-wrap w-full md:w-auto justify-end sm:justify-start overflow-hidden">
                    
                    {/* Language */}
                    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-full bg-white hover:bg-slate-100 shadow-sm flex items-center justify-center text-slate-600 transition-colors" title={lang === 'ar' ? 'English' : 'العربية'}>
                       <Globe size={16} />
                    </button>

                    {/* Wizard */}
                    <button onClick={() => onGoToWizard?.()} className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-full bg-white hover:bg-slate-100 shadow-sm flex items-center justify-center text-slate-600 transition-colors hover:text-[#007AFF]" title={lang === 'ar' ? 'العودة للمعالج' : 'Wizard'}>
                       <Sparkles size={16} />
                    </button>
                    
                    {/* Reset Data */}
                    <button onClick={onReset} className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-full bg-white hover:bg-red-50 shadow-sm flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors" title={t.reset}>
                       <RotateCcw size={16} className="rotate-180" />
                    </button>

                    <div className="w-px h-5 bg-slate-200 mx-1 hidden md:block"></div>

                    {/* Admin Tools */}
                    {currentUser.role === 'admin' && (
                       <button onClick={onOpenAdmin} className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-full bg-indigo-50 hover:bg-indigo-100 shadow-sm flex items-center justify-center text-indigo-600 transition-colors border-none" title={lang === 'ar' ? 'إدارة المستخدمين' : 'Users Admin'}>
                          <Shield size={16} />
                       </button>
                    )}

                    {/* Logout */}
                    <button onClick={onLogout} className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-full bg-red-50 hover:bg-red-100 shadow-sm flex items-center justify-center text-red-600 transition-colors border-none" title={lang === 'ar' ? 'خروج' : 'Logout'}>
                       <LogOut size={16} className={lang === 'ar' ? 'mr-0.5' : 'ml-0.5'} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Bottom Bar: Steps & Metrics */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center w-full mt-2 lg:h-16">
           
            {/* Step Progress Container */}
            <div className="w-full flex justify-start md:justify-center overflow-x-auto pb-4 md:pb-0 pt-2 px-1 hide-scrollbar">
                <div className="flex items-center justify-between md:justify-center bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-3 px-4 sm:px-8 w-max min-w-full md:min-w-0 mx-auto gap-1 sm:gap-4">
                    {steps.map((step, idx) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const Icon = step.icon;
                        return (
                        <React.Fragment key={step.id}>
                            <div className={`flex flex-col items-center relative z-10 w-14 sm:w-16 md:w-20 shrink-0 ${isActive || isCompleted ? 'text-blue-600' : 'text-slate-500'}`}>
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 shadow-sm ${
                                    isActive 
                                    ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-blue-200/50 scale-105' 
                                    : isCompleted
                                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}>
                                    <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-pulse' : ''} />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-bold mt-2 whitespace-nowrap transition-colors ${isActive ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`h-[2px] w-8 sm:w-12 md:w-16 shrink-0 -mt-6 transition-colors duration-500 rounded-full ${isCompleted ? 'bg-[#007AFF]' : 'bg-slate-200'}`}></div>
                            )}
                        </React.Fragment>
                    )})}
                </div>
            </div>

            {/* Mini Metrics (Only on Dashboard) - Absolute positioned on Desktop so it doesn't break centering */}
            <div className={`lg:absolute lg:right-2 flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm lg:shadow-none transition-all duration-300 mt-2 lg:mt-0 ${currentStep === AppStep.DASHBOARD ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 lg:pointer-events-none'}`}>
                 <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-medium">{t.remaining}</div>
                    <div className={`font-bold text-sm tracking-tight ${metrics.remainingSalary < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                        {metrics.remainingSalary.toLocaleString()}
                    </div>
                 </div>
                 <div className="w-px h-6 bg-slate-200"></div>
                 <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-medium">{t.savingsRate}</div>
                    <div className="font-bold text-sm text-emerald-500 tracking-tight">%{savingsPercentage}</div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};