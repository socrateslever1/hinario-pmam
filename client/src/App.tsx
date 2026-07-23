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
import { useEffect } from "react";
import { getStudentSession, STUDENT_SESSION_CHANGED } from "@/lib/studentSession";
import "@/styles/role-visibility.css";
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
import UserProfilePage from "./pages/UserProfile";
import XerifeSystemDocs from "./pages/XerifeSystemDocs";
import ServiceBoard from "./pages/ServiceBoard";
import ClassroomMap from "./pages/ClassroomMap";
import AdministrativeRoom from "./pages/AdministrativeRoom";
import { ChangePassword } from "./pages/ChangePassword";
import { AccessManagement } from "./pages/AccessManagement";
import BottomNavigation from "./components/BottomNavigation";
import { GlobalFOButton } from "./components/GlobalFOButton";

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
      <Route path="/perfil" component={UserProfilePage} />
      <Route path="/quadro-de-servico" component={ServiceBoard} />
      <Route path="/sala-de-aula" component={ClassroomMap} />
      <Route path="/sala-de-aula/:subview" component={ClassroomMap} />
      <Route path="/sala-administrativa" component={AdministrativeRoom} />
      <Route path="/documentos" component={Documents} />
      <Route path="/xerife-system-docs" component={XerifeSystemDocs} />
      <Route path="/alterar-senha" component={ChangePassword} />
      <Route path="/gerenciar-acessos"><AccessManagement /></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => window.scrollTo(0, 0), [location]);
  return null;
}

function StudentVisualMode() {
  useEffect(() => {
    const sync = () => {
      document.body.classList.toggle("qg-student-view", Boolean(getStudentSession()));
    };
    sync();
    window.addEventListener(STUDENT_SESSION_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      document.body.classList.remove("qg-student-view");
      window.removeEventListener(STUDENT_SESSION_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return null;
}

function App() {
  useSessionRefresh();
  useSessionManager();
  useAutoUpdate();
  useOfflineCache();
  useBackgroundSync();

  const { precacheAssets } = usePWA();
  useEffect(() => {
    const assets = new Set<string>();
    document.querySelectorAll("script[src]").forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes("/assets/")) assets.add(src);
    });
    document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href.includes("/assets/")) assets.add(href);
    });
    if (assets.size > 0) precacheAssets(Array.from(assets));
  }, [precacheAssets]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <StudentVisualMode />
            <Router />
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