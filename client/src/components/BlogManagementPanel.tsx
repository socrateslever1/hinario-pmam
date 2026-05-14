import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { formatDateBR } from "@/lib/formatDate";

export function BlogManagementPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    published: false,
  });

  // Queries
  const { data: posts, isLoading, refetch } = trpc.blog.list.useQuery({
    published: undefined,
  });

  // Mutations
  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setIsOpen(false);
    },
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      setIsOpen(false);
    },
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      imageUrl: "",
      published: false,
    });
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // Usar a API de upload do Manus
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const data = await response.json();
      setFormData({ ...formData, imageUrl: data.url });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Título e conteúdo são obrigatórios");
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
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          published: formData.published,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar post:", error);
      alert("Erro ao salvar post");
    }
  };

  const handleEdit = (post: any) => {
    setFormData({
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || "",
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
        alert("Erro ao deletar post");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, edite e publique notícias e avisos para a página inicial
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Post" : "Criar Novo Post"}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {editingId ? "editar o" : "criar um novo"} post
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Digite o título do post"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Conteúdo *</label>
                <Textarea
                  placeholder="Digite o conteúdo do post"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="mt-1 min-h-[200px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Imagem do Post</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    ref={fileInputRef}
                    className="flex-1"
                  />
                  {isUploading && (
                    <span className="text-sm text-muted-foreground flex items-center">
                      Enviando...
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 5MB. Formatos: JPG, PNG, WebP
                </p>
                {formData.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Publicar imediatamente
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
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
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingId ? "Atualizar" : "Criar"} Post
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Posts */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando posts...
                </TableCell>
              </TableRow>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateBR(new Date(post.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={post.published ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {post.published ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Rascunho
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(post.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhum post criado ainda
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
