import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Expense, ExpenseType, Language } from '../types';
import { TRANSLATIONS } from '../constants';

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
    switch (type) {
      case ExpenseType.NEED: return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">{type}</span>;
      case ExpenseType.WANT: return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">{type}</span>;
      case ExpenseType.SAVING: return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium">{type}</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
          <tr>
            <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseName}</th>
            <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseType}</th>
            <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseAmount}</th>
            <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t.expenseAmount} %</th>
            <th className={`px-4 py-3 hidden md:table-cell ${isRtl ? 'text-right' : 'text-left'}`}>{t.notes}</th>
            <th className="px-4 py-3 text-center w-24"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                {t.noExpenses}
              </td>
            </tr>
          ) : (
            expenses.map((expense) => {
              const percentage = salary > 0 ? Math.ceil((expense.amount / salary) * 100) : 0;
              return (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className={`px-4 py-3 font-medium text-gray-900 ${isRtl ? 'text-right' : 'text-left'}`}>{expense.name}</td>
                  <td className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{getTypeBadge(expense.type)}</td>
                  <td className={`px-4 py-3 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>{expense.amount.toLocaleString()}</td>
                  <td className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getPercentageColor(expense.amount)}`}>
                      %{percentage}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-gray-500 max-w-xs truncate hidden md:table-cell ${isRtl ? 'text-right' : 'text-left'}`}>{expense.notes || '-'}</td>
                  <td className="px-4 py-3">
                    {/* Mobile Optimized Actions: Stacked or Larger touch targets */}
                    <div className="flex items-center justify-center gap-3 md:gap-2">
                      <button 
                        onClick={() => onEdit(expense)} 
                        className="p-2 md:p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"
                        title={t.edit}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(expense.id)} 
                        className="p-2 md:p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                        title={t.delete}
                      >
                        <Trash2 size={18} />
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
  );
};