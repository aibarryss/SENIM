export type UserRole = 'donor' | 'susn' | 'partner' | 'admin';

export type CampaignCategory = 'grocery' | 'medicine' | 'winter' | 'education';

export type CampaignUrgency = 'urgent' | 'high_priority' | 'verified' | null;

export type CampaignStatus = 'active' | 'funded' | 'completed';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  /** Optional locale -> text map for localized display. Falls back to `title`. */
  title_i18n?: Record<string, string> | null;
  /** Optional locale -> text map for localized display. Falls back to `description`. */
  description_i18n?: Record<string, string> | null;
  category: CampaignCategory;
  region: string;
  goal_amount: number;
  raised_amount: number;
  urgency: CampaignUrgency;
  status: CampaignStatus;
  image_url: string | null;
  partner_id: string | null;
  /** The SUSN user who created this campaign. */
  creator_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'voucher_redemption' | 'medicine_purchase' | 'utility_payment';
  voucher_number: string | null;
  store_name: string;
  city: string;
  amount: number;
  created_at: string;
}

export interface PlatformStats {
  id: number;
  food_baskets_today: number;
  verified_aid_almaty: number;
  active_qr_vouchers: number;
  families_helped: number;
  partner_retailers: number;
}

export type PartnerStoreType = 'supermarket' | 'pharmacy' | 'clothing' | 'education';

export interface Partner {
  id: string;
  name: string;
  type: PartnerStoreType;
  city: string;
  logo_letter: string;
  logo_color: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  phone: string | null;
  verified: boolean;
  created_at: string;
}

export interface DonationIntent {
  id: string;
  donor_id: string;
  campaign_id: string | null;
  amount: number;
  payment_type: 'full' | 'partial' | 'subscription';
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type SusnVerificationStatus = ApplicationStatus;

export interface AiVerificationResult {
  confidence: number;
  checks: string[];
  summary: string;
}

export interface SusnVerificationRequest {
  id: string;
  user_id: string;
  document_path: string;
  status: SusnVerificationStatus;
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  ai_result: AiVerificationResult | null;
}

export interface PartnerApplication {
  id: string;
  user_id: string;
  store_name: string;
  store_type: PartnerStoreType;
  city: string;
  address: string;
  status: ApplicationStatus;
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}
