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
                generatedAdvice = `توصية: إنفاقك على "الرغبات" مرتفع (${Math.round(wantsPct)}%). جرب تقليل بند "${largestWant.name}".`;
            } else if (largestWant) {
                generatedAdvice = `توصية: حاول تقليل الكماليات مثل "${largestWant.name}".`;
            } else {
                generatedAdvice = `توصية: ميزانيتك مضغوطة. راجع المصروفات غير الضرورية.`;
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
       case ExpenseType.NEED: return 'text-red-600 font-semibold';
       case ExpenseType.WANT: return 'text-amber-600 font-semibold';
       case ExpenseType.SAVING: return 'text-emerald-600 font-semibold';
       default: return 'text-slate-700 font-semibold';
     }
  };

  const isRtl = lang === 'ar';

  return (
    <div className="bg-transparent p-4 sm:p-5 w-full max-w-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
          {editingExpense ? <Edit2Icon /> : <PlusCircleIcon />}
          {editingExpense ? (lang === 'ar' ? 'تعديل المصروف' : 'Edit Expense') : t.addExpense}
        </h3>
        <button 
          onClick={onCancelEdit}
          className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors active:scale-95"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          
          <div className="flex flex-col gap-1.5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-500 mb-1.5 px-1 uppercase tracking-wider">{t.expenseName}</label>
              
              <select 
                onChange={handleSuggestionSelect}
                className="w-full mb-2.5 px-3 py-2.5 text-[14px] font-medium border border-slate-200 bg-slate-50 hover:bg-white rounded-[12px] text-slate-700 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 outline-none cursor-pointer transition-all appearance-none"
                defaultValue=""
              >
                <option value="" disabled>{lang === 'ar' ? "اختر من القائمة أو اكتب اسماً جديداً..." : "Select suggested or type..."}</option>
                {currentSuggestions.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all text-[16px] text-slate-900 font-semibold"
                placeholder={lang === 'ar' ? "أو أدخل اسماً مخصصاً..." : "Enter custom name..."}
                required
                autoFocus={!editingExpense}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-[13px] font-semibold text-slate-500 mb-0.5 px-1 uppercase tracking-wider">{t.expenseAmount}</label>
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={amount}
              onChange={(e) => {
                 const val = e.target.value.replace(/[^0-9.]/g, '');
                 setAmount(val);
              }}
              className={`w-full px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all text-[16px] text-slate-900 font-bold tabular-nums tracking-tight ${lang==='ar' ? 'mt-0 sm:mt-[38px]' : 'mt-0 md:mt-[38px]'}`}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-[13px] font-semibold text-slate-500 mb-0.5 px-1 uppercase tracking-wider">{t.expenseType}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExpenseType)}
              className={`w-full px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all text-[15px] appearance-none cursor-pointer ${getTypeColorClass(type)}`}
            >
              {EXPENSE_TYPES.map(t => (
                <option key={t} value={t} className={getTypeColorClass(t)}>
                    {EXPENSE_TYPE_LABELS[lang][t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
             <label className="block text-[13px] font-semibold text-slate-500 mb-0.5 px-1 uppercase tracking-wider">{t.notes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white rounded-[16px] focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] outline-none transition-all text-[16px] text-slate-900"
              placeholder={lang === 'ar' ? "اختياري" : "Optional"}
            />
          </div>
        </div>

        {warning && (
          <div className="bg-amber-50/80 border-[0.5px] border-amber-200 p-4 rounded-[16px] shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
              <div>
                <p className="text-[14px] font-bold text-amber-800 tracking-tight">{warning}</p>
                {advice && <p className="text-[13px] text-amber-700/80 mt-1.5 bg-white/60 px-3 py-2 rounded-xl font-medium">{advice}</p>}
                <p className="text-[12px] text-amber-600 mt-2 font-bold underline cursor-pointer hover:text-amber-700 inline-flex active:scale-95" onClick={handleSubmit}>
                    {lang === 'ar' ? 'حفظ المصروف وتجاهل التنبيه' : 'Save anyway'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-6 py-3.5 rounded-[16px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2 active:scale-95 text-[15px]"
            >
              {t.cancel}
            </button>
          <button
            type="submit"
            className="px-8 py-3.5 rounded-[16px] font-semibold bg-[#007AFF] text-white hover:bg-[#0062cc] shadow-[0_2px_10px_rgba(0,122,255,0.3)] transition-all flex items-center gap-2 active:scale-[0.98] text-[15px]"
          >
            {editingExpense ? <Save size={18} strokeWidth={1.5} /> : <PlusCircle size={18} strokeWidth={1.5} />}
            {editingExpense ? t.save : t.addExpense}
          </button>
        </div>
      </form>
    </div>
  );
};

const Edit2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;