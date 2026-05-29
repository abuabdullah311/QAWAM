import React from 'react';
import { DashboardMetrics, Expense, ExpenseType, Language, BudgetRule } from '../types';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { COLORS, TRANSLATIONS, EXPENSE_TYPE_LABELS } from '../constants';
import { ShieldAlert, Heart, PiggyBank } from 'lucide-react';

interface PrintableReportProps {
  salary: number;
  metrics: DashboardMetrics;
  expenses: Expense[];
  lang: Language;
  budgetRule?: BudgetRule;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ 
  salary, 
  metrics, 
  expenses, 
  lang,
  budgetRule = { needs: 50, wants: 30, savings: 20 }
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const sortOrder: Record<ExpenseType, number> = {
    [ExpenseType.NEED]: 1,
    [ExpenseType.WANT]: 2,
    [ExpenseType.SAVING]: 3,
  };
  const sortedExpenses = [...expenses].sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);

  const getTypeBadge = (type: ExpenseType) => {
    const label = EXPENSE_TYPE_LABELS[lang][type];
    switch (type) {
      case ExpenseType.NEED: return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] bg-red-50 text-red-600 font-semibold border border-red-100">
          <ShieldAlert size={10} />
          {label}
        </span>
      );
      case ExpenseType.WANT: return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] bg-orange-50 text-orange-600 font-semibold border border-orange-100">
          <Heart size={10} />
          {label}
        </span>
      );
      case ExpenseType.SAVING: return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
          <PiggyBank size={10} />
          {label}
        </span>
      );
    }
  };

  // Pie Chart Data
  const pieData = [
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.NEED], value: metrics.totalNeeds, color: COLORS[ExpenseType.NEED] },
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.WANT], value: metrics.totalWants, color: COLORS[ExpenseType.WANT] },
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.SAVING], value: metrics.totalSavingsCalculated, color: COLORS[ExpenseType.SAVING] },
  ].filter(item => item.value > 0);

  // Bar Chart Data
  const getPercent = (val: number) => salary > 0 ? parseFloat(((val / salary) * 100).toFixed(1)) : 0;
  const barData = [
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.NEED], actual: getPercent(metrics.totalNeeds), target: budgetRule.needs, color: COLORS[ExpenseType.NEED] },
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.WANT], actual: getPercent(metrics.totalWants), target: budgetRule.wants, color: COLORS[ExpenseType.WANT] },
    { name: EXPENSE_TYPE_LABELS[lang][ExpenseType.SAVING], actual: getPercent(metrics.totalSavingsCalculated), target: budgetRule.savings, color: COLORS[ExpenseType.SAVING] },
  ];

  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
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
        width: '794px', // A4 Width
        minHeight: '1123px', // A4 Height
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: 'Calibri, sans-serif'
      }}
    >
      {/* --- HEADER SECTION --- */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center mb-4 px-1 gap-2">
          <div className="text-xs text-gray-500 w-32">{today}</div>
          <div className="flex-1 text-center mx-2">
             <span className="font-diwani text-emerald-700 text-xl block leading-tight mb-1">
               {isRtl ? '﴿وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا﴾' : 'QAWAM Financial Report'}
             </span>
             {isRtl && (
                <span className="text-gray-400 text-[10px] block mt-0.5 font-sans">
                   سورة الفرقان، الآية 67
                </span>
             )}
          </div>
          <div className="w-32 flex justify-end">
             <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-full">v1.5</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-center w-full">
            <img src="./QAWAM_logo.png" alt="QAWAM" className="h-16 object-contain" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-emerald-500 pb-1 px-4">
              {lang === 'ar' ? 'تقرير مالي شامل' : 'Comprehensive Financial Report'}
          </h2>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-500 mb-3">{t.step3}</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg text-center">
            <span className="block text-gray-500 text-xs mb-1">{t.salaryLabel}</span>
            <span className="block text-xl font-black text-gray-800">{salary.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400">{t.currency}</span>
          </div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg text-center">
            <span className="block text-gray-500 text-xs mb-1">{t.totalExpenses}</span>
            <span className="block text-xl font-black text-gray-700">{metrics.totalExpenses.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400">{t.currency}</span>
          </div>
          <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg text-center">
            <span className="block text-[#007AFF] text-xs mb-1">{t.remaining}</span>
            <span className="block text-xl font-black text-blue-700">{metrics.remainingSalary.toLocaleString()}</span>
            <span className="text-[10px] text-blue-400">{t.currency}</span>
          </div>
          <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-lg text-center">
            <span className="block text-emerald-600 text-xs mb-1">{t.savingsRate}</span>
            <span className="block text-xl font-black text-emerald-700">
              {salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8 bg-gray-50 border border-gray-100 rounded-xl p-6">
        <div className="flex justify-between items-start gap-4">
          
          {/* Pie Chart */}
          <div style={{ width: 330, height: 220, direction: 'ltr' }} className="flex flex-col items-center">
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
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 15;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const pct = ((value/salary)*100).toFixed(0);
                  return (
                    <text x={x} y={y} fill="#4b5563" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={9} fontWeight="bold">
                      {pct}%
                    </text>
                  );
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} stroke="#fff" />
                ))}
              </Pie>
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                formatter={(value, entry: any) => {
                    const val = entry.payload.value;
                    const pct = ((val/salary)*100).toFixed(0);
                    return <span style={{ color: '#333', fontSize: '10px', fontWeight: 'bold' }}>{value} ({pct}%)</span>
                }}
              />
            </PieChart>
          </div>

          <div className="w-px h-40 bg-gray-200 mt-4"></div>

          {/* Bar Chart */}
          <div style={{ width: 330, height: 220, direction: 'ltr' }} className="flex flex-col items-center">
            <BarChart
              width={330}
              height={200}
              data={barData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Calibri' }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(val) => val === 'target' ? t.target : t.actual}
                wrapperStyle={{ fontSize: '10px' }}
              />
              <Bar dataKey="target" fill={COLORS.target} barSize={25} isAnimationActive={false} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="target" position="top" fill="#9ca3af" fontSize={9} formatter={(val: number) => `${val}%`} />
              </Bar>
              <Bar dataKey="actual" barSize={25} isAnimationActive={false} radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="actual" position="top" fill="#4b5563" fontSize={9} fontWeight="bold" formatter={(val: number) => `${val}%`} />
              </Bar>
            </BarChart>
          </div>
        
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mb-8 flex-1">
        <h3 className="text-sm font-bold text-gray-600 mb-3 border-r-4 border-gray-400 pr-2 rtl:border-r-4 rtl:border-l-0 ltr:border-l-4 ltr:border-r-0">
            {t.expensesTitle}
        </h3>
        <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-2 border border-gray-200 text-xs">{t.expenseName}</th>
              <th className="p-2 border border-gray-200 text-xs w-28">{t.expenseType}</th>
              <th className="p-2 border border-gray-200 text-xs w-24">{t.expenseAmount}</th>
              <th className="p-2 border border-gray-200 text-xs w-16">%</th>
              <th className="p-2 border border-gray-200 text-xs">{t.notes}</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense, idx) => (
              <tr key={expense.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-200 font-bold text-gray-800">{expense.name}</td>
                <td className="p-2 border border-gray-200">
                    {getTypeBadge(expense.type)}
                </td>
                <td className="p-2 border border-gray-200 font-mono text-gray-700">{expense.amount.toLocaleString()}</td>
                <td className="p-2 border border-gray-200 text-xs text-gray-500">
                  {salary > 0 ? ((expense.amount / salary) * 100).toFixed(1) : 0}%
                </td>
                <td className="p-2 border border-gray-200 text-gray-400 text-xs">{expense.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200 text-center">
        <p className="text-[10px] text-gray-400 opacity-70">© {new Date().getFullYear()} {t.appTitle}</p>
      </div>
    </div>
  );
};