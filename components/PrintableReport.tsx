import React from 'react';
import { DashboardMetrics, Expense, ExpenseType } from '../types';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { COLORS } from '../constants';

interface PrintableReportProps {
  salary: number;
  metrics: DashboardMetrics;
  expenses: Expense[];
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ salary, metrics, expenses }) => {
  const data = [
    { name: ExpenseType.NEED, value: metrics.totalNeeds, color: COLORS[ExpenseType.NEED] },
    { name: ExpenseType.WANT, value: metrics.totalWants, color: COLORS[ExpenseType.WANT] },
    { name: 'ادخار واستثمار', value: metrics.totalSavingsCalculated, color: COLORS[ExpenseType.SAVING] },
  ].filter(item => item.value > 0);

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      id="printable-report" 
      className="bg-white p-8 mx-auto"
      style={{ 
        width: '794px', // A4 Width at 96 DPI (Standard for PDF generation)
        minHeight: '1123px', // A4 Height
        direction: 'rtl',
        fontFamily: 'Calibri, sans-serif'
      }}
    >
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-diwani">تقرير قَوَام المالي</h1>
          <p className="text-gray-600">تاريخ التقرير: {today}</p>
        </div>
        <div className="text-left">
           <img src="./logo.png" alt="QAWAM" className="h-16 object-contain grayscale" />
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-r-4 border-gray-800 pr-2">ملخص الدخل والتوزيع</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 p-4 border border-gray-200 rounded">
            <span className="block text-gray-500 text-sm mb-1">صافي الراتب</span>
            <span className="block text-xl font-bold text-gray-900">{salary.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded">
            <span className="block text-gray-500 text-sm mb-1">مجموع المصاريف</span>
            <span className="block text-xl font-bold text-red-700">{metrics.totalExpenses.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded">
            <span className="block text-gray-500 text-sm mb-1">المتبقي</span>
            <span className="block text-xl font-bold text-blue-700">{metrics.remainingSalary.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded">
            <span className="block text-gray-500 text-sm mb-1">نسبة الادخار</span>
            <span className="block text-xl font-bold text-emerald-700">
              {salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section - Fixed Size for Print */}
      <div className="mb-8 flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">التمثيل البياني للمصروفات</h3>
        <div style={{ width: 400, height: 300, direction: 'ltr' }}>
          <PieChart width={400} height={300}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false} // Disable animation for instant capture
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} stroke="#fff" />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-r-4 border-gray-800 pr-2">تفاصيل المصروفات</h2>
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 border border-gray-700">المصرف</th>
              <th className="p-3 border border-gray-700">النوع</th>
              <th className="p-3 border border-gray-700">المبلغ</th>
              <th className="p-3 border border-gray-700">النسبة</th>
              <th className="p-3 border border-gray-700">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, idx) => (
              <tr key={expense.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-300 font-bold">{expense.name}</td>
                <td className="p-2 border border-gray-300">{expense.type}</td>
                <td className="p-2 border border-gray-300">{expense.amount.toLocaleString()}</td>
                <td className="p-2 border border-gray-300">
                  {salary > 0 ? ((expense.amount / salary) * 100).toFixed(1) : 0}%
                </td>
                <td className="p-2 border border-gray-300 text-gray-500">{expense.notes || '-'}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500 border border-gray-300">لا توجد بيانات</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-gray-300 text-center text-xs text-gray-400">
        <p>تم استخراج هذا التقرير آلياً بواسطة تطبيق قَوَام - QAWAM</p>
      </div>
    </div>
  );
};