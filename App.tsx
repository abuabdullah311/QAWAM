import React, { useState, useEffect } from 'react';
import { StickyHeader } from './components/StickyHeader';
import { FinancialChart } from './components/FinancialChart';
import { TargetVsActualChart } from './components/TargetVsActualChart';
import { ExpenseTable } from './components/ExpenseTable';
import { AddExpenseForm } from './components/AddExpenseForm';
import { PrintableReport } from './components/PrintableReport';
import { FinancialAdvisor } from './components/FinancialAdvisor';
import { ExpenseWizard } from './components/ExpenseWizard';
import { Expense, ExpenseType, DashboardMetrics, AppStep, Language, BudgetRule } from './types';
import { TRANSLATIONS, EXPENSE_TYPE_LABELS } from './constants';
import { Download, Info, AlertCircle, CheckCircle2, Plus, ArrowRight, ArrowLeft, Send, AlertTriangle, Scale, Ban, Pencil, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Helper for Analysis Cards
function AnalysisCard({ title, current, target, color, isMinimum = false, lang }: any) {
  const t = TRANSLATIONS[lang as Language];
  const diff = current - target;
  const isNegative = isMinimum ? diff < -5 : diff > 5; 
  
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} transition-all hover:shadow-md duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs bg-white px-2 py-0.5 rounded shadow-sm opacity-80 font-mono font-bold">{Math.round(current)}%</span>
      </div>
      <div className="w-full bg-white/50 h-2 rounded-full mb-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out bg-current shadow-sm`} 
          style={{ width: `${Math.min(current, 100)}%` }}
        ></div>
      </div>
      {isNegative ? (
        <div className="flex items-start gap-1 text-xs mt-1 font-medium opacity-90">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>
             {isMinimum 
               ? `${t.belowTarget} ${Math.abs(Math.round(diff))}%` 
               : `${t.aboveTarget} ${Math.round(diff)}%`}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-1 text-xs mt-1 font-medium opacity-90">
          <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
          <span>{t.idealRange}</span>
        </div>
      )}
    </div>
  );
}

interface BlockingErrorState {
  type: 'total';
  current: number;
  limit: number;
}

interface WarningState {
  type: 'needs' | 'wants' | 'savings';
  current: number;
  limit: number;
  rulePct: number;
  excessAmount: number;
  suggestions: { name: string; amount: number; reduceBy: number }[];
}

function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [step, setStep] = useState<AppStep>(AppStep.SALARY);
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetRule, setBudgetRule] = useState<BudgetRule>({ needs: 50, wants: 30, savings: 20 });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for Blocking Errors (Total > Salary)
  const [blockingError, setBlockingError] = useState<BlockingErrorState | null>(null);
  
  // State for Warnings (Category > Limit) - Non blocking
  const [warningState, setWarningState] = useState<WarningState | null>(null);
  
  const [visitorCount, setVisitorCount] = useState<number>(12050);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Initialize from LocalStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('qawam_expenses');
    const savedSalary = localStorage.getItem('qawam_salary');
    const savedVisitor = localStorage.getItem('qawam_visitors');
    const savedRule = localStorage.getItem('qawam_rule');
    
    // Simple mock visitor logic
    let count = 12050;
    if (savedVisitor) {
       count = parseInt(savedVisitor);
    } else {
       count = 12050 + Math.floor(Math.random() * 50);
       localStorage.setItem('qawam_visitors', count.toString());
    }
    setVisitorCount(count);

    if (savedRule) {
      setBudgetRule(JSON.parse(savedRule));
    }

    if (savedSalary) {
      const s = parseFloat(savedSalary);
      setSalary(s);
      if (s > 0) {
          // If expenses exist, go to dashboard
          if(savedExpenses && JSON.parse(savedExpenses).length > 0) {
              setStep(AppStep.DASHBOARD);
          } else {
              setStep(AppStep.WIZARD);
          }
      }
    }
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save on Change
  useEffect(() => {
    localStorage.setItem('qawam_expenses', JSON.stringify(expenses));
    localStorage.setItem('qawam_salary', salary.toString());
    localStorage.setItem('qawam_rule', JSON.stringify(budgetRule));
  }, [expenses, salary, budgetRule]);

  // Calculations
  const metrics: DashboardMetrics = React.useMemo(() => {
    const totalNeeds = expenses.filter(e => e.type === ExpenseType.NEED).reduce((acc, curr) => acc + curr.amount, 0);
    const totalWants = expenses.filter(e => e.type === ExpenseType.WANT).reduce((acc, curr) => acc + curr.amount, 0);
    const totalSavingsExpenses = expenses.filter(e => e.type === ExpenseType.SAVING).reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalExpenses = totalNeeds + totalWants + totalSavingsExpenses;
    const remainingSalary = salary - totalExpenses;
    const totalSavingsCalculated = Math.max(0, salary - totalNeeds - totalWants);

    return {
      totalNeeds,
      totalWants,
      totalSavingsExpenses,
      totalExpenses,
      remainingSalary,
      totalSavingsCalculated
    };
  }, [expenses, salary]);

  // Handlers
  const handleNextStep = () => {
      if (step === AppStep.SALARY && salary > 0) {
          if (expenses.length > 0) {
              setStep(AppStep.EXPENSES);
          } else {
              setStep(AppStep.WIZARD);
          }
      }
      else if (step === AppStep.WIZARD) setStep(AppStep.ADVISOR);
      else if (step === AppStep.ADVISOR) setStep(AppStep.EXPENSES);
      else if (step === AppStep.EXPENSES) {
          
          // 1. STRICT BLOCKING: Total Expenses > Salary
          // This must prevent progress because it's mathematically impossible
          if (Math.round(metrics.totalExpenses) > salary) {
              setBlockingError({ 
                  type: 'total', 
                  current: metrics.totalExpenses, 
                  limit: salary 
              });
              return;
          }

          // 2. WARNINGS (Non-blocking): Check limits
          // We check Wants first as requested, then others
          
          const wantsLimit = (budgetRule.wants / 100) * salary;
          if (Math.round(metrics.totalWants) > Math.round(wantsLimit)) {
               triggerWarning('wants', metrics.totalWants, wantsLimit, budgetRule.wants);
               return;
          }

          const needsLimit = (budgetRule.needs / 100) * salary;
          if (Math.round(metrics.totalNeeds) > Math.round(needsLimit)) {
               triggerWarning('needs', metrics.totalNeeds, needsLimit, budgetRule.needs);
               return;
          }

          // If no blocking errors and no warnings (or warnings ignored), proceed
          setStep(AppStep.DASHBOARD);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerWarning = (type: 'needs'|'wants'|'savings', current: number, limit: number, rulePct: number) => {
      const excess = current - limit;
      const expenseType = type === 'needs' ? ExpenseType.NEED : (type === 'wants' ? ExpenseType.WANT : ExpenseType.SAVING);
      
      // Find largest expenses in this category to suggest reduction
      const categoryExpenses = expenses
          .filter(e => e.type === expenseType)
          .sort((a, b) => b.amount - a.amount);

      const suggestions = categoryExpenses.slice(0, 3).map(e => ({
          name: e.name,
          amount: e.amount,
          reduceBy: Math.min(e.amount, excess) // Suggest reducing by excess, capped at item amount
      }));

      setWarningState({
          type,
          current,
          limit,
          rulePct,
          excessAmount: excess,
          suggestions
      });
  };

  const handleIgnoreWarning = () => {
      setWarningState(null);
      setStep(AppStep.DASHBOARD);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
      if (step === AppStep.WIZARD) setStep(AppStep.SALARY);
      else if (step === AppStep.ADVISOR) setStep(AppStep.WIZARD);
      else if (step === AppStep.EXPENSES) setStep(AppStep.ADVISOR);
      else if (step === AppStep.DASHBOARD) setStep(AppStep.EXPENSES);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleWizardComplete = (newExpenses: Omit<Expense, 'id'>[]) => {
      const formatted = newExpenses.map(e => ({
          ...e,
          id: Date.now().toString() + Math.random().toString()
      }));
      setExpenses(formatted);
      setStep(AppStep.ADVISOR);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingExpense(null), 300);
  };

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense = { ...newExpenseData, id: Date.now().toString() + Math.random().toString() };
    setExpenses(prev => [newExpense, ...prev]);
    handleCloseModal();
    return true;
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    handleCloseModal();
    return true;
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleReset = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف البيانات؟' : 'Are you sure you want to reset data?')) {
      localStorage.removeItem('qawam_expenses');
      localStorage.removeItem('qawam_salary');
      localStorage.removeItem('qawam_rule');
      setSalary(0);
      setExpenses([]);
      setBudgetRule({ needs: 50, wants: 30, savings: 20 });
      setEditingExpense(null);
      setStep(AppStep.SALARY);
      window.scrollTo(0, 0);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const input = document.getElementById('printable-report');
      if (!input) throw new Error('Report not found');
      input.style.display = 'flex';
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF(isRtl ? 'p' : 'p', 'mm', 'a4'); 
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`QAWAM-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? "خطأ في التصدير" : "Export Error");
    } finally {
      setIsExporting(false);
    }
  };

  const getAnalysis = () => {
    if (salary === 0) return null;
    const needPct = (metrics.totalNeeds / salary) * 100;
    const wantPct = (metrics.totalWants / salary) * 100;
    const savePct = (metrics.totalSavingsCalculated / salary) * 100;

    const isBalanced = 
      Math.abs(needPct - budgetRule.needs) <= 5 && 
      Math.abs(wantPct - budgetRule.wants) <= 5 && 
      savePct >= (budgetRule.savings - 5);

    return (
      <div className="mb-6">
        {isBalanced && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 animate-pulse">
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-bold text-emerald-800">{t.balancedMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalysisCard title={`${t.needs} (${t.target} ${budgetRule.needs}%)`} current={needPct} target={budgetRule.needs} color="red" lang={lang} />
          <AnalysisCard title={`${t.wants} (${t.target} ${budgetRule.wants}%)`} current={wantPct} target={budgetRule.wants} color="amber" lang={lang} />
          <AnalysisCard title={`${t.savings} (${t.target} ${budgetRule.savings}%)`} current={savePct} target={budgetRule.savings} color="emerald" isMinimum lang={lang} />
        </div>
      </div>
    );
  };

  const renderBlockingModalContent = () => {
      if (!blockingError) return null;
      // This is only for Total > Salary
      const title = lang === 'ar' ? 'تجاوز الراتب' : 'Salary Exceeded';
      const message = lang === 'ar' 
        ? `إجمالي المصروفات (${blockingError.current.toLocaleString()}) يتجاوز صافي الراتب (${blockingError.limit.toLocaleString()}).`
        : `Total expenses (${blockingError.current.toLocaleString()}) exceed net salary (${blockingError.limit.toLocaleString()}).`;

      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
             <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center border-t-4 border-red-500">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                   <Ban size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">{message}</p>
                <button
                    onClick={() => setBlockingError(null)}
                    className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-lg"
                >
                    {lang === 'ar' ? 'مراجعة المصروفات' : 'Review Expenses'}
                </button>
             </div>
          </div>
      );
  };

  const renderWarningModalContent = () => {
      if (!warningState) return null;
      
      const catName = warningState.type === 'needs' ? t.needs 
                     : warningState.type === 'wants' ? t.wants 
                     : t.savings;
      
      const title = lang === 'ar' ? `تنبيه: ارتفاع ${catName}` : `Warning: High ${catName}`;
      
      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
             <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform scale-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="text-start">
                             <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                             <p className="text-xs text-gray-500">{lang === 'ar' ? 'لقد تجاوزت النسبة المقترحة' : 'You exceeded the suggested ratio'}</p>
                        </div>
                     </div>
                     <button onClick={() => setWarningState(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-gray-700 mb-6 leading-relaxed text-start">
                    {lang === 'ar' ? (
                        <>
                           مجموع مصاريف "{catName}" هو <span className="font-bold">{warningState.current.toLocaleString()}</span>. 
                           للوصول للنسبة المثالية ({warningState.rulePct}%)، يفضل تقليل المبلغ بمقدار <span className="font-bold text-red-600">{Math.round(warningState.excessAmount).toLocaleString()}</span>.
                        </>
                    ) : (
                        <>
                           Total "{catName}" expenses are <span className="font-bold">{warningState.current.toLocaleString()}</span>.
                           To reach the ideal ratio ({warningState.rulePct}%), try reducing by <span className="font-bold text-red-600">{Math.round(warningState.excessAmount).toLocaleString()}</span>.
                        </>
                    )}
                </div>

                {warningState.suggestions.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 text-start">{lang === 'ar' ? 'مقترحات للتخفيض:' : 'Suggestions to reduce:'}</h4>
                        <div className="space-y-2">
                            {warningState.suggestions.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <span className="font-bold text-gray-700 text-sm">{s.name}</span>
                                    <div className="text-xs text-gray-500">
                                        {lang === 'ar' ? 'قلل بمقدار' : 'Reduce by'} <span className="font-bold text-emerald-600">{Math.round(s.reduceBy).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => setWarningState(null)}
                        className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        {lang === 'ar' ? 'مراجعة وتعديل' : 'Review & Edit'}
                    </button>
                    <button
                        onClick={handleIgnoreWarning}
                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                        <span>{lang === 'ar' ? 'تجاهل وعرض النتائج' : 'Ignore & Show Results'}</span>
                        {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </button>
                </div>
             </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28 relative flex flex-col selection:bg-blue-100 selection:text-blue-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <StickyHeader 
        salary={salary} 
        metrics={metrics} 
        onReset={handleReset} 
        currentStep={step} 
        visitorCount={visitorCount}
        lang={lang}
        setLang={setLang}
      />

      {/* Hidden Report for PDF */}
      <div style={{ position: 'fixed', left: '-10000px', top: 0, zIndex: -5, overflow: 'hidden' }}>
        <PrintableReport 
            salary={salary} 
            metrics={metrics} 
            expenses={expenses} 
            lang={lang} 
            budgetRule={budgetRule}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 flex-grow w-full">
        
        {/* --- STEP 1: SALARY --- */}
        {step === AppStep.SALARY && (
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
                 <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-white/50 p-8 w-full max-w-lg text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
                    
                    <h2 className="text-2xl font-black text-gray-800 mb-6">{t.salaryLabel}</h2>
                    
                    <div className="relative mb-6 group">
                        <input
                        type="number"
                        value={salary || ''}
                        onChange={(e) => setSalary(parseFloat(e.target.value))}
                        placeholder="0"
                        autoFocus
                        className="w-full font-black text-gray-800 border-b-2 border-gray-100 focus:border-blue-600 outline-none bg-transparent transition-all placeholder-gray-200 text-6xl text-center py-6 group-hover:border-blue-200"
                        />
                        <span className={`absolute text-gray-400 font-bold bottom-8 text-xl pointer-events-none transition-all ${isRtl ? 'left-4' : 'right-4'}`}>{t.currency}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-xl text-xs text-blue-800 mb-8 justify-center border border-blue-100">
                        <Info size={16} className="shrink-0" />
                        <p className="font-medium">{t.salaryHint}</p>
                    </div>

                    <button 
                        onClick={handleNextStep}
                        disabled={salary <= 0}
                        className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 ${salary > 0 ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                        <span>{t.next}</span>
                        {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </button>
                 </div>
            </div>
        )}

        {/* --- STEP 2: EXPENSE WIZARD (NEW) --- */}
        {step === AppStep.WIZARD && (
            <ExpenseWizard 
               salary={salary}
               lang={lang}
               onComplete={handleWizardComplete}
            />
        )}

        {/* --- STEP 3: AI ADVISOR (ANALYSIS ONLY) --- */}
        {step === AppStep.ADVISOR && (
            <div className="animate-fade-in w-full max-w-2xl mx-auto">
                <FinancialAdvisor 
                    salary={salary}
                    expenses={expenses}
                    onUpdateRule={setBudgetRule}
                    onFinish={() => setStep(AppStep.EXPENSES)}
                    lang={lang}
                />
            </div>
        )}

        {/* --- STEP 4: EXPENSES LIST --- */}
        {step === AppStep.EXPENSES && (
            <div className="animate-fade-in space-y-6">
                
                {/* Header Action */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
                    <div className="text-center md:text-start flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-gray-800">{t.step2}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-sm text-gray-500">
                           <span>{t.expensesTitle} <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-bold text-gray-600 ml-1">{expenses.length}</span></span>
                           <span className="text-gray-300 hidden sm:inline">|</span>
                           <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                              <span className="text-blue-800 font-medium text-xs">{t.salaryLabel}:</span>
                              <span className="font-bold text-blue-900">{salary.toLocaleString()}</span>
                              <button 
                                onClick={() => setStep(AppStep.SALARY)} 
                                className="ml-1 text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-100"
                                title={t.edit}
                              >
                                <Pencil size={12} />
                              </button>
                           </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 font-bold transition-all hover:-translate-y-0.5 active:scale-95 w-full md:w-auto justify-center"
                    >
                        <Plus size={20} />
                        {t.addExpense}
                    </button>
                </div>

                {/* The List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[300px] overflow-hidden">
                     <ExpenseTable 
                        expenses={expenses} 
                        salary={salary} 
                        onDelete={handleDeleteExpense} 
                        onEdit={handleOpenEditModal}
                        lang={lang}
                     />
                </div>

                {/* Nav Buttons */}
                <div className="flex justify-between mt-8 gap-4">
                     <button 
                        onClick={handlePrevStep}
                        className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100 font-bold flex items-center gap-2 transition-colors"
                     >
                        {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                        {t.back}
                     </button>
                     
                     <button 
                        onClick={handleNextStep}
                        className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:scale-95"
                     >
                        <span>{t.finish}</span>
                        {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                     </button>
                </div>
            </div>
        )}

        {/* --- STEP 5: DASHBOARD --- */}
        {step === AppStep.DASHBOARD && (
          <div className="animate-fade-in space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts Column */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                    <h3 className="font-bold text-gray-700 mb-2 text-center text-sm">{t.expensesTitle}</h3>
                    <FinancialChart metrics={metrics} lang={lang} />
                 </div>
                 
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                    <h3 className="font-bold text-gray-700 mb-2 text-center text-sm">{t.target} vs {t.actual}</h3>
                    <TargetVsActualChart 
                        salary={salary} 
                        metrics={metrics} 
                        lang={lang} 
                        budgetRule={budgetRule}
                    />
                 </div>
              </div>
              
              {/* Stats Column */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                 {getAnalysis()}
                 
                 <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-2xl p-8 shadow-xl shadow-indigo-100 flex flex-col justify-center h-full min-h-[160px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <h4 className="text-indigo-200 text-sm font-medium mb-2 uppercase tracking-wider">{t.savings}</h4>
                        <div className="text-5xl font-black mb-3 flex items-baseline gap-2 tracking-tight">
                            {metrics.totalSavingsCalculated.toLocaleString()} 
                            <span className="text-xl font-normal text-indigo-300">{t.currency}</span>
                        </div>
                        
                        {metrics.remainingSalary > 0 && (
                        <div className="bg-indigo-950/30 backdrop-blur-sm rounded-lg px-4 py-2 text-sm flex items-center gap-2 w-fit mt-2 border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                            {t.remaining}: <span className="font-mono font-bold">{metrics.remainingSalary.toLocaleString()}</span>
                        </div>
                        )}
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4">
                     <button 
                        onClick={handlePrevStep}
                        className="flex-1 bg-white border-2 border-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 flex justify-center items-center gap-2 transition-all hover:border-gray-200 shadow-sm"
                     >
                        <Edit2 size={16} />
                        {t.edit} {t.step2}
                     </button>

                     <button 
                        onClick={exportPDF}
                        disabled={isExporting}
                        className={`flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
                     >
                        {isExporting ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Download size={16} />}
                        <span>{t.exportPDF}</span>
                     </button>
                 </div>
              </div>
            </div>

            {/* Expenses Table (Read Only view or quick edit) */}
            {expenses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in mt-6 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <h3 className="font-bold text-gray-800 text-sm">{t.expensesTitle}</h3>
                   <button onClick={() => setStep(AppStep.EXPENSES)} className="text-blue-600 text-xs font-bold hover:underline">
                      {t.edit}
                   </button>
                </div>
                <ExpenseTable 
                  expenses={expenses} 
                  salary={salary} 
                  onDelete={handleDeleteExpense} 
                  onEdit={handleOpenEditModal}
                  lang={lang}
                />
              </div>
            )}
          </div>
        )}

      </main>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
             if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="w-full max-w-2xl animate-[fadeIn_0.3s_ease-out]">
            <AddExpenseForm 
              salary={salary} 
              currentTotal={metrics.totalExpenses}
              expenses={expenses}
              onAdd={handleAddExpense}
              editingExpense={editingExpense}
              onUpdate={handleUpdateExpense}
              onCancelEdit={handleCloseModal}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* Blocking Error Modal (For Total Salary Check) */}
      {renderBlockingModalContent()}

      {/* Warning Modal (For Category Limit Checks - Non Blocking) */}
      {renderWarningModalContent()}

      {/* Persistent Footer - Centered always */}
      <footer className="fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 py-3 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.03)] z-40 flex justify-center items-center transition-all">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50/50 px-4 py-1.5 rounded-full border border-slate-100/50">
           <span>{t.developedBy}</span>
           <a href="https://www.linkedin.com/in/ahmed-alshareef-innovation" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
             <img src="./ashareef_logo.png" alt="Logo" className="h-5 object-contain" />
           </a>
        </div>
      </footer>

    </div>
  );
}

const Edit2 = ({size}:{size:number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

export default App;