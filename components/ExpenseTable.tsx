import React from 'react';
import { Trash2, Edit2, ShieldAlert, Heart, PiggyBank } from 'lucide-react';
import { Expense, ExpenseType, Language } from '../types';
import { TRANSLATIONS, EXPENSE_TYPE_LABELS } from '../constants';

interface ExpenseTableProps {
  expenses: Expense[];
  salary: number;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  lang: Language;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, salary, onDelete, onEdit, lang }) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const getPercentageColor = (amount: number): string => {
    if (salary === 0) return 'bg-slate-100 text-slate-500';
    const percentage = (amount / salary) * 100;
    if (percentage <= 5) return 'bg-[#34C759]/10 text-[#34C759]';
    if (percentage <= 15) return 'bg-[#FF9500]/10 text-[#FF9500]';
    return 'bg-[#FF3B30]/10 text-[#FF3B30]';
  };

  const getTypeBadge = (type: ExpenseType) => {
    const label = EXPENSE_TYPE_LABELS[lang][type];
    switch (type) {
      case ExpenseType.NEED: return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] bg-red-50 text-red-600 font-semibold tracking-wide border border-red-100/50 shadow-sm">
          <ShieldAlert size={14} className="opacity-80" />
          {label}
        </span>
      );
      case ExpenseType.WANT: return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] bg-orange-50 text-orange-600 font-semibold tracking-wide border border-orange-100/50 shadow-sm">
          <Heart size={14} className="opacity-80" />
          {label}
        </span>
      );
      case ExpenseType.SAVING: return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] bg-emerald-50 text-emerald-600 font-semibold tracking-wide border border-emerald-100/50 shadow-sm">
          <PiggyBank size={14} className="opacity-80" />
          {label}
        </span>
      );
    }
  };

  const sortOrder: Record<ExpenseType, number> = {
    [ExpenseType.NEED]: 1,
    [ExpenseType.WANT]: 2,
    [ExpenseType.SAVING]: 3,
  };

  const sortedExpenses = [...expenses].sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);


  return (
    <>
      <div className="hidden md:block overflow-x-auto w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        <table className="w-full text-[14px]">
          <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200/50 uppercase text-[11px] tracking-widest">
            <tr>
              <th className="px-5 py-4 text-start font-semibold">{t.expenseName}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.expenseType}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.expenseAmount}</th>
              <th className="px-5 py-4 text-start font-semibold">% {t.fromSalary}</th>
              <th className="px-5 py-4 text-start font-semibold">{t.notes}</th>
              <th className="px-5 py-4 text-center w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent">
            {sortedExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                     <span className="text-[15px]">{t.noExpenses}</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedExpenses.map((expense) => {
                const percentage = salary > 0 ? Math.ceil((expense.amount / salary) * 100) : 0;
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-5 py-4 font-semibold text-slate-900 border-none text-start">{expense.name}</td>
                     <td className="px-5 py-4 border-none text-start">{getTypeBadge(expense.type)}</td>
                     <td className="px-5 py-4 font-semibold text-slate-900 border-none text-start tabular-nums tracking-tight text-[15px]">{expense.amount.toLocaleString()}</td>
                     <td className="px-5 py-4 border-none text-start">
                       <span className={`inline-block px-3 py-1 rounded-[8px] text-[12px] font-bold tabular-nums ${getPercentageColor(expense.amount)}`}>
                         {percentage}%
                       </span>
                     </td>
                     <td className="px-5 py-4 text-slate-500 max-w-[150px] truncate border-none text-start text-[13px]">{expense.notes || '-'}</td>
                     <td className="px-5 py-4 border-none">
                       <div className="flex items-center justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => onEdit(expense)} 
                           className="p-2 bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 rounded-full transition-colors active:scale-95"
                           title={t.edit}
                         >
                           <Edit2 size={16} strokeWidth={1.5} />
                         </button>
                         <button 
                           onClick={() => onDelete(expense.id)} 
                           className="p-2 bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 rounded-full transition-colors active:scale-95"
                           title={t.delete}
                         >
                           <Trash2 size={16} strokeWidth={1.5} />
                         </button>
                       </div>
                     </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex flex-col divide-y divide-slate-100 w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        {sortedExpenses.length === 0 ? (
           <div className="px-4 py-16 text-center text-slate-400 font-medium">
             <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-[15px]">{t.noExpenses}</span>
             </div>
           </div>
        ) : (
          sortedExpenses.map((expense) => {
             const percentage = salary > 0 ? Math.ceil((expense.amount / salary) * 100) : 0;
             return (
              <div key={expense.id} className="p-4 sm:p-5 flex flex-col gap-3.5 bg-transparent hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                   <div className="flex flex-col items-start gap-1">
                     <span className="font-semibold text-slate-900 text-[16px] tracking-tight">{expense.name}</span>
                     {getTypeBadge(expense.type)}
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="font-bold text-slate-900 text-[18px] tabular-nums tracking-tight">{expense.amount.toLocaleString()}</span>
                     <span className={`inline-block px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold tabular-nums mt-1 ${getPercentageColor(expense.amount)}`}>
                        {percentage}% {t.fromSalary}
                     </span>
                   </div>
                </div>
                {expense.notes && (
                  <div className="text-[13px] text-slate-500 bg-slate-50/80 p-3 rounded-[12px] border border-slate-100/50">
                    {expense.notes}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <button 
                    onClick={() => onEdit(expense)} 
                    className="flex-1 py-3 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-[12px] transition-colors active:scale-95 text-[14px] font-semibold"
                  >
                    <Edit2 size={16} strokeWidth={1.5} /> {t.edit}
                  </button>
                  <button 
                    onClick={() => onDelete(expense.id)} 
                    className="p-3 bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 rounded-[12px] transition-colors active:scale-95 flex items-center justify-center"
                  >
                    <Trash2 size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
             )
          })
        )}
      </div>
    </>
  );
};