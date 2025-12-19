export enum ExpenseType {
  NEED = 'احتياج',
  WANT = 'رغبة',
  SAVING = 'ادخار واستثمار'
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: ExpenseType;
  notes?: string;
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