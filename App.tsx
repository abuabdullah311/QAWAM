import React, { useState, useEffect } from 'react';
import { StickyHeader } from './components/StickyHeader';
import { FinancialChart } from './components/FinancialChart';
import { TargetVsActualChart } from './components/TargetVsActualChart';
import { ExpenseTable } from './components/ExpenseTable';
import { AddExpenseForm } from './components/AddExpenseForm';
import { PrintableReport } from './components/PrintableReport';
import { Expense, ExpenseType, DashboardMetrics } from './types';
import { GUIDANCE_TEXT } from './constants';
import { Download, Info, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// 1. إضافة سطر الاستيراد هنا
import { Analytics } from "@vercel/analytics/react";

// Helper Component defined as function
function AnalysisCard({ title, current, target, color, label, isMinimum = false }: any) {
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
               ? `أقل من الهدف بـ ${Math.abs(Math.round(diff))}%` 
               : `أعلى من الهدف بـ ${Math.round(diff)}%`}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-1 text-xs mt-1 font-medium opacity-90">
          <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
          <span>ضمن النطاق المثالي</span>
        </div>
      )}
    </div>
  );
}

function App() {
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize from LocalStorage or Defaults
  useEffect(() => {
    const savedExpenses = localStorage.getItem('qawam_expenses');
    const savedSalary = localStorage.getItem('qawam_salary');

    if (savedSalary) {
      const s = parseFloat(savedSalary);
      setSalary(s);
      if (s > 0) setShowContent(true);
    }
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    } else {
      setExpenses([]);
    }
  }, []);

  // Save on Change
  useEffect(() => {
    localStorage.setItem('qawam_expenses', JSON.stringify(expenses));
    localStorage.setItem('qawam_salary', salary.toString());
    if (salary > 0) setShowContent(true);
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
    setTimeout(() => setEditingExpense(null), 300); // Clear after animation
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
    if (window.confirm('هل أنت متأكد من حذف جميع البيانات والبدء من جديد؟')) {
      localStorage.removeItem('qawam_expenses');
      localStorage.removeItem('qawam_salary');
      setSalary(0);
      setExpenses([]);
      setEditingExpense(null);
      setShowContent(false);
      window.scrollTo(0, 0);
    }
  };

  // Robust PDF Export
  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const input = document.getElementById('printable-report');
      if (!input) throw new Error('Printable report element not found');

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
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
      console.error("PDF Export failed", err);
      alert("حدث خطأ أثناء تصدير PDF. يرجى المحاولة مرة أخرى.");
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
              <p className="font-bold text-emerald-800">أحسنت! توزيعك المالي متوازن.</p>
              <p className="text-xs text-emerald-600">أنت تلتزم بقاعدة 50/30/20 بشكل ممتاز.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnalysisCard title="الاحتياج (الهدف 50%)" current={needPct} target={50} color="red" label={ExpenseType.NEED} />
          <AnalysisCard title="الرغبات (الهدف 30%)" current={wantPct} target={30} color="amber" label={ExpenseType.WANT}  />
          <AnalysisCard title="الادخار (الهدف 20%)" current={savePct} target={20} color="emerald" label={ExpenseType.SAVING} isMinimum />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 relative">
      <StickyHeader salary={salary} metrics={metrics} onReset={handleReset} />

      <div style={{ position: 'fixed', left: '-10000px', top: 0, zIndex: -5, overflow: 'hidden' }}>
        <PrintableReport salary={salary} metrics={metrics} expenses={expenses} />
      </div>

      <main className="max-w-4xl mx-auto px-4">
        {/* Top Section: Salary Input */}
        <div className={`transition-all duration-700 ease-in-out ${salary === 0 ? 'min-h-[60vh] flex flex-col justify-center items-center' : 'mb-6'}`}>
          <div className={`w-full ${salary === 0 ? 'max-w-xl text-center' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}`}>
            <section className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden transition-all duration-500 ${salary === 0 ? 'shadow-xl scale-105 border-blue-200' : 'h-full flex flex-col justify-center'}`}>
              {salary === 0 && <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>}
              <label className={`block font-bold text-gray-800 mb-3 ${salary === 0 ? 'text-xl' : 'text-sm'}`}>
                {salary === 0 ? 'خطوتك الأولى: أدخل صافي راتبك 💰' : 'صافي الراتب الشهري'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={salary || ''}
                  onChange={(e) => setSalary(parseFloat(e.target.value))}
                  placeholder="0"
                  autoFocus={salary === 0}
                  className={`w-full font-black text-gray-800 border-b-2 border-gray-200 focus:border-blue-600 outline-none bg-transparent transition-all placeholder-gray-200 ${salary === 0 ? 'text-6xl text-center py-4' : 'text-4xl py-2'}`}
                />
                <span className={`absolute text-gray-400 font-medium ${salary === 0 ? 'left-4 bottom-6 text-lg' : 'left-0 bottom-3'}`}>ريال</span>
              </div>
            </section>
            {salary > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 h-full flex flex-col justify-center animate-fade-in">
                <div className="flex items-center gap-2 mb-2 text-blue-800">
                    <Info size={20} />
                    <h3 className="font-bold">إرشادات سريعة</h3>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-line">{GUIDANCE_TEXT}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Content */}
        {showContent && (
          <div className="fade-in space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 flex flex-col gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-2 text-center text-sm">التوزيع الحالي</h3>
                    <FinancialChart metrics={metrics} />
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-2 text-center text-sm">مقارنة المستهدف بالفعلي</h3>
                    <TargetVsActualChart salary={salary} metrics={metrics} />
                 </div>
              </div>
              <div className="lg:col-span-2 flex flex-col gap-6">
                 {getAnalysis()}
                 <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-lg flex flex-col justify-center h-full min-h-[140px]">
                    <h4 className="text-indigo-200 text-sm font-medium mb-1">الادخار والاستثمار الكلي</h4>
                    <div className="text-4xl font-bold mb-2">{metrics.totalSavingsCalculated.toLocaleString()} <span className="text-lg font-normal text-indigo-300">ريال</span></div>
                    {metrics.remainingSalary > 0 && (
                       <div className="bg-indigo-800/50 rounded px-3 py-2 text-sm flex items-center gap-2 w-fit">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                          متبقي غير موزع: {metrics.remainingSalary.toLocaleString()}
                       </div>
                    )}
                 </div>
              </div>
            </div>

            <div data-html2canvas-ignore className="flex justify-end">
              <button onClick={handleOpenAddModal} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 font-bold text-lg">
                <Plus size={24} />
                <span>إضافة مصروف جديد</span>
              </button>
            </div>

            {expenses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                   <h3 className="font-bold text-gray-800">تفاصيل المصروفات</h3>
                   <span className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full shadow-sm">{expenses.length} بند</span>
                </div>
                <ExpenseTable expenses={expenses} salary={salary} onDelete={handleDeleteExpense} onEdit={handleOpenEditModal} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="w-full max-w-2xl animate-[fadeIn_0.3s_ease-out]">
            <AddExpenseForm salary={salary} currentTotal={metrics.totalExpenses} expenses={expenses} onAdd={handleAddExpense} editingExpense={editingExpense} onUpdate={handleUpdateExpense} onCancelEdit={handleCloseModal} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-slate-400 text-xs border-t border-slate-200">
        <p className="mb-2">تم التطوير بواسطة</p>
        <div className="flex justify-center mb-2">
           <a href="https://www.linkedin.com/in/ahmed-alshareef-innovation" target="_blank" rel="noopener noreferrer" className="inline-block transition-transform hover:scale-105">
             <img src="./ashareef_logo.png" alt="Developer Logo" className="h-16 object-contain opacity-80" />
           </a>
        </div>
        <p className="opacity-70">© {new Date().getFullYear()} قوام. جميع الحقوق محفوظة.</p>
      </footer>

      {/* Floating Action Button */}
      {showContent && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3" data-html2canvas-ignore>
          <button onClick={exportPDF} disabled={isExporting} className={`bg-slate-800 hover:bg-slate-900 text-white p-3 md:px-6 rounded-xl shadow-
