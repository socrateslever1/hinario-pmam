import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
      <Route path="/sobre" component={About} />
      <Route path="/xerife" component={Admin} />
      <Route path="/admin/sync/:id" component={SyncStudio} />
      <Route path="/login" component={Login} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
