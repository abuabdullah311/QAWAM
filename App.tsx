import React, { useState, useEffect } from 'react';
import { StickyHeader } from './components/StickyHeader';
import { FinancialChart } from './components/FinancialChart';
import { TargetVsActualChart } from './components/TargetVsActualChart';
import { ExpenseTable } from './components/ExpenseTable';
import { AddExpenseForm } from './components/AddExpenseForm';
import { PrintableReport } from './components/PrintableReport';
import { Expense, ExpenseType, DashboardMetrics, AppStep, Language } from './types';
import { TRANSLATIONS } from './constants';
import { Download, Info, AlertCircle, CheckCircle2, Plus, ArrowRight, ArrowLeft, Send } from 'lucide-react';
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
    <div className={`p-4 rounded-lg border ${colors[color]} transition-all hover:shadow-sm`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs bg-white px-2 py-0.5 rounded shadow-sm opacity-80 font-mono font-bold">{Math.round(current)}%</span>
      </div>
      <div className="w-full bg-white/50 h-2 rounded-full mb-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out bg-current`} 
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

function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [step, setStep] = useState<AppStep>(AppStep.SALARY);
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number>(12050);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Initialize from LocalStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('qawam_expenses');
    const savedSalary = localStorage.getItem('qawam_salary');
    const savedVisitor = localStorage.getItem('qawam_visitors');
    
    // Simple mock visitor logic
    let count = 12050;
    if (savedVisitor) {
       count = parseInt(savedVisitor);
    } else {
       count = 12050 + Math.floor(Math.random() * 50);
       localStorage.setItem('qawam_visitors', count.toString());
    }
    setVisitorCount(count);

    if (savedSalary) {
      const s = parseFloat(savedSalary);
      setSalary(s);
      if (s > 0) {
          // If expenses exist, go to dashboard, else salary/expenses
          if(savedExpenses && JSON.parse(savedExpenses).length > 0) {
              setStep(AppStep.DASHBOARD);
          } else {
              setStep(AppStep.EXPENSES);
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
  }, [expenses, salary]);

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
      if (step === AppStep.SALARY && salary > 0) setStep(AppStep.EXPENSES);
      else if (step === AppStep.EXPENSES) setStep(AppStep.DASHBOARD);
  };

  const handlePrevStep = () => {
      if (step === AppStep.EXPENSES) setStep(AppStep.SALARY);
      else if (step === AppStep.DASHBOARD) setStep(AppStep.EXPENSES);
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
    const newExpense = { ...newExpenseData, id: Date.now().toString() };
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
      
      // Temporarily show report to capture
      input.style.display = 'flex';
      
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Hide again (actually it's fixed offscreen in JSX)

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF(isRtl ? 'p' : 'p', 'mm', 'a4'); // No RTL config needed for images
      
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
      Math.abs(needPct - 50) <= 5 && 
      Math.abs(wantPct - 30) <= 5 && 
      savePct >= 15;

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
          <AnalysisCard title={`${t.needs} (${t.target} 50%)`} current={needPct} target={50} color="red" lang={lang} />
          <AnalysisCard title={`${t.wants} (${t.target} 30%)`} current={wantPct} target={30} color="amber" lang={lang} />
          <AnalysisCard title={`${t.savings} (${t.target} 20%)`} current={savePct} target={20} color="emerald" isMinimum lang={lang} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 relative flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
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
        <PrintableReport salary={salary} metrics={metrics} expenses={expenses} lang={lang} />
      </div>

      <main className="max-w-4xl mx-auto px-4 flex-grow w-full">
        
        {/* --- STEP 1: SALARY --- */}
        {step === AppStep.SALARY && (
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
                 <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 w-full max-w-lg text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.salaryLabel}</h2>
                    
                    <div className="relative mb-6">
                        <input
                        type="number"
                        value={salary || ''}
                        onChange={(e) => setSalary(parseFloat(e.target.value))}
                        placeholder="0"
                        autoFocus
                        className="w-full font-black text-gray-800 border-b-2 border-gray-200 focus:border-blue-600 outline-none bg-transparent transition-all placeholder-gray-200 text-5xl text-center py-4"
                        />
                        <span className={`absolute text-gray-400 font-medium bottom-6 text-lg ${isRtl ? 'left-4' : 'right-4'}`}>{t.currency}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-8 justify-center">
                        <Info size={14} />
                        <p>{t.salaryHint}</p>
                    </div>

                    <button 
                        onClick={handleNextStep}
                        disabled={salary <= 0}
                        className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${salary > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        <span>{t.next}</span>
                        {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </button>
                 </div>
            </div>
        )}

        {/* --- STEP 2: EXPENSES --- */}
        {step === AppStep.EXPENSES && (
            <div className="animate-fade-in space-y-6">
                
                {/* Header Action */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{t.step2}</h2>
                        <p className="text-sm text-gray-500">{t.expensesTitle} ({expenses.length})</p>
                    </div>
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md flex items-center gap-2 font-bold transition-all"
                    >
                        <Plus size={18} />
                        {t.addExpense}
                    </button>
                </div>

                {/* The List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[300px]">
                     <ExpenseTable 
                        expenses={expenses} 
                        salary={salary} 
                        onDelete={handleDeleteExpense} 
                        onEdit={handleOpenEditModal}
                        lang={lang}
                     />
                </div>

                {/* Nav Buttons */}
                <div className="flex justify-between mt-8">
                     <button 
                        onClick={handlePrevStep}
                        className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-bold flex items-center gap-2 transition-colors"
                     >
                        {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                        {t.back}
                     </button>
                     
                     <button 
                        onClick={handleNextStep}
                        className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg transition-all"
                     >
                        <span>{t.finish}</span>
                        {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                     </button>
                </div>
            </div>
        )}

        {/* --- STEP 3: DASHBOARD --- */}
        {step === AppStep.DASHBOARD && (
          <div className="animate-fade-in space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts Column */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-2 text-center text-sm">{t.expensesTitle}</h3>
                    <FinancialChart metrics={metrics} />
                 </div>
                 
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-2 text-center text-sm">{t.target} vs {t.actual}</h3>
                    <TargetVsActualChart salary={salary} metrics={metrics} />
                 </div>
              </div>
              
              {/* Stats Column */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                 {getAnalysis()}
                 
                 <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-lg flex flex-col justify-center h-full min-h-[140px]">
                    <h4 className="text-indigo-200 text-sm font-medium mb-1">{t.savings}</h4>
                    <div className="text-4xl font-bold mb-2 flex items-baseline gap-2">
                         {metrics.totalSavingsCalculated.toLocaleString()} 
                         <span className="text-lg font-normal text-indigo-300">{t.currency}</span>
                    </div>
                    
                    {metrics.remainingSalary > 0 && (
                       <div className="bg-indigo-800/50 rounded px-3 py-2 text-sm flex items-center gap-2 w-fit mt-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                          {t.remaining}: {metrics.remainingSalary.toLocaleString()}
                       </div>
                    )}
                 </div>

                 <div className="flex gap-4">
                     <button 
                        onClick={handlePrevStep}
                        className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 flex justify-center items-center gap-2"
                     >
                        <Edit2 size={16} />
                        {t.edit} {t.step2}
                     </button>
                 </div>
              </div>
            </div>

            {/* Expenses Table (Read Only view or quick edit) */}
            {expenses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-fade-in mt-6">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                   <h3 className="font-bold text-gray-800">{t.expensesTitle}</h3>
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

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
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

      {/* Persistent Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <span>{t.developedBy}</span>
           <a href="https://www.linkedin.com/in/ahmed-alshareef-innovation" target="_blank" rel="noopener noreferrer">
             <img src="./ashareef_logo.png" alt="Logo" className="h-8 object-contain opacity-80 hover:opacity-100" />
           </a>
        </div>

        {/* Export Button (Visible on Dashboard) */}
        {step === AppStep.DASHBOARD && (
             <button 
             onClick={exportPDF}
             disabled={isExporting}
             className={`bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
           >
             {isExporting ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Download size={16} />}
             <span className="font-bold text-xs md:text-sm">{t.exportPDF}</span>
           </button>
        )}
      </footer>

    </div>
  );
}

const Edit2 = ({size}:{size:number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

export default App;