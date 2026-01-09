import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { Expense, ExpenseType, Language, BudgetRule } from '../types';
import { TRANSLATIONS } from '../constants';

interface FinancialAdvisorProps {
  salary: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateRule: (rule: BudgetRule) => void;
  onFinish: () => void;
  lang: Language;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ 
  salary, 
  onAddExpense, 
  onUpdateRule,
  onFinish, 
  lang 
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      // Check for API Key safely
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
         setMessages([{
             id: 'error',
             sender: 'ai',
             text: lang === 'ar' 
               ? "عذراً، مفتاح API غير متوفر. يرجى المتابعة للإدخال اليدوي." 
               : "Sorry, API Key is missing. Please proceed to manual entry."
         }]);
         return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const systemInstruction = `
          You are 'Qawam Assistant', a financial advisor.
          Context: User Salary = ${salary} ${t.currency}. Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
          
          Goal:
          1. Determine the best 50/30/20 rule adjustment. 
             - If single/simple: 50/30/20.
             - If married/high debt/family: Suggest 60/30/10 or 60/20/20 (Needs/Wants/Savings).
          2. Extract monthly expenses from the conversation.

          Protocol:
          - Ask SHORT, SINGLE questions. Be friendly.
          - Start by asking about social status/family/obligations.
          - Then ask about FIXED bills (Rent, Loan, Utilities).
          - Then ask about VARIABLE expenses (Food, Transport).
          - Then Luxuries.
          
          CRITICAL OUTPUT FORMAT:
          If you detect expenses or a rule change, append a JSON block at the VERY END of your response. 
          Do not mention the JSON in the text.
          
          JSON Schema:
          \`\`\`json
          {
            "rule": { "needs": 60, "wants": 20, "savings": 20 }, // Optional, send only if changed
            "expenses": [ // Optional
              { "name": "Rent", "amount": 5000, "type": "احتياج" }, // Type must be one of: 'احتياج', 'رغبة', 'ادخار واستثمار' (even in English mode, map internally or use Arabic enum values)
              { "name": "Coffee", "amount": 200, "type": "رغبة" }
            ]
          }
          \`\`\`
          Type mapping: 
          - Needs -> 'احتياج'
          - Wants -> 'رغبة'
          - Savings -> 'ادخار واستثمار'
        `;

        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
        
        chatSessionRef.current = chat;
        
        // Initial Message
        setMessages([{
          id: '1',
          sender: 'ai',
          text: t.chatWelcome
        }]);

      } catch (error) {
        console.error("Failed to init chat", error);
        setMessages([{
             id: 'init-error',
             sender: 'ai',
             text: lang === 'ar' ? "فشل تهيئة المحادثة." : "Failed to initialize chat."
        }]);
      }
    };

    initChat();
  }, [salary, lang, t.currency, t.chatWelcome]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: input });
      const rawText = response.text || "";
      
      // Parse JSON
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      let displayText = rawText;

      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1];
          const data = JSON.parse(jsonStr);
          
          // Execute Actions
          if (data.rule) {
            onUpdateRule(data.rule);
          }
          if (data.expenses && Array.isArray(data.expenses)) {
            data.expenses.forEach((exp: any) => {
              // Ensure type matches enum
              let type: ExpenseType = ExpenseType.NEED;
              if (exp.type === 'رغبة' || exp.type === 'Wants' || exp.type === 'Want') type = ExpenseType.WANT;
              if (exp.type === 'ادخار واستثمار' || exp.type === 'Savings' || exp.type === 'Saving') type = ExpenseType.SAVING;
              if (exp.type === 'احتياج' || exp.type === 'Needs' || exp.type === 'Need') type = ExpenseType.NEED;

              onAddExpense({
                name: exp.name,
                amount: typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount),
                type: type,
                notes: 'Auto-detected'
              });
            });
          }

          // Remove JSON from display
          displayText = rawText.replace(jsonMatch[0], '').trim();
        } catch (e) {
          console.error("JSON Parse Error", e);
        }
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: displayText }]);

    } catch (error: any) {
      console.error("Chat Error:", error);
      
      let errorMsg = lang === 'ar' ? "عذراً، حدث خطأ في الاتصال." : "Sorry, connection error.";
      // Append detailed error for debugging
      if (error.message) {
         errorMsg += ` (${error.message})`;
      }
      
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t.advisorStep}</h3>
            <p className="text-xs text-blue-100 opacity-80">Gemini AI Powered</p>
          </div>
        </div>
        <button 
          onClick={onFinish}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          {t.skipToExpenses}
          {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gray-200 text-gray-500 px-4 py-2 rounded-full text-xs rounded-bl-none">
              ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chatPlaceholder}
            className="flex-1 bg-gray-100 text-gray-800 placeholder-gray-400 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-xl transition-all shadow-md ${
              !input.trim() || isTyping 
               ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
               : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={20} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};