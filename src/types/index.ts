export interface Draft {
  id: string;
  image_url: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
