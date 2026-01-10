export enum ExpenseType {
  NEED = 'احتياج',
  WANT = 'رغبة',
  SAVING = 'ادخار واستثمار'
}

export enum AppStep {
  SALARY = 1,
  WIZARD = 2,
  ADVISOR = 3,
  EXPENSES = 4,
  DASHBOARD = 5
}

export type Language = 'ar' | 'en';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: ExpenseType;
  notes?: string;
}

export interface BudgetRule {
  needs: number;
  wants: number;
  savings: number;
}

export interface Suggestion {
  name: string;
}

export interface DashboardMetrics {
  totalNeeds: number;
  totalWants: number;
  totalSavingsExpenses: number; // Savings explicitly listed as expenses
  totalExpenses: number;
  remainingSalary: number;
  totalSavingsCalculated: number; // (Salary - Needs - Wants)
}