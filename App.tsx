import React, { useState, useEffect } from 'react';
import { supabase } from './library/supabaseClient';
import { Auth } from './components/Auth';
import { UserManagementModal } from './components/UserManagementModal';
import { StickyHeader } from './components/StickyHeader';
import { FinancialChart } from './components/FinancialChart';
import { TargetVsActualChart } from './components/TargetVsActualChart';
import { ExpenseTable } from './components/ExpenseTable';
import { AddExpenseForm } from './components/AddExpenseForm';
import { PrintableReport } from './components/PrintableReport';
import { FinancialAdvisor } from './components/FinancialAdvisor';
import { ExpenseWizard } from './components/ExpenseWizard';
import { Expense, ExpenseType, DashboardMetrics, AppStep, Language, BudgetRule, UserProfile } from './types';
import { TRANSLATIONS, EXPENSE_TYPE_LABELS } from './constants';
import { Download, Info, AlertCircle, CheckCircle2, Plus, ArrowRight, ArrowLeft, Send, AlertTriangle, Scale, Ban, Pencil, X, Wallet } from 'lucide-react';
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

let isPageLoaded = false;

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);

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
  const [isLiveCount, setIsLiveCount] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchUserProfile(session.user.id);
    } else {
      setIsAuthLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile', error);
        // Fallback: If no profile exists or recursion error occurs, 
        // grant temporary admin UI access so the user can copy & run the fix SQL.
        setCurrentUser({ id: userId, email: '', role: 'admin' });
      } else {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Initialize from LocalStorage and Visitor Logic
  useEffect(() => {
    const savedExpenses = localStorage.getItem('qawam_expenses');
    const savedSalary = localStorage.getItem('qawam_salary');
    const savedRule = localStorage.getItem('qawam_rule');
    
    // Visitor Algorithm
    let globalVisits = parseInt(localStorage.getItem('qawam_total_page_views') || '120', 10);
    
    if (!isPageLoaded) {
      globalVisits += 1;
      localStorage.setItem('qawam_total_page_views', globalVisits.toString());
      isPageLoaded = true;
    }
    
    setVisitorCount(globalVisits);
    setIsLiveCount(true);

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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1c1c1e]/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Almarai',sans-serif]" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#007AFF] border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">جاري التحقق من مسار الدخول...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLoginSuccess={checkSession} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Almarai',sans-serif] pb-28 relative flex flex-col selection:bg-blue-100 selection:text-blue-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <StickyHeader 
        salary={salary} 
        metrics={metrics} 
        onReset={handleReset} 
        currentStep={step} 
        visitorCount={visitorCount}
        lang={lang}
        setLang={setLang}
        isLive={isLiveCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdminModal(true)}
        onGoToWizard={() => setStep(AppStep.WIZARD)}
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
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] px-2">
                 <div className="bg-white/70 backdrop-blur-3xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200/50 p-8 sm:p-12 w-full max-w-xl text-center relative overflow-hidden transition-all duration-500">
                    
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-sm">
                       <Wallet className="text-[#007AFF] relative z-10" size={36} strokeWidth={1.5} />
                    </div>

                    <h2 className="text-[28px] font-bold text-slate-900 mb-3 tracking-tight">{t.salaryLabel}</h2>
                    <p className="text-[15px] font-medium text-slate-500 mb-10">{t.salaryHint}</p>
                    
                    <div className="relative mb-10 group bg-white/50 backdrop-blur-lg rounded-[24px] p-6 sm:p-8 border border-slate-200/60 transition-colors shadow-sm focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/10 focus-within:bg-white">
                        <input
                        type="text"
                        inputMode="decimal"
                        value={salary || ''}
                        onChange={(e) => {
                           const val = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                           setSalary(isNaN(val) ? 0 : val);
                        }}
                        placeholder="0"
                        autoFocus
                        dir="ltr"
                        className="w-full font-bold text-slate-900 bg-transparent outline-none transition-all placeholder-slate-300 text-[56px] sm:text-[72px] tabular-nums text-center tracking-tighter"
                        />
                        <span className="absolute text-slate-400 font-bold bottom-[42px] text-xl pointer-events-none end-6 sm:end-8">{t.currency}</span>
                    </div>

                    <button 
                        onClick={handleNextStep}
                        disabled={salary <= 0}
                        className={`w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 ${salary > 0 ? 'bg-[#007AFF] text-white hover:bg-[#0062cc] shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'}`}
                    >
                        <span>{t.next}</span>
                        {isRtl ? <ArrowLeft size={20} strokeWidth={1.5} /> : <ArrowRight size={20} strokeWidth={1.5} />}
                    </button>

                    {expenses.length === 0 && (
                        <button
                          onClick={() => setStep(AppStep.EXPENSES)}
                          disabled={salary <= 0}
                          className={`mt-4 w-full py-4 rounded-2xl font-medium text-[16px] flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 border ${salary > 0 ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm' : 'bg-transparent border-slate-100/50 text-slate-300 cursor-not-allowed'}`}
                        >
                          {lang === 'ar' ? 'تخطي الدليل وإدخال المصاريف يدوياً' : 'Skip Wizard & Enter Manually'}
                        </button>
                    )}
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
                <div className="flex flex-col md:flex-row justify-between items-center bg-white/70 backdrop-blur-3xl p-5 sm:p-6 rounded-[24px] shadow-sm border border-slate-200/50 gap-5">
                    <div className="text-center md:text-start flex flex-col gap-1.5">
                        <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">{t.step2}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-[13px] text-slate-500">
                           <span className="flex items-center gap-1.5 font-medium">{t.expensesTitle} <span className="bg-slate-100 px-2 rounded-full font-bold text-slate-700">{expenses.length}</span></span>
                           <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block"></span>
                           <div className="flex items-center gap-1.5 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
                              <Wallet size={14} className="text-slate-400" strokeWidth={1.5} />
                              <span className="text-slate-500 font-medium">{t.salaryLabel}:</span>
                              <span className="font-bold text-slate-700 tabular-nums">{salary.toLocaleString()}</span>
                              <button 
                                onClick={() => setStep(AppStep.SALARY)} 
                                className="ms-1 text-slate-400 hover:text-[#007AFF] transition-colors p-1 rounded-full hover:bg-blue-50 active:scale-95"
                                title={t.edit}
                              >
                                <Pencil size={12} strokeWidth={1.5} />
                              </button>
                           </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-[#007AFF] hover:bg-[#0062cc] text-white px-6 py-3.5 rounded-[16px] shadow-sm flex items-center gap-2 font-semibold transition-all active:scale-95 w-full md:w-auto justify-center text-[15px]"
                    >
                        <Plus size={18} strokeWidth={1.5} />
                        {t.addExpense}
                    </button>
                </div>

                {/* The List */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 min-h-[300px] overflow-hidden">
                     <ExpenseTable 
                        expenses={expenses} 
                        salary={salary} 
                        onDelete={handleDeleteExpense} 
                        onEdit={handleOpenEditModal}
                        lang={lang}
                     />
                </div>

                {/* Nav Buttons */}
                <div className="flex justify-between mt-8 gap-4 pb-8">
                     <button 
                        onClick={handlePrevStep}
                        className="px-6 py-3.5 rounded-[16px] text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm font-semibold flex items-center gap-2 transition-all active:scale-95 text-[15px]"
                     >
                        {isRtl ? <ArrowRight size={18} strokeWidth={1.5} /> : <ArrowLeft size={18} strokeWidth={1.5} />}
                        {t.back}
                     </button>
                     
                     <button 
                        onClick={handleNextStep}
                        className="px-8 py-3.5 rounded-[16px] bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold flex items-center gap-2 shadow-[0_2px_12px_rgba(0,122,255,0.3)] transition-all active:scale-[0.98] text-[15px]"
                     >
                        <span>{t.finish}</span>
                        {isRtl ? <ArrowLeft size={18} strokeWidth={1.5} /> : <ArrowRight size={18} strokeWidth={1.5} />}
                     </button>
                </div>
            </div>
        )}

        {/* --- STEP 5: DASHBOARD --- */}
        {step === AppStep.DASHBOARD && (
          <div className="animate-fade-in space-y-6 pb-20">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                 <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[24px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 transition-all hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
                    <h3 className="font-semibold text-slate-900 mb-4 text-center text-sm tracking-tight">{t.expensesTitle}</h3>
                    <FinancialChart metrics={metrics} lang={lang} />
                 </div>
                 
                 <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[24px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 transition-all hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
                    <h3 className="font-semibold text-slate-900 mb-4 text-center text-sm tracking-tight">{t.target} vs {t.actual}</h3>
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
                 
                 <div className="bg-[#1c1c1e] text-white rounded-[32px] p-8 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.2)] flex flex-col justify-center h-full min-h-[160px] relative overflow-hidden group">
                    <div className="absolute top-0 end-0 w-64 h-64 bg-gradient-to-br from-[#007AFF]/20 to-purple-500/20 rounded-full blur-[40px] -me-32 -mt-32 transition-transform duration-1000 group-hover:scale-150"></div>
                    <div className="relative z-10 hidden lg:block absolute bottom-0 start-0 w-full h-[60%] bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    <div className="relative z-20">
                        <h4 className="text-white/60 text-[13px] font-semibold mb-2 uppercase tracking-widest">{t.savings}</h4>
                        <div className="text-[56px] sm:text-[72px] font-semibold mb-3 flex items-baseline gap-2 tracking-tighter tabular-nums text-white drop-shadow-sm">
                            {metrics.totalSavingsCalculated.toLocaleString()} 
                            <span className="text-[24px] sm:text-[28px] font-medium text-white/50">{t.currency}</span>
                        </div>
                        
                        {metrics.remainingSalary > 0 && (
                        <div className="bg-white/10 backdrop-blur-md rounded-[16px] px-4 py-2 text-[14px] flex items-center gap-2.5 w-fit mt-2 border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"></span>
                            {t.remaining}: <span className="font-mono font-bold tracking-tight text-white">{metrics.remainingSalary.toLocaleString()}</span>
                        </div>
                        )}
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4">
                     <button 
                        onClick={handlePrevStep}
                        className="flex-1 bg-white border border-slate-200/80 text-slate-700 py-4.5 rounded-[16px] font-semibold hover:bg-slate-50 flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95 text-[15px]"
                     >
                        <Edit2 size={18} strokeWidth={1.5} />
                        {t.edit} {t.step2}
                     </button>

                     <button 
                        onClick={exportPDF}
                        disabled={isExporting}
                        className={`flex-1 bg-[#1c1c1e] text-white py-4.5 rounded-[16px] font-semibold hover:bg-black flex justify-center items-center gap-2 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-95 text-[15px] ${isExporting ? 'opacity-70 cursor-wait scale-100' : ''}`}
                     >
                        {isExporting ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={18} strokeWidth={1.5} />}
                        <span>{t.exportPDF}</span>
                     </button>
                 </div>
              </div>
            </div>

            {/* Expenses Table (Read Only view or quick edit) */}
            {expenses.length > 0 && (
              <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 animate-fade-in mt-6 overflow-hidden">
                 <div className="p-5 sm:p-6 border-b border-slate-200/60 flex justify-between items-center bg-transparent">
                   <h3 className="font-semibold text-slate-900 text-[15px]">{t.expensesTitle}</h3>
                   <button onClick={() => setStep(AppStep.EXPENSES)} className="text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors active:scale-95">
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in sm:animate-in sm:zoom-in-95"
          onClick={(e) => {
             if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 overflow-hidden transform-gpu max-h-[90vh] overflow-y-auto hide-scrollbar border-t sm:border border-slate-200/50 space-y-0">
            {/* Modal Drag Handle for Mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            
            <div className="p-2 sm:p-0">
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
        </div>
      )}

      {/* Blocking Error Modal (For Total Salary Check) */}
      {renderBlockingModalContent()}

      {/* Warning Modal (For Category Limit Checks - Non Blocking) */}
      {renderWarningModalContent()}

      {/* Persistent Footer - Centered always */}
      <footer className="fixed bottom-0 w-full bg-white/70 backdrop-blur-[20px] saturate-[1.8] border-t border-slate-900/5 py-[env(safe-area-inset-bottom,12px)] px-4 shadow-[0_-1px_3px_rgba(0,0,0,0.02)] z-40 flex justify-center items-center transition-all">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/60 shadow-sm my-2">
           <span>{t.developedBy}</span>
           <a href="https://www.linkedin.com/in/ahmed-alshareef-innovation" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity flex items-center">
             <img 
               src="/ashareef_logo.png" 
               alt="Logo" 
               className="h-[18px] object-contain" 
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
               }}
             />
           </a>
        </div>
      </footer>

      {/* Admin User Management Modal */}
      {showAdminModal && currentUser?.role === 'admin' && (
        <UserManagementModal 
          currentUser={currentUser} 
          onClose={() => setShowAdminModal(false)} 
        />
      )}

    </div>
  );
}

const Edit2 = ({size}:{size:number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

export default App;