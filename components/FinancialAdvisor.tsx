import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, ArrowRight, ArrowLeft, PieChart, Sparkles } from 'lucide-react';
import { Expense, Language, BudgetRule, ExpenseType } from '../types';
import { TRANSLATIONS } from '../constants';

interface FinancialAdvisorProps {
  salary: number;
  expenses: Expense[];
  onUpdateRule: (rule: BudgetRule) => void;
  onFinish: () => void;
  lang: Language;
}

export const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ 
  salary, 
  expenses,
  onUpdateRule, 
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
            ? "بناءً على مصاريفك الحالية، وضعك المالي يسمح بتطبيق القاعدة الذهبية 50/30/20. هذا التوزيع يضمن توازناً مثالياً بين الالتزامات، الرفاهية، والادخار للمستقبل." 
            : "Based on your current expenses, your financial situation allows for the golden 50/30/20 rule. This distribution ensures a perfect balance between obligations, lifestyle, and savings.";
      }

      setAnalysisResult({
          message,
          rule
      });
      onUpdateRule(rule);
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
            onUpdateRule(data.recommended_rule);
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
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

      {isLoading ? (
        <div className="text-center flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
                 <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                    <Sparkles size={24} className="animate-pulse" />
                 </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
                {lang === 'ar' ? 'جاري تحليل مصروفاتك...' : 'Analyzing your expenses...'}
            </h3>
            <p className="text-gray-500 text-sm">
                {lang === 'ar' ? 'يقوم المستشار الذكي باختيار أفضل تقسيم لميزانيتك' : 'The AI advisor is selecting the best budget split'}
            </p>
        </div>
      ) : (
        <div className="w-full max-w-lg animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                    <Bot size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {lang === 'ar' ? 'اكتمل التحليل!' : 'Analysis Complete!'}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                    {analysisResult.message}
                </p>
            </div>

            {analysisResult.rule && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <PieChart size={100} />
                     </div>
                     <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 relative z-10">
                         {lang === 'ar' ? 'القاعدة المالية المقترحة' : 'Recommended Budget Rule'}
                     </h4>
                     <div className="flex justify-between items-end relative z-10">
                         <div className="text-center">
                             <div className="text-2xl font-black text-red-500">{analysisResult.rule.needs}%</div>
                             <div className="text-xs font-bold text-gray-400 mt-1">{lang === 'ar' ? 'احتياجات' : 'Needs'}</div>
                         </div>
                         <div className="text-gray-300 font-light text-2xl pb-4">/</div>
                         <div className="text-center">
                             <div className="text-2xl font-black text-amber-500">{analysisResult.rule.wants}%</div>
                             <div className="text-xs font-bold text-gray-400 mt-1">{lang === 'ar' ? 'رغبات' : 'Wants'}</div>
                         </div>
                         <div className="text-gray-300 font-light text-2xl pb-4">/</div>
                         <div className="text-center">
                             <div className="text-2xl font-black text-emerald-500">{analysisResult.rule.savings}%</div>
                             <div className="text-xs font-bold text-gray-400 mt-1">{lang === 'ar' ? 'ادخار' : 'Savings'}</div>
                         </div>
                     </div>
                </div>
            )}

            <button 
                onClick={onFinish}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
                {lang === 'ar' ? 'عرض النتائج التفصيلية' : 'View Detailed Results'}
                {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </button>
        </div>
      )}
    </div>
  );
};