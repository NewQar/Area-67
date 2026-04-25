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
  gender?: 'male' | 'female';
  numChildren?: number;
}

export type AidCategory =
  | 'cash'
  | 'cash_voucher'
  | 'in_kind'
  | 'insurance'
  | 'caregiver'
  | 'maternal'
  | 'family_welfare'
  | 'retiree'
  | 'zakat'
  | 'education'
  | 'registration_gate';

export type LocalizedName = Record<Language, string>;

export interface AidTier {
  label: string;
  amount: string;
  num_children_factor?: boolean;
}

export interface AidAmount {
  min_myr: number;
  max_myr: number | null;
  description: string;
  tiers?: AidTier[];
}

export interface ApplicationWindow {
  type: 'annual' | 'open' | 'auto' | 'one_off' | 'event_triggered' | 'semester';
  open_month?: number;
  close_month?: number;
  notes?: string;
}

export interface AidEligibility {
  citizenship?: string;
  min_age?: number | null;
  max_age?: number | null;
  gender?: 'male' | 'female';
  religion?: string;
  state?: string;
  income_band?: string | null;
  education_status?: string;
  employment_history?: string;
  household_categories?: string[];
  asnaf_categories?: string[];
  required_registrations?: string[];
  additional_rules?: string[];
}

export interface AidApplication {
  online_url?: string;
  claim_url?: string;
  store_locator_url?: string;
  mobile_app?: string;
  offline_options?: string[];
  steps: string[];
  renewal_required?: boolean;
  renewal_notes?: string;
}

export interface Aid {
  id: string;
  slug: string;
  name: LocalizedName;
  provider: string;
  category: AidCategory;
  is_recurring: boolean;
  is_auto_credited?: boolean;
  is_religion_specific: boolean;
  religion_required?: string;
  is_state_specific: string | null;
  state_covers?: string[];
  is_active: boolean;
  is_prerequisite_only?: boolean;
  unverified?: boolean;
  application_window: ApplicationWindow;
  amount: AidAmount;
  eligibility_criteria: AidEligibility;
  required_documents: string[];
  application: AidApplication;
  linked_aids?: string[];
  unlocks_aids?: string[];
  tags: string[];
  source_urls: string[];
  last_verified_at: string;
}

export type MatchStatus = 'eligible' | 'partial' | 'auto';

export interface MatchedAid {
  id: string;
  reason: string;
  confidence: number;
  status?: MatchStatus;
  gap?: string;
  fix_url?: string;
  estimated_days?: number;
}

export interface NearMissAid {
  id: string;
  gap: string;
  suggestion: string;
  fix_url?: string;
  estimated_days?: number;
}

export interface MatchResult {
  matched: MatchedAid[];
  nearMiss: NearMissAid[];
  nextSteps: string[];
}
