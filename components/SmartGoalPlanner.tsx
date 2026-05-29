import React, { useState, useMemo } from 'react';
import { Expense, Language, ExpenseType, DashboardMetrics } from '../types';
import { Target, TrendingUp, ArrowLeft, ArrowRight, Calculator, Calendar, Lightbulb, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SmartGoalPlannerProps {
  salary: number;
  expenses: Expense[];
  metrics: DashboardMetrics;
  lang: Language;
  onBack: () => void;
}

type GoalType = 'DEBT' | 'WEALTH' | null;

export const SmartGoalPlanner: React.FC<SmartGoalPlannerProps> = ({ salary, expenses, metrics, lang, onBack }) => {
  const isRtl = lang === 'ar';
  const [goalType, setGoalType] = useState<GoalType>(null);
  
  // Form State
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
  const [totalDebtBalance, setTotalDebtBalance] = useState<string>('');
  const [targetMonths, setTargetMonths] = useState<number>(24);
  
  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState<string[]>([]);
  const [currentSavings, setCurrentSavings] = useState<string>('');
  const [roiPercent, setRoiPercent] = useState<number>(5);
  
  const [customAdditionalMonthly, setCustomAdditionalMonthly] = useState<number>(0);
  
  const handleReset = () => {
    setGoalType(null);
    setSelectedDebtIds([]);
    setTotalDebtBalance('');
    setTargetMonths(24);
    setSelectedInvestmentIds([]);
    setCurrentSavings('');
    setRoiPercent(5);
    setCustomAdditionalMonthly(0);
  };

  const debtInstallments = useMemo(() => {
     return expenses.filter(e => selectedDebtIds.includes(e.id)).reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses, selectedDebtIds]);

  const monthlyInvestments = useMemo(() => {
     return expenses.filter(e => selectedInvestmentIds.includes(e.id)).reduce((acc, curr) => acc + curr.amount, 0) + customAdditionalMonthly;
  }, [expenses, selectedInvestmentIds, customAdditionalMonthly]);

  // Calculations for Debt Payoff
  const debtSimulation = useMemo(() => {
      const balance = parseFloat(totalDebtBalance) || 0;
      const initialSavings = parseFloat(currentSavings) || 0;
      const r = (roiPercent / 100) / 12;
      const n = targetMonths;
      
      // DEBT: After N months, debt balance assuming it decreases linearly by installment
      const projectedDebt = Math.max(0, balance - (debtInstallments * n));
      
      // INVESTMENTS: Future Value
      let fvSavings = initialSavings;
      let fvMonthly = 0;
      
      if (r > 0) {
          fvSavings = initialSavings * Math.pow(1 + r, n);
          fvMonthly = monthlyInvestments * ((Math.pow(1 + r, n) - 1) / r);
      } else {
          fvSavings = initialSavings;
          fvMonthly = monthlyInvestments * n;
      }
      
      const totalProjectedInvestments = fvSavings + fvMonthly;
      const shortfall = projectedDebt - totalProjectedInvestments;
      
      let requiredAdditionalMonthly = 0;
      if (shortfall > 0) {
          if (r > 0) {
              requiredAdditionalMonthly = (shortfall * r) / (Math.pow(1 + r, n) - 1);
          } else {
              requiredAdditionalMonthly = shortfall / n;
          }
      }
      
      return {
          projectedDebt,
          totalProjectedInvestments,
          shortfall,
          isAchievable: shortfall <= 0,
          requiredAdditionalMonthly
      };
  }, [totalDebtBalance, debtInstallments, currentSavings, monthlyInvestments, roiPercent, targetMonths]);

  // Calculations for Wealth Target
  const [wealthTargetAmount, setWealthTargetAmount] = useState<string>('');
  
  const wealthSimulation = useMemo(() => {
      const target = parseFloat(wealthTargetAmount) || 0;
      const initialSavings = parseFloat(currentSavings) || 0;
      const r = (roiPercent / 100) / 12;
      const n = targetMonths;
      
      let fvSavings = initialSavings;
      let fvMonthly = 0;
      
      if (r > 0) {
          fvSavings = initialSavings * Math.pow(1 + r, n);
          fvMonthly = monthlyInvestments * ((Math.pow(1 + r, n) - 1) / r);
      } else {
          fvSavings = initialSavings;
          fvMonthly = monthlyInvestments * n;
      }
      
      const totalProjectedInvestments = fvSavings + fvMonthly;
      const shortfall = target - totalProjectedInvestments;
      
      let requiredAdditionalMonthly = 0;
      if (shortfall > 0) {
          if (r > 0) {
              requiredAdditionalMonthly = (shortfall * r) / (Math.pow(1 + r, n) - 1);
          } else {
              requiredAdditionalMonthly = shortfall / n;
          }
      }
      
      return {
          totalProjectedInvestments,
          shortfall,
          isAchievable: shortfall <= 0,
          requiredAdditionalMonthly
      };
  }, [wealthTargetAmount, currentSavings, monthlyInvestments, roiPercent, targetMonths]);

  const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

  if (!goalType) {
    return (
       <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 p-6 sm:p-8" dir={isRtl ? 'rtl' : 'ltr'}>
           <div className="flex items-center gap-3 mb-8">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              </button>
              <div>
                  <h2 className="text-xl font-bold text-slate-900">{isRtl ? 'المخطط المالي الذكي' : 'Smart Goal Planner'}</h2>
                  <p className="text-sm text-slate-500 mt-1">{isRtl ? 'حدد هدفك المالي وسنقوم برسم خطة ذكية للوصول إليه' : 'Choose your financial goal to get a smart plan'}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button onClick={() => setGoalType('DEBT')} className="group text-right text-slate-800 bg-white border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30 p-6 rounded-2xl transition-all flex flex-col items-center text-center gap-4">
                   <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target size={28} />
                   </div>
                   <div>
                       <h3 className="font-bold text-lg mb-2">{isRtl ? 'تصميم سداد الديون (متى وكيف؟)' : 'Smart Debt Payoff Strategy'}</h3>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium">{isRtl ? 'حدد متى تريد إنهاء قرضك تماماً وحجم الديون الحالية، وسيحسب لك كيف تستخدم استثماراتك لبلوغه' : 'Set when you want to terminate your loan, we calculate how to use investments to hit it'}</p>
                   </div>
               </button>

               <button onClick={() => setGoalType('WEALTH')} className="group text-right text-slate-800 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 p-6 rounded-2xl transition-all flex flex-col items-center text-center gap-4">
                   <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp size={28} />
                   </div>
                   <div>
                       <h3 className="font-bold text-lg mb-2">{isRtl ? 'بناء الثروة والاستثمار' : 'Wealth Building & Investment'}</h3>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium">{isRtl ? 'خطط للوصول إلى مبلغ ادخاري مستهدف في غضون فترة معينة، وسنخبرك بخطة الاستثمار المناسبة' : 'Plan to reach a target amount, and we will guide your saving & investing plan'}</p>
                   </div>
               </button>
           </div>
       </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 flex flex-col overflow-hidden animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
       <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-6 flex items-center justify-between z-10 relative">
           <div className="flex items-center gap-3">
              <button onClick={handleReset} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm rounded-full transition-all text-slate-600">
                {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              </button>
              <div>
                  <h2 className="text-lg font-bold text-slate-900">{goalType === 'DEBT' ? (isRtl ? 'خطة التخلص من الديون' : 'Debt Payoff Plan') : (isRtl ? 'خطة بناء الثروة' : 'Wealth Building Plan')}</h2>
              </div>
           </div>
       </div>

       <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 xl:gap-8">
           {/* FORM */}
           <div className="flex flex-col gap-6">
                
                {goalType === 'DEBT' && (
                  <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                         <div className="flex items-center gap-2 text-indigo-600">
                           <Target size={20} />
                           <span className="font-bold">{isRtl ? 'تفاصيل الدين المستهدف' : 'Target Debt Details'}</span>
                         </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">{isRtl ? 'إجمالي المتبقي للقرض (الأصل + الأرباح)' : 'Total Remaining Loan Balance'}</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={totalDebtBalance}
                              onChange={(e) => setTotalDebtBalance(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl font-bold font-mono text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-sans"
                              placeholder="مثال: 150000"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{isRtl ? 'ر.س' : 'SAR'}</span>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                          <label className="block text-sm font-bold text-slate-700 mb-2">{isRtl ? 'اختر الأقساط المرتبطة (سيتم خصمها من المتبقي دورياً)' : 'Select Related Installments'}</label>
                          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {expenses.length === 0 ? (
                                <p className="text-sm text-slate-500 italic p-2">{isRtl ? 'لا توجد مصروفات مضافة في الخطة الحالية' : 'No expenses added'}</p>
                              ) : expenses.map(exp => (
                                  <label key={exp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedDebtIds.includes(exp.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedDebtIds(prev => [...prev, exp.id]);
                                            else setSelectedDebtIds(prev => prev.filter(id => id !== exp.id));
                                        }}
                                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                      />
                                      <div className="flex-1 flex justify-between items-center group">
                                          <span className="font-semibold text-slate-700 text-sm">{exp.name}</span>
                                          <span className="text-slate-500 text-sm font-bold font-mono group-hover:text-indigo-600 transition-colors">{exp.amount.toLocaleString()}</span>
                                      </div>
                                  </label>
                              ))}
                          </div>
                      </div>
                  </div>
                )}

                {goalType === 'WEALTH' && (
                  <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                      <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-3">
                         <Target size={20} />
                         <span className="font-bold">{isRtl ? 'الهدف المالي' : 'Financial Target'}</span>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">{isRtl ? 'المبلغ المستهدف الوصول إليه' : 'Target Amount to Reach'}</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={wealthTargetAmount}
                              onChange={(e) => setWealthTargetAmount(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl font-bold font-mono text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-sans"
                              placeholder="مثال: 500000"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{isRtl ? 'ر.س' : 'SAR'}</span>
                          </div>
                      </div>
                  </div>
                )}

                <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-100/50">
                        <div className="flex items-center gap-2 text-amber-700">
                            <Calendar size={20} />
                            <span className="font-bold text-sm sm:text-base">{isRtl ? 'متى تريد تحقيق الهدف (سداد أو إنجاز)؟' : 'When do you want to hit the target?'}</span>
                        </div>
                        <div className="font-bold text-amber-600 bg-white shadow-sm px-3 py-1.5 rounded-lg text-sm tabular-nums flex items-center gap-1">
                           <span className="text-lg">{targetMonths}</span>
                           <span>{isRtl ? 'شهر' : 'Months'}</span>
                        </div>
                    </div>

                    <div className="px-2 pt-2">
                        <input 
                          type="range" 
                          min="1" max="120" step="1"
                          value={targetMonths}
                          onChange={(e) => setTargetMonths(parseInt(e.target.value))}
                          className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
                           <span>{isRtl ? '1 شهر' : '1 Month'}</span>
                           <span>{isRtl ? '10 سنوات (120)' : '10 Years (120)'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <Wallet size={20} />
                            <span className="font-bold">{isRtl ? 'الاستثمار المغذي للهدف' : 'Investments Feeding Target'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{isRtl ? 'المدخرات المتوفرة كاش/استثمار' : 'Currently Saved Amount'}</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={currentSavings}
                                onChange={(e) => setCurrentSavings(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 font-mono font-bold"
                                placeholder="0"
                              />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{isRtl ? 'نسبة الربح السنوي المتوقعة' : 'Expected Annual ROI (%)'}</label>
                            <div className="relative">
                                <input 
                                  type="number" 
                                  value={roiPercent}
                                  onChange={(e) => setRoiPercent(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold font-mono text-emerald-700"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/50 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={() => setRoiPercent(4)} className="flex-1 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">{isRtl ? '4% (مرابحة)' : '4% (Murabaha)'}</button>
                        <button onClick={() => setRoiPercent(8)} className="flex-1 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">{isRtl ? '8% (مؤشرات متداولة)' : '8% (ETFs)'}</button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="block text-sm font-bold text-slate-700 mb-3">{isRtl ? 'اختر أقساط الادخار/الاستثمار الجارية حالياً' : 'Select Ongoing Monthly Savings'}</label>
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {expenses.filter(e => e.type === ExpenseType.SAVING).length === 0 ? (
                                <p className="text-sm text-slate-500 italic p-2">{isRtl ? 'أنت لا تدخر حالياً! أضف مدخرات في الخطوة السابقة' : 'No savings added!'}</p>
                              ) : expenses.filter(e => e.type === ExpenseType.SAVING).map(exp => (
                                  <label key={exp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 cursor-pointer transition-colors shadow-sm">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedInvestmentIds.includes(exp.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedInvestmentIds(prev => [...prev, exp.id]);
                                            else setSelectedInvestmentIds(prev => prev.filter(id => id !== exp.id));
                                        }}
                                        className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                      />
                                      <div className="flex-1 flex justify-between items-center group">
                                          <span className="font-semibold text-slate-700 text-sm">{exp.name}</span>
                                          <span className="text-slate-500 text-sm font-bold font-mono group-hover:text-emerald-600 transition-colors">{exp.amount.toLocaleString()}</span>
                                      </div>
                                  </label>
                              ))}
                          </div>
                    </div>

                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                           <label className="text-sm font-bold text-indigo-900">{isRtl ? 'ماذا لو أضفت مبلغا شهرياً آخر؟ (عصف ذهني)' : 'Additional Custom Monthly Investment'}</label>
                           <span className="font-bold font-mono text-indigo-700 bg-white shadow-sm border border-indigo-100 px-3 py-1 rounded-lg text-sm">{customAdditionalMonthly.toLocaleString()} SAR</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="20000" step="100"
                          value={customAdditionalMonthly}
                          onChange={(e) => setCustomAdditionalMonthly(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
           </div>

           {/* RESULTS PANEL */}
           <div className="flex flex-col h-full rounded-2xl bg-gradient-to-b from-[#0B132B] to-[#121A31] border border-slate-800 p-6 lg:p-8 shadow-2xl relative overflow-hidden text-white mt-8 lg:mt-0">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4"></div>
               
               <h3 className="text-xl font-bold mb-8 flex items-center gap-3 relative z-10 border-b border-white/10 pb-4">
                  <Lightbulb className="text-amber-400" size={24} />
                  {isRtl ? 'تحليل المخطط الذكي' : 'Smart Planner Analysis'}
               </h3>

               {goalType === 'DEBT' && (
                 <div className="flex flex-col gap-8 relative z-10 flex-1">
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10 shadow-inner flex flex-col justify-center">
                             <div className="text-slate-400 text-xs sm:text-sm mb-2 font-medium">{isRtl ? 'قيمة القرض المتبقية في شهر الحسم' : 'Debt balance at target date'}</div>
                             <div className="text-3xl font-bold font-mono text-red-400/90 tracking-tight">{Math.round(debtSimulation.projectedDebt).toLocaleString()}</div>
                         </div>
                         <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10 shadow-inner flex flex-col justify-center">
                             <div className="text-slate-400 text-xs sm:text-sm mb-2 font-medium">{isRtl ? 'قيمة محفظتك الاستثمارية حينها' : 'Investment portfolio value then'}</div>
                             <div className="text-3xl font-bold font-mono text-emerald-400/90 tracking-tight">{Math.round(debtSimulation.totalProjectedInvestments).toLocaleString()}</div>
                         </div>
                     </div>

                     <div className={classNames(
                         "p-6 lg:p-8 rounded-2xl border flex flex-col items-center justify-center text-center gap-4 bg-black/20 backdrop-blur-md shadow-2xl transition-all",
                         debtSimulation.isAchievable ? "border-emerald-500/30" : "border-red-500/30"
                     )}>
                         {debtSimulation.isAchievable ? (
                            <>
                                <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 mb-2">
                                  <CheckCircle2 size={48} className="text-emerald-400" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">{isRtl ? 'الهدف قابل للتحقيق!' : 'Goal is Achievable!'}</h4>
                                <p className="text-emerald-100/70 text-sm leading-relaxed max-w-sm">
                                   {isRtl 
                                     ? `ممتاز! في الشهر المحدد، ستتمكن من تسييل الثروة وسداد القرض بالكامل، وسيتبقى لك كاش حر إضافي قيمته:` 
                                     : `Great! At target date, you can liquidate and pay off the loan in full, keeping a cash surplus of:`
                                   }
                                </p>
                                <div className="text-4xl font-bold font-mono text-white mt-2 bg-emerald-900/40 px-8 py-4 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                   {Math.round(Math.abs(debtSimulation.shortfall)).toLocaleString()}
                                </div>
                            </>
                         ) : (
                            <>
                                <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-2">
                                  <AlertTriangle size={48} className="text-red-400" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">{isRtl ? 'تحتاج إلى تعديل الخطة' : 'Plan needs adjustment'}</h4>
                                <p className="text-red-100/70 text-sm leading-relaxed max-w-sm">
                                   {isRtl 
                                     ? `في الوقت الذي حددته لسداد الدين دفعة واحدة، محفظتك الاستثمارية ستكون عاجزة بمقدار:` 
                                     : `At your target date, investments fall short. The shortfall is:`
                                   }
                                </p>
                                <div className="text-3xl font-bold font-mono text-red-300 mt-2">
                                   {Math.round(debtSimulation.shortfall).toLocaleString()}
                                </div>

                                <div className="mt-6 p-5 bg-white/5 rounded-xl border border-white/10 w-full text-center group">
                                     <div className="text-slate-300 mb-3 text-sm font-medium">{isRtl ? 'للحاق بالهدف وسداد الدين بالكامل في وقته، يجب زيادة استثمارك الشهري فوراً بمقدار:' : 'To hit target on time, increase monthly investment by:'}</div>
                                     <div className="text-3xl font-bold font-mono text-amber-400">{Math.round(debtSimulation.requiredAdditionalMonthly).toLocaleString()}</div>
                                     <div className="text-[11px] text-slate-500 mt-3 font-medium bg-black/20 inline-block px-3 py-1.5 rounded-full">{isRtl ? '(استخدم شريط العصف الذهني المجاور لتجربة مبالغ شهرية اضافية)' : '(Use the slider to add custom monthly amount)'}</div>
                                </div>
                            </>
                         )}
                     </div>

                     <div className="mt-auto bg-slate-800/40 rounded-xl p-5 text-xs text-slate-400 leading-relaxed border border-white/5 font-medium flex items-start gap-3">
                         <span className="text-amber-500 text-lg">💡</span>
                         <div>
                            <span className="font-bold text-amber-500 mb-1 block text-sm">{isRtl ? 'منطق الأداة' : 'How it works'}</span>
                            {isRtl 
                            ? 'تفترض الأداة استمرارك الطبيعي في دفع القسط الشهري والذي يقلل أصل الدين بشكل تراكمي. بالتوازي، استثماراتك المحددة تنمو بعائد مركب شهرياً. لكي تنجح خطة "الخروج المبكر"، يجب أن تتجاوز قيمة المحفظة الرصيد المتبقي للقرض عند النقطة الزمنية (الشهر) التي قمت باختيارها.'
                            : 'The tool assumes regular installment payments reducing the principal, while selected investments grow with compound returns. To succeed, portfolio FV must exceed the remaining debt balance at the chosen target date.'
                            }
                         </div>
                     </div>
                 </div>
               )}

               {goalType === 'WEALTH' && (
                 <div className="flex flex-col gap-8 relative z-10 flex-1">
                     
                     <div className="grid grid-cols-1 gap-4">
                         <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-inner flex flex-col items-center">
                             <div className="text-slate-400 text-sm mb-3 font-medium">{isRtl ? 'قيمة محفظتك الاستثمارية بعد' : 'Portfolio value after'} <span className="text-white">({targetMonths}) {isRtl ? 'شهر' : 'mo'}</span></div>
                             <div className="text-5xl font-bold font-mono text-emerald-400/90 tracking-tight">{Math.round(wealthSimulation.totalProjectedInvestments).toLocaleString()}</div>
                         </div>
                     </div>

                     <div className={classNames(
                         "p-6 lg:p-8 rounded-2xl border flex flex-col items-center justify-center text-center gap-4 bg-black/20 backdrop-blur-md shadow-2xl transition-all",
                         wealthSimulation.isAchievable ? "border-emerald-500/30" : "border-red-500/30"
                     )}>
                         {wealthSimulation.isAchievable ? (
                            <>
                                <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 mb-2">
                                  <CheckCircle2 size={48} className="text-emerald-400" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">{isRtl ? 'ستصل للهدف وأكثر!' : 'Goal Reached & Exceeded!'}</h4>
                                <p className="text-emerald-100/70 text-sm leading-relaxed max-w-sm">
                                   {isRtl 
                                     ? `أنت تحلق! محفظتك الاستثمارية ستتجاوز الهدف المطلوب بفائض قدره:` 
                                     : `You are flying! Portfolio exceeds target by:`
                                   }
                                </p>
                                <div className="text-4xl font-bold font-mono text-white mt-2 bg-emerald-900/40 px-8 py-4 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                   {Math.round(Math.abs(wealthSimulation.shortfall)).toLocaleString()}
                                </div>
                            </>
                         ) : (
                            <>
                                <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-2">
                                  <AlertTriangle size={48} className="text-red-400" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">{isRtl ? 'السرعة الاستثمارية بطيئة' : 'Plan needs acceleration'}</h4>
                                <p className="text-red-100/70 text-sm leading-relaxed max-w-sm">
                                   {isRtl 
                                     ? `حتى مع العوائد المتوقعة، أنت لن تصل إلى المبلغ المستهدف في الوقت المحدد.` 
                                     : `Even with ROI, you fall short of target amount on time.`
                                   }
                                </p>
                                
                                <div className="mt-6 p-5 bg-white/5 rounded-xl border border-white/10 w-full text-center">
                                     <div className="text-slate-300 mb-3 text-sm font-medium">{isRtl ? 'لسد الفجوة وتحقيق الهدف، قم بزيادة استثمارك الشهري من الآن بمقدار:' : 'To hit your target on time, increase monthly investment by:'}</div>
                                     <div className="text-3xl font-bold font-mono text-amber-400">{Math.round(wealthSimulation.requiredAdditionalMonthly).toLocaleString()}</div>
                                     <div className="text-[11px] text-slate-500 mt-3 font-medium bg-black/20 inline-block px-3 py-1.5 rounded-full">{isRtl ? '(استخدم شريط العصف الذهني المجاور لتجربة مبالغ شهرية اضافية)' : '(Use the slider to add custom monthly amount)'}</div>
                                </div>
                            </>
                         )}
                     </div>

                 </div>
               )}
           </div>
       </div>

    </div>
  );
};
