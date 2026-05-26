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
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-105">
            <Wallet size={36} strokeWidth={1.5} />
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 tracking-tight">
            {lang === 'ar' ? 'هل لديك إلتزام شهري لـ:' : 'Do you have a monthly obligation for:'}
            <span className="text-blue-600 block mt-2 font-black text-3xl sm:text-4xl">{currentItem[0]}</span>
          </h3>
          
          <div className="text-slate-500 bg-slate-50/80 p-6 sm:p-8 rounded-[2rem] mb-8 mx-auto max-w-lg border border-slate-100 shadow-sm mt-6">
             <div className="flex items-center justify-center gap-3 text-base sm:text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
                <Info size={24} className="shrink-0 text-blue-500 opacity-80" strokeWidth={1.5} />
                <span>{currentItem[1]}</span>
             </div>
             <p className="text-xs text-slate-400 mt-5 border-t border-slate-200/50 pt-4 font-medium">
               {lang === 'ar' 
                ? "المقصود هو المبالغ التي يتم دفعها بشكل شهري ومنتظم." 
                : "We mean amounts paid monthly and regularly."}
             </p>
          </div>

          {!showInput ? (
            <div className="grid grid-cols-2 gap-5 max-w-xs mx-auto">
              <button
                onClick={() => handleNext(false)}
                className="flex items-center justify-center gap-2 py-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold transition-all active:scale-95 shadow-sm hover:shadow"
              >
                <X size={24} strokeWidth={2.5} />
                {lang === 'ar' ? 'لا' : 'No'}
              </button>
              <button
                onClick={() => handleNext(true)}
                className="flex items-center justify-center gap-2 py-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-1 active:scale-95"
              >
                <Check size={24} strokeWidth={2.5} />
                {lang === 'ar' ? 'نعم' : 'Yes'}
              </button>
            </div>
          ) : (
            <div className="max-w-sm mx-auto animate-fade-in space-y-5">
              <label className="block text-center text-sm font-bold text-slate-500 mb-1">
                {lang === 'ar' ? 'أدخل المبلغ الشهري' : 'Enter monthly amount'}
              </label>
              <div className="relative mb-5 bg-slate-50/50 rounded-3xl p-3 border border-slate-100 transition-colors hover:bg-slate-50">
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAmount()}
                  autoFocus
                  placeholder="0"
                  className="w-full text-4xl sm:text-5xl font-bold bg-transparent outline-none transition-all placeholder-slate-300 text-center tracking-tighter text-slate-900"
                />
                <span className={`absolute top-6 text-slate-400 font-bold text-xl ${isRtl ? 'left-6' : 'right-6'}`}>{t.currency}</span>
              </div>
              <button
                onClick={confirmAmount}
                disabled={!currentAmount}
                className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  currentAmount 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {lang === 'ar' ? 'تأكيد ومتابعة' : 'Confirm & Next'}
                {isRtl ? <ArrowLeft size={20} strokeWidth={2.5} /> : <ArrowRight size={20} strokeWidth={2.5} />}
              </button>
               <button
                onClick={() => setShowInput(false)}
                className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
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
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-105">
                    <Plus size={36} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight text-center">
                    {lang === 'ar' ? 'هل لديك مصروفات شهرية أخرى؟' : 'Do you have other monthly expenses?'}
                </h3>
                <div className="text-slate-500 bg-slate-50/80 p-8 rounded-[2rem] text-sm mb-10 mx-auto max-w-md border border-slate-100 shadow-sm mt-4 text-center">
                    <p className="font-medium text-lg leading-relaxed text-slate-700">{lang === 'ar' ? 'القائمة شارفت على الانتهاء! إذا كان لديك أي مصروف شهري غير مذكور في القائمة، يمكنك إضافته يدوياً.' : 'If you have any unlisted monthly expense, you can add it manually.'}</p>
                    <p className="text-sm text-slate-400 mt-6 pt-6 border-t border-slate-200/60 font-medium">
                        {lang === 'ar' ? 'يمكنك التعديل أو الحذف لاحقاً.' : 'You can add multiple expenses and edit them later.'}
                    </p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-4 max-w-md mx-auto">
                    <button
                        onClick={handleSkipAll}
                        className="flex-1 py-4 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm hover:border-slate-300"
                    >
                        {lang === 'ar' ? 'لا، إنهاء القائمة' : 'No, Finish List'}
                    </button>
                    <button
                        onClick={() => setIsAddingCustom(true)}
                        className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        {lang === 'ar' ? 'إضافة مصروف آخر' : 'Add another expense'}
                    </button>
                </div>
            </>
         ) : (
            <div className="max-w-sm mx-auto animate-fade-in space-y-5">
                <h3 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">{lang === 'ar' ? 'إضافة مصروف جديد' : 'Add New Expense'}</h3>
                
                <div className="space-y-5">
                    <div className="text-start">
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                            {lang === 'ar' ? 'اسم المصروف' : 'Expense Name'}
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثلاً: جيم، نتفليكس...' : 'e.g. Gym, Netflix...'}
                            autoFocus
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-slate-800"
                        />
                    </div>
                    
                    <div className="text-start">
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                            {lang === 'ar' ? 'المبلغ الشهري' : 'Monthly Amount'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={currentAmount}
                                onChange={(e) => setCurrentAmount(e.target.value)}
                                placeholder="0"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-center font-bold text-2xl tracking-tight text-slate-900"
                                onKeyDown={(e) => e.key === 'Enter' && confirmAmount()}
                            />
                             <span className={`absolute top-5 text-slate-400 font-bold ${isRtl ? 'left-5' : 'right-5'}`}>{t.currency}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                         <button
                            onClick={() => setIsAddingCustom(false)}
                            className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={confirmAmount}
                            disabled={!currentAmount || !customName}
                            className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95 ${
                                (!currentAmount || !customName)
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 hover:-translate-y-0.5'
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
      <div className="w-full relative mb-10">
        <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Skip button moved under progress bar */}
        {!isCustomPhase && (
          <div className="absolute -bottom-6 w-full flex justify-end">
             <button
                onClick={handleSkipAll}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors underline decoration-slate-300 hover:decoration-slate-500 underline-offset-4 active:scale-95"
             >
                {lang === 'ar' ? 'تخطي الدليل للتسجيل اليدوي' : 'Skip to Manual Entry'}
             </button>
          </div>
        )}
      </div>

      <div className={`bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white p-8 md:p-12 w-full relative transition-all duration-300 transform ${isAnimating ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
        
        {/* Item Count Badge (Only in checklist phase) */}
        {!isCustomPhase && (
            <div className="absolute top-8 left-8 text-xs font-bold text-slate-400 bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/50">
            {currentIndex + 1} / {checklistItems.length}
            </div>
        )}

        {isCustomPhase ? renderCustomPhase() : renderChecklistPhase()}

      </div>
    </div>
  );
};