import React from 'react';
import { DashboardMetrics, AppStep, Language } from '../types';
import { RotateCcw, Users, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface StickyHeaderProps {
  salary: number;
  metrics: DashboardMetrics;
  onReset: () => void;
  currentStep: AppStep;
  visitorCount: number;
  lang: Language;
  setLang: (l: Language) => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ 
  salary, 
  metrics, 
  onReset, 
  currentStep,
  visitorCount,
  lang,
  setLang
}) => {
  const t = TRANSLATIONS[lang];
  const savingsPercentage = salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0;
  
  const steps = [
    { id: AppStep.SALARY, label: t.step1 },
    { id: AppStep.EXPENSES, label: t.step2 },
    { id: AppStep.DASHBOARD, label: t.step3 },
  ];

  return (
    <div className="sticky-header bg-white/95 border-b border-gray-200 shadow-sm pt-2 pb-3 px-4 mb-6 backdrop-blur-md transition-all duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Bar: Language | Visitor | Reset */}
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600 transition-colors"
                >
                    <Globe size={12} />
                    {lang === 'ar' ? 'English' : 'العربية'}
                </button>
                <div className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Users size={12} />
                    <span>{visitorCount.toLocaleString()} {t.visitors}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <button 
                   onClick={onReset}
                   className="flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-all group"
                   title={t.reset}
                   data-html2canvas-ignore
                 >
                   <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                   <span className="text-xs hidden sm:inline">{t.reset}</span>
                 </button>
            </div>
        </div>

        {/* Logo & Steps */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
            {/* Logo */}
            <div className="flex items-center gap-2">
                 <img src="./QAWAM_logo.png" alt="QAWAM" className="h-8 md:h-10 object-contain" />
            </div>

            {/* Step Progress */}
            <div className="flex items-center w-full md:w-auto justify-center">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.id}>
                        <div className={`flex flex-col items-center relative z-10 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-300'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${
                                currentStep >= step.id 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-gray-400 border-gray-200'
                            }`}>
                                {step.id}
                            </div>
                            <span className="text-[10px] font-bold mt-1">{step.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 w-12 md:w-20 -mt-4 transition-colors duration-500 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mini Metrics (Only on Dashboard) */}
            <div className={`hidden md:flex items-center gap-3 transition-opacity duration-300 ${currentStep === AppStep.DASHBOARD ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="text-center">
                    <div className="text-[10px] text-gray-500">{t.remaining}</div>
                    <div className={`font-bold text-sm ${metrics.remainingSalary < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {metrics.remainingSalary.toLocaleString()}
                    </div>
                 </div>
                 <div className="w-px h-6 bg-gray-200"></div>
                 <div className="text-center">
                    <div className="text-[10px] text-gray-500">{t.savingsRate}</div>
                    <div className="font-bold text-sm text-emerald-600">%{savingsPercentage}</div>
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
};