import { ExpenseType } from './types';

export const EXPENSE_TYPES = [
  ExpenseType.NEED,
  ExpenseType.WANT,
  ExpenseType.SAVING,
];

// Translations for Expense Types (Key is the Enum value which is Arabic)
export const EXPENSE_TYPE_LABELS = {
  ar: {
    [ExpenseType.NEED]: 'احتياج',
    [ExpenseType.WANT]: 'رغبة',
    [ExpenseType.SAVING]: 'ادخار واستثمار'
  },
  en: {
    [ExpenseType.NEED]: 'Needs',
    [ExpenseType.WANT]: 'Wants',
    [ExpenseType.SAVING]: 'Savings & Investment'
  }
};

export const EXPENSE_DEFINITIONS = {
  "التمويل العقاري": "القسط الشهري لسداد قرض شراء أو بناء مسكن.",
  "التمويل الشخصي": "القسط الشهري لسداد قرض شخصي تم الحصول عليه سابقا.",
  "قسط السيارة": "الدفعة الشهرية المستحقة لتمويل شراء سيارة.",
  "مصاريف المنزل اليومية": "الإنفاق الشهري المخصص للاحتياجات اليومية للمنزل مثل السوبرماركت والمنظفات.",
  "المصروف المدرسي": "التكاليف الشهرية لإجمالي المبالغ اليوميه التي يتم إعطاؤها للأبناء خلال يومهم الدراسي.",
  "فاتورة الكهرباء": "المبلغ الشهري المستحق مقابل استهلاك الكهرباء.",
  "فاتورة المياه": "المبلغ الشهري المستحق مقابل استهلاك المياه.",
  "فاتورة الجوال والإنترنت": "التكلفة الشهرية لخدمات الهاتف المحمول والإنترنت المنزلي أو الشخصي.",
  "المواصلات": "الإنفاق الشهري على وسائل التنقل غير الوقود مثل التاكسي أو النقل العام.",
  "وقود السيارة": "التكلفة الشهرية للوقود المستخدم للسيارة.",
  "مصروفات طبية وعلاجية": "متوسط الإنفاق الشهري على العلاج، الأدوية، أو الزيارات الطبية.",
  "صيانة وإصلاحات المنزل": "التكاليف الشهرية المخصصة للصيانة الدورية أو إصلاحات المنزل الطارئة.",
  
  "العاملة المنزلية": "المبلغ الشهري المدفوع مقابل خدمات عاملة أو خادمة منزلية بشكل منتظم.",
  "دروس خصوصية": "التكاليف الشهرية للدروس التعليمية المدفوعة خارج المدرسة للأبناء أو للبالغين.",
  "مشتريات الأبناء": "المصاريف الشهرية المرتبطة باحتياجات الأبناء غير الدراسية مثل الملابس، الألعاب، والأنشطة.",
  "المطاعم والكافيهات": "المبالغ الشهرية المصروفة على الأكل والشرب خارج المنزل.",
  "مصاريف ترفيه وتسوق": "الإنفاق الشهري على التسوق والترفيه مثل التسوق في المولات، الهوايات، والرحلات القصيرة.",
  "الصدقة": "المبالغ الشهرية التي يتم تخصيصها للتبرع بشكل منتظم لأغراض خيرية أو دينية.",
  "الاشتراكات الشهرية": "اجمالي تكلفة الاشتراكات الشهرية مثل منصات البحث عن وظائف، النوادي، التطبيقات، أو الخدمات المدفوعة.",
  "المصروف الشخصي": "المبلغ الشهري الذي يستخدمه المستخدم نفسه لنفقاته الشخصية غير المصنفة.",
  "غسيل السيارة": "المبالغ المصروفة شهريا على تنظيف السيارة.",
  "غسيل المنزل الخارجي": "التكلفة الشهرية لتنظيف الواجهات أو المساحات الخارجية للمنزل.",
  "هدية الوالدة": "المبلغ الشهري المخصص للوالدة.",
  "هدية الزوجة": "المبلغ الشهري المخصص للزوجة.",

  "ادخار عام للطوارئ": "مبلغ شهري يتم تخصيصه لمواجهة الحالات الطارئة والغير متوقعة.",
  "الادخار للعيد القادم": "مبلغ شهري يتم ادخاره لتغطية تكاليف العيد القادم.",
  "ادخار تعليمي للأبناء": "مبلغ شهري مخصص لادخار إجمالي الرسوم الدراسية السنوية للأبناء.",
  "الاستثمار": "مبالغ يتم تخصيصها شهريا للاستثمار في أصول أو أدوات مالية بهدف النمو."
};

// Mapping for Auto-Categorization (Arabic)
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

// Mapping for Auto-Categorization (English)
export const EXPENSE_MAPPING_EN: Record<string, ExpenseType> = {
  "Car Loan": ExpenseType.NEED,
  "Personal Loan": ExpenseType.NEED,
  "Mortgage / Rent": ExpenseType.NEED,
  "Groceries": ExpenseType.NEED,
  "School Fees": ExpenseType.NEED,
  "Electricity Bill": ExpenseType.NEED,
  "Water Bill": ExpenseType.NEED,
  "Phone & Internet": ExpenseType.NEED,
  "Transportation": ExpenseType.NEED,
  "Fuel": ExpenseType.NEED,
  "Medical Expenses": ExpenseType.NEED,
  "Home Maintenance": ExpenseType.NEED,
  
  "Car Wash": ExpenseType.WANT,
  "Home Services": ExpenseType.WANT,
  "Gifts": ExpenseType.WANT,
  "Housemaid": ExpenseType.WANT,
  "Private Tutor": ExpenseType.WANT,
  "Kids Shopping": ExpenseType.WANT,
  "Restaurants & Cafes": ExpenseType.WANT,
  "Entertainment & Shopping": ExpenseType.WANT,
  "Charity": ExpenseType.WANT,
  "Subscriptions (Netflix, Gym)": ExpenseType.WANT,
  "Personal Allowance": ExpenseType.WANT,

  "Emergency Fund": ExpenseType.SAVING,
  "Holiday Savings": ExpenseType.SAVING,
  "Kids Education Fund": ExpenseType.SAVING,
  "Investments (Stocks, Crypto)": ExpenseType.SAVING
};

export const SUGGESTED_EXPENSES = Object.keys(EXPENSE_MAPPING);
export const SUGGESTED_EXPENSES_EN = Object.keys(EXPENSE_MAPPING_EN);

export const COLORS = {
  [ExpenseType.NEED]: '#ef4444', // Red-500
  [ExpenseType.WANT]: '#f59e0b', // Amber-500
  [ExpenseType.SAVING]: '#10b981', // Emerald-500
  background: '#f8fafc',
  text: '#1e293b',
  target: '#94a3b8' // Slate-400 for Target Bars
};

export const GUIDANCE_TEXT_AR = `
1. أدخل صافي راتبك في الحقل المخصص.
2. أضف مصاريفك من القائمة وسيتم تصنيفها تلقائياً (مع إمكانية التعديل).
3. مفاهيم التصنيف:
   • احتياج: مصروف لا يمكن الاستغناء عنه.
   • رغبة: مصروف يمكن تأجيله أو تقليله.
   • ادخار واستثمار: مبلغ للأمان المالي أو لتنمية المال.
4. راقب المؤشرات الرسومية لمقارنة وضعك الحالي مع الوضع المثالي (50/30/20).
`;

export const GUIDANCE_TEXT_EN = `
1. Enter your net salary.
2. Add your expenses from the list or manually.
3. Classification Concepts:
   • Need: Essential expenses.
   • Want: Expenses that can be deferred or reduced.
   • Savings: Money for security or investment.
4. Monitor charts to compare your status with the ideal 50/30/20 rule.
`;

export const TRANSLATIONS = {
  ar: {
    appTitle: "قَوَام",
    step1: "الراتب",
    stepWizard: "قائمة المصاريف",
    advisorStep: "تحليل المستشار",
    step2: "المصاريف",
    step3: "النتائج",
    salaryLabel: "صافي الراتب الشهري",
    currency: "ريال",
    salaryPlaceholder: "0",
    salaryHint: "المقصود هو الراتب الشهري الصافي الذي يتم إيداعه في الحساب البنكي شهرياً.",
    next: "التالي",
    back: "السابق",
    finish: "عرض النتائج",
    skipToExpenses: "تخطي للإدخال اليدوي",
    addExpense: "إضافة مصروف جديد",
    expensesTitle: "قائمة المصروفات",
    noExpenses: "لم يتم إضافة مصروفات بعد.",
    edit: "تعديل",
    delete: "حذف",
    expenseName: "اسم المصروف",
    expenseAmount: "المبلغ",
    expenseType: "النوع",
    notes: "ملاحظات",
    save: "حفظ",
    cancel: "إلغاء",
    reset: "بدء جديد",
    exportPDF: "حفظ التقرير PDF",
    exporting: "جاري التصدير...",
    needs: "الاحتياجات",
    wants: "الرغبات",
    savings: "الادخار",
    remaining: "المتبقي",
    totalExpenses: "المصروفات",
    savingsRate: "معدل الادخار",
    visitors: "مستفيد",
    guidanceTitle: "إرشادات سريعة",
    guidanceText: GUIDANCE_TEXT_AR,
    adviceTitle: "توصية الخبير",
    errorSalaryExceeded: "عفواً، إضافة هذا المبلغ ستتجاوز الراتب.",
    balancedMessage: "أحسنت! توزيعك المالي متوازن.",
    target: "الهدف",
    actual: "الفعلي",
    belowTarget: "أقل من الهدف بـ",
    aboveTarget: "أعلى من الهدف بـ",
    idealRange: "ضمن النطاق المثالي",
    developedBy: "تم التطوير بواسطة",
    chatPlaceholder: "اسأل المستشار عن خطتك المالية...",
    chatWelcome: "مرحباً! لقد قمت بتحليل مصاريفك التي أدخلتها. إليك التقرير المبدئي."
  },
  en: {
    appTitle: "QAWAM",
    step1: "Salary",
    stepWizard: "Expenses Checklist",
    advisorStep: "Advisor Analysis",
    step2: "Expenses",
    step3: "Dashboard",
    salaryLabel: "Net Monthly Salary",
    currency: "SAR",
    salaryPlaceholder: "0",
    salaryHint: "The net monthly salary deposited into your bank account.",
    next: "Next",
    back: "Back",
    finish: "View Results",
    skipToExpenses: "Skip to Manual Entry",
    addExpense: "Add New Expense",
    expensesTitle: "Expenses List",
    noExpenses: "No expenses added yet.",
    edit: "Edit",
    delete: "Delete",
    expenseName: "Expense Name",
    expenseAmount: "Amount",
    expenseType: "Type",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    reset: "Reset",
    exportPDF: "Save as PDF",
    exporting: "Exporting...",
    needs: "Needs",
    wants: "Wants",
    savings: "Savings",
    remaining: "Remaining",
    totalExpenses: "Total Expenses",
    savingsRate: "Savings Rate",
    visitors: "Users",
    guidanceTitle: "Quick Guide",
    guidanceText: GUIDANCE_TEXT_EN,
    adviceTitle: "Expert Advice",
    errorSalaryExceeded: "Sorry, adding this amount exceeds your salary.",
    balancedMessage: "Great! Your financial distribution is balanced.",
    target: "Target",
    actual: "Actual",
    belowTarget: "Below target by",
    aboveTarget: "Above target by",
    idealRange: "Within ideal range",
    developedBy: "Developed by",
    chatPlaceholder: "Ask the advisor about your plan...",
    chatWelcome: "Hello! I've analyzed your submitted expenses. Here is the initial report."
  }
};