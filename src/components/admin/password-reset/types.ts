export interface ResetRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  reset_token_sent_at: string | null;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
}
