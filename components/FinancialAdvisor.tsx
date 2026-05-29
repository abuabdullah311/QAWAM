import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, ArrowRight, ArrowLeft, PieChart, Sparkles } from 'lucide-react';
import { Expense, Language, BudgetRule, ExpenseType } from '../types';
import { TRANSLATIONS } from '../constants';

interface FinancialAdvisorProps {
  salary: number;
  expenses: Expense[];
  onFinish: () => void;
  lang: Language;
}

export const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ 
  salary, 
  expenses,
  onFinish, 
  lang 
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  
  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<{ message: string, rule: BudgetRule | null }>({ message: '', rule: null });

  // Function to calculate rule locally if AI fails (Fallback)
  const performLocalAnalysis = () => {
      const totalNeeds = expenses
        .filter(e => e.type === ExpenseType.NEED)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const needsPct = salary > 0 ? (totalNeeds / salary) * 100 : 0;
      let rule = { needs: 50, wants: 30, savings: 20 };
      let message = "";

      if (needsPct > 65) {
          rule = { needs: 70, wants: 20, savings: 10 };
          message = lang === 'ar'
            ? "نظراً لأن التزاماتك الأساسية مرتفعة (أكثر من 65% من الراتب)، نقترح قاعدة 70/20/10 لتكون الخطة واقعية وقابلة للتطبيق."
            : "Since your essential obligations are high (over 65% of salary), we suggest the 70/20/10 rule to make the plan realistic and achievable.";
      } else if (needsPct > 55) {
          rule = { needs: 60, wants: 20, savings: 20 };
           message = lang === 'ar'
            ? "تشكل الاحتياجات جزءاً كبيراً من دخلك، لذا قمنا بتعديل القاعدة إلى 60/20/20. هذا سيمنحك مرونة أكبر في إدارة المصاريف الضرورية دون الضغط على ميزانيتك."
            : "Needs make up a large part of your income, so we adjusted the rule to 60/20/20. This gives you more flexibility in managing essentials without straining your budget.";
      } else {
           message = lang === 'ar' 
            ? "بناءً على مصاريفك الحالية، وضعك المالي يسمح بتطبيق القاعدة الذهبية 50/30/20. هذا التوزيع يضمن توازناً مثالياً بين الالتزامات، الرفاهية، والادخار والاستثمار للمستقبل." 
            : "Based on your current expenses, your financial situation allows for the golden 50/30/20 rule. This distribution ensures a perfect balance between obligations, lifestyle, and savings.";
      }

      setAnalysisResult({
          message,
          rule
      });
  };

  useEffect(() => {
    const runAnalysis = async () => {
      setIsLoading(true);
      
      // Artificial delay for better UX even if local
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!process.env.API_KEY) {
         performLocalAnalysis();
         setIsLoading(false);
         return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const expensesJSON = JSON.stringify(expenses.map(e => ({ name: e.name, amount: e.amount, type: e.type })));
        
        const systemInstruction = `
          Context: User Salary = ${salary} ${t.currency}. Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
          
          ROLE:
          You are "Qawam's Financial Analyzer".
          
          TASK:
          1. Analyze the provided list of expenses.
          2. Calculate the actual Needs ratio.
          3. Recommend the BEST budget rule based on their actual situation:
             - If Needs are around 50%, recommend 50/30/20.
             - If Needs are high (e.g. > 55%), recommend 60/20/20 or 70/20/10 to be realistic.
             - Explain clearly why this rule fits them.
          4. Return a JSON response.
          
          OUTPUT FORMAT (JSON ONLY):
          {
            "analysis_message": "A concise explanation (max 3 sentences) of why this rule is chosen based on their high/low needs.",
            "recommended_rule": { "needs": 60, "wants": 20, "savings": 20 }
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `User Data: ${expensesJSON}. Analyze and recommend rule in JSON.`,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.1, 
            responseMimeType: 'application/json'
          },
        });
        
        const rawText = response.text || "";
        const data = JSON.parse(rawText);

        if (data.recommended_rule && data.analysis_message) {
            setAnalysisResult({
                message: data.analysis_message,
                rule: data.recommended_rule
            });
        } else {
            throw new Error("Invalid format");
        }

      } catch (err: any) {
        console.warn("AI Analysis Failed (Quota or Error), switching to local fallback.", err);
        // Fallback to local analysis on ANY error (including 429)
        performLocalAnalysis();
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [salary, expenses, lang, t.currency]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[440px] w-full bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white p-10 animate-fade-in relative overflow-hidden transition-all duration-500">
      
      {isLoading ? (
        <div className="text-center flex flex-col items-center">
            <div className="relative w-20 h-20 mb-5">
                 <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                 <div className="absolute inset-0 border-[6px] border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                    <Sparkles size={28} strokeWidth={1.5} className="animate-pulse" />
                 </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
                {lang === 'ar' ? 'جاري تحليل مصروفاتك...' : 'Analyzing your expenses...'}
            </h3>
            <p className="text-slate-500 font-medium">
                {lang === 'ar' ? 'يقوم المستشار الذكي باختيار أفضل تقسيم لميزانيتك' : 'The AI advisor is selecting the best budget split'}
            </p>
        </div>
      ) : (
        <div className="w-full max-w-lg animate-[fadeIn_0.5s_ease-out]">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl mb-6 shadow-lg shadow-indigo-500/20 transform transition-transform hover:scale-105">
                    <Bot size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
                    {lang === 'ar' ? 'اكتمل التحليل!' : 'Analysis Complete!'}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    {analysisResult.message}
                </p>
            </div>

            {analysisResult.rule && (
                <div className="bg-white border text-center border-slate-100 rounded-3xl p-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                     <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform scale-150 -translate-y-10">
                        <PieChart size={160} />
                     </div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">
                         {lang === 'ar' ? 'القاعدة المالية المقترحة' : 'Recommended Budget Rule'}
                     </h4>
                     <div className="flex justify-between items-center relative z-10 max-w-sm mx-auto">
                         <div className="text-center flex-1">
                             <div className="text-4xl font-black text-rose-500 tracking-tighter">{analysisResult.rule.needs}%</div>
                             <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">{lang === 'ar' ? 'احتياجات' : 'Needs'}</div>
                         </div>
                         <div className="text-slate-200 font-light text-3xl pb-6">/</div>
                         <div className="text-center flex-1">
                             <div className="text-4xl font-black text-amber-500 tracking-tighter">{analysisResult.rule.wants}%</div>
                             <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">{lang === 'ar' ? 'رغبات' : 'Wants'}</div>
                         </div>
                         <div className="text-slate-200 font-light text-3xl pb-6">/</div>
                         <div className="text-center flex-1">
                             <div className="text-4xl font-black text-emerald-500 tracking-tighter">{analysisResult.rule.savings}%</div>
                             <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">{lang === 'ar' ? 'ادخار' : 'Savings'}</div>
                         </div>
                     </div>
                </div>
            )}

            <button 
                onClick={onFinish}
                className="w-full py-5 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
                {lang === 'ar' ? 'عرض النتائج التفصيلية' : 'View Detailed Results'}
                {isRtl ? <ArrowLeft size={20} strokeWidth={2.5} /> : <ArrowRight size={20} strokeWidth={2.5} />}
            </button>
        </div>
      )}
    </div>
  );
};