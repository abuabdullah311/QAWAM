import React from 'react';
import { DashboardMetrics, ExpenseType, Language, BudgetRule } from '../types';
import { COLORS, EXPENSE_TYPE_LABELS } from '../constants';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface TargetVsActualChartProps {
  salary: number;
  metrics: DashboardMetrics;
  lang: Language;
  budgetRule: BudgetRule;
}

export const TargetVsActualChart: React.FC<TargetVsActualChartProps> = ({ 
  salary, 
  metrics, 
  lang,
  budgetRule
}) => {
  if (salary <= 0) return null;

  const getPercent = (val: number) => parseFloat(((val / salary) * 100).toFixed(1));

  const items = [
    {
      type: 'needs',
      name: lang === 'ar' ? 'الاحتياجات' : 'Needs',
      actual: getPercent(metrics.totalNeeds),
      target: budgetRule.needs,
      colorClass: 'bg-red-50 text-red-800 border-red-100',
      barBg: 'bg-white',
      barFill: 'bg-red-700',
      iconColor: 'text-red-600',
    },
    {
      type: 'wants',
      name: lang === 'ar' ? 'الرغبات' : 'Wants',
      actual: getPercent(metrics.totalWants),
      target: budgetRule.wants,
      colorClass: 'bg-amber-50 text-amber-800 border-amber-100',
      barBg: 'bg-white',
      barFill: 'bg-amber-700',
      iconColor: 'text-amber-600',
    },
    {
      type: 'savings',
      name: lang === 'ar' ? 'الادخار' : 'Savings',
      actual: getPercent(metrics.totalSavingsCalculated),
      target: budgetRule.savings,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-100',
      barBg: 'bg-white',
      barFill: 'bg-emerald-700',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full mt-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {items.map((item, idx) => {
        // Here, the "Target" is the 100% of the bar width
        const fillWidth = Math.min((item.actual / item.target) * 100, 100);
        
        // Logic for messages
        let isExceeded = false;
        let isUnder = false;
        let icon = null;
        let message = '';
        
        if (item.type === 'needs' || item.type === 'wants') {
            isExceeded = item.actual > item.target;
            if (isExceeded) {
                icon = <AlertTriangle size={14} className={item.iconColor} />;
                message = lang === 'ar' ? 'تجاوز النسبة المحددة' : 'Limit Exceeded';
            } else {
                icon = <CheckCircle2 size={14} className={item.iconColor} />;
                message = lang === 'ar' ? 'ضمن النطاق المثالي' : 'Within Ideal Range';
            }
        } else if (item.type === 'savings') {
            isUnder = item.actual < item.target;
            if (isUnder) {
                icon = <AlertCircle size={14} className={item.iconColor} />;
                message = lang === 'ar' ? 'لم تخصص المبلغ المستهدف من الادخار والاستثمار' : 'You did not allocate the target savings';
            } else {
                icon = <Sparkles size={14} className={item.iconColor} />;
                message = lang === 'ar' ? 'ممتاز، أنت تسير على الطريق الصحيح للحرية المالية' : 'Great, you are on the right path to financial freedom';
            }
        }

        return (
          <div key={idx} className={`p-4 rounded-[16px] border ${item.colorClass} flex flex-col gap-3 relative`}>
             <div className="flex justify-between items-center">
                <span className="bg-white/80 font-bold px-2 py-1 rounded-[6px] text-[13px] shadow-sm">
                   {item.actual}%
                </span>
                <span className="font-bold text-[14px]">
                   {item.name} ({lang === 'ar' ? 'الهدف' : 'Target'} {item.target}%)
                </span>
             </div>
             
             <div className={`w-full h-3 rounded-full ${item.barBg} overflow-hidden shadow-inner`}>
                <div 
                   className={`h-full ${item.barFill} transition-all duration-1000 ease-out`}
                   style={{ 
                     width: `${fillWidth}%`, 
                     ...(lang === 'ar' ? { marginLeft: 'auto', marginRight: 0 } : { marginRight: 'auto', marginLeft: 0 })
                   }}
                >
                </div>
             </div>
             
             <div className="flex justify-start items-center gap-1.5 mt-1">
                 {icon}
                 <span className={`text-[12px] font-semibold ${item.iconColor}`}>{message}</span>
             </div>
          </div>
        );
      })}
    </div>
  );
};
