import React, { useState, useEffect } from 'react';
import { Expense, ExpenseType, Language } from '../types';
import { EXPENSE_TYPES, SUGGESTED_EXPENSES, SUGGESTED_EXPENSES_EN, EXPENSE_MAPPING, EXPENSE_MAPPING_EN, TRANSLATIONS, EXPENSE_TYPE_LABELS } from '../constants';
import { PlusCircle, Save, X, AlertTriangle } from 'lucide-react';

interface AddExpenseFormProps {
  salary: number;
  currentTotal: number;
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id'>) => boolean; 
  editingExpense?: Expense | null;
  onUpdate: (updatedExpense: Expense) => boolean;
  onCancelEdit: () => void;
  lang: Language;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ 
  salary, 
  currentTotal, 
  expenses,
  onAdd, 
  editingExpense,
  onUpdate,
  onCancelEdit,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<ExpenseType>(ExpenseType.NEED);
  const [notes, setNotes] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  
  // Determine which suggestions to show
  const currentSuggestions = lang === 'ar' ? SUGGESTED_EXPENSES : SUGGESTED_EXPENSES_EN;

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name);
      setAmount(editingExpense.amount.toString());
      setType(editingExpense.type);
      setNotes(editingExpense.notes || '');
      setWarning(null);
      setAdvice(null);
    }
  }, [editingExpense]);

  useEffect(() => {
    if (name) {
       // Check Arabic mapping
       if (lang === 'ar' && EXPENSE_MAPPING[name]) {
          setType(EXPENSE_MAPPING[name]);
       }
       // Check English mapping
       if (lang === 'en' && EXPENSE_MAPPING_EN[name]) {
          setType(EXPENSE_MAPPING_EN[name]);
       }
    }
  }, [name, lang]);

  // Real-time validation for UI feedback (non-blocking)
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        setWarning(null);
        setAdvice(null);
        return;
    }

    const amountDiff = editingExpense ? numAmount - editingExpense.amount : numAmount;
    
    if (currentTotal + amountDiff > salary) {
        const deficit = (currentTotal + amountDiff) - salary;
        setWarning(`${t.errorSalaryExceeded} (${deficit.toLocaleString()})`);
        
        const otherExpenses = expenses.filter(e => editingExpense ? e.id !== editingExpense.id : true);
        const currentWants = otherExpenses.filter(e => e.type === ExpenseType.WANT).reduce((sum, e) => sum + e.amount, 0);
        const wantsPct = (currentWants / salary) * 100;
        
        const largestWant = otherExpenses
            .filter(e => e.type === ExpenseType.WANT)
            .sort((a, b) => b.amount - a.amount)[0];

        let generatedAdvice = "";

        if (lang === 'ar') {
            if (wantsPct > 30 && largestWant) {
                generatedAdvice = `توصية الخبير: إنفاقك على "الرغبات" مرتفع (${Math.round(wantsPct)}%). جرب تقليل بند "${largestWant.name}".`;
            } else if (largestWant) {
                generatedAdvice = `توصية الخبير: حاول تقليل الكماليات مثل "${largestWant.name}".`;
            } else {
                generatedAdvice = `توصية الخبير: ميزانيتك مضغوطة. راجع مصروفاتك.`;
            }
        } else {
            if (wantsPct > 30 && largestWant) {
                generatedAdvice = `Expert Tip: Your 'Wants' are high (${Math.round(wantsPct)}%). Try reducing "${largestWant.name}".`;
            } else if (largestWant) {
                generatedAdvice = `Expert Tip: Try reducing luxuries like "${largestWant.name}".`;
            } else {
                generatedAdvice = `Expert Tip: Your budget is tight. Review your needs.`;
            }
        }
        setAdvice(generatedAdvice);
    } else {
        setWarning(null);
        setAdvice(null);
    }
  }, [amount, currentTotal, salary, editingExpense, expenses, lang, t.errorSalaryExceeded]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name || isNaN(numAmount) || numAmount <= 0) return;

    // NOTE: Removed the blocking return logic. 
    // We allow the user to save even if warning exists.
    
    let success = false;
    if (editingExpense) {
      success = onUpdate({ ...editingExpense, name, amount: numAmount, type, notes });
    } else {
      success = onAdd({ name, amount: numAmount, type, notes });
    }

    if (success) {
      if (!editingExpense) {
        setName('');
        setAmount('');
        setNotes('');
        setType(ExpenseType.NEED);
      }
      setWarning(null);
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

  const isRtl = lang === 'ar';

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {editingExpense ? <Edit2Icon /> : <PlusCircleIcon />}
          {editingExpense ? (lang === 'ar' ? 'تعديل المصروف' : 'Edit Expense') : t.addExpense}
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
          
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t.expenseName}</label>
              
              <select 
                onChange={handleSuggestionSelect}
                className="w-full mb-2 px-2 py-1.5 text-xs border border-gray-200 bg-gray-50 rounded text-gray-600 focus:border-blue-500 outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>{lang === 'ar' ? "↓ اختر من القائمة المقترحة" : "↓ Select suggested expense"}</option>
                {currentSuggestions.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder={lang === 'ar' ? "أو اكتب الاسم هنا..." : "Expense name..."}
                required
                autoFocus={!editingExpense}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t.expenseAmount}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${lang==='ar' ? 'mt-[29px]' : 'md:mt-[29px]'}`}
              placeholder="0.00"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t.expenseType}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExpenseType)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white md:mt-[29px] ${getTypeColorClass(type)}`}
            >
              {EXPENSE_TYPES.map(t => (
                <option key={t} value={t} className={getTypeColorClass(t)}>
                    {EXPENSE_TYPE_LABELS[lang][t]}
                </option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-xs font-semibold text-gray-500 mb-1">{t.notes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all md:mt-[29px]"
              placeholder={lang === 'ar' ? "اختياري" : "Optional"}
            />
          </div>
        </div>

        {warning && (
          <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="text-amber-500 ltr:mr-2 rtl:ml-2 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-amber-700">{warning}</p>
                {advice && <p className="text-sm text-amber-600 mt-1 bg-white/50 p-2 rounded">{advice}</p>}
                <p className="text-xs text-amber-500 mt-2 font-bold underline cursor-pointer" onClick={handleSubmit}>
                    {lang === 'ar' ? 'حفظ المصروف وتجاهل التنبيه' : 'Save anyway'}
                </p>
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
              {t.cancel}
            </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
          >
            {editingExpense ? <Save size={18} /> : <PlusCircle size={18} />}
            {editingExpense ? t.save : t.addExpense}
          </button>
        </div>
      </form>
    </div>
  );
};

const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;