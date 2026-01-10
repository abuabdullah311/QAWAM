import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, X, Wallet, Info, Plus, Save } from 'lucide-react';
import { EXPENSE_DEFINITIONS, TRANSLATIONS, EXPENSE_MAPPING, EXPENSE_MAPPING_EN } from '../constants';
import { Expense, ExpenseType, Language } from '../types';

interface ExpenseWizardProps {
  onComplete: (expenses: Omit<Expense, 'id'>[]) => void;
  lang: Language;
  salary: number;
}

export const ExpenseWizard: React.FC<ExpenseWizardProps> = ({ onComplete, lang, salary }) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  
  // Convert definitions to array
  const checklistItems = Object.entries(EXPENSE_DEFINITIONS);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collectedExpenses, setCollectedExpenses] = useState<Omit<Expense, 'id'>[]>([]);
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Custom Expense State
  const [isCustomPhase, setIsCustomPhase] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  const currentItem = checklistItems[currentIndex];
  // Progress calculation: If in custom phase, show 100%
  const progress = isCustomPhase 
    ? 100 
    : ((currentIndex) / checklistItems.length) * 100;

  const handleNext = (hasExpense: boolean) => {
    if (hasExpense) {
      setShowInput(true);
    } else {
      advanceSlide();
    }
  };

  const confirmAmount = () => {
    if (!currentAmount || parseFloat(currentAmount) <= 0) return;
    
    const amount = parseFloat(currentAmount);
    
    if (isCustomPhase && isAddingCustom) {
        // Saving a custom expense
        const newExpense = {
            name: customName,
            amount: amount,
            type: ExpenseType.WANT, // Default for manual, Advisor will refine
            notes: 'Manual Wizard Entry (Custom)'
        };
        setCollectedExpenses(prev => [...prev, newExpense]);
        // Reset custom form to allow adding another or finishing
        setCustomName('');
        setCurrentAmount('');
        setIsAddingCustom(false);
    } else {
        // Saving a predefined expense
        const name = currentItem[0];
        // Auto categorize
        let type = ExpenseType.NEED;
        if (lang === 'ar' && EXPENSE_MAPPING[name]) type = EXPENSE_MAPPING[name];
        else if (lang === 'en' && EXPENSE_MAPPING_EN[name]) type = EXPENSE_MAPPING_EN[name];

        const newExpense = {
            name: name,
            amount: amount,
            type: type,
            notes: 'Manual Wizard Entry'
        };

        setCollectedExpenses(prev => [...prev, newExpense]);
        advanceSlide();
    }
  };

  const advanceSlide = () => {
    setIsAnimating(true);
    setTimeout(() => {
      if (currentIndex < checklistItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentAmount('');
        setShowInput(false);
      } else {
        // Finished checklist, move to custom phase
        setIsCustomPhase(true);
        setCurrentAmount('');
        setShowInput(false);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleSkipAll = () => {
      onComplete(collectedExpenses);
  };

  // --- RENDER HELPERS ---

  const renderChecklistPhase = () => (
    <>
        {/* Question Section */}
        <div className="text-center mt-2">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 leading-relaxed">
            {lang === 'ar' ? 'هل لديك التزام شهري متعلق بـ:' : 'Do you have a monthly obligation for:'}
            <span className="text-blue-600 block mt-1">{currentItem[0]}</span>
          </h3>
          
          <div className="text-gray-500 bg-gray-50 p-6 rounded-xl mb-6 mx-auto max-w-lg border border-gray-100">
             <div className="flex items-center justify-center gap-2 text-lg md:text-xl font-medium text-gray-700 leading-relaxed">
                <Info size={20} className="shrink-0 text-blue-500" />
                <span>{currentItem[1]}</span>
             </div>
             <p className="text-xs text-gray-400 mt-4 border-t border-gray-200 pt-3">
               {lang === 'ar' 
                ? "المقصود هو المبالغ التي يتم دفعها بشكل شهري ومنتظم من صافي الراتب الشهري." 
                : "We mean amounts paid monthly and regularly from your net monthly salary."}
             </p>
          </div>

          {!showInput ? (
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                onClick={() => handleNext(false)}
                className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-gray-100 hover:border-red-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold transition-all"
              >
                <X size={20} />
                {lang === 'ar' ? 'لا' : 'No'}
              </button>
              <button
                onClick={() => handleNext(true)}
                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
              >
                <Check size={20} />
                {lang === 'ar' ? 'نعم' : 'Yes'}
              </button>
            </div>
          ) : (
            <div className="max-w-xs mx-auto animate-fade-in">
              <label className="block text-start text-xs font-bold text-gray-500 mb-2">
                {lang === 'ar' ? 'أدخل المبلغ الشهري' : 'Enter monthly amount'}
              </label>
              <div className="relative mb-4">
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAmount()}
                  autoFocus
                  placeholder="0"
                  className="w-full text-2xl font-bold border-2 border-blue-100 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-center"
                />
                <span className={`absolute top-4 text-gray-400 font-bold ${isRtl ? 'left-4' : 'right-4'}`}>{t.currency}</span>
              </div>
              <button
                onClick={confirmAmount}
                disabled={!currentAmount}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  currentAmount 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {lang === 'ar' ? 'تأكيد ومتابعة' : 'Confirm & Next'}
                {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>
               <button
                onClick={() => setShowInput(false)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
            </div>
          )}
        </div>
    </>
  );

  const renderCustomPhase = () => (
      <div className="text-center mt-4">
         
         {!isAddingCustom ? (
            <>
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Plus size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {lang === 'ar' ? 'هل لديك مصروفات شهرية أخرى؟' : 'Do you have other monthly expenses?'}
                </h3>
                <div className="text-gray-500 bg-gray-50 p-4 rounded-xl text-sm mb-8 mx-auto max-w-md border border-gray-100">
                    <p>{lang === 'ar' ? 'إذا كان لديك أي مصروف شهري غير مذكور في القائمة، يمكنك إضافته يدوياً.' : 'If you have any unlisted monthly expense, you can add it manually.'}</p>
                    <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-200">
                        {lang === 'ar' ? 'يمكنك إضافة أكثر من مصروف، وستتمكن من تعديلها لاحقاً.' : 'You can add multiple expenses and edit them later.'}
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <button
                        onClick={() => setIsAddingCustom(true)}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        {lang === 'ar' ? 'إضافة مصروف آخر' : 'Add another expense'}
                    </button>
                    <button
                        onClick={handleSkipAll}
                        className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                    >
                        {lang === 'ar' ? 'لا، إنهاء القائمة' : 'No, Finish List'}
                    </button>
                </div>
            </>
         ) : (
            <div className="max-w-xs mx-auto animate-fade-in">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{lang === 'ar' ? 'إضافة مصروف جديد' : 'Add New Expense'}</h3>
                
                <div className="space-y-4">
                    <div className="text-start">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                            {lang === 'ar' ? 'اسم المصروف' : 'Expense Name'}
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثلاً: جيم، نتفليكس...' : 'e.g. Gym, Netflix...'}
                            autoFocus
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="text-start">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                            {lang === 'ar' ? 'المبلغ الشهري' : 'Monthly Amount'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={currentAmount}
                                onChange={(e) => setCurrentAmount(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 outline-none transition-all text-center font-bold text-lg"
                                onKeyDown={(e) => e.key === 'Enter' && confirmAmount()}
                            />
                             <span className={`absolute top-4 text-gray-400 font-bold ${isRtl ? 'left-4' : 'right-4'}`}>{t.currency}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                         <button
                            onClick={() => setIsAddingCustom(false)}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={confirmAmount}
                            disabled={!currentAmount || !customName}
                            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                                (!currentAmount || !customName)
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                            }`}
                        >
                            {t.save}
                        </button>
                    </div>
                </div>
            </div>
         )}
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-2xl mx-auto animate-fade-in px-4">
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={`bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 w-full relative transition-all duration-300 transform ${isAnimating ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
        
        {/* Item Count Badge (Only in checklist phase) */}
        {!isCustomPhase && (
            <div className="absolute top-6 left-6 text-xs font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded-full">
            {currentIndex + 1} / {checklistItems.length}
            </div>
        )}

        {isCustomPhase ? renderCustomPhase() : renderChecklistPhase()}

      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400 font-medium">
         {lang === 'ar' ? `الراتب: ${salary.toLocaleString()}` : `Salary: ${salary.toLocaleString()}`}
      </div>
    </div>
  );
};