import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Expense, ExpenseType } from '../types';
import { COLORS } from '../constants';

interface ExpenseTableProps {
  expenses: Expense[];
  salary: number;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, salary, onDelete, onEdit }) => {
  
  const getPercentageColor = (amount: number): string => {
    if (salary === 0) return 'bg-gray-100 text-gray-500';
    const percentage = (amount / salary) * 100;
    if (percentage <= 5) return 'bg-green-100 text-green-800';
    if (percentage <= 15) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const getTypeBadge = (type: ExpenseType) => {
    switch (type) {
      // Changed to Red style
      case ExpenseType.NEED: return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">احتياج</span>;
      case ExpenseType.WANT: return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">رغبة</span>;
      case ExpenseType.SAVING: return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium">ادخار</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">اسم المصرف</th>
            <th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">المبلغ</th>
            <th className="px-4 py-3">النسبة</th>
            <th className="px-4 py-3">ملاحظات</th>
            <th className="px-4 py-3 text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                لا توجد مصارف مضافة حالياً.
              </td>
            </tr>
          ) : (
            expenses.map((expense) => {
              const percentage = salary > 0 ? Math.ceil((expense.amount / salary) * 100) : 0;
              return (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{expense.name}</td>
                  <td className="px-4 py-3">{getTypeBadge(expense.type)}</td>
                  <td className="px-4 py-3 font-semibold">{expense.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getPercentageColor(expense.amount)}`}>
                      %{percentage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{expense.notes || '-'}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button 
                      onClick={() => onEdit(expense)} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="تعديل"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(expense.id)} 
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
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