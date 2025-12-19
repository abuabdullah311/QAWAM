import React, { useState, useEffect } from 'react';
import { Expense, ExpenseType } from '../types';
import { EXPENSE_TYPES, SUGGESTED_EXPENSES } from '../constants';
import { PlusCircle, Save, X, AlertTriangle } from 'lucide-react';

interface AddExpenseFormProps {
  salary: number;
  currentTotal: number;
  expenses: Expense[]; // Added expenses list to analyze for advice
  onAdd: (expense: Omit<Expense, 'id'>) => boolean; 
  editingExpense?: Expense | null;
  onUpdate: (updatedExpense: Expense) => boolean;
  onCancelEdit: () => void;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ 
  salary, 
  currentTotal, 
  expenses,
  onAdd, 
  editingExpense,
  onUpdate,
  onCancelEdit
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<ExpenseType>(ExpenseType.NEED);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);

  // Load editing expense data
  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name);
      setAmount(editingExpense.amount.toString());
      setType(editingExpense.type);
      setNotes(editingExpense.notes || '');
      setError(null);
      setAdvice(null);
    }
  }, [editingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name || isNaN(numAmount) || numAmount <= 0) return;

    // Check budget limit
    const amountDiff = editingExpense ? numAmount - editingExpense.amount : numAmount;
    if (currentTotal + amountDiff > salary) {
      const deficit = (currentTotal + amountDiff) - salary;
      setError(`عفواً، إضافة هذا المبلغ ستتجاوز الراتب بمقدار ${deficit.toLocaleString()}.`);
      
      // --- Smart Expert Advice Logic ---
      
      // 1. Analyze Current Distribution (excluding the item being edited to avoid double counting)
      const otherExpenses = expenses.filter(e => editingExpense ? e.id !== editingExpense.id : true);
      
      const currentNeeds = otherExpenses.filter(e => e.type === ExpenseType.NEED).reduce((sum, e) => sum + e.amount, 0);
      const currentWants = otherExpenses.filter(e => e.type === ExpenseType.WANT).reduce((sum, e) => sum + e.amount, 0);
      
      // Calculate Percentages
      const wantsPct = (currentWants / salary) * 100;
      
      // 2. Find specific candidates to cut
      // Sort Wants by amount descending
      const largestWant = otherExpenses
        .filter(e => e.type === ExpenseType.WANT)
        .sort((a, b) => b.amount - a.amount)[0];

      // Sort Needs by amount descending
      const largestNeed = otherExpenses
        .filter(e => e.type === ExpenseType.NEED)
        .sort((a, b) => b.amount - a.amount)[0];

      let generatedAdvice = "";

      if (wantsPct > 30 && largestWant) {
        generatedAdvice = `توصية الخبير: إنفاقك على "الرغبات" مرتفع (${Math.round(wantsPct)}% بينما الموصى به 30%). لإتاحة المجال لهذا المصروف، نقترح عليك تقليل بند "${largestWant.name}" بمقدار ${deficit.toLocaleString()}.`;
      } else if (largestWant) {
        generatedAdvice = `توصية الخبير: لإضافة هذا المصروف، ابدأ بتقليل الكماليات. هل يمكنك تخفيض بند "${largestWant.name}"؟`;
      } else if (largestNeed) {
         generatedAdvice = `توصية الخبير: ميزانيتك مضغوطة جداً وتتكون معظمها من احتياجات. راجع بند "${largestNeed.name}" إن كان يمكن استبداله ببديل أقل تكلفة لتوفير ${deficit.toLocaleString()}.`;
      } else {
         generatedAdvice = `توصية الخبير: حاول تقليل أي مصروف آخر بمقدار ${deficit.toLocaleString()} لإتمام العملية.`;
      }

      setAdvice(generatedAdvice);
      return;
    }

    let success = false;
    if (editingExpense) {
      success = onUpdate({ ...editingExpense, name, amount: numAmount, type, notes });
    } else {
      success = onAdd({ name, amount: numAmount, type, notes });
    }

    if (success) {
      // Reset form
      if (!editingExpense) {
        setName('');
        setAmount('');
        setNotes('');
        setType(ExpenseType.NEED);
      }
      setError(null);
      setAdvice(null);
    }
  };

  const handleSuggestionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      setName(e.target.value);
    }
  };

  const getTypeColorClass = (t: ExpenseType) => {
     switch (t) {
       case ExpenseType.NEED: return 'text-red-700 font-bold';
       case ExpenseType.WANT: return 'text-amber-600 font-bold';
       case ExpenseType.SAVING: return 'text-emerald-600 font-bold';
       default: return 'text-gray-700';
     }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {editingExpense ? <Edit2Icon /> : <PlusCircleIcon />}
          {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
        </h3>
        <button 
          onClick={onCancelEdit}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Name Input with Helper Select */}
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">اسم المصروف</label>
              
              <select 
                onChange={handleSuggestionSelect}
                className="w-full mb-2 px-2 py-1.5 text-xs border border-gray-200 bg-gray-50 rounded text-gray-600 focus:border-blue-500 outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>↓ اختر من القائمة المقترحة</option>
                {SUGGESTED_EXPENSES.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="أو اكتب الاسم هنا..."
                required
                autoFocus={!editingExpense}
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">المبلغ</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mt-[29px]"
              placeholder="0.00"
              min="0"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">النوع (إلزامي)</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExpenseType)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white md:mt-[29px] ${getTypeColorClass(type)}`}
            >
              {EXPENSE_TYPES.map(t => (
                <option key={t} value={t} className={getTypeColorClass(t)}>{t}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
             <label className="block text-xs font-semibold text-gray-500 mb-1">ملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all md:mt-[29px]"
              placeholder="اختياري"
            />
          </div>
        </div>

        {/* Error & Advice Block */}
        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-md animate-pulse">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 ml-2 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-red-700">{error}</p>
                {advice && <p className="text-sm text-red-600 mt-1 bg-white/50 p-2 rounded">{advice}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              إلغاء
            </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
          >
            {editingExpense ? <Save size={18} /> : <PlusCircle size={18} />}
            {editingExpense ? 'حفظ التعديلات' : 'إضافة المصروف'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;