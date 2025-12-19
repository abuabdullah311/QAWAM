import React, { useState, useEffect, useRef } from 'react';
import { StickyHeader } from './components/StickyHeader';
import { FinancialChart } from './components/FinancialChart';
import { ExpenseTable } from './components/ExpenseTable';
import { AddExpenseForm } from './components/AddExpenseForm';
import { Expense, ExpenseType, DashboardMetrics } from './types';
import { GUIDANCE_TEXT } from './constants';
import { Download, Info, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function App() {
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Initialize from LocalStorage or Defaults
  useEffect(() => {
    const savedExpenses = localStorage.getItem('qawam_expenses');
    const savedSalary = localStorage.getItem('qawam_salary');

    if (savedSalary) setSalary(parseFloat(savedSalary));
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    } else {
      // Initialize empty to keep UI clean until user adds expenses
      setExpenses([]);
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
    
    // Logic: Total Savings = (Salary - Needs - Wants).
    // This includes both explicit "Saving" expenses AND remaining cash.
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
  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense = { ...newExpenseData, id: Date.now().toString() };
    setExpenses(prev => [newExpense, ...prev]);
    return true;
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setEditingExpense(null);
    return true;
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    
    const canvas = await html2canvas(dashboardRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`QAWAM-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // 50/30/20 Analysis Text
  const getAnalysis = () => {
    if (salary === 0) return null;
    const needPct = (metrics.totalNeeds / salary) * 100;
    const wantPct = (metrics.totalWants / salary) * 100;
    const savePct = (metrics.totalSavingsCalculated / salary) * 100;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnalysisCard 
          title="الاحتياج (الهدف 50%)" 
          current={needPct} 
          target={50} 
          color="red" // Changed to red
          label={ExpenseType.NEED}
        />
        <AnalysisCard 
          title="الرغبات (الهدف 30%)" 
          current={wantPct} 
          target={30} 
          color="amber"
          label={ExpenseType.WANT} 
        />
        <AnalysisCard 
          title="الادخار (الهدف 20%)" 
          current={savePct} 
          target={20} 
          color="emerald" 
          label={ExpenseType.SAVING}
          isMinimum
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <StickyHeader salary={salary} metrics={metrics} />

      <main className="max-w-4xl mx-auto px-4" ref={dashboardRef}>
        
        {/* Top Section: Salary Input & Guide Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Salary Input (Right in RTL) */}
          <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 h-full flex flex-col justify-center">
            <label className="block text-sm font-bold text-gray-700 mb-2">صافي الراتب الشهري</label>
            <div className="relative">
              <input
                type="number"
                value={salary || ''}
                onChange={(e) => setSalary(parseFloat(e.target.value))}
                placeholder="0"
                className="w-full text-4xl font-bold text-gray-800 border-b-2 border-gray-300 focus:border-blue-600 outline-none py-2 bg-transparent transition-colors"
              />
              <span className="absolute left-0 bottom-3 text-gray-400 font-medium">ريال</span>
            </div>
            
            {/* Added Clarification */}
            <div className="flex items-start gap-2 mt-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                المقصود هو الراتب الشهري الصافي الذي يتم إيداعه في الحساب البنكي شهرياً.
              </p>
            </div>
          </section>

          {/* Quick Guide (Left in RTL) */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 h-full flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2 text-blue-800">
                <Info size={20} />
                <h3 className="font-bold">إرشادات سريعة</h3>
             </div>
             <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-line">
               {GUIDANCE_TEXT}
             </p>
          </div>

        </div>

        {/* Dashboard: Charts & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 text-center">توزيع الراتب</h3>
            <FinancialChart metrics={metrics} />
          </div>
          
          <div className="lg:col-span-2">
             {/* 50/30/20 Indicators */}
             {getAnalysis()}
             
             {/* Quick Stats Box */}
             <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-lg flex flex-col justify-center h-48">
                <h4 className="text-indigo-200 text-sm font-medium mb-1">الادخار والاستثمار الكلي</h4>
                <div className="text-4xl font-bold mb-2">{metrics.totalSavingsCalculated.toLocaleString()}</div>
                <p className="text-xs text-indigo-300 mb-4">يشمل المبالغ المصنفة كادخار + المتبقي من الراتب</p>
                
                {metrics.remainingSalary > 0 && (
                   <div className="bg-indigo-800/50 rounded px-3 py-2 text-sm flex items-center gap-2 w-fit">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      متبقي غير موزع: {metrics.remainingSalary.toLocaleString()}
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div data-html2canvas-ignore>
           <AddExpenseForm 
             salary={salary} 
             currentTotal={metrics.totalExpenses}
             expenses={expenses} // Passing expenses for analysis
             onAdd={handleAddExpense}
             editingExpense={editingExpense}
             onUpdate={handleUpdateExpense}
             onCancelEdit={() => setEditingExpense(null)}
           />
        </div>

        {/* Table - Only shown if expenses exist */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-gray-800">تفاصيل المصارف</h3>
               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                 {expenses.length} بند
               </span>
            </div>
            <ExpenseTable 
              expenses={expenses} 
              salary={salary} 
              onDelete={handleDeleteExpense} 
              onEdit={setEditingExpense}
            />
          </div>
        )}

      </main>

      {/* Floating Action Button for Export */}
      <div className="fixed bottom-6 left-6 z-50">
        <button 
          onClick={exportPDF}
          className="bg-gray-800 hover:bg-gray-900 text-white p-4 rounded-full shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
          title="تصدير PDF"
        >
          <Download size={24} />
          <span className="font-bold hidden md:inline">حفظ PDF</span>
        </button>
      </div>

    </div>
  );
}

// Helper Component for the 50/30/20 cards
const AnalysisCard = ({ title, current, target, color, label, isMinimum = false }: any) => {
  const diff = current - target;
  // If need/want exceeds target -> Warning. If savings exceeds target -> Good.
  const isNegative = isMinimum ? diff < -5 : diff > 5; 
  
  // Tailwind dynamic classes hack
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100', // Added Red variant
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs bg-white px-2 py-0.5 rounded shadow-sm opacity-80">{Math.round(current)}%</span>
      </div>
      <div className="w-full bg-white/50 h-2 rounded-full mb-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 bg-current`} 
          style={{ width: `${Math.min(current, 100)}%` }}
        ></div>
      </div>
      {isNegative && (
        <div className="flex items-start gap-1 text-xs mt-1 font-medium opacity-90">
          <AlertCircle size={12} className="mt-0.5" />
          <span>
             {isMinimum 
               ? `أقل من الهدف بـ ${Math.abs(Math.round(diff))}%` 
               : `أعلى من الهدف بـ ${Math.round(diff)}%`}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;