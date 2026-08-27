import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useAutoUpdate } from "./hooks/useAutoUpdate";
import { usePWA } from "./hooks/usePWA";
import { useOfflineCache } from "./hooks/useOfflineCache";
import { useBackgroundSync } from "./hooks/useBackgroundSync";
import { useBugleAudioCache } from "./hooks/useBugleAudioCache";
import { useSessionRefresh } from "./hooks/useSessionRefresh";
import { useSessionManager } from "./_core/hooks/useSessionManager";
import { Suspense, useEffect } from "react";
import BottomNavigation from "./components/BottomNavigation";
import { GlobalFOButton } from "./components/GlobalFOButton";
import { lazyWithRetry } from "./lib/lazyWithRetry";

const Home = lazyWithRetry(() => import("./pages/Home"));
const Hymns = lazyWithRetry(() => import("./pages/Hymns"));
const HymnDetail = lazyWithRetry(() => import("./pages/HymnDetail"));
const Cfap2026 = lazyWithRetry(() => import("./pages/Cfap2026"));
const CfapHistory = lazyWithRetry(() => import("./pages/CfapHistory"));
const CfapCommanderDetail = lazyWithRetry(() => import("./pages/CfapCommanderDetail"));
const About = lazyWithRetry(() => import("./pages/About"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const CharlieMike = lazyWithRetry(() => import("./pages/CharlieMike"));
const SyncStudio = lazyWithRetry(() => import("./pages/SyncStudio"));
const Drill = lazyWithRetry(() => import("./pages/Drill"));
const DrillDetail = lazyWithRetry(() => import("./pages/DrillDetail"));
const BlogDetail = lazyWithRetry(() => import("./pages/BlogDetail"));
const GradesLogin = lazyWithRetry(() => import("./pages/GradesLogin"));
const Grades = lazyWithRetry(() => import("./pages/Grades"));
const GradesManagement = lazyWithRetry(() => import("./pages/GradesManagement"));
const Documents = lazyWithRetry(() => import("./pages/Documents"));
const StudentProfilePage = lazyWithRetry(() => import("./pages/StudentProfile"));
const UserProfilePage = lazyWithRetry(() => import("./pages/UserProfile"));
const ServiceBoard = lazyWithRetry(() => import("./pages/ServiceBoard"));
const ClassroomMap = lazyWithRetry(() => import("./pages/ClassroomMap"));
const AdministrativeRoom = lazyWithRetry(() => import("./pages/AdministrativeRoom"));
const ChangePassword = lazyWithRetry(() => import("./pages/ChangePassword").then((module) => ({ default: module.ChangePassword })));
const AccessManagement = lazyWithRetry(() => import("./pages/AccessManagement").then((module) => ({ default: module.AccessManagement })));

function Router() {
  return (
    <Suspense fallback={<div className="grid min-h-[45vh] place-items-center text-sm font-semibold text-muted-foreground">Carregando…</div>}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hinos" component={Hymns} />
      <Route path="/charlie-mike" component={CharlieMike} />
      <Route path="/charlie-mike/:id">
        <HymnDetail catalog="charlie-mike" />
      </Route>
      <Route path="/hino/:id">
        <HymnDetail />
      </Route>
      <Route path="/cfap-2026" component={Cfap2026} />
      <Route path="/historia-cfap" component={CfapHistory} />
      <Route path="/historia-cfap/comandantes/:slug" component={CfapCommanderDetail} />
      <Route path="/drill" component={Drill} />
      <Route path="/drill/:id" component={DrillDetail} />
      <Route path="/blog/:id" component={BlogDetail} />
      <Route path="/sobre" component={About} />
      <Route path="/xerife" component={Admin} />
      <Route path="/admin/sync/:id" component={SyncStudio} />
      <Route path="/login" component={Login} />
      <Route path="/entrar" component={GradesLogin} />
      <Route path="/notas-do-curso" component={Grades} />
      <Route path="/lançar-notas" component={GradesManagement} />
      <Route path="/perfil-aluno" component={StudentProfilePage} />
      <Route path="/perfil" component={UserProfilePage} />
      <Route path="/quadro-de-servico" component={ServiceBoard} />
      <Route path="/sala-de-aula" component={ClassroomMap} />
      <Route path="/sala-de-aula/:subview" component={ClassroomMap} />
      <Route path="/sala-administrativa" component={AdministrativeRoom} />
      <Route path="/documentos" component={Documents} />
      <Route path="/alterar-senha" component={ChangePassword} />
      <Route path="/gerenciar-acessos">
        <AccessManagement />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
  useSessionRefresh();
  useSessionManager();
  useAutoUpdate();
  useOfflineCache();
  useBackgroundSync();
  useBugleAudioCache();

  const { precacheAssets } = usePWA();
  useEffect(() => {
    const assets = new Set<string>();

    document.querySelectorAll('script[src]').forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src && src.includes('/assets/')) assets.add(src);
    });

    document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href && href.includes('/assets/')) assets.add(href);
    });

    if (assets.size > 0) {
      console.log('[App] Sending', assets.size, 'assets to SW for pre-cache');
      precacheAssets(Array.from(assets));
    }
  }, [precacheAssets]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <div>
              <Router />
            </div>
            <GlobalFOButton />
            <BottomNavigation />
            <OfflineIndicator />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
