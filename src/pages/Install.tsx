import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Apple, Smartphone, Share, Plus, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEO } from "@/components/SEO";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setDefaultTab("ios");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <PublicLayout>
      <SEO
        title="Instale o FrotaApp"
        description="Instale o FrotaApp Curitiba na tela inicial do seu celular. Acesso rápido, experiência de aplicativo nativo e funciona em qualquer Android ou iPhone."
        canonical="/instalar"
      />

      <section className="container py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            App Mobile
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Instale o FrotaApp no seu celular
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Acesso direto da tela inicial, abertura instantânea e experiência de app nativo.
            Funciona em qualquer iPhone ou Android — sem precisar baixar da loja.
          </p>

          {installed ? (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-success-soft px-5 py-2.5 text-sm font-semibold text-success-soft-foreground">
              <CheckCircle2 className="h-4 w-4" />
              App instalado neste dispositivo
            </div>
          ) : deferredPrompt ? (
            <Button size="lg" onClick={handleInstall} className="mt-8 gap-2 rounded-full">
              <Download className="h-5 w-5" />
              Instalar agora
            </Button>
          ) : null}
        </motion.div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Tabs value={defaultTab} onValueChange={(v) => setDefaultTab(v as "android" | "ios")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="android" className="gap-2">
                <Smartphone className="h-4 w-4" /> Android
              </TabsTrigger>
              <TabsTrigger value="ios" className="gap-2">
                <Apple className="h-4 w-4" /> iPhone / iPad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="android">
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>No Android (Chrome ou Edge)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <Step n={1}>
                    Toque no menu <span className="font-semibold text-foreground">⋮</span> no canto
                    superior direito do navegador.
                  </Step>
                  <Step n={2}>
                    Selecione{" "}
                    <span className="font-semibold text-foreground">
                      "Instalar app" ou "Adicionar à tela inicial"
                    </span>
                    .
                  </Step>
                  <Step n={3}>
                    Confirme tocando em <span className="font-semibold text-foreground">Instalar</span>.
                    Pronto! O ícone do FrotaApp aparece ao lado dos seus apps.
                  </Step>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ios">
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>No iPhone ou iPad (Safari)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <Step n={1}>
                    Toque no botão <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Share className="h-4 w-4" /> Compartilhar</span> na barra inferior.
                  </Step>
                  <Step n={2}>
                    Role para baixo e escolha{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Plus className="h-4 w-4" /> Adicionar à Tela de Início
                    </span>
                    .
                  </Step>
                  <Step n={3}>
                    Confirme tocando em <span className="font-semibold text-foreground">Adicionar</span>.
                    O FrotaApp passa a abrir como um app, em tela cheia.
                  </Step>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Benefit title="Abre em segundos" desc="Sem esperar carregar o navegador." />
            <Benefit title="Tela cheia" desc="Experiência de app nativo, sem barras." />
            <Benefit title="Sempre atualizado" desc="Recebe melhorias automaticamente." />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {n}
      </span>
      <p className="pt-0.5">{children}</p>
    </div>
  );
}

function Benefit({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
