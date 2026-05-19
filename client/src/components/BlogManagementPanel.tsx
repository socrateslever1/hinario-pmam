import { useState, useRef, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Eye, EyeOff, Youtube, Save } from "lucide-react";
import { formatDateBR } from "@/lib/formatDate";

const DRAFT_KEY = "blog_draft_v1";

interface DraftData {
  title: string;
  content: string;
  imageUrl: string;
  youtubeUrl: string;
  published: boolean;
  editingId: number | null;
  savedAt: number;
}

function saveDraft(data: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {}
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function BlogManagementPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "publicados" | "rascunhos">("todos");
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    youtubeUrl: "",
    published: true,
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Verificar rascunho ao montar
  useEffect(() => {
    const draft = loadDraft();
    if (draft && (draft.title || draft.content)) {
      setHasDraft(true);
      setDraftSavedAt(draft.savedAt);
    }
  }, []);

  // Salvar rascunho automaticamente com debounce de 2s
  useEffect(() => {
    if (!isOpen) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (formData.title || formData.content) {
        const draft: DraftData = { ...formData, editingId, savedAt: Date.now() };
        saveDraft(draft);
        setDraftSavedAt(Date.now());
        setHasDraft(true);
      }
    }, 2000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [formData, isOpen, editingId]);

  // Queries
  const { data: posts, isLoading, refetch } = trpc.blog.list.useQuery();

  // Mutations
  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setIsOpen(false);
      clearDraft();
      setHasDraft(false);
    },
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setIsOpen(false);
      clearDraft();
      setHasDraft(false);
    },
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", imageUrl: "", youtubeUrl: "", published: true });
    setEditingId(null);
    setFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleContinueDraft = () => {
    const draft = loadDraft();
    if (!draft) return;
    setFormData({
      title: draft.title,
      content: draft.content,
      imageUrl: draft.imageUrl,
      youtubeUrl: draft.youtubeUrl || "",
      published: draft.published,
    });
    setEditingId(draft.editingId);
    setIsOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: 'error', message: 'Por favor, selecione uma imagem válida' });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'A imagem deve ter no máximo 5MB' });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Erro ao fazer upload da imagem");

      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setFeedback({ type: 'error', message: 'Erro ao fazer upload da imagem' });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setFeedback({ type: 'error', message: 'Título e conteúdo são obrigatórios' });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          published: formData.published,
        });
        setFeedback({ type: 'success', message: 'Post atualizado com sucesso!' });
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          published: formData.published,
        });
        setFeedback({ type: 'success', message: 'Post publicado com sucesso!' });
      }
      setTimeout(() => setFeedback(null), 5000);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao salvar post';
      setFeedback({ type: 'error', message: `Erro: ${errorMessage}` });
      console.error("Erro ao salvar post:", error);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleEdit = (post: any) => {
    setFormData({
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || "",
      youtubeUrl: "",
      published: post.published,
    });
    setEditingId(post.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este post?")) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        console.error("Erro ao deletar post:", error);
        setFeedback({ type: 'error', message: 'Erro ao deletar post' });
        setTimeout(() => setFeedback(null), 5000);
      }
    }
  };

  const filteredPosts = posts?.filter(post => {
    const matchTitle = post.title.toLowerCase().includes(searchTitle.toLowerCase());
    const matchStatus =
      filterStatus === "todos" ? true :
      filterStatus === "publicados" ? post.published :
      !post.published;
    return matchTitle && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, edite e publique notícias e avisos para a página inicial
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasDraft && (
            <Button
              variant="outline"
              onClick={handleContinueDraft}
              className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              <Save className="h-4 w-4" />
              Continuar rascunho
              {draftSavedAt && (
                <span className="text-xs opacity-70 ml-1">
                  ({new Date(draftSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </Button>
          )}
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Post
              </Button>
            </DialogTrigger>
            <DialogContent
              className="w-full max-w-2xl max-h-[90vh] flex flex-col p-0"
              style={{ touchAction: 'pan-y' }}
            >
              {/* Header fixo */}
              <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                <DialogTitle>
                  {editingId ? "Editar Post" : "Criar Novo Post"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para {editingId ? "editar o" : "criar um novo"} post
                </DialogDescription>
                {draftSavedAt && isOpen && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Save className="h-3 w-3" />
                    Rascunho salvo às {new Date(draftSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </DialogHeader>

              {/* Área scrollável */}
              <div
                className="flex-1 overflow-y-auto px-6 pb-2"
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {feedback && (
                  <div className={`p-3 rounded-lg mb-4 ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <p className="text-sm font-medium">
                      {feedback.type === 'success' ? '✓ ' : '✗ '}{feedback.message}
                    </p>
                  </div>
                )}

                <form id="post-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="text-sm font-medium">Título *</label>
                    <Input
                      placeholder="Digite o título do post"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <label className="text-sm font-medium">Conteúdo *</label>
                    <div className="mt-1">
                      <RichTextEditor
                        content={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                        placeholder="Digite o conteúdo da notícia com formatação..."
                      />
                    </div>
                  </div>

                  {/* Link YouTube */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Youtube className="h-4 w-4 text-red-500" />
                      Link YouTube (opcional)
                    </label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      className="mt-1"
                      style={{ fontSize: '16px' }}
                    />
                    {formData.youtubeUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(formData.youtubeUrl)}`}
                          className="w-full h-full"
                          allowFullScreen
                          title="Preview YouTube"
                        />
                      </div>
                    )}
                  </div>

                  {/* Imagem */}
                  <div>
                    <label className="text-sm font-medium">Imagem do Post (opcional)</label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        ref={fileInputRef}
                        className="flex-1"
                        style={{ fontSize: '16px' }}
                      />
                      {isUploading && (
                        <span className="text-sm text-muted-foreground flex items-center whitespace-nowrap">
                          Enviando...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Máximo 5MB. JPG, PNG, WebP</p>
                    {formData.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-40 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                          className="w-full text-xs text-red-600 py-1 hover:bg-red-50 transition-colors"
                        >
                          Remover imagem
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Publicar */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                      className="rounded border-gray-300 w-4 h-4"
                    />
                    <label htmlFor="published" className="text-sm font-medium">
                      Publicar imediatamente
                    </label>
                  </div>
                </form>
              </div>

              {/* Botões fixos no rodapé */}
              <div
                className="flex gap-2 justify-end px-6 py-4 border-t bg-background shrink-0"
                style={{ touchAction: 'pan-y' }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="post-form"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingId ? "Atualizar Post" : "Criar Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-3 bg-muted/30 rounded-lg p-4">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Buscar por título..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            className="max-w-xs"
            style={{ fontSize: '16px' }}
          />
          <div className="flex gap-1">
            {(["todos", "publicados", "rascunhos"] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de posts */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando posts...</div>
      ) : !filteredPosts?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Nenhum post encontrado</p>
          <p className="text-sm mt-1">Crie o primeiro post clicando em "Novo Post"</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[180px] truncate">{post.title}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {formatDateBR(new Date(post.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(post)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            await updateMutation.mutateAsync({
                              id: post.id,
                              title: post.title,
                              content: post.content,
                              imageUrl: post.imageUrl ?? null,
                              published: !post.published,
                            });
                            refetch();
                          } catch {}
                        }}
                        title={post.published ? "Despublicar" : "Publicar"}
                      >
                        {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        title="Deletar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}
