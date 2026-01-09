import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardMetrics, ExpenseType, Language } from '../types';
import { COLORS, EXPENSE_TYPE_LABELS } from '../constants';

interface FinancialChartProps {
  metrics: DashboardMetrics;
  lang: Language;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ metrics, lang }) => {
  const data = [
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.NEED], value: metrics.totalNeeds, color: COLORS[ExpenseType.NEED] },
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.WANT], value: metrics.totalWants, color: COLORS[ExpenseType.WANT] },
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.SAVING], value: metrics.totalSavingsCalculated, color: COLORS[ExpenseType.SAVING] },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
        {lang === 'ar' ? 'أدخل الراتب والمصارف لرؤية المخطط' : 'Add salary and expenses to view chart'}
      </div>
    );
  }

  return (
    <div className="h-72 w-full" dir="ltr"> 
      {/* dir=ltr is forced here for Recharts tooltip positioning consistency */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString()}`, lang === 'ar' ? 'المبلغ' : 'Amount']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};