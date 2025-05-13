import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import MainMenu from "@/pages/mainMenu";
import HeroSelection from "@/pages/heroSelection";
import Battle from "@/pages/battle";
import MatchResults from "@/pages/matchResults";
import { useEffect } from "react";
import { useGameState } from "./hooks/useGameState";
import { useWebSocket } from "./hooks/useWebSocket";

function Router() {
  const [location, setLocation] = useLocation();
  const { gameState } = useGameState();
  const { connectionStatus } = useWebSocket();

  // Redirect based on game state
  useEffect(() => {
    if (connectionStatus === 'connected') {
      if (gameState.isLoggedIn && location === '/') {
        setLocation('/main-menu');
      } else if (!gameState.isLoggedIn && location !== '/') {
        setLocation('/');
      }

      if (gameState.currentPhase === 'drafting' && location !== '/hero-selection') {
        setLocation('/hero-selection');
      } else if (gameState.currentPhase === 'battle' && location !== '/battle') {
        setLocation('/battle');
      } else if (gameState.currentPhase === 'complete' && location !== '/match-results') {
        setLocation('/match-results');
      }
    }
  }, [gameState.isLoggedIn, gameState.currentPhase, location, connectionStatus, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/main-menu" component={MainMenu} />
      <Route path="/hero-selection" component={HeroSelection} />
      <Route path="/battle" component={Battle} />
      <Route path="/match-results" component={MatchResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
