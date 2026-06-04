import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import BookList from "./pages/BookList";
import BookForm from "./pages/BookForm";
import BookDetail from "./pages/BookDetail";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <BookList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books/new"
          element={
            <ProtectedRoute>
              <BookForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books/:id"
          element={
            <ProtectedRoute>
              <BookDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books/:id/edit"
          element={
            <ProtectedRoute>
              <BookForm mode="edit" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
