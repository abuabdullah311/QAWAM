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
import { FinancialFreedomLab } from './components/FinancialFreedomLab';
import { SmartGoalPlanner } from './components/SmartGoalPlanner';
import { Expense, ExpenseType, DashboardMetrics, AppStep, Language, BudgetRule, UserProfile } from './types';
import { TRANSLATIONS, EXPENSE_TYPE_LABELS } from './constants';
import { Download, Info, AlertCircle, CheckCircle2, Plus, ArrowRight, ArrowLeft, Send, AlertTriangle, Scale, Ban, Pencil, X, Wallet, Save, RotateCcw, Trash2, Edit2, Sparkles, Target, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';



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
  const BUDGET_RULE = { needs: 50, wants: 30, savings: 20 };
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // State for Blocking Errors (Total > Salary)
  const [blockingError, setBlockingError] = useState<BlockingErrorState | null>(null);
  
  // State for Warnings (Category > Limit) - Non blocking
  const [warningState, setWarningState] = useState<WarningState | null>(null);
  
  // State for Category Info Popup after Salary
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  
  const [visitorCount, setVisitorCount] = useState<number>(253);
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
        
        // Load data from profile into state
        if (data.salary) setSalary(Number(data.salary));
        if (data.expenses) setExpenses(data.expenses);
        if (data.current_step) setStep(Number(data.current_step) as AppStep);
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

  // Data fetching handled by fetchUserProfile now
  useEffect(() => {
    // Visitor Algorithm using Supabase for global platform statistics
    const fetchGlobalVisits = async () => {
      try {
        if (!isPageLoaded) {
          // Increment global counter on the server
          await supabase.rpc('increment_page_views');
          isPageLoaded = true;
        }
        
        // Fetch the updated global count
        const { data, error } = await supabase.from('page_views').select('count').eq('id', 'global').single();
        
        if (data && data.count) {
          // Base it around 253 as requested.
          setVisitorCount(253 + data.count);
        }
        setIsLiveCount(true);
      } catch (e) {
        console.error('Error fetching global visitor count', e);
      }
    };
    
    fetchGlobalVisits();
  }, []);

  // Save on Change to Supabase
  useEffect(() => {
    if (!currentUser) return;

    const timeoutId = setTimeout(async () => {
      await supabase.from('profiles').update({
        salary: salary,
        expenses: expenses,
        current_step: step
      }).eq('id', currentUser.id);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [expenses, salary, step, currentUser]);

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
          setShowCategoryInfo(true);
      }
      else if (step === AppStep.WIZARD) setStep(AppStep.EXPENSES);
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
          
          const wantsLimit = (BUDGET_RULE.wants / 100) * salary;
          if (Math.round(metrics.totalWants) > Math.round(wantsLimit)) {
               triggerWarning('wants', metrics.totalWants, wantsLimit, BUDGET_RULE.wants);
               return;
          }

          const needsLimit = (BUDGET_RULE.needs / 100) * salary;
          if (Math.round(metrics.totalNeeds) > Math.round(needsLimit)) {
               triggerWarning('needs', metrics.totalNeeds, needsLimit, BUDGET_RULE.needs);
               return;
          }

          // If no blocking errors and no warnings (or warnings ignored), proceed
          setStep(AppStep.ADVISOR);
      }
      else if (step === AppStep.ADVISOR) {
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
      else if (step === AppStep.EXPENSES) setStep(AppStep.WIZARD);
      else if (step === AppStep.ADVISOR) setStep(AppStep.EXPENSES);
      else if (step === AppStep.DASHBOARD) setStep(AppStep.ADVISOR);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleWizardComplete = (newExpenses: Omit<Expense, 'id'>[]) => {
      const formatted = newExpenses.map(e => ({
          ...e,
          id: Date.now().toString() + Math.random().toString()
      }));
      setExpenses(formatted);
      setStep(AppStep.EXPENSES);
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
      setSalary(0);
      setExpenses([]);
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



  const renderBlockingModalContent = () => {
      if (!blockingError) return null;
      // This is only for Total > Salary
      const title = lang === 'ar' ? 'تجاوز الراتب' : 'Salary Exceeded';
      const message = lang === 'ar' 
        ? `إجمالي المصروفات (${blockingError.current.toLocaleString()}) يتجاوز صافي الراتب (${blockingError.limit.toLocaleString()}).`
        : `Total expenses (${blockingError.current.toLocaleString()}) exceed net salary (${blockingError.limit.toLocaleString()}).`;

      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1c1c1e]/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
             <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-center border-t-4 border-red-500 max-h-[85vh] overflow-y-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-red-600">
                   <Ban size={24} className="sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 mb-5 sm:mb-6 leading-relaxed text-[13px] sm:text-sm">{message}</p>
                <button
                    onClick={() => setBlockingError(null)}
                    className="w-full py-2.5 sm:py-3 bg-gray-800 text-white text-[13px] sm:text-sm rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-lg"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
             <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl transform scale-100 transition-all max-h-[85vh] overflow-y-auto hide-scrollbar">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                     <div className="flex items-center gap-2 sm:gap-3">
                         <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                            <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="text-start">
                             <h3 className="text-base sm:text-lg font-bold text-gray-800">{title}</h3>
                             <p className="text-[11px] sm:text-xs text-gray-500">{lang === 'ar' ? 'لقد تجاوزت النسبة المقترحة' : 'You exceeded the suggested ratio'}</p>
                        </div>
                     </div>
                     <button onClick={() => setWarningState(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"><X size={18} className="sm:w-5 sm:h-5" /></button>
                </div>
                
                <div className="bg-amber-50 p-3 sm:p-4 rounded-xl border border-amber-100 text-[13px] sm:text-sm text-gray-700 mb-4 sm:mb-6 leading-relaxed text-start">
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
                    <div className="mb-4 sm:mb-6">
                        <h4 className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase mb-2 text-start">{lang === 'ar' ? 'مقترحات للتخفيض:' : 'Suggestions to reduce:'}</h4>
                        <div className="space-y-1.5 sm:space-y-2 max-h-[150px] overflow-y-auto pr-1">
                            {warningState.suggestions.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
                                    <span className="font-bold text-gray-700 text-[12px] sm:text-sm truncate mr-2">{s.name}</span>
                                    <div className="text-[11px] sm:text-xs text-gray-500 shrink-0">
                                        {lang === 'ar' ? 'قلل بمقدار' : 'Reduce by'} <span className="font-bold text-emerald-600 ml-1">{Math.round(s.reduceBy).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                    <button
                        onClick={() => setWarningState(null)}
                        className="w-full py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-700 text-[13px] sm:text-sm rounded-xl font-bold hover:bg-gray-50 transition-colors"
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

  const renderCategoryInfoModal = () => {
    if (!showCategoryInfo) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
         <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl transform scale-100 transition-all text-center">
            <h3 className="text-[20px] font-bold text-slate-900 mb-4 tracking-tight">
               {lang === 'ar' ? 'تصنيفات المصاريف المعتمدة' : 'Official Expense Categories'}
            </h3>
            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
               {lang === 'ar' ? 'في منصة قوام، يتم تقسيم مصروفاتك إلى 3 أصناف رئيسية تساعدك على معرفة أين تذهب أموالك:' : 'In Qawam, your expenses are divided into 3 main categories to help you track your money:'}
            </p>
            <div className="space-y-3 mb-6 text-start">
               <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="bg-red-500 rounded-full w-3 h-3 mt-1.5 shrink-0"></div>
                  <div>
                    <h4 className="font-bold text-red-700 text-[14px]">{lang === 'ar' ? 'احتياج' : 'Need'}</h4>
                    <p className="text-[12px] text-red-600 font-medium">
                      {lang === 'ar' ? 'مصروف أساسي ومهم جداً ولا يمكن تأجيله أو التقليل منه بسهولة (مثل الإيجار، الفواتير الأساسية).' : 'Essential expenses that cannot be deferred or easily reduced (e.g. Rent, Basic bills).'}
                    </p>
                  </div>
               </div>
               <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="bg-amber-500 rounded-full w-3 h-3 mt-1.5 shrink-0"></div>
                  <div>
                    <h4 className="font-bold text-amber-700 text-[14px]">{lang === 'ar' ? 'رغبة' : 'Want'}</h4>
                    <p className="text-[12px] text-amber-600 font-medium">
                      {lang === 'ar' ? 'مصروف يمكن تأجيله أو التقليل منه أو الاستغناء عنه لزيادة مدخراتك (مثل المطاعم، التسوق، الاشتراكات).' : 'Expenses that can be deferred or reduced to increase savings (e.g. Dining out, Shopping).'}
                    </p>
                  </div>
               </div>
               <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="bg-emerald-500 rounded-full w-3 h-3 mt-1.5 shrink-0"></div>
                  <div>
                    <h4 className="font-bold text-emerald-700 text-[14px]">{lang === 'ar' ? 'ادخار / استثمار' : 'Saving & Investment'}</h4>
                    <p className="text-[12px] text-emerald-600 font-medium">
                      {lang === 'ar' ? 'مبالغ تخصصها للمستقبل سواء للطوارئ أو بهدف تنميتها عبر الاستثمار.' : 'Funds allocated for the future, emergencies or investments.'}
                    </p>
                  </div>
               </div>
            </div>
            <button
               onClick={() => {
                  setShowCategoryInfo(false);
                  if (expenses.length > 0) setStep(AppStep.EXPENSES);
                  else setStep(AppStep.WIZARD);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
               }}
               className="w-full bg-[#007AFF] text-white py-3 rounded-xl font-bold text-[15px] hover:bg-[#0062cc] transition-colors shadow-sm"
            >
               {lang === 'ar' ? 'فهمت، لنبدأ' : 'Got it, let\'s start'}
            </button>
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
    return <Auth onLoginSuccess={checkSession} lang={lang} setLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Almarai',sans-serif] relative flex flex-col selection:bg-blue-100 selection:text-blue-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {renderCategoryInfoModal()}
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
        onStepClick={(s) => {
          if (salary > 0) {
            setStep(s);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (s === AppStep.SALARY) {
            setStep(s);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Hidden Report for PDF */}
      <div style={{ position: 'fixed', left: '-10000px', top: 0, zIndex: -5, overflow: 'hidden' }}>
        <PrintableReport 
            salary={salary} 
            metrics={metrics} 
            expenses={expenses} 
            lang={lang} 
            budgetRule={BUDGET_RULE}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 flex-grow w-full">
        
        {/* --- STEP 1: SALARY --- */}
        {step === AppStep.SALARY && (
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[30vh] sm:min-h-[40vh] px-2 py-2 sm:py-0 mt-2 sm:mt-4">
                 {/* Top Navigation */}
                 <div className="flex flex-col w-full max-w-xl gap-2 mb-4">
                     <button 
                         onClick={handleNextStep}
                         disabled={salary <= 0}
                         className={`w-full py-2.5 rounded-[12px] font-semibold text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 transition-all active:scale-95 ${salary > 0 ? 'bg-[#007AFF] text-white hover:bg-[#0062cc] shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'}`}
                     >
                         <span>{lang === 'ar' ? 'إدخال المصروفات آليا' : 'Auto Setup Expenses'}</span>
                         {isRtl ? <ArrowLeft size={16} strokeWidth={1.5} /> : <ArrowRight size={16} strokeWidth={1.5} />}
                     </button>
                     {expenses.length === 0 && (
                         <button
                           onClick={() => setStep(AppStep.EXPENSES)}
                           disabled={salary <= 0}
                           className={`w-full py-2.5 rounded-[12px] font-semibold text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${salary > 0 ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm' : 'bg-transparent border-slate-100/50 text-slate-300 cursor-not-allowed'}`}
                         >
                           {lang === 'ar' ? 'التخطي وإدخال المصروفات يدويا' : 'Skip & Enter Manually'}
                         </button>
                     )}
                 </div>

                 <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200/50 p-5 sm:p-8 w-full max-w-xl text-center relative overflow-hidden transition-all duration-500">
                    
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-sm">
                       <Wallet className="text-[#007AFF] relative z-10 w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-[18px] sm:text-[22px] font-bold text-slate-900 mb-1 tracking-tight">{t.salaryLabel}</h2>
                    <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 mb-4 sm:mb-6">{t.salaryHint}</p>
                    
                    <div className="relative mb-2 sm:mb-4 group bg-white/50 backdrop-blur-lg rounded-[20px] p-3 sm:p-5 border border-slate-200/60 transition-colors shadow-sm focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/10 focus-within:bg-white">
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
                        className="w-full font-bold text-slate-900 bg-transparent outline-none transition-all placeholder-slate-300 text-[36px] sm:text-[56px] tabular-nums text-center tracking-tighter"
                        />
                        <span className="absolute text-slate-400 font-bold bottom-[20px] sm:bottom-[28px] text-base sm:text-lg pointer-events-none end-4 sm:end-6">{t.currency}</span>
                    </div>
                 </div>
            </div>
        )}

        {/* --- STEP 2: EXPENSE WIZARD (NEW) --- */}
        {step === AppStep.WIZARD && (
            <ExpenseWizard 
               salary={salary}
               lang={lang}
               onComplete={handleWizardComplete}
               onBack={() => setStep(AppStep.SALARY)}
            />
        )}

        {/* --- STEP 4: AI ADVISOR (ANALYSIS ONLY) --- */}
        {step === AppStep.ADVISOR && (
            <div className="animate-fade-in w-full max-w-2xl mx-auto">
                <FinancialAdvisor 
                    salary={salary}
                    expenses={expenses}
                    onFinish={() => setStep(AppStep.DASHBOARD)}
                    onBack={() => setStep(AppStep.EXPENSES)}
                    lang={lang}
                />
            </div>
        )}

        {/* --- STEP 3: EXPENSES LIST --- */}
        {step === AppStep.EXPENSES && (
            <div className="animate-fade-in space-y-3 sm:space-y-4 pt-2">
                
                {/* Top Navigation */}
                <div className="flex gap-2 w-full justify-between">
                     <button 
                        onClick={handlePrevStep}
                        className="px-4 py-2 rounded-[12px] text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[13px] sm:text-[14px] flex-[0.8] sm:flex-none"
                     >
                        {isRtl ? <ArrowRight size={16} strokeWidth={1.5} /> : <ArrowLeft size={16} strokeWidth={1.5} />}
                        {t.back}
                     </button>
                     
                     <button 
                        onClick={handleNextStep}
                        className="flex-1 sm:flex-none px-6 py-2 rounded-[12px] bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold flex items-center justify-center gap-1.5 shadow-[0_2px_12px_rgba(0,122,255,0.3)] transition-all active:scale-[0.98] text-[13px] sm:text-[14px]"
                     >
                        <span>{lang === 'ar' ? 'عرض التحليل' : 'View Analysis'}</span>
                        {isRtl ? <ArrowLeft size={16} strokeWidth={1.5} /> : <ArrowRight size={16} strokeWidth={1.5} />}
                     </button>
                </div>

                {/* Header Action */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white/70 backdrop-blur-3xl p-3 sm:p-5 rounded-[16px] shadow-sm border border-slate-200/50 gap-3">
                    <div className="text-center md:text-start flex flex-col gap-1">
                        <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 tracking-tight">{t.step2}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mt-1 text-[11px] sm:text-[13px] text-slate-500">
                           <span className="flex items-center gap-1 sm:gap-1.5 font-medium">{t.expensesTitle} <span className="bg-slate-100 px-1.5 sm:px-2 rounded-full font-bold text-slate-700">{expenses.length}</span></span>
                           <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block"></span>
                           <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-slate-100">
                              <Wallet size={14} className="text-slate-400 w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
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
                        className="bg-[#007AFF] hover:bg-[#0062cc] text-white px-5 py-2.5 rounded-[12px] shadow-sm flex items-center gap-2 font-semibold transition-all active:scale-95 w-full md:w-auto justify-center text-[14px]"
                    >
                        <Plus size={18} strokeWidth={1.5} />
                        {t.addExpense}
                    </button>
                </div>

                {/* Intelligent Warning System based on Custom Rule (Feature 5) */}
                {(() => {
                   const needsRatio = (metrics.totalNeeds / salary) * 100;
                   const wantsRatio = (metrics.totalWants / salary) * 100;
                   if (needsRatio > BUDGET_RULE.needs && wantsRatio > BUDGET_RULE.wants) {
                       return (
                           <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3 text-rose-700 animate-fade-in shadow-sm">
                              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                              <div className="text-[13px] font-medium leading-relaxed">
                                {lang === 'ar' ? `تنبيه: لقد تجاوزت الحد المخصص للاحتياجات (${BUDGET_RULE.needs}%) والرغبات (${BUDGET_RULE.wants}%). قد يؤثر هذا على مدخراتك.` : `Warning: You exceeded the limit for both Needs (${BUDGET_RULE.needs}%) and Wants (${BUDGET_RULE.wants}%), impacting your savings.`}
                              </div>
                           </div>
                       )
                   } else if (needsRatio > BUDGET_RULE.needs) {
                       return (
                           <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-700 animate-fade-in shadow-sm">
                              <AlertCircle className="shrink-0 mt-0.5" size={18} />
                              <div className="text-[13px] font-medium leading-relaxed">
                                {lang === 'ar' ? `تجاوز للاحتياجات: مصاريف الأساسيات أصبحت أكبر من القاعدة المحددة لك (${BUDGET_RULE.needs}%). راجع القائمة إن أمكن.` : `Needs Exceeded: Basic expenses are larger than your set rule (${BUDGET_RULE.needs}%). Review if possible.`}
                              </div>
                           </div>
                       )
                   } else if (wantsRatio > BUDGET_RULE.wants) {
                       return (
                           <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-700 animate-fade-in shadow-sm">
                              <Info className="shrink-0 mt-0.5" size={18} />
                              <div className="text-[13px] font-medium leading-relaxed">
                                {lang === 'ar' ? `إنذار مبكر: الإنفاق على الرغبات أعلى من النسبة المحددة (${BUDGET_RULE.wants}%). احرص على عدم المساس بنسبة الادخار.` : `Early Alert: Spending on Wants is higher than the set ${BUDGET_RULE.wants}%. Ensure savings are not affected.`}
                              </div>
                           </div>
                       )
                   }
                   return null;
                })()}

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
            </div>
        )}

        {/* --- STEP 5: DASHBOARD --- */}
        {step === AppStep.DASHBOARD && (
          <div className="animate-fade-in space-y-6 pb-20">
            
            {/* Top Navigation */}
            <div className="flex w-full gap-2 mb-2">
                 <button
                    onClick={() => setStep(AppStep.ADVISOR)}
                    className="flex-1 px-1 sm:px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-[12px] font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-[12px] sm:text-[14px] flex items-center justify-center gap-1 sm:gap-1.5"
                 >
                    {isRtl ? <ArrowRight size={16} strokeWidth={1.5} /> : <ArrowLeft size={16} strokeWidth={1.5} />}
                    <span className="truncate">{lang === 'ar' ? 'السابق' : 'Prev'}</span>
                 </button>
                 
                 <button 
                    onClick={exportPDF}
                    disabled={isExporting}
                    className={`flex-[1.2] sm:flex-1 bg-[#1c1c1e] text-white py-2 px-1 sm:px-4 rounded-[12px] font-semibold hover:bg-black flex justify-center items-center gap-1 sm:gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-95 text-[12px] sm:text-[14px] ${isExporting ? 'opacity-70 cursor-wait scale-100' : ''}`}
                 >
                    {isExporting ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full flex-shrink-0"></div> : <Download size={16} strokeWidth={1.5} className="flex-shrink-0" />}
                    <span className="truncate">{lang === 'ar' ? 'التقرير PDF' : 'PDF Report'}</span>
                 </button>

                 <button
                    onClick={() => setStep(AppStep.TOOLS)}
                    className="flex-1 px-1 sm:px-4 py-2 bg-[#007AFF] text-white rounded-[12px] font-semibold hover:bg-[#0062cc] transition-all shadow-[0_4px_16px_rgba(0,122,255,0.2)] active:scale-95 text-[12px] sm:text-[14px] flex items-center justify-center gap-1 sm:gap-1.5"
                 >
                    <span className="truncate">{lang === 'ar' ? 'الأدوات' : 'Tools'}</span>
                    {isRtl ? <ArrowLeft size={16} strokeWidth={1.5} /> : <ArrowRight size={16} strokeWidth={1.5} />}
                 </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                 <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[24px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 transition-all hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
                    <h3 className="font-semibold text-slate-900 mb-4 text-center text-sm tracking-tight">{t.expensesTitle}</h3>
                    <FinancialChart metrics={metrics} lang={lang} />
                 </div>
              </div>
              
              {/* Stats Column */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                 
                 <div className="bg-white/70 backdrop-blur-3xl p-6 rounded-[24px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 transition-all hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
                    <h3 className="font-semibold text-slate-900 mb-4 text-center text-sm tracking-tight">{t.target} vs {t.actual}</h3>
                    <TargetVsActualChart 
                        salary={salary} 
                        metrics={metrics} 
                        lang={lang} 
                        budgetRule={BUDGET_RULE}
                    />
                 </div>
                 
                 <div className="bg-[#1c1c1e] text-white rounded-[32px] p-8 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.2)] flex flex-col justify-center h-full min-h-[160px] relative overflow-hidden group">
                    <div className="absolute top-0 end-0 w-64 h-64 bg-gradient-to-br from-[#007AFF]/20 to-purple-500/20 rounded-full blur-[40px] -me-32 -mt-32 transition-transform duration-1000 group-hover:scale-150"></div>
                    <div className="relative z-10 hidden lg:block absolute bottom-0 start-0 w-full h-[60%] bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    <div className="relative z-20">
                        <h4 className="text-white/60 text-[11px] sm:text-[13px] font-semibold mb-1 sm:mb-2 uppercase tracking-widest">{t.savings}</h4>
                        <div className="text-[42px] sm:text-[56px] md:text-[72px] font-semibold mb-2 sm:mb-3 flex items-baseline gap-1 sm:gap-2 tracking-tighter tabular-nums text-white drop-shadow-sm">
                            {metrics.totalSavingsCalculated.toLocaleString()} 
                            <span className="text-[18px] sm:text-[24px] md:text-[28px] font-medium text-white/50">{t.currency}</span>
                        </div>
                        
                        {metrics.remainingSalary > 0 && (
                        <div className="bg-white/10 backdrop-blur-md rounded-[16px] px-4 py-2 text-[14px] flex items-center gap-2.5 w-fit mt-2 border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]"></span>
                            {t.remaining}: <span className="font-mono font-bold tracking-tight text-white">{metrics.remainingSalary.toLocaleString()}</span>
                        </div>
                        )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 6: TOOLS --- */}
        {step === AppStep.TOOLS && (
          <div className="animate-fade-in pb-20 mt-4 max-w-2xl mx-auto">
             
             {!activeTool && (
                <div className="mb-4">
                    <button
                        onClick={() => setStep(AppStep.DASHBOARD)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-[12px] font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                        {isRtl ? <ArrowRight size={16} strokeWidth={1.5} /> : <ArrowLeft size={16} strokeWidth={1.5} />}
                        {lang === 'ar' ? 'السابق' : 'Prev'}
                    </button>
                </div>
             )}

             {activeTool === 'PLANNER' && <SmartGoalPlanner salary={salary} expenses={expenses} metrics={metrics} lang={lang} onBack={() => setActiveTool(null)} />}
             {activeTool === 'LAB' && <FinancialFreedomLab salary={salary} expenses={expenses} metrics={metrics} lang={lang} onBack={() => setActiveTool(null)} />}

             {!activeTool && (
                 <div className="bg-white/70 backdrop-blur-3xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-slate-200/50 p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
                       {lang === 'ar' ? 'الأدوات الذكية' : 'Smart Tools'}
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button onClick={() => setActiveTool('PLANNER')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all group">
                           <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 text-indigo-600 group-hover:scale-110 transition-transform">
                              <Target size={24} />
                           </div>
                           <span className="font-semibold text-slate-800 text-[14px]">
                              {lang === 'ar' ? 'المخطط المالي الذكي' : 'Smart Goal Planner'}
                           </span>
                       </button>
                       
                       <button onClick={() => setActiveTool('LAB')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all group">
                           <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 text-cyan-600 group-hover:scale-110 transition-transform">
                              <Activity size={24} />
                           </div>
                           <span className="font-semibold text-slate-800 text-[14px]">
                              {lang === 'ar' ? 'مختبر الحرية المالية' : 'Financial Freedom Lab'}
                           </span>
                       </button>
                    </div>
                 </div>
             )}
          </div>
        )}

      </main>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in sm:animate-in sm:zoom-in-95"
          onClick={(e) => {
             if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-t-[24px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 overflow-hidden transform-gpu max-h-[85vh] flex flex-col border-t sm:border border-slate-200/50 space-y-0">
            {/* Modal Drag Handle for Mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            
            <div className="p-2 sm:p-0 overflow-y-auto w-full hide-scrollbar flex-1 pb-safe max-h-full">
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
      <footer className="w-full bg-white border-t border-slate-900/5 py-1 px-4 shadow-[0_-1px_3px_rgba(0,0,0,0.02)] z-40 flex justify-center items-center transition-all mt-auto mt-8 shrink-0 pb-safe">
        <div className="flex items-center gap-2.5 text-[12px] text-slate-500 font-medium bg-transparent px-2 py-0.5 rounded-full my-1">
           <span>{t.developedBy}</span>
           <a href="https://www.linkedin.com/in/ahmed-alshareef-innovation" target="_blank" rel="noopener noreferrer" className="opacity-90 hover:opacity-100 transition-opacity flex items-center">
             <img 
               src="/ashareef_logo.png" 
               alt="Logo" 
               className="h-10 object-contain ml-1" 
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



export default App;