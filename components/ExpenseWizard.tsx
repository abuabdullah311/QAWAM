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
        <div className="text-center mt-0 sm:mt-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 transform transition-transform hover:scale-105">
            <Wallet size={36} strokeWidth={1.5} className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 tracking-tight">
            {lang === 'ar' ? 'هل لديك إلتزام شهري لـ:' : 'Do you have a monthly obligation for:'}
            <span className="text-[#007AFF] block mt-1 sm:mt-2 font-black text-2xl sm:text-4xl">{currentItem[0]}</span>
          </h3>
          
          <div className="text-slate-500 bg-slate-50/80 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] mb-6 sm:mb-8 mx-auto max-w-lg border border-slate-100 shadow-sm mt-4 sm:mt-6">
             <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
                <Info size={20} className="shrink-0 text-blue-500 opacity-80 sm:w-6 sm:h-6" strokeWidth={1.5} />
                <span>{currentItem[1]}</span>
             </div>
             <p className="text-[11px] sm:text-xs text-slate-400 mt-4 sm:mt-5 border-t border-slate-200/50 pt-3 sm:pt-4 font-medium">
               {lang === 'ar' 
                ? "المقصود هو المبالغ التي يتم دفعها بشكل شهري ومنتظم." 
                : "We mean amounts paid monthly and regularly."}
             </p>
          </div>

          {!showInput ? (
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                onClick={() => handleNext(false)}
                className="flex items-center justify-center gap-2 py-4.5 rounded-[16px] bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 font-semibold transition-all active:scale-95 shadow-sm text-[16px]"
              >
                <X size={20} strokeWidth={1.5} />
                {lang === 'ar' ? 'لا' : 'No'}
              </button>
              <button
                onClick={() => handleNext(true)}
                className="flex items-center justify-center gap-2 py-4.5 rounded-[16px] bg-[#1c1c1e] hover:bg-black text-white font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all active:scale-95 text-[16px]"
              >
                <Check size={20} strokeWidth={1.5} />
                {lang === 'ar' ? 'نعم' : 'Yes'}
              </button>
            </div>
          ) : (
            <div className="max-w-sm mx-auto animate-fade-in space-y-4">
              <label className="block text-center text-[13px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                {lang === 'ar' ? 'أدخل المبلغ الشهري' : 'Enter monthly amount'}
              </label>
              <div className="relative mb-5 bg-white/50 backdrop-blur-md rounded-[24px] p-6 border border-slate-200/60 shadow-sm transition-colors focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/10 focus-within:bg-white group">
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentAmount}
                  onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setCurrentAmount(val);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAmount()}
                  autoFocus
                  dir="ltr"
                  placeholder="0"
                  className="w-full text-[48px] font-bold bg-transparent outline-none transition-all placeholder-slate-300 text-center tracking-tighter text-slate-900 tabular-nums"
                />
                <span className="absolute bottom-[36px] text-slate-400 font-bold text-lg pointer-events-none end-6">{t.currency}</span>
              </div>
              <button
                onClick={confirmAmount}
                disabled={!currentAmount}
                className={`w-full py-4.5 rounded-[16px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-[16px] ${
                  currentAmount 
                  ? 'bg-[#007AFF] text-white shadow-[0_2px_12px_rgba(0,122,255,0.3)] hover:bg-[#0062cc]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
                }`}
              >
                {lang === 'ar' ? 'تأكيد ومتابعة' : 'Confirm & Next'}
                {isRtl ? <ArrowLeft size={18} strokeWidth={1.5} /> : <ArrowRight size={18} strokeWidth={1.5} />}
              </button>
               <button
                onClick={() => setShowInput(false)}
                className="mt-4 text-[14px] font-semibold text-slate-400 hover:text-slate-600 transition-colors w-full py-2"
              >
                {lang === 'ar' ? 'تراجع' : 'Cancel'}
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
                <div className="w-20 h-20 bg-slate-100/80 shadow-sm text-[#34C759] rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Plus size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-[24px] font-bold text-slate-900 mb-4 tracking-tight text-center">
                    {lang === 'ar' ? 'هل لديك مصروفات شهرية أخرى؟' : 'Do you have other monthly expenses?'}
                </h3>
                <div className="text-slate-500 bg-slate-50/80 p-6 rounded-[24px] text-sm mb-10 mx-auto max-w-md border border-slate-200/50 shadow-sm mt-4 text-center">
                    <p className="font-medium text-[15px] leading-relaxed text-slate-700">{lang === 'ar' ? 'القائمة شارفت على الانتهاء! إذا كان لديك أي مصروف شهري غير مذكور في القائمة، يمكنك إضافته يدوياً.' : 'If you have any unlisted monthly expense, you can add it manually.'}</p>
                    <p className="text-[13px] text-slate-400 mt-5 pt-5 border-t border-slate-200/60 font-medium">
                        {lang === 'ar' ? 'يمكنك التعديل أو الحذف لاحقاً.' : 'You can add multiple expenses and edit them later.'}
                    </p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-4 max-w-md mx-auto">
                    <button
                        onClick={handleSkipAll}
                        className="flex-1 py-4.5 px-6 rounded-[16px] bg-white border border-slate-200/80 text-slate-600 font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-sm text-[15px]"
                    >
                        {lang === 'ar' ? 'لا، إنهاء القائمة' : 'No, Finish List'}
                    </button>
                    <button
                        onClick={() => setIsAddingCustom(true)}
                        className="flex-1 py-4.5 px-6 rounded-[16px] bg-[#34C759] hover:bg-[#32b853] text-white font-semibold shadow-[0_4px_16px_rgba(52,199,89,0.2)] transition-all flex items-center justify-center gap-2 active:scale-95 text-[15px]"
                    >
                        <Plus size={18} strokeWidth={1.5} />
                        {lang === 'ar' ? 'إضافة مصروف آخر' : 'Add another expense'}
                    </button>
                </div>
            </>
         ) : (
            <div className="max-w-sm mx-auto animate-fade-in space-y-6">
                <h3 className="text-[20px] font-bold text-slate-900 mb-6 tracking-tight">{lang === 'ar' ? 'إضافة مصروف جديد' : 'Add New Expense'}</h3>
                
                <div className="space-y-5">
                    <div className="text-start">
                        <label className="block text-[13px] font-semibold text-slate-500 mb-2 uppercase tracking-wide px-1">
                            {lang === 'ar' ? 'اسم المصروف' : 'Expense Name'}
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثلاً: جيم، نتفليكس...' : 'e.g. Gym, Netflix...'}
                            autoFocus
                            className="w-full px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200/80 rounded-[16px] focus:border-[#007AFF] focus:bg-white focus:ring-4 focus:ring-[#007AFF]/10 outline-none transition-all font-semibold text-slate-900 text-[16px]"
                        />
                    </div>
                    
                    <div className="text-start">
                        <label className="block text-[13px] font-semibold text-slate-500 mb-2 uppercase tracking-wide px-1">
                            {lang === 'ar' ? 'المبلغ الشهري' : 'Monthly Amount'}
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                inputMode="decimal"
                                dir="ltr"
                                value={currentAmount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setCurrentAmount(val);
                                }}
                                placeholder="0"
                                className="w-full px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200/80 rounded-[16px] focus:border-[#007AFF] focus:bg-white focus:ring-4 focus:ring-[#007AFF]/10 outline-none transition-all text-center font-bold text-[28px] tracking-tight tabular-nums text-slate-900"
                                onKeyDown={(e) => e.key === 'Enter' && confirmAmount()}
                            />
                             <span className="absolute top-[22px] text-slate-400 font-bold end-5 text-[16px] pointer-events-none">{t.currency}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                         <button
                            onClick={() => setIsAddingCustom(false)}
                            className="flex-1 py-4.5 rounded-[16px] border border-slate-200/80 text-slate-600 font-semibold hover:bg-slate-50 active:scale-95 transition-all shadow-sm bg-white text-[15px]"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={confirmAmount}
                            disabled={!currentAmount || !customName}
                            className={`flex-1 py-4.5 rounded-[16px] font-semibold text-white shadow-sm transition-all active:scale-95 text-[15px] ${
                                (!currentAmount || !customName)
                                ? 'bg-slate-100 border border-slate-200/60 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-[#34C759] hover:bg-[#32b853] shadow-[0_4px_16px_rgba(52,199,89,0.2)]'
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
    <div className="flex flex-col items-center justify-center min-h-[350px] sm:min-h-[450px] w-full max-w-2xl mx-auto animate-fade-in px-1 sm:px-4">
      
      {/* Progress Bar */}
      <div className="w-full relative mb-6 sm:mb-12">
        <div className="w-full h-1.5 sm:h-2 bg-slate-200/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#007AFF] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Skip button moved under progress bar */}
        {!isCustomPhase && (
          <div className="absolute -bottom-8 w-full flex justify-end">
             <button
                onClick={handleSkipAll}
                className="text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
             >
                {lang === 'ar' ? 'تخطي للادخال اليدوي' : 'Skip to Manual Entry'} →
             </button>
          </div>
        )}
      </div>

      <div className={`bg-white/70 backdrop-blur-3xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200/50 p-6 sm:p-12 w-full relative transition-all duration-300 transform ${isAnimating ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
        
        {/* Item Count Badge (Only in checklist phase) */}
        {!isCustomPhase && (
            <div className="absolute top-[28px] end-8 sm:left-8 sm:end-auto text-[12px] font-bold text-slate-400 bg-slate-100/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
            {currentIndex + 1} / {checklistItems.length}
            </div>
        )}

        {isCustomPhase ? renderCustomPhase() : renderChecklistPhase()}

      </div>
    </div>
  );
};