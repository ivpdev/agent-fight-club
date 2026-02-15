import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AgentProvider } from "@/contexts/AgentContext";
import AgentScreen from "./pages/AgentScreen";
import HelpersScreen from "./pages/HelpersScreen";
import HelperDetailScreen from "./pages/HelperDetailScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AgentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AgentScreen />} />
            <Route path="/helpers" element={<HelpersScreen />} />
            <Route path="/helpers/:id" element={<HelperDetailScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AgentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
