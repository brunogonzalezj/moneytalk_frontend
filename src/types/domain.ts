export type TransactionType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  provider?: 'email' | 'google';
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string; // category name
  categoryId?: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type SummaryGroupBy = 'day' | 'week' | 'month';

export interface Summary {
  range: { from: string; to: string; groupBy: SummaryGroupBy };
  totals: { income: number; expense: number; balance: number; count: number };
  byCategory: {
    categoryId: number;
    name: string;
    type: TransactionType;
    total: number;
    count: number;
    percentage: number;
  }[];
  series: { period: string; income: number; expense: number }[];
}

export type BudgetType = 'SAVINGS_GOAL' | 'PURCHASE_GOAL' | 'EMERGENCY_FUND' | 'VACATION' | 'OTHER';
export type BudgetStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

// A savings goal ("presupuesto" in the UI)
export interface Budget {
  id: string;
  name: string;
  description?: string;
  type: BudgetType;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED';

export interface RecurringPayment {
  id: string;
  name: string;
  description?: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  nextPaymentDate: string;
  endDate?: string | null;
  categoryId: number;
  category: string;
  status: RecurringStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AIRecommendation {
  id: number;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
}

export interface CategorizeResult {
  isValidFinancialTransaction: boolean;
  confidence: number;
  transactionTypeExtracted: TransactionType;
  amountExtracted: number;
  descriptionExtracted: string;
  dateExtracted?: string;
  categoryName: string;
  suggestedCategory?: string;
  rejectionReason?: string;
  /** Every valid transaction in the text, when the user dictated several at once */
  transactions?: CategorizeResult[];
}

export interface NotificationSettingsData {
  dailyReminder: boolean;
  dailyTime: string;
  weeklyReminder: boolean;
  weeklyDay: number;
  transactionReminder: boolean;
  monthlyReport: boolean;
  timezone?: string;
}
