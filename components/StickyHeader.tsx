import React from 'react';
import { DashboardMetrics } from '../types';
import { RotateCcw } from 'lucide-react';

interface StickyHeaderProps {
  salary: number;
  metrics: DashboardMetrics;
  onReset: () => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ salary, metrics, onReset }) => {
  const savingsPercentage = salary > 0 ? Math.round((metrics.totalSavingsCalculated / salary) * 100) : 0;
  
  // Date Formatting
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="sticky-header bg-white/95 border-b border-gray-200 shadow-sm py-2 px-4 mb-6 backdrop-blur-md transition-all duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Row: Date | Ayah | Version & Reset */}
        <div className="flex justify-between items-center mb-2 px-1 gap-2">
          
          {/* Left: Date */}
          <div className="text-[10px] text-gray-400 min-w-[80px]">
            <span className="hidden sm:inline">{today}</span>
            <span className="sm:hidden">{new Date().toLocaleDateString('ar-SA')}</span>
          </div>

          {/* Center: Ayah (Always Visible) */}
          <div className="flex-1 text-center">
             <span className="font-diwani text-emerald-700 text-sm md:text-lg block leading-tight">
               ﴿وَالَّذِينَ إِذَا أَنفَقُوا لَمْ يُسْرِفُوا وَلَمْ يَقْتُرُوا وَكَانَ بَيْنَ ذَٰلِكَ قَوَامًا﴾
               <span className="font-sans text-[10px] md:text-xs text-emerald-600 mr-2 opacity-80">[الفرقان: 67]</span>
             </span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center justify-end gap-3 min-w-[80px]">
             <button 
               onClick={onReset}
               className="flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-all group"
               title="حذف البيانات والبدء من جديد"
               data-html2canvas-ignore
             >
               <RotateCcw size={12} className="group-hover:-rotate-180 transition-transform duration-500" />
               <span className="text-[10px] hidden sm:inline">إعادة تعيين</span>
             </button>
             <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 rounded-full">v1.2</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          
          {/* App Logo - Centered */}
          <div className="flex justify-center w-full">
            <img 
              src="./QAWAM_logo.png" 
              alt="QAWAM" 
              className="h-10 md:h-12 object-contain"
            />
          </div>
          
          {/* Metrics Bar - Only show if Salary is entered */}
          {salary > 0 && (
            <div className="flex justify-center w-full animate-[fadeIn_0.5s_ease-out]">
              <div className="flex flex-wrap justify-center items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm">
                
                {/* Remaining - Highlighted */}
                <div className="flex flex-col items-center px-2">
                  <span className="text-blue-600 text-[10px] font-bold mb-0.5">المتبقي</span>
                  <span className={`text-xl md:text-2xl font-black ${metrics.remainingSalary < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                    {metrics.remainingSalary.toLocaleString()}
                  </span>
                </div>

                <div className="w-px h-8 bg-gray-300"></div>

                {/* Expenses */}
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-[10px]">المصروفات</span>
                  <span className={`font-bold text-sm ${metrics.totalExpenses > salary ? 'text-red-600' : 'text-gray-700'}`}>
                    {metrics.totalExpenses.toLocaleString()}
                  </span>
                </div>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                {/* Savings Rate */}
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-[10px]">الادخار</span>
                  <span className="font-bold text-sm text-emerald-600">
                    %{savingsPercentage}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};