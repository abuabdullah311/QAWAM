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
    { type: ExpenseType.NEED, name: EXPENSE_TYPE_LABELS[lang][ExpenseType.NEED], value: metrics.totalNeeds, color: COLORS[ExpenseType.NEED] },
    { type: ExpenseType.WANT, name: EXPENSE_TYPE_LABELS[lang][ExpenseType.WANT], value: metrics.totalWants, color: COLORS[ExpenseType.WANT] },
    { type: ExpenseType.SAVING, name: EXPENSE_TYPE_LABELS[lang][ExpenseType.SAVING], value: metrics.totalSavingsCalculated, color: COLORS[ExpenseType.SAVING] },
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
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
              value,
              name,
              fill
            }) => {
              const RADIAN = Math.PI / 180;
              const radius = outerRadius * 1.35;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);

              return (
                <text
                  x={x}
                  y={y}
                  fill={fill}
                  className="text-[12px] font-bold"
                  textAnchor={x > cx ? 'start' : 'end'}
                  dominantBaseline="central"
                >
                  {value.toLocaleString()}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString()}`, lang === 'ar' ? 'المبلغ' : 'Amount']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            content={(props) => {
              const { payload } = props;
              if (!payload) return null;
              // Enforce order: Needs, Wants, Savings. 
              // Since it's dir="ltr" on the parent container to fix the tooltip,
              // we can manually render the legend items in row-reverse or with RTL.
              const order = [ExpenseType.NEED, ExpenseType.WANT, ExpenseType.SAVING];
              const orderedPayload = [...payload].sort((a, b) => {
                 const aIndex = order.indexOf((a.payload as any).type || -1);
                 const bIndex = order.indexOf((b.payload as any).type || -1);
                 return aIndex - bIndex;
              });

              return (
                <div className="flex justify-center items-center gap-4 mt-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  {orderedPayload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-[13px] font-semibold text-slate-700">{entry.value}</span>
                    </div>
                  ))}
                </div>
              );
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};