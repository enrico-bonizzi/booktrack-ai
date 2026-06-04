import axios from "axios";
import { clearStoredAuth, getStoredToken } from "../contexts/AuthContext";
import type {
  Book,
  BookCreate,
  BookImage,
  DashboardStats,
  Granularity,
  PeriodStats,
  TimeseriesStats,
} from "../types/book";
import type { LoginResponse, User } from "../types/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      clearStoredAuth();
      // força navegação pra login se não estiver lá
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const AuthApi = {
  googleLogin: (idToken: string) =>
    api.post<LoginResponse>("/auth/google", { id_token: idToken }).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

export const BooksApi = {
  list: () => api.get<Book[]>("/books").then((r) => r.data),
  get: (id: number) => api.get<Book>(`/books/${id}`).then((r) => r.data),
  create: (payload: BookCreate) =>
    api.post<Book>("/books", payload).then((r) => r.data),
  update: (
    id: number,
    payload: Partial<BookCreate> & {
      current_page?: number;
      notes?: string;
      total_pages?: number;
    }
  ) => api.patch<Book>(`/books/${id}`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/books/${id}`),
  stats: () =>
    api.get<DashboardStats>("/books/dashboard/stats").then((r) => r.data),
  lookup: (q: string) =>
    api
      .get<{
        title: string;
        author: string;
        total_pages: number;
        description: string;
        cover_url: string;
        sources?: string[];
      }>("/ai/lookup", { params: { q } })
      .then((r) => r.data),
  addImage: (bookId: number, url: string, caption?: string) =>
    api
      .post<BookImage>(`/books/${bookId}/images`, {
        url,
        caption: caption || null,
      })
      .then((r) => r.data),
  uploadImage: (bookId: number, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (caption) fd.append("caption", caption);
    return api
      .post<BookImage>(`/books/${bookId}/images/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  removeImage: (bookId: number, imageId: number) =>
    api.delete(`/books/${bookId}/images/${imageId}`),
  periodStats: (start: string, end: string) =>
    api
      .get<PeriodStats>("/books/stats/period", { params: { start, end } })
      .then((r) => r.data),
  timeseries: (start: string, end: string, granularity: Granularity) =>
    api
      .get<TimeseriesStats>("/books/stats/timeseries", {
        params: { start, end, granularity },
      })
      .then((r) => r.data),
};

export default api;
