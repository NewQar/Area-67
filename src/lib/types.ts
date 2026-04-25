export type Language = 'ms' | 'en' | 'zh' | 'ta';

export interface UserProfile {
  name: string;
  language: Language;
  age: number;
  state: string;
  householdSize: number;
  monthlyIncome: number;
  citizenship?: string;
  hasOKUCard?: boolean;
  religion?: string;
}

export interface Aid {
  id: string;
  name: string;
  nameEn: string;
  amount: number;
  frequency: string;
  criteria: Record<string, unknown>;
  description: string;
  applyUrl: string;
  provider: string;
}

export interface MatchResult {
  matched: Array<{ id: string; reason: string; confidence: number }>;
  nearMiss: Array<{ id: string; gap: string; suggestion: string }>;
  nextSteps: string[];
}
