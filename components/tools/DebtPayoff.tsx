import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Ban } from 'lucide-react';
import { Language } from '../../types';

interface DebtPayoffProps {
  lang: Language;
  onBack: () => void;
}

export const DebtPayoff: React.FC<DebtPayoffProps> = ({ lang, onBack }) => {
  const isRtl = lang === 'ar';
  const [debtAmount, setDebtAmount] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  
  const monthsToPayoff = monthlyPayment > 0 ? Math.ceil(debtAmount / monthlyPayment) : 0;
  const years = Math.floor(monthsToPayoff / 12);
  const months = monthsToPayoff % 12;

  return (
    <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 p-6 animate-fade-in relative">
        <button onClick={onBack} className="absolute top-4 start-4 p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm rounded-full active:scale-95 transition-all">
           {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            {lang === 'ar' ? 'التحرر من الديون' : 'Debt Payoff Visualizer'}
        </h2>
        <p className="text-[13px] text-slate-500 mb-6 leading-relaxed text-center max-w-sm mx-auto">
            {lang === 'ar' 
            ? 'أدخل قيمة الديون الإجمالية والمبلغ المخصص للسداد شهرياً لمعرفة متى ستتحرر منها.' 
            : 'Enter your total debt and monthly payment to see when you will be debt-free.'}
        </p>

        <div className="space-y-4 max-w-sm mx-auto">
            <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-200/60 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'إجمالي الدين' : 'Total Debt'}
                </div>
                <input
                type="number"
                min="0"
                value={debtAmount || ''}
                onChange={(e) => setDebtAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                dir="ltr"
                className="w-full font-bold text-slate-900 bg-transparent outline-none placeholder-slate-300 text-[24px] tabular-nums tracking-tighter"
                />
            </div>
            
            <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-200/60 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    {lang === 'ar' ? 'السداد الشهري' : 'Monthly Payment'}
                </div>
                <input
                type="number"
                min="0"
                value={monthlyPayment || ''}
                onChange={(e) => setMonthlyPayment(parseInt(e.target.value) || 0)}
                placeholder="0"
                dir="ltr"
                className="w-full font-bold text-slate-900 bg-transparent outline-none placeholder-slate-300 text-[24px] tabular-nums tracking-tighter"
                />
            </div>

            {monthsToPayoff > 0 && (
                 <div className="mt-6 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                     <Ban className="text-blue-400 mb-3" size={32} />
                     <div className="text-[12px] font-bold text-blue-400 uppercase mb-2">{lang === 'ar' ? 'ستتحرر من الديون بعد' : 'Debt-free in'}</div>
                     <div className="text-2xl font-black text-blue-600">
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
