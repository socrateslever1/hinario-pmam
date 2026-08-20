import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function reloadAndClearCache() {
  try {
    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
        globalThis.location.reload();
      });
      return;
    }
  } catch {
    // ignore
  }
  globalThis.location?.reload();
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Importing a module script failed") ||
        this.state.error?.message?.includes("error loading dynamically imported module") ||
        this.state.error?.name === "ChunkLoadError";

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 text-center">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl font-bold mb-2">
              {isChunkError ? "Nova versão do aplicativo disponível!" : "Ocorreu um erro inesperado."}
            </h2>

            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {isChunkError
                ? "O aplicativo foi atualizado no servidor. Clique no botão abaixo para carregar a versão mais recente."
                : "Não se preocupe, recarregue a página para tentar novamente."}
            </p>

            <button
              onClick={reloadAndClearCache}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer shadow-lg transition-all"
              )}
            >
              <RotateCcw size={18} />
              Atualizar e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
