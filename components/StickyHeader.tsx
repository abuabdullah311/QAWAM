import React from 'react';
import { DashboardMetrics } from '../types';

interface StickyHeaderProps {
  salary: number;
  metrics: DashboardMetrics;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ salary, metrics }) => {
  const savingsPercentage = salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0;

  return (
    <div className="sticky-header bg-white/95 border-b border-gray-200 shadow-sm py-3 px-4 mb-6 backdrop-blur-md">
      <div className="max-w-4xl mx-auto">
        
        {/* Quranic Verse */}
        <div className="text-center mb-3 pb-3 border-b border-slate-100">
           <div className="text-emerald-700 leading-relaxed">
             <span className="font-diwani text-xl md:text-3xl block mb-1">
               ﴿وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا﴾
             </span>
             <span className="text-xs text-emerald-600/80 block">سورة الفرقان - الآية 67</span>
           </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* App Title */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">قَوَام - QAWAM</h1>
            {/* Mobile Salary Display (hidden on desktop to avoid dup) */}
            <div className="md:hidden flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
               <span className="text-gray-500 text-xs font-medium">الراتب:</span>
               <span className="text-sm font-bold text-gray-900">{salary.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Metrics Bar */}
          <div className="flex flex-wrap justify-center md:justify-end gap-3 md:gap-6 text-sm w-full md:w-auto">
            
            {/* Desktop Salary Display */}
            <div className="hidden md:flex items-center gap-2 border-l pl-6 border-gray-300">
               <span className="text-gray-500 font-medium">الراتب:</span>
               <span className="text-xl font-bold text-gray-900">{salary.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-gray-500 text-[10px] md:text-xs">المصروفات</span>
                <span className={`font-bold ${metrics.totalExpenses > salary ? 'text-red-600' : 'text-gray-800'}`}>
                  {metrics.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500 text-[10px] md:text-xs">المتبقي</span>
                <span className={`font-bold ${metrics.remainingSalary < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {metrics.remainingSalary.toLocaleString()}
                </span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500 text-[10px] md:text-xs">نسبة الادخار</span>
                <span className="font-bold text-emerald-600">
                  %{savingsPercentage}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};