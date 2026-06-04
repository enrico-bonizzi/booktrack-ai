import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BooksApi } from "../services/api";

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  mode?: "create" | "edit";
}

export default function BookForm({ mode = "create" }: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const [notStarted, setNotStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(isEdit);

  const [form, setForm] = useState({
    title: "",
    author: "",
    total_pages: 0,
    current_page: 0,
    start_date: today() as string,
    finish_date: today() as string,
    cover_url: "",
    description: "",
    notes: "",
  });
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    BooksApi.get(Number(id))
      .then((b) => {
        setForm({
          title: b.title,
          author: b.author,
          total_pages: b.total_pages,
          current_page: b.current_page,
          start_date: b.start_date || today(),
          finish_date: b.finish_date || today(),
          cover_url: b.cover_url || "",
          description: b.description || "",
          notes: b.notes || "",
        });
        setNotStarted(!b.start_date);
        setFinished(!!b.finish_date);
      })
      .finally(() => setHydrating(false));
  }, [id, isEdit]);

  function toggleNotStarted(checked: boolean) {
    setNotStarted(checked);
    if (checked) {
      setFinished(false);
      setForm((f) => ({ ...f, current_page: 0 }));
    }
  }

  function toggleFinished(checked: boolean) {
    setFinished(checked);
    if (checked) {
      setNotStarted(false);
      setForm((f) => ({ ...f, current_page: f.total_pages || f.current_page }));
    }
  }

  async function handleLookup() {
    if (!form.title) return;
    setLoadingAI(true);
    try {
      const meta = await BooksApi.lookup(`${form.title} ${form.author}`);
      setForm((f) => ({
        ...f,
        title: meta.title || f.title,
        author: meta.author || f.author,
        total_pages: meta.total_pages || f.total_pages,
        cover_url: meta.cover_url || f.cover_url,
        description: meta.description || f.description,
        current_page: finished ? meta.total_pages || f.current_page : f.current_page,
      }));
    } catch {
      alert("Não foi possível buscar metadados.");
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: any = {
      title: form.title,
      author: form.author,
      total_pages: form.total_pages,
      cover_url: form.cover_url || null,
      description: form.description || null,
      current_page: finished
        ? form.total_pages
        : notStarted
        ? 0
        : form.current_page,
      start_date: notStarted ? null : form.start_date,
      finish_date: finished ? form.finish_date : null,
    };
    // Em "novo livro" envia notes se foi digitado em algum momento; em edição
    // não toca em notes — preservamos o que o usuário escreveu na tela do livro.
    if (!isEdit && form.notes) {
      payload.notes = form.notes;
    }

    try {
      if (isEdit && id) {
        await BooksApi.update(Number(id), payload as any);
        navigate(`/books/${id}`);
      } else {
        await BooksApi.create(payload as any);
        navigate("/books");
      }
    } catch (e: any) {
      alert("Erro ao salvar: " + (e?.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (isEdit && id) navigate(`/books/${id}`);
    else navigate(-1);
  }

  if (hydrating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-muted-foreground">Carregando…</div>
    );
  }

  const inputCls =
    "w-full px-3 py-2 bg-background border border-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-foreground">
          {isEdit ? "Editar livro" : "Novo livro"}
        </h1>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-card border border-border hover:bg-muted transition"
        >
          ← Voltar
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm"
      >
        <Field label="Título">
          <input
            required
            className={inputCls}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Autor">
          <input
            required
            className={inputCls}
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
        </Field>
        <button
          type="button"
          onClick={handleLookup}
          disabled={loadingAI}
          className="text-sm text-primary hover:opacity-80 font-medium disabled:opacity-50"
        >
          🤖 {loadingAI ? "Buscando..." : "Preencher automaticamente com IA"}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Total de páginas">
            <input
              type="number"
              required
              min={1}
              className={inputCls}
              value={form.total_pages || ""}
              onChange={(e) =>
                setForm({ ...form, total_pages: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Página atual">
            <input
              type="number"
              min={0}
              disabled={notStarted || finished}
              className={`${inputCls} disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed`}
              value={
                finished ? form.total_pages : notStarted ? 0 : form.current_page
              }
              onChange={(e) =>
                setForm({ ...form, current_page: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer min-h-[40px]">
            <input
              type="checkbox"
              checked={notStarted}
              onChange={(e) => toggleNotStarted(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span>📕 Ainda não iniciado (lista de desejos)</span>
          </label>

          {!notStarted && (
            <Field label="Data de início">
              <input
                type="date"
                required={!notStarted}
                className={inputCls}
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </Field>
          )}

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer min-h-[40px]">
            <input
              type="checkbox"
              checked={finished}
              onChange={(e) => toggleFinished(e.target.checked)}
              disabled={notStarted}
              className="accent-primary w-4 h-4 disabled:opacity-50"
            />
            <span>✅ Já finalizei este livro</span>
          </label>

          {finished && (
            <Field label="Data de conclusão">
              <input
                type="date"
                required={finished}
                className={inputCls}
                value={form.finish_date}
                onChange={(e) => setForm({ ...form, finish_date: e.target.value })}
              />
            </Field>
          )}
        </div>

        <Field label="URL da capa (opcional)">
          <input
            className={inputCls}
            value={form.cover_url}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
            placeholder="https://..."
          />
        </Field>

        {form.cover_url && (
          <div className="flex justify-center">
            <img
              src={form.cover_url}
              alt="Preview"
              className="h-32 rounded-lg shadow-md"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          </div>
        )}

        <Field label="Descrição (opcional)">
          <textarea
            rows={3}
            className={inputCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-foreground bg-muted hover:bg-accent transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2.5 rounded-lg font-medium shadow-sm transition disabled:opacity-60"
          >
            {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
