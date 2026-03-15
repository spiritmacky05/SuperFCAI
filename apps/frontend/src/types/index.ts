
export enum EstablishmentType {
  Residential = 'Residential',
  Business = 'Business',
  Mercantile = 'Mercantile',
  Educational = 'Educational',
  Assembly = 'Assembly',
  Industrial = 'Industrial',
  Storage = 'Storage',
  HealthCare = 'Health Care',
  SpecialOccupancy = 'Special Occupancy',
  Others = 'Others'
}

export enum OccupancyType {
  FSIC_Occupancy = 'FSIC For Occupancy',
  New_Business = 'New Business (Occupancy)',
  Renewal = 'Renewal of Business Permit'
}

export interface SearchParams {
  establishmentType: EstablishmentType | '';
  area: string;
  stories: string;
  additional_details?: string;
}

export interface AiResponse {
  markdown: string;
}

export type UserRole = 'free' | 'pro' | 'admin' | 'super_admin';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Only for local storage logic, normally hashed
  bfp_id_url?: string;
  status?: string;
  bfp_account_number?: string;
  payment_status?: 'none' | 'pending' | 'approved' | 'rejected';
  proof_of_payment_url?: string;
  subscription_expiry?: string;
  last_payment_date?: string;
  session_id?: string;
}

export interface SavedReport {
  id: string;
  timestamp: number;
  params: SearchParams;
  result: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: 'provision' | 'interpretation' | 'correction';
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ErrorReport {
  id: number;
  user_email: string;
  cited_error: string;
  actual_correction: string;
  status: 'pending' | 'evaluated';
  created_at: string;
}
