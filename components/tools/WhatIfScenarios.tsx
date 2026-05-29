import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { Language, Expense, DashboardMetrics } from '../../types';

interface WhatIfScenariosProps {
  salary: number;
  expenses: Expense[];
  metrics: DashboardMetrics;
  lang: Language;
  onBack: () => void;
}

export const WhatIfScenarios: React.FC<WhatIfScenariosProps> = ({ salary, metrics, lang, onBack }) => {
  const isRtl = lang === 'ar';
  const [expenseCutPct, setExpenseCutPct] = useState<number>(10);
  
  const totalVariable = metrics.totalWants;
  const potentialSavings = Math.round((totalVariable * expenseCutPct) / 100);
  const newSavings = metrics.totalSavingsCalculated + potentialSavings;

  return (
    <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 p-6 animate-fade-in relative">
        <button onClick={onBack} className="absolute top-4 start-4 p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-full active:scale-95 transition-all">
           {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            {lang === 'ar' ? 'التخطيط المتعدد "ماذا لو؟"' : 'What-If Scenarios'}
        </h2>
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed text-center max-w-sm mx-auto">
            {lang === 'ar' 
            ? 'ماذا لو قمت بتقليص مصاريف "الرغبات" بنسبة معينة؟ كيف سيؤثر ذلك على مدخراتك الكلية؟' 
            : 'What if you cut your "wants" expenses by a certain percentage? How does it affect savings?'}
        </p>

        <div className="space-y-6 max-w-sm mx-auto">
            <div className="space-y-2">
               <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>{lang === 'ar' ? 'نسبة التقليص من الرغبات' : 'Wants Cut Percentage'}</span>
                  <span className="text-purple-600 font-bold">{expenseCutPct}%</span>
               </div>
               <input 
                 type="range" min="0" max="100" step="5" 
                 value={expenseCutPct} 
                 onChange={(e) => setExpenseCutPct(parseInt(e.target.value))} 
                 className="w-full accent-purple-500" 
               />
            </div>
            
            <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                   <div className="text-[12px] font-bold text-purple-400 uppercase">{lang === 'ar' ? 'المدخرات الحالية' : 'Current Savings'}</div>
                   <div className="font-mono font-semibold text-slate-700">{metrics.totalSavingsCalculated.toLocaleString()}</div>
                </div>
                <div className="flex justify-between items-center mb-4">
                   <div className="text-[12px] font-bold text-purple-400 uppercase">{lang === 'ar' ? 'الوفر المتوقع' : 'Potential Savings'}</div>
                   <div className="font-mono font-bold text-emerald-500">+{potentialSavings.toLocaleString()}</div>
                </div>
                <div className="h-px bg-purple-200/50 w-full mb-4"></div>
                <div className="flex justify-between items-center">
                   <div className="text-[13px] font-bold text-purple-600 uppercase">{lang === 'ar' ? 'إجمالي المدخرات الجديد' : 'New Total Savings'}</div>
                   <div className="font-mono font-black text-purple-700 text-xl">{newSavings.toLocaleString()}</div>
                </div>
            </div>
        </div>
    </div>
  );
};
