import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Target } from 'lucide-react';
import { Language, DashboardMetrics } from '../../types';

interface SavingsGoalProps {
  metrics: DashboardMetrics;
  lang: Language;
  onBack: () => void;
}

export const SavingsGoal: React.FC<SavingsGoalProps> = ({ metrics, lang, onBack }) => {
  const isRtl = lang === 'ar';
  const [goalAmount, setGoalAmount] = useState<number>(0);
  
  const monthlySavings = metrics.totalSavingsCalculated;
  const monthsToGoal = (monthlySavings > 0 && goalAmount > 0) ? Math.ceil(goalAmount / monthlySavings) : 0;
  const years = Math.floor(monthsToGoal / 12);
  const months = monthsToGoal % 12;

  return (
    <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 p-6 animate-fade-in relative">
        <button onClick={onBack} className="absolute top-4 start-4 p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-full active:scale-95 transition-all">
           {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            {lang === 'ar' ? 'محاكي أهداف الادخار والاستثمار' : 'Savings Goals Simulator'}
        </h2>
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed text-center max-w-sm mx-auto">
            {lang === 'ar' 
            ? 'احسب المدة الزمنية اللازمة للوصول لهدف مالي معين بناءً على نسبة ادخارك الحالية.' 
            : 'Calculate the time needed to reach a specific financial goal based on your current savings.'}
        </p>

        <div className="space-y-4 max-w-sm mx-auto">
            <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-200/60 transition-colors focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}
                </div>
                <input
                type="number"
                min="0"
                value={goalAmount || ''}
                onChange={(e) => setGoalAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                dir="ltr"
                className="w-full font-bold text-slate-900 bg-transparent outline-none placeholder-slate-300 text-[24px] tabular-nums tracking-tighter"
                />
            </div>

            <div className="flex justify-between items-center py-3 px-2">
                <span className="text-sm font-semibold text-slate-600">{lang === 'ar' ? 'ادخارك الشهري الحالي:' : 'Current monthly savings:'}</span>
                <span className="font-mono font-bold text-emerald-500">{monthlySavings.toLocaleString()}</span>
            </div>

            {monthsToGoal > 0 && (
                 <div className="mt-4 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                     <Target className="text-amber-400 mb-3" size={32} />
                     <div className="text-[12px] font-bold text-amber-500 uppercase mb-2">{lang === 'ar' ? 'ستصل لهدفك خلال' : 'You will reach your goal in'}</div>
                     <div className="text-2xl font-black text-amber-600">
                         {years > 0 && <span>{years} {lang === 'ar' ? 'سنة' : 'Years'} </span>}
                         {years > 0 && months > 0 && <span>{lang === 'ar' ? 'و ' : 'and '}</span>}
                         {months > 0 && <span>{months} {lang === 'ar' ? 'شهر' : 'Months'}</span>}
                     </div>
                 </div>
            )}
        </div>
    </div>
  );
};
