import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Wallet } from 'lucide-react';
import { Language } from '../types';

interface ExtraIncomeProps {
  salary: number;
  lang: Language;
  onBack: () => void;
}

export const ExtraIncomeActivity: React.FC<ExtraIncomeProps> = ({ salary, lang, onBack }) => {
  const isRtl = lang === 'ar';
  const [extraIncome, setExtraIncome] = useState<number>(0);
  
  // Example rule: 70% goes to savings, 30% to wants.
  const savingsShare = Math.round(extraIncome * 0.7);
  const wantsShare = extraIncome - savingsShare;

  return (
    <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 p-6 animate-fade-in relative">
        <button onClick={onBack} className="absolute top-4 start-4 p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-full active:scale-95 transition-all">
           {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            {lang === 'ar' ? 'محاكي الدخل الإضافي' : 'Extra Income Simulator'}
        </h2>
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed text-center max-w-sm mx-auto">
            {lang === 'ar' 
            ? 'اكتشف كيف ستتأثر مدخراتك ورغباتك لو زاد دخلك الشهري.' 
            : 'Discover how your savings and lifestyle improve if you increase your monthly income.'}
        </p>

        <div className="space-y-6 max-w-sm mx-auto">
            <div className="relative group bg-slate-50 rounded-[16px] p-4 border border-slate-200/60 transition-colors focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'قيمة الدخل الإضافي المتوقع' : 'Expected Extra Income'}
                </div>
                <input
                type="number"
                min="0"
                value={extraIncome || ''}
                onChange={(e) => setExtraIncome(parseInt(e.target.value) || 0)}
                placeholder="0"
                dir="ltr"
                className="w-full font-bold text-slate-900 bg-transparent outline-none placeholder-slate-300 text-[32px] tabular-nums tracking-tighter"
                />
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="text-center flex-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">{lang === 'ar' ? 'زيادة المدخرات (70%)' : 'Extra Savings'}</div>
                    <div className="font-mono font-bold text-emerald-500 text-[18px]">+{savingsShare.toLocaleString()}</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center flex-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">{lang === 'ar' ? 'للرغبات (30%)' : 'Extra Wants'}</div>
                    <div className="font-mono font-bold text-amber-500 text-[18px]">+{wantsShare.toLocaleString()}</div>
                </div>
            </div>
        </div>
    </div>
  );
};
