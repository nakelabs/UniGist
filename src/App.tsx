import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useHeartbeat();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* The Boss Admin Routes */}
            <Route path="/theboss" element={<Admin />} />
            <Route path="/TheBoss" element={<Admin />} />
            <Route path="/Theboss" element={<Admin />} />
            <Route path="/the-boss" element={<Admin />} />
            <Route path="/The-Boss" element={<Admin />} />
            <Route path="/boss" element={<Admin />} />
            <Route path="/Boss" element={<Admin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/admin-secure-access-2025" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
