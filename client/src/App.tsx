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
import { useSessionRefresh } from "./hooks/useSessionRefresh";
import { useEffect } from "react";
import Home from "./pages/Home";
import Hymns from "./pages/Hymns";
import HymnDetail from "./pages/HymnDetail";
import Cfap2026 from "./pages/Cfap2026";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import CharlieMike from "./pages/CharlieMike";
import EducationCenter from "./pages/EducationCenter";
import EducationModule from "./pages/EducationModule";
import SyncStudio from "./pages/SyncStudio";
import Drill from "./pages/Drill";
import DrillDetail from "./pages/DrillDetail";
import BlogDetail from "./pages/BlogDetail";
import GradesLogin from "./pages/GradesLogin";
import Grades from "./pages/Grades";
import GradesManagement from "./pages/GradesManagement";
import Documents from "./pages/Documents";
import StudentProfilePage from "./pages/StudentProfile";
import XerifeSystemDocs from "./pages/XerifeSystemDocs";
import ServiceBoard from "./pages/ServiceBoard";
import ClassroomMap from "./pages/ClassroomMap";
import BottomNavigation from "./components/BottomNavigation";

function Router() {
  return (
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
      <Route path="/quadro-de-servico" component={ServiceBoard} />
      <Route path="/sala-de-aula" component={ClassroomMap} />
      <Route path="/sala-de-aula/:subview" component={ClassroomMap} />
      <Route path="/documentos" component={Documents} />
      <Route path="/xerife-system-docs" component={XerifeSystemDocs} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
  
  // Ativar auto-atualização silenciosa
  useAutoUpdate();
  
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
            <BottomNavigation />
            <OfflineIndicator />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
