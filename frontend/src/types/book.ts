export interface BookImage {
  id: number;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface ReadingLog {
  id: number;
  book_id: number;
  pages_read: number;
  current_page_after: number;
  logged_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  total_pages: number;
  current_page: number;
  start_date: string | null;
  finish_date: string | null;
  cover_url: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  progress_percent: number;
  daily_average: number;
  estimated_finish_date: string | null;
  status: "not_started" | "in_progress" | "completed";
  images: BookImage[];
  logs: ReadingLog[];
}

export interface BookCreate {
  title: string;
  author: string;
  total_pages: number;
  current_page?: number;
  start_date?: string | null;
  finish_date?: string | null;
  notes?: string | null;
  cover_url?: string | null;
}

export interface DashboardStats {
  total_books: number;
  in_progress: number;
  completed: number;
  average_daily_pages: number;
  overall_progress: number;
}

export interface PeriodStats {
  start: string;
  end: string;
  days: number;
  books_completed: number;
  books_completed_list: Book[];
  pages_logged: number;          // net
  pages_logged_gross: number;    // só positivos
  pages_corrections: number;     // |soma dos negativos|
  pages_total_from_completed: number;
  average_per_day: number;
}

export type Granularity = "year" | "month" | "week";

export interface TimeseriesPoint {
  bucket: string;
  pages: number;        // net
  pages_gross: number;  // só positivos
  sessions: number;
}

export interface TimeseriesStats {
  start: string;
  end: string;
  granularity: Granularity;
  total_pages: number;
  points: TimeseriesPoint[];
}
