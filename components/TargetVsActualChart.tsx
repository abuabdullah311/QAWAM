import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { DashboardMetrics, ExpenseType } from '../types';
import { COLORS } from '../constants';

interface TargetVsActualChartProps {
  salary: number;
  metrics: DashboardMetrics;
}

export const TargetVsActualChart: React.FC<TargetVsActualChartProps> = ({ salary, metrics }) => {
  if (salary === 0) return null;

  const getPercent = (val: number) => parseFloat(((val / salary) * 100).toFixed(1));

  const data = [
    {
      name: 'احتياج',
      actual: getPercent(metrics.totalNeeds),
      target: 50,
      color: COLORS[ExpenseType.NEED]
    },
    {
      name: 'رغبة',
      actual: getPercent(metrics.totalWants),
      target: 30,
      color: COLORS[ExpenseType.WANT]
    },
    {
      name: 'ادخار',
      actual: getPercent(metrics.totalSavingsCalculated),
      target: 20,
      color: COLORS[ExpenseType.SAVING]
    },
  ];

  return (
    <div className="h-72 w-full mt-4" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
          <XAxis dataKey="name" tick={{ fontFamily: 'Almarai', fontSize: 12 }} />
          <YAxis unit="%" tick={{ fontSize: 10 }} />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right', direction: 'rtl' }}
            formatter={(value: number, name: string) => [`${value}%`, name === 'actual' ? 'الفعلي' : 'المستهدف']}
            labelStyle={{ display: 'none' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            formatter={(value) => value === 'actual' ? 'الفعلي' : 'المستهدف'}
          />
          <Bar name="target" dataKey="target" fill={COLORS.target} radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar name="actual" dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};