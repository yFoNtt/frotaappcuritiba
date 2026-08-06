import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

interface StartupFallbackProps {
  missingEnv?: string[];
  error?: unknown;
}

function StartupFallback({ missingEnv = [], error }: StartupFallbackProps) {
  const isConfigurationError = missingEnv.length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-xl rounded-lg border border-border bg-card p-7 shadow-lg" aria-labelledby="startup-error-title">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-xl font-bold text-destructive" aria-hidden="true">
            !
          </span>
          <h1 id="startup-error-title" className="text-xl font-semibold">
            {isConfigurationError ? "Configuração ausente" : "Não foi possível iniciar o aplicativo"}
          </h1>
        </div>

        {isConfigurationError ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O aplicativo não conseguiu iniciar porque variáveis do backend não estão configuradas neste build.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Configuração faltando:</p>
            <ul className="mt-2 list-inside list-disc font-mono text-sm text-destructive">
              {missingEnv.map((key) => <li key={key}>{key}</li>)}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Se você administra o FrotaApp, republique o projeto para incluir as variáveis do Lovable Cloud no build.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ocorreu um erro inesperado durante o carregamento. Recarregue a página para tentar novamente.
            </p>
            {import.meta.env.DEV && error instanceof Error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {error.message}
              </pre>
            )}
            <button
              type="button"
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Recarregar página
            </button>
          </>
        )}
      </section>
    </main>
  );
}

// Guard: se as variáveis de ambiente do backend não estiverem embutidas no
// bundle, o cliente Supabase explode com "supabaseUrl is required" na
// inicialização e a página fica em branco. Mostramos uma mensagem clara
// em vez de deixar o React quebrar silenciosamente.
async function bootstrap() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Elemento raiz "#root" não encontrado.');
  }

  const root = createRoot(rootElement);
  const missingEnv: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missingEnv.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missingEnv.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (missingEnv.length > 0) {
    root.render(<StartupFallback missingEnv={missingEnv} />);
    return;
  }

  try {
    const { default: App } = await import("./App.tsx");
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  } catch (error) {
    console.error("[Bootstrap Error]", error);
    root.render(<StartupFallback error={error} />);
  }
}

export const startup = bootstrap();
