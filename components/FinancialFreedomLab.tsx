import React, { useState, useMemo } from 'react';
import { Expense, ExpenseType, Language, DashboardMetrics } from '../types';
import { ArrowLeft, ArrowRight, FlaskConical, TrendingUp, Scissors, PlusCircle, Sparkles, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface FinancialFreedomLabProps {
  salary: number;
  expenses: Expense[];
  metrics: DashboardMetrics;
  lang: Language;
  onBack: () => void;
}

export const FinancialFreedomLab: React.FC<FinancialFreedomLabProps> = ({ salary, expenses, metrics, lang, onBack }) => {
  const isRtl = lang === 'ar';
  
  // Variables & Controls
  const [extraMonthlyIncome, setExtraMonthlyIncome] = useState<number>(0);
  const [wantReductions, setWantReductions] = useState<Record<string, number>>({});
  const [roiPercent, setRoiPercent] = useState<number>(7);

  const wants = useMemo(() => expenses.filter(e => e.type === ExpenseType.WANT), [expenses]);
  
  // Baseline calculations
  const baselineNetSalary = salary;
  const currentUnallocatedCash = Math.max(0, baselineNetSalary - metrics.totalExpenses);
  const baselineMonthlySavings = metrics.totalSavingsExpenses + currentUnallocatedCash;

  // Lab calculations
  const amountSavedFromWants = useMemo(() => {
    return wants.reduce((acc, w) => acc + (w.amount * ((wantReductions[w.id] || 0) / 100)), 0);
  }, [wants, wantReductions]);

  const newMonthlySavings = baselineMonthlySavings + extraMonthlyIncome + amountSavedFromWants;
  const optimizationImpact = newMonthlySavings - baselineMonthlySavings;

  // Chart & Projections Data (10 years projection)
  const projectionData = useMemo(() => {
    const data = [];
    const r = (roiPercent / 100) / 12;
    let accumulatedBaseline = 0;
    let accumulatedOptimized = 0;

    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        data.push({ year: isRtl ? 'الآن' : 'Now', baseline: 0, optimized: 0 });
        continue;
      }
      
      const n = year * 12;
      if (r > 0) {
          accumulatedBaseline = baselineMonthlySavings * ((Math.pow(1 + r, n) - 1) / r);
          accumulatedOptimized = newMonthlySavings * ((Math.pow(1 + r, n) - 1) / r);
      } else {
          accumulatedBaseline = baselineMonthlySavings * n;
          accumulatedOptimized = newMonthlySavings * n;
      }

      data.push({
          year: isRtl ? `سنة ${year}` : `Year ${year}`,
          baseline: Math.round(accumulatedBaseline),
          optimized: Math.round(accumulatedOptimized)
      });
    }
    return data;
  }, [baselineMonthlySavings, newMonthlySavings, roiPercent, isRtl]);

  const current10Year = projectionData[10].baseline;
  const optimized10Year = projectionData[10].optimized;
  const extraWealthGenerated = optimized10Year - current10Year;

  const handleReset = () => {
      setExtraMonthlyIncome(0);
      setWantReductions({});
      setRoiPercent(7);
  };

  const formatCurrency = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + (isRtl ? ' مليون' : 'M');
      if (val >= 1000) return (val / 1000).toFixed(1) + (isRtl ? ' ألف' : 'k');
      return val.toString();
  };

  return (
    <div className="bg-white/80 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 flex flex-col overflow-hidden animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
       <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-6 flex items-center justify-between z-10 relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
           <div className="flex items-center gap-3 relative z-10">
              <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all text-white">
                {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              </button>
              <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <FlaskConical size={20} className="text-cyan-400" />
                      {isRtl ? 'مختبر الحرية المالية' : 'Financial Freedom Lab'}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">{isRtl ? 'محاكاة أثر تعديل المصروفات وزيادة الدخل' : 'Simulate impact of expenses tuning and extra income'}</p>
              </div>
           </div>
           {(extraMonthlyIncome > 0 || amountSavedFromWants > 0) && (
             <button onClick={handleReset} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
                {isRtl ? 'إعادة ضبط' : 'Reset'}
             </button>
           )}
       </div>

       <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 xl:gap-8 bg-slate-50">
           {/* CONTROL VARIABLES */}
           <div className="flex flex-col gap-6">
                
                {/* 1. Reduce Wants */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-orange-600">
                            <Scissors size={20} />
                            <span className="font-bold">{isRtl ? 'متغير 1: تقليم الرغبات' : 'Variable 1: Trim Wants'}</span>
                        </div>
                        {amountSavedFromWants > 0 && (
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full animate-fade-in">
                                +{Math.round(amountSavedFromWants).toLocaleString()} {isRtl ? 'وفر شهري' : 'Month'}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {wants.length === 0 ? (
                            <p className="text-sm text-slate-500 italic text-center py-4">{isRtl ? 'لا توجد مصروفات رغبات مسجلة' : 'No wants recorded'}</p>
                        ) : wants.map(want => (
                            <div key={want.id} className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-slate-700 text-sm">{want.name}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-400 font-bold">{isRtl ? 'الأساس' : 'Base'}: {want.amount.toLocaleString()}</span>
                                        {wantReductions[want.id] > 0 && (
                                            <span className="text-xs font-bold text-emerald-600">
                                                -{Math.round(want.amount * (wantReductions[want.id] / 100)).toLocaleString()} {isRtl ? 'توفير' : 'Saved'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400 w-8">{wantReductions[want.id] || 0}%</span>
                                    <input 
                                        type="range" min="0" max="100" step="10"
                                        value={wantReductions[want.id] || 0}
                                        onChange={(e) => setWantReductions(prev => ({...prev, [want.id]: parseInt(e.target.value)}))}
                                        className="flex-1 accent-orange-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <button onClick={() => setWantReductions(prev => ({...prev, [want.id]: 100}))} className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors" title="Cut completely">100%</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Extra Income */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-blue-600">
                            <PlusCircle size={20} />
                            <span className="font-bold">{isRtl ? 'متغير 2: دخل إضافي محتمل' : 'Variable 2: Extra Income'}</span>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{isRtl ? 'مبلغ إضافي شهري (ثابت)' : 'Monthly Extra Cash Flow'}</label>
                        <div className="relative">
                            <input 
                              type="number" 
                              value={extraMonthlyIncome || ''}
                              onChange={(e) => setExtraMonthlyIncome(parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-mono font-bold"
                              placeholder="0"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{isRtl ? 'ر.س' : 'SAR'}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => setExtraMonthlyIncome(v => v + 500)} className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors">+500</button>
                            <button onClick={() => setExtraMonthlyIncome(v => v + 1000)} className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors">+1000</button>
                            <button onClick={() => setExtraMonthlyIncome(v => v + 2000)} className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors">+2000</button>
                        </div>
                    </div>
                </div>

                {/* 3. Market Simulator */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
                    <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-3">
                        <TrendingUp size={20} />
                        <span className="font-bold">{isRtl ? 'التسريع بالاستثمار' : 'Investment Acceleration'}</span>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-end mb-2">
                             <label className="text-sm font-bold text-slate-700">{isRtl ? 'معدل العائد السنوي المتوقع' : 'Expected Annual ROI'}</label>
                             <span className="font-bold font-mono text-emerald-600">{roiPercent}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="25" step="1"
                            value={roiPercent}
                            onChange={(e) => setRoiPercent(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                            <span>{isRtl ? 'بدون' : '0%'}</span>
                            <span>{isRtl ? 'متوسط (7%)' : 'Avg (7%)'}</span>
                            <span>{isRtl ? 'عالي (25%)' : 'High (25%)'}</span>
                        </div>
                    </div>
                </div>

           </div>

           {/* RESULTS PANEL */}
           <div className="flex flex-col h-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden mt-8 lg:mt-0 relative">
               
               <div className="p-6 bg-slate-900 text-white relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 mix-blend-overlay"></div>
                   <h3 className="text-lg font-bold flex items-center gap-2 relative z-10 mb-6">
                       <Activity size={20} className="text-cyan-400" />
                       {isRtl ? 'تأثير التجربة' : 'Experiment Impact'}
                   </h3>

                   <div className="grid grid-cols-2 gap-4 relative z-10">
                       <div className="bg-white/10 backdrop-blur border border-white/10 p-4 rounded-xl">
                           <div className="text-xs text-slate-300 font-medium mb-1">{isRtl ? 'معدل الادخار الاستثماري' : 'Monthly Savings Firepower'}</div>
                           <div className="flex items-baseline gap-2">
                               <div className="text-2xl font-bold font-mono text-white">{Math.round(newMonthlySavings).toLocaleString()}</div>
                               <div className="text-xs text-slate-400">/ {isRtl ? 'شهر' : 'mo'}</div>
                           </div>
                           {optimizationImpact > 0 && (
                               <div className="text-xs font-bold text-cyan-300 flex items-center mt-1">
                                    <ArrowUpRight size={12} className="mr-0.5" />
                                    +{Math.round(optimizationImpact).toLocaleString()}
                               </div>
                           )}
                       </div>
                       
                       <div className="bg-white/10 backdrop-blur border border-white/10 p-4 rounded-xl">
                           <div className="text-xs text-slate-300 font-medium mb-1">{isRtl ? 'الثروة الصافية بعد 10 سنوات' : 'Net Wealth after 10 Years'}</div>
                           <div className="text-2xl font-bold font-mono text-white">{formatCurrency(optimized10Year)}</div>
                           {extraWealthGenerated > 0 && (
                               <div className="text-xs font-bold text-emerald-400 mt-1">
                                    +{formatCurrency(extraWealthGenerated)} {isRtl ? 'نمو إضافي' : 'extra growth'}
                               </div>
                           )}
                       </div>
                   </div>
               </div>

               <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[300px]">
                   <h4 className="text-sm font-bold text-slate-500 mb-6 w-full text-center">{isRtl ? 'مسار نمو الثروة التراكمي (10 سنوات)' : 'Wealth Accumulation Path (10 Years)'}</h4>
                   <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                       <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => formatCurrency(val)} />
                           <RechartsTooltip 
                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                               formatter={(value: number) => [value.toLocaleString(), '']}
                               labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
                           />
                           <Area type="monotone" dataKey="baseline" name={isRtl ? "المسار الأصلي" : "Baseline"} stroke="#cbd5e1" strokeWidth={2} fillOpacity={1} fill="url(#colorBaseline)" />
                           <Area type="monotone" dataKey="optimized" name={isRtl ? "بعد التحسين" : "Optimized"} stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorOptimized)" />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>

               {optimizationImpact > 0 && (
                   <div className="bg-cyan-50 p-4 border-t border-cyan-100 flex items-start gap-3">
                       <Sparkles className="text-cyan-600 mt-0.5 shrink-0" size={18} />
                       <div className="text-sm font-medium text-cyan-800 leading-relaxed">
                           {isRtl 
                           ? `هذه التعديلات البسيطة التي قمت بها ترفع قدرتك الادخارية بمقدار ${Math.round(optimizationImpact).toLocaleString()} شهرياً مما يعجل بوصولك للحرية المالية، سيصنع ذلك فارقاً خرافياً بفضل العائد المركب خلال السنوات القادمة.`
                           : `These small optimization tweaks increase your savings firepower by ${Math.round(optimizationImpact).toLocaleString()}/mo. Compound interest will turn this into a massive advantage over the years.`}
                       </div>
                   </div>
               )}
           </div>
       </div>

    </div>
  );
};
