import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Login() {
  const { loginWithGoogle, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  async function handleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate("/", { replace: true });
    } catch (e) {
      alert("Falha no login. Tente novamente.");
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Halos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/30 rounded-full blur-3xl" />
      </div>

      <button
        type="button"
        onClick={toggle}
        className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-card/80 backdrop-blur border border-border flex items-center justify-center text-foreground z-10"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="bg-card text-card-foreground rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-border relative z-10">
        <div className="text-6xl mb-3">📚</div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          BookTrack <span className="text-primary">AI</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-3 mb-8">
          Painel inteligente de leitura. Entre com sua conta Google para
          acompanhar seus livros, anotações e progresso.
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => alert("Erro ao autenticar com Google.")}
            useOneTap
            theme={theme === "dark" ? "filled_black" : "filled_blue"}
            text="signin_with"
            shape="pill"
            locale="pt_BR"
          />
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground mt-4">Entrando…</p>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            🔒 Seus livros e anotações ficam vinculados à sua conta.
          </p>
        </div>
      </div>
    </div>
  );
}
