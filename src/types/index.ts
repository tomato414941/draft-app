export type SourceType = 'image' | 'text' | 'url';
export type TargetSns = 'x' | 'instagram' | 'linkedin' | 'bluesky';

export interface Draft {
  id: string;
  image_url: string | null;
  content: string;
  created_at: string;
  updated_at?: string;
  source_type: SourceType;
  source_text: string | null;
  source_url: string | null;
  target_sns: TargetSns;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface SnsInfo {
  id: TargetSns;
  name: string;
  icon: string;
  maxLength: number;
}

export const SNS_LIST: SnsInfo[] = [
  { id: 'x', name: 'X', icon: '𝕏', maxLength: 280 },
  { id: 'instagram', name: 'Instagram', icon: '📷', maxLength: 2200 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', maxLength: 3000 },
  { id: 'bluesky', name: 'Bluesky', icon: '🦋', maxLength: 300 },
];
