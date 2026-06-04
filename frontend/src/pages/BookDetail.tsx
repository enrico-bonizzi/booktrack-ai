import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BooksApi } from "../services/api";
import type { Book } from "../types/book";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [page, setPage] = useState(0);
  const [notes, setNotes] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    if (!id) return;
    const b = await BooksApi.get(Number(id));
    setBook(b);
    setPage(b.current_page);
    setNotes(b.notes || "");
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!book) {
    return (
      <div className="p-8 text-muted-foreground text-center">Carregando…</div>
    );
  }

  async function save() {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await BooksApi.update(Number(id), {
        current_page: page,
        notes,
      });
      setBook(updated);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id) return;
    if (!confirm("Excluir este livro?")) return;
    await BooksApi.remove(Number(id));
    navigate("/books");
  }

  async function addImage() {
    if (!id || !newImageUrl.trim()) return;
    await BooksApi.addImage(Number(id), newImageUrl.trim(), newImageCaption.trim() || undefined);
    setNewImageUrl("");
    setNewImageCaption("");
    reload();
  }

  async function removeImage(imageId: number) {
    if (!id) return;
    if (!confirm("Remover esta imagem?")) return;
    await BooksApi.removeImage(Number(id), imageId);
    reload();
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!id) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const f of list) {
        if (f.size > 5 * 1024 * 1024) {
          alert(`"${f.name}" passa de 5 MB — pulei.`);
          continue;
        }
        await BooksApi.uploadImage(
          Number(id),
          f,
          newImageCaption.trim() || undefined
        );
      }
      setNewImageCaption("");
      await reload();
    } catch (e: any) {
      alert(
        "Falha no upload: " + (e?.response?.data?.detail || e.message || "erro")
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = ""; // permite reupload do mesmo arquivo
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  const inputCls =
    "px-3 py-2 bg-background border border-input text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-card border border-border hover:bg-muted transition"
        >
          ← Voltar
        </button>
        <div className="flex gap-2">
          <Link
            to={`/books/${id}/edit`}
            className="px-3 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
          >
            ✏️ Editar livro
          </Link>
          <button
            onClick={remove}
            className="px-3 py-2 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-1">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="rounded-2xl shadow-xl w-full"
            />
          ) : (
            <div className="aspect-[2/3] bg-muted rounded-2xl flex items-center justify-center text-muted-foreground text-4xl">
              📖
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {book.title}
            </h1>
            <p className="text-muted-foreground mt-1">{book.author}</p>
            {book.description && (
              <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                {book.description}
              </p>
            )}
          </div>

          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border space-y-4 shadow-sm">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-foreground">Progresso</span>
              <span className="text-2xl font-bold text-primary">
                {book.progress_percent}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${book.progress_percent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Página atual
                </label>
                <input
                  type="number"
                  min={0}
                  max={book.total_pages}
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className={`${inputCls} mt-1 w-full`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total de páginas
                </label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-muted text-foreground border border-border">
                  {book.total_pages}
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>📅 Início: {book.start_date || "—"}</div>
              <div>📈 Média: {book.daily_average} pág/dia</div>
              <div>🎯 Previsão: {book.estimated_finish_date || "—"}</div>
              <div>✅ Conclusão: {book.finish_date || "—"}</div>
            </div>
          </div>

          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-sm">
            <label className="text-sm font-medium text-foreground">
              📝 Anotações, resumos e trechos favoritos
            </label>
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`mt-2 w-full ${inputCls}`}
              placeholder="Escreva aqui suas impressões..."
            />
          </div>

          {/* Galeria */}
          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border space-y-3 shadow-sm">
            <h2 className="text-sm font-medium text-foreground">
              🖼️ Imagens vinculadas ({book.images.length})
            </h2>

            {book.images.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma imagem ainda. Cole abaixo a URL de uma foto.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {book.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-border"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || ""}
                      className="w-full h-32 object-cover"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-1 truncate">
                        {img.caption}
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 bg-card/90 hover:bg-destructive hover:text-destructive-foreground text-destructive rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Legenda opcional (vale para upload e URL) */}
            <input
              type="text"
              placeholder="Legenda das próximas imagens (opcional)"
              value={newImageCaption}
              onChange={(e) => setNewImageCaption(e.target.value)}
              className={`${inputCls} text-sm w-full mt-2`}
            />

            {/* Drop zone — upload do PC */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="text-3xl mb-1">📎</div>
              <p className="text-sm text-foreground">
                {uploading
                  ? "Enviando…"
                  : dragActive
                  ? "Solte para enviar"
                  : "Clique ou arraste imagens aqui"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WEBP ou GIF · até 5 MB cada
              </p>
            </div>

            {/* OU adicionar por URL */}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ou adicionar por URL
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <input
                  type="url"
                  placeholder="https://imagem.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className={`sm:col-span-2 ${inputCls} text-sm`}
                />
                <input
                  type="text"
                  placeholder="Legenda (opcional)"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  className={`${inputCls} text-sm`}
                />
              </div>
              <button
                type="button"
                onClick={addImage}
                disabled={!newImageUrl.trim()}
                className="mt-2 text-sm bg-muted hover:bg-accent text-foreground px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                + Adicionar por URL
              </button>
            </details>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 rounded-lg font-medium shadow-sm transition disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar progresso e anotações"}
          </button>
        </div>
      </div>
    </div>
  );
}
