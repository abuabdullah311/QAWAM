import { ExpenseType } from './types';

export const EXPENSE_TYPES = [
  ExpenseType.NEED,
  ExpenseType.WANT,
  ExpenseType.SAVING,
];

// Mapping for Auto-Categorization
export const EXPENSE_MAPPING: Record<string, ExpenseType> = {
  "قسط السيارة": ExpenseType.NEED,
  "التمويل الشخصي": ExpenseType.NEED,
  "التمويل العقاري": ExpenseType.NEED,
  "مصاريف المنزل اليومية": ExpenseType.NEED,
  "المصروف المدرسي": ExpenseType.NEED,
  "فاتورة الكهرباء": ExpenseType.NEED,
  "فاتورة المياه": ExpenseType.NEED,
  "فاتورة الجوال والإنترنت": ExpenseType.NEED,
  "المواصلات": ExpenseType.NEED,
  "وقود السيارة": ExpenseType.NEED,
  "مصروفات طبية وعلاجية": ExpenseType.NEED,
  "صيانة وإصلاحات المنزل": ExpenseType.NEED,
  
  "غسيل السيارة": ExpenseType.WANT,
  "غسيل المنزل الخارجي": ExpenseType.WANT,
  "هدية الوالدة": ExpenseType.WANT,
  "هدية الزوجة": ExpenseType.WANT,
  "العاملة المنزلية": ExpenseType.WANT,
  "دروس خصوصية": ExpenseType.WANT,
  "مشتريات الأبناء": ExpenseType.WANT,
  "المطاعم والكافيهات": ExpenseType.WANT,
  "مصاريف ترفيه وتسوق": ExpenseType.WANT,
  "الصدقة": ExpenseType.WANT,
  "الاشتراكات الشهرية": ExpenseType.WANT,
  "المصروف الشخصي": ExpenseType.WANT,

  "ادخار عام للطوارئ": ExpenseType.SAVING,
  "الادخار للعيد القادم": ExpenseType.SAVING,
  "ادخار تعليمي للأبناء": ExpenseType.SAVING,
  "الاستثمار": ExpenseType.SAVING
};

export const SUGGESTED_EXPENSES = Object.keys(EXPENSE_MAPPING);

export const COLORS = {
  [ExpenseType.NEED]: '#ef4444', // Red-500
  [ExpenseType.WANT]: '#f59e0b', // Amber-500
  [ExpenseType.SAVING]: '#10b981', // Emerald-500
  background: '#f8fafc',
  text: '#1e293b',
  target: '#94a3b8' // Slate-400 for Target Bars
};

export const GUIDANCE_TEXT = `
1. أدخل صافي راتبك في الحقل المخصص.
2. أضف مصاريفك من القائمة وسيتم تصنيفها تلقائياً (مع إمكانية التعديل).
3. مفاهيم التصنيف:
   • احتياج: مصروف لا يمكن الاستغناء عنه.
   • رغبة: مصروف يمكن تأجيله أو تقليله.
   • ادخار واستثمار: مبلغ للأمان المالي أو لتنمية المال.
4. راقب المؤشرات الرسومية لمقارنة وضعك الحالي مع الوضع المثالي (50/30/20).
`;