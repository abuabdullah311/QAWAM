import React from 'react';
import { DashboardMetrics, Expense, ExpenseType } from '../types';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { COLORS } from '../constants';

interface PrintableReportProps {
  salary: number;
  metrics: DashboardMetrics;
  expenses: Expense[];
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ salary, metrics, expenses }) => {
  // Pie Chart Data
  const pieData = [
    { name: ExpenseType.NEED, value: metrics.totalNeeds, color: COLORS[ExpenseType.NEED] },
    { name: ExpenseType.WANT, value: metrics.totalWants, color: COLORS[ExpenseType.WANT] },
    { name: 'ادخار واستثمار', value: metrics.totalSavingsCalculated, color: COLORS[ExpenseType.SAVING] },
  ].filter(item => item.value > 0);

  // Bar Chart Data
  const getPercent = (val: number) => salary > 0 ? parseFloat(((val / salary) * 100).toFixed(1)) : 0;
  const barData = [
    { name: 'احتياج', actual: getPercent(metrics.totalNeeds), target: 50, color: COLORS[ExpenseType.NEED] },
    { name: 'رغبة', actual: getPercent(metrics.totalWants), target: 30, color: COLORS[ExpenseType.WANT] },
    { name: 'ادخار', actual: getPercent(metrics.totalSavingsCalculated), target: 20, color: COLORS[ExpenseType.SAVING] },
  ];

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      id="printable-report" 
      className="bg-white p-8 mx-auto flex flex-col"
      style={{ 
        width: '794px', // A4 Width at 96 DPI
        minHeight: '1123px', // A4 Height
        direction: 'rtl',
        fontFamily: 'Calibri, sans-serif'
      }}
    >
      {/* --- HEADER SECTION --- */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        
        {/* Top Row: Date | Verse | Version */}
        <div className="flex justify-between items-center mb-4 px-1 gap-2">
          
          {/* Date */}
          <div className="text-xs text-gray-500 w-32">
            {today}
          </div>

          {/* Verse (Center) */}
          <div className="flex-1 text-center mx-2">
             <span className="font-diwani text-emerald-700 text-xl block leading-tight mb-1">
               ﴿وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا﴾
             </span>
             <span className="font-sans text-xs text-emerald-600 opacity-80">[الفرقان: 67]</span>
          </div>

          {/* Version (Right - No Reset Button) */}
          <div className="w-32 flex justify-end">
             <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-full">v1.3</span>
          </div>
        </div>

        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-center w-full">
            <img 
              src="./QAWAM_logo.png" 
              alt="QAWAM" 
              className="h-16 object-contain"
            />
          </div>
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-emerald-500 pb-1 px-4">تقرير مالي شامل</h2>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}

      {/* Summary Cards */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-500 mb-3">ملخص الدخل والتوزيع</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg text-center">
            <span className="block text-gray-500 text-xs mb-1">صافي الراتب</span>
            <span className="block text-xl font-black text-gray-800">{salary.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400">ريال</span>
          </div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg text-center">
            <span className="block text-gray-500 text-xs mb-1">إجمالي المصروفات</span>
            <span className="block text-xl font-black text-gray-700">{metrics.totalExpenses.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400">ريال</span>
          </div>
          <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg text-center">
            <span className="block text-blue-600 text-xs mb-1">المتبقي (حر)</span>
            <span className="block text-xl font-black text-blue-700">{metrics.remainingSalary.toLocaleString()}</span>
            <span className="text-[10px] text-blue-400">ريال</span>
          </div>
          <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-lg text-center">
            <span className="block text-emerald-600 text-xs mb-1">معدل الادخار</span>
            <span className="block text-xl font-black text-emerald-700">
              {salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0}%
            </span>
            <span className="text-[10px] text-emerald-400">من الدخل</span>
          </div>
        </div>
      </div>

      {/* Charts Section (Side by Side) */}
      <div className="mb-8 bg-gray-50 border border-gray-100 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-600 mb-4 border-r-4 border-emerald-400 pr-2">التحليل البياني</h3>
        
        <div className="flex justify-between items-start gap-4">
          
          {/* Pie Chart */}
          <div style={{ width: 330, height: 220, direction: 'ltr' }} className="flex flex-col items-center">
            <h4 className="text-xs font-bold text-gray-500 mb-2">توزيع المصروفات</h4>
            <PieChart width={330} height={200}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} stroke="#fff" />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </div>

          {/* Vertical Separator */}
          <div className="w-px h-40 bg-gray-200 mt-4"></div>

          {/* Bar Chart */}
          <div style={{ width: 330, height: 220, direction: 'ltr' }} className="flex flex-col items-center">
            <h4 className="text-xs font-bold text-gray-500 mb-2">مقارنة المستهدف (رمادي) بالفعلي</h4>
            <BarChart
              width={330}
              height={200}
              data={barData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Calibri' }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Bar dataKey="target" fill={COLORS.target} barSize={25} isAnimationActive={false} radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" barSize={25} isAnimationActive={false} radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </div>
        
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mb-8 flex-1">
        <h3 className="text-sm font-bold text-gray-600 mb-3 border-r-4 border-gray-400 pr-2">تفاصيل البنود</h3>
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-2 border border-gray-200 text-xs">المصروف</th>
              <th className="p-2 border border-gray-200 text-xs w-24">النوع</th>
              <th className="p-2 border border-gray-200 text-xs w-24">المبلغ</th>
              <th className="p-2 border border-gray-200 text-xs w-16">النسبة</th>
              <th className="p-2 border border-gray-200 text-xs">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, idx) => (
              <tr key={expense.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-200 font-bold text-gray-800">{expense.name}</td>
                <td className="p-2 border border-gray-200 text-gray-600 text-xs">{expense.type}</td>
                <td className="p-2 border border-gray-200 font-mono text-gray-700">{expense.amount.toLocaleString()}</td>
                <td className="p-2 border border-gray-200 text-xs text-gray-500">
                  {salary > 0 ? ((expense.amount / salary) * 100).toFixed(1) : 0}%
                </td>
                <td className="p-2 border border-gray-200 text-gray-400 text-xs">{expense.notes || '-'}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500 border border-gray-200">لا توجد بيانات</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER SECTION --- */}
      <div className="mt-auto pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400 mb-2">تم التطوير بواسطة</p>
        <div className="flex justify-center mb-2">
           <img src="./ashareef_logo.png" alt="Developer Logo" className="h-12 object-contain opacity-80" />
        </div>
        <p className="text-[10px] text-gray-400 opacity-70">© {new Date().getFullYear()} قوام. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
};