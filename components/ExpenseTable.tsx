import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
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
    if (salary === 0) return 'bg-gray-100 text-gray-500';
    const percentage = (amount / salary) * 100;
    if (percentage <= 5) return 'bg-green-100 text-green-800';
    if (percentage <= 15) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const getTypeBadge = (type: ExpenseType) => {
    const label = EXPENSE_TYPE_LABELS[lang][type];
    switch (type) {
      case ExpenseType.NEED: return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">{label}</span>;
      case ExpenseType.WANT: return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">{label}</span>;
      case ExpenseType.SAVING: return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium">{label}</span>;
    }
  };

  return (
    <>
      <div className="hidden md:block overflow-x-auto w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 uppercase text-xs tracking-wider">
            <tr>
              <th className={`px-5 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseName}</th>
              <th className={`px-5 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseType}</th>
              <th className={`px-5 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseAmount}</th>
              <th className={`px-5 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>% {t.fromSalary}</th>
              <th className={`px-5 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t.notes}</th>
              <th className="px-5 py-4 text-center w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-transparent">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium">
                  {t.noExpenses}
                </td>
              </tr>
            ) : (
              expenses.map((expense) => {
                const percentage = salary > 0 ? Math.ceil((expense.amount / salary) * 100) : 0;
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className={`px-5 py-5 font-bold text-slate-800 border-none ${isRtl ? 'text-right' : 'text-left'}`}>{expense.name}</td>
                    <td className={`px-5 py-5 border-none ${isRtl ? 'text-right' : 'text-left'}`}>{getTypeBadge(expense.type)}</td>
                    <td className={`px-5 py-5 font-bold text-slate-900 border-none ${isRtl ? 'text-right' : 'text-left'}`}>{expense.amount.toLocaleString()}</td>
                    <td className={`px-5 py-5 border-none ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getPercentageColor(expense.amount)}`}>
                        {percentage}%
                      </span>
                    </td>
                    <td className={`px-5 py-5 text-slate-500 max-w-[150px] truncate border-none ${isRtl ? 'text-right' : 'text-left'}`}>{expense.notes || '-'}</td>
                    <td className="px-5 py-5 border-none">
                      <div className="flex items-center justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(expense)} 
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shadow-sm"
                          title={t.edit}
                        >
                          <Edit2 size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => onDelete(expense.id)} 
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shadow-sm"
                          title={t.delete}
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
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
        {expenses.length === 0 ? (
           <div className="px-4 py-12 text-center text-slate-400 font-medium">
             {t.noExpenses}
           </div>
        ) : (
          expenses.map((expense) => {
             const percentage = salary > 0 ? Math.ceil((expense.amount / salary) * 100) : 0;
             return (
              <div key={expense.id} className="p-4 flex flex-col gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                   <div>
                     <div className="font-bold text-slate-800 text-base mb-1.5">{expense.name}</div>
                     {getTypeBadge(expense.type)}
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="font-black text-slate-900 text-lg">{expense.amount.toLocaleString()}</span>
                     <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${getPercentageColor(expense.amount)}`}>
                        {percentage}% {t.fromSalary}
                     </span>
                   </div>
                </div>
                {expense.notes && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {expense.notes}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button 
                    onClick={() => onEdit(expense)} 
                    className="flex-1 py-2 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shadow-sm text-xs font-bold"
                  >
                    <Edit2 size={14} strokeWidth={2.5} /> {t.edit}
                  </button>
                  <button 
                    onClick={() => onDelete(expense.id)} 
                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shadow-sm flex items-center justify-center"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
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