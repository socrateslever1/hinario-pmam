import { useRef, useState, useCallback, useEffect } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Node, mergeAttributes } from "@tiptap/core";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading2,
  Heading3,
  Quote,
  Code,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./RichTextEditor.css";

// ─── Componente React para renderizar imagem com alças de resize ─────────────
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, align, float: floatVal } = node.attrs as {
    src: string;
    alt?: string;
    width?: number;
    align?: string;
    float?: string;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const currentWidth = width || 100;

  // Estilos do wrapper externo (controla float/alinhamento)
  const wrapperStyle: React.CSSProperties = {};
  if (floatVal === "left") {
    wrapperStyle.float = "left";
    wrapperStyle.marginRight = "1rem";
    wrapperStyle.marginBottom = "0.5rem";
    wrapperStyle.clear = "none";
  } else if (floatVal === "right") {
    wrapperStyle.float = "right";
    wrapperStyle.marginLeft = "1rem";
    wrapperStyle.marginBottom = "0.5rem";
    wrapperStyle.clear = "none";
  } else {
    wrapperStyle.float = "none";
    wrapperStyle.clear = "both";
    if (align === "center") {
      wrapperStyle.display = "flex";
      wrapperStyle.justifyContent = "center";
    } else if (align === "right") {
      wrapperStyle.display = "flex";
      wrapperStyle.justifyContent = "flex-end";
    } else {
      wrapperStyle.display = "block";
    }
  }

  const onMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = imgRef.current?.offsetWidth || 300;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const containerWidth = containerRef.current?.parentElement?.offsetWidth || 600;
        const delta = ev.clientX - startX.current;
        const newPx = Math.max(80, startWidth.current + delta);
        const newPct = Math.min(100, Math.round((newPx / containerWidth) * 100));
        updateAttributes({ width: newPct });
      };

      const onMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [updateAttributes]
  );

  // Touch resize
  const onTouchStartResize = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      isResizing.current = true;
      startX.current = touch.clientX;
      startWidth.current = imgRef.current?.offsetWidth || 300;

      const onTouchMove = (ev: TouchEvent) => {
        if (!isResizing.current) return;
        const t = ev.touches[0];
        const containerWidth = containerRef.current?.parentElement?.offsetWidth || 600;
        const delta = t.clientX - startX.current;
        const newPx = Math.max(80, startWidth.current + delta);
        const newPct = Math.min(100, Math.round((newPx / containerWidth) * 100));
        updateAttributes({ width: newPct });
      };

      const onTouchEnd = () => {
        isResizing.current = false;
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper
      as="span"
      style={{
        ...wrapperStyle,
        display: floatVal ? "inline-block" : wrapperStyle.display,
        maxWidth: "100%",
      }}
      data-drag-handle
    >
      <span
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
          width: `${currentWidth}%`,
          maxWidth: "100%",
          outline: selected ? "2px solid #c4a84b" : "none",
          borderRadius: "0.375rem",
          cursor: "default",
          userSelect: "none",
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "0.375rem",
          }}
          draggable={false}
        />

        {/* Alça de resize no canto inferior direito */}
        {selected && (
          <span
            onMouseDown={onMouseDownResize}
            onTouchStart={onTouchStartResize}
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              background: "#c4a84b",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "se-resize",
              zIndex: 10,
            }}
          />
        )}

        {/* Alça de resize no canto inferior esquerdo */}
        {selected && (
          <span
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isResizing.current = true;
              startX.current = e.clientX;
              startWidth.current = imgRef.current?.offsetWidth || 300;

              const onMouseMove = (ev: MouseEvent) => {
                if (!isResizing.current) return;
                const containerWidth = containerRef.current?.parentElement?.offsetWidth || 600;
                const delta = startX.current - ev.clientX; // invertido
                const newPx = Math.max(80, startWidth.current + delta);
                const newPct = Math.min(100, Math.round((newPx / containerWidth) * 100));
                updateAttributes({ width: newPct });
              };
              const onMouseUp = () => {
                isResizing.current = false;
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              };
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
            style={{
              position: "absolute",
              bottom: -6,
              left: -6,
              width: 14,
              height: 14,
              background: "#c4a84b",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "sw-resize",
              zIndex: 10,
            }}
          />
        )}
      </span>
    </NodeViewWrapper>
  );
}

// ─── Extensão TipTap customizada com atributos de alinhamento/float/width ────
const ResizableImage = Node.create({
  name: "resizableImage",
  group: "inline",
  inline: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: null },
      width: { default: 100 },
      align: { default: "center" },
      float: { default: "none" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (el) => {
          const img = el as HTMLImageElement;
          const style = img.getAttribute("style") || "";
          let width = 100;
          let align = "center";
          let floatVal = "none";

          const wMatch = style.match(/width:\s*([\d.]+)%/);
          if (wMatch) width = parseFloat(wMatch[1]);

          const floatMatch = style.match(/float:\s*(\w+)/);
          if (floatMatch) floatVal = floatMatch[1];

          const marginMatch = style.match(/margin:\s*0\s+auto/);
          if (marginMatch) align = "center";

          const mlMatch = style.match(/margin-left:\s*auto/);
          const mrMatch = style.match(/margin-right:\s*auto/);
          if (mlMatch && mrMatch) align = "center";
          else if (mlMatch) align = "right";
          else if (mrMatch) align = "left";

          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") || "",
            title: img.getAttribute("title"),
            width,
            align,
            float: floatVal,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, float: floatVal, src, alt, title } = HTMLAttributes;
    const w = width || 100;
    let styleStr = `width: ${w}%; height: auto; display: block; border-radius: 0.375rem;`;

    if (floatVal && floatVal !== "none") {
      styleStr += ` float: ${floatVal};`;
      if (floatVal === "left") styleStr += " margin-right: 1rem; margin-bottom: 0.5rem;";
      if (floatVal === "right") styleStr += " margin-left: 1rem; margin-bottom: 0.5rem;";
    } else {
      if (align === "center") styleStr += " margin-left: auto; margin-right: auto;";
      else if (align === "right") styleStr += " margin-left: auto; margin-right: 0;";
      else styleStr += " margin-left: 0; margin-right: auto;";
    }

    return ["img", mergeAttributes({ src, alt, title, style: styleStr })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

// ─── Props do componente ──────────────────────────────────────────────────────
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  postId?: number;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Escreva seu conteúdo aqui...",
  postId,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageAttrs, setSelectedImageAttrs] = useState<{
    align: string;
    float: string;
    width: number;
    alt: string;
  } | null>(null);

  const uploadImageMutation = trpc.blog.uploadImage.useMutation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      ResizableImage,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const node = editor.state.doc.nodeAt(selection.from);
      if (node?.type.name === "resizableImage") {
        setSelectedImageAttrs({
          align: node.attrs.align || "center",
          float: node.attrs.float || "none",
          width: node.attrs.width || 100,
          alt: node.attrs.alt || "",
        });
      } else {
        setSelectedImageAttrs(null);
      }
    },
  });

  // Sincronizar selectedImageAttrs quando o editor muda
  useEffect(() => {
    if (!editor) return;
    const { selection } = editor.state;
    const node = editor.state.doc.nodeAt(selection.from);
    if (node?.type.name === "resizableImage") {
      setSelectedImageAttrs({
        align: node.attrs.align || "center",
        float: node.attrs.float || "none",
        width: node.attrs.width || 100,
        alt: node.attrs.alt || "",
      });
    }
  }, [editor?.state]);

  if (!editor) return null;

  // ── Helpers para atualizar atributos da imagem selecionada ──────────────────
  const updateSelectedImage = (attrs: Record<string, unknown>) => {
    if (!editor) return;
    const { selection } = editor.state;
    const node = editor.state.doc.nodeAt(selection.from);
    if (node?.type.name !== "resizableImage") return;

    editor
      .chain()
      .focus()
      .updateAttributes("resizableImage", attrs)
      .run();

    setSelectedImageAttrs((prev) =>
      prev ? { ...prev, ...(attrs as Partial<typeof prev>) } : prev
    );
  };

  const setImageAlign = (align: string) => updateSelectedImage({ align, float: "none" });
  const setImageFloat = (floatVal: string) => updateSelectedImage({ float: floatVal });

  // ── Upload de arquivo ───────────────────────────────────────────────────────
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadImageMutation.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
        postId,
        alignment: "center",
        sizePercent: 100,
      });

      editor
        .chain()
        .focus()
        .insertContent({
          type: "resizableImage",
          attrs: { src: result.url, alt: file.name, width: 100, align: "center", float: "none" },
        })
        .run();
    } catch (err) {
      console.error("Erro ao fazer upload da imagem:", err);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const addImageByUrl = () => {
    const url = window.prompt("Insira a URL da imagem:");
    if (url) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "resizableImage",
          attrs: { src: url, alt: "", width: 100, align: "center", float: "none" },
        })
        .run();
    }
  };

  const addLink = () => {
    const url = window.prompt("Insira a URL do link:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  // ── Toolbar de imagem selecionada ───────────────────────────────────────────
  const ImageToolbar = () => {
    if (!selectedImageAttrs) return null;
    const { align, float: floatVal, width, alt } = selectedImageAttrs;

    return (
      <div className="image-toolbar">
        <span className="image-toolbar-label">Imagem:</span>

        {/* Alinhamento (sem float) */}
        <div className="toolbar-group" title="Alinhamento centralizado">
          <Button
            type="button"
            size="sm"
            variant={align === "left" && floatVal === "none" ? "default" : "outline"}
            onClick={() => setImageAlign("left")}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={align === "center" && floatVal === "none" ? "default" : "outline"}
            onClick={() => setImageAlign("center")}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={align === "right" && floatVal === "none" ? "default" : "outline"}
            onClick={() => setImageAlign("right")}
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Float / Texto ao redor */}
        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant={floatVal === "left" ? "default" : "outline"}
            onClick={() => setImageFloat("left")}
            title="Texto ao redor — imagem à esquerda"
            className="text-xs px-2"
          >
            ⬛◻ Esq
          </Button>
          <Button
            type="button"
            size="sm"
            variant={floatVal === "right" ? "default" : "outline"}
            onClick={() => setImageFloat("right")}
            title="Texto ao redor — imagem à direita"
            className="text-xs px-2"
          >
            ◻⬛ Dir
          </Button>
          <Button
            type="button"
            size="sm"
            variant={floatVal === "none" ? "default" : "outline"}
            onClick={() => updateSelectedImage({ float: "none" })}
            title="Sem float (bloco)"
            className="text-xs px-2"
          >
            Bloco
          </Button>
        </div>

        {/* Tamanho */}
        <div className="toolbar-group" style={{ alignItems: "center", gap: "0.25rem" }}>
          <span className="text-xs text-gray-500">Largura:</span>
          {[25, 50, 75, 100].map((pct) => (
            <Button
              key={pct}
              type="button"
              size="sm"
              variant={width === pct ? "default" : "outline"}
              onClick={() => updateSelectedImage({ width: pct })}
              className="text-xs px-2"
              title={`${pct}% da largura`}
            >
              {pct}%
            </Button>
          ))}
        </div>

        {/* Alt text */}
        <div className="toolbar-group" style={{ alignItems: "center", gap: "0.25rem" }}>
          <span className="text-xs text-gray-500">Alt:</span>
          <input
            type="text"
            value={alt}
            onChange={(e) => updateSelectedImage({ alt: e.target.value })}
            placeholder="Texto alternativo"
            className="text-xs border border-gray-300 rounded px-2 py-1"
            style={{ width: 120 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="rich-text-editor">
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      {/* Toolbar principal */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("bold") ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("italic") ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("blockquote") ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("codeBlock") ? "default" : "outline"}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Bloco de código"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addLink}
            title="Adicionar link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Enviar imagem do dispositivo (máx 5MB)"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addImageByUrl}
            title="Inserir imagem por URL"
            className="text-xs px-2"
          >
            URL
          </Button>
        </div>

        <div className="toolbar-group">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().undo().run()}
            title="Desfazer"
          >
            ↶
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().redo().run()}
            title="Refazer"
          >
            ↷
          </Button>
        </div>
      </div>

      {/* Toolbar contextual de imagem (aparece quando imagem está selecionada) */}
      <ImageToolbar />

      <EditorContent
        editor={editor}
        className="editor-content"
        data-placeholder={placeholder}
      />
    </div>
  );
}
