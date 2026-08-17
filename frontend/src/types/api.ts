export interface HelloResponse { message: string; created_at: string; }
export interface MeResponse { user_id: string; email: string; }
export interface ProfileResponse { id: string; role: "citizen" | "store_owner" | "admin" | null; display_name: string | null; points_total: number; }
export interface StoreResponse { id: string; owner_id: string; name: string; qr_code: string; bags_avoided_count: number; points_total: number; }
export interface ScanResponse { success: boolean; points_awarded: number; store_name: string; capped: boolean; }
export interface ReportResponse { id: string; reporter_id: string; lat: number; lng: number; photo_before_url: string; photo_after_url: string | null; status: "pending_review" | "open" | "in_progress" | "claimed" | "cleaned" | "completed" | "rejected"; claimed_by_id: string | null; claimed_by_name: string | null; cleaned_by_id: string | null; created_at: string; }
export interface HistoryEntry { id: string; amount: number; label: string; source: string; created_at: string; }
export interface LeaderboardEntry { rank: number; id: string; display_name: string | null; points_total: number; }
export interface StoreLeaderboardEntry { rank: number; id: string; name: string; points_total: number; }