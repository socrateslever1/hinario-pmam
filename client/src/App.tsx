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
import { useSessionRefresh } from "./hooks/useSessionRefresh";
import { useSessionManager } from "./_core/hooks/useSessionManager";
import { lazy, Suspense, useEffect } from "react";
import BottomNavigation from "./components/BottomNavigation";
import { GlobalFOButton } from "./components/GlobalFOButton";

const Home = lazy(() => import("./pages/Home"));
const Hymns = lazy(() => import("./pages/Hymns"));
const HymnDetail = lazy(() => import("./pages/HymnDetail"));
const Cfap2026 = lazy(() => import("./pages/Cfap2026"));
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const CharlieMike = lazy(() => import("./pages/CharlieMike"));
const EducationCenter = lazy(() => import("./pages/EducationCenter"));
const EducationModule = lazy(() => import("./pages/EducationModule"));
const SyncStudio = lazy(() => import("./pages/SyncStudio"));
const Drill = lazy(() => import("./pages/Drill"));
const DrillDetail = lazy(() => import("./pages/DrillDetail"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const GradesLogin = lazy(() => import("./pages/GradesLogin"));
const Grades = lazy(() => import("./pages/Grades"));
const GradesManagement = lazy(() => import("./pages/GradesManagement"));
const Documents = lazy(() => import("./pages/Documents"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfile"));
const UserProfilePage = lazy(() => import("./pages/UserProfile"));
const XerifeSystemDocs = lazy(() => import("./pages/XerifeSystemDocs"));
const ServiceBoard = lazy(() => import("./pages/ServiceBoard"));
const ClassroomMap = lazy(() => import("./pages/ClassroomMap"));
const AdministrativeRoom = lazy(() => import("./pages/AdministrativeRoom"));
const ChangePassword = lazy(() => import("./pages/ChangePassword").then((module) => ({ default: module.ChangePassword })));
const AccessManagement = lazy(() => import("./pages/AccessManagement").then((module) => ({ default: module.AccessManagement })));

function Router() {
  return (
    <Suspense fallback={<div className="grid min-h-[45vh] place-items-center text-sm font-semibold text-muted-foreground">Carregando…</div>}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hinos" component={Hymns} />
      <Route path="/charlie-mike" component={CharlieMike} />
      <Route path="/hino/:id" component={HymnDetail} />
      <Route path="/estudos" component={EducationCenter} />
      <Route path="/estudos/:slug" component={EducationModule} />
      <Route path="/cfap-2026" component={Cfap2026} />
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
      <Route path="/xerife-system-docs" component={XerifeSystemDocs} />
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
  // Renovar sessão automaticamente
  useSessionRefresh();
  
  // Gerenciar sessão em background
  useSessionManager();
  
  // Ativar auto-atualização silenciosa
  useAutoUpdate();
  
  // Pré-cachear dados críticos para offline
  useOfflineCache();
  
  // Sincronizar em background quando voltar online
  useBackgroundSync();

  // Baixar e manter os toques e dobrados disponíveis com conexão lenta/offline
  
  // Pré-cachear assets para offline
  const { precacheAssets } = usePWA();
  useEffect(() => {
    // Coletar todos os scripts e links carregados
    const assets = new Set<string>();
    
    // Scripts
    document.querySelectorAll('script[src]').forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src && src.includes('/assets/')) {
        assets.add(src);
      }
    });
    
    // Stylesheets
    document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href && href.includes('/assets/')) {
        assets.add(href);
      }
    });
    
    // Enviar para Service Worker pré-cachear
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
