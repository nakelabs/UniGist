import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./components/TermsAndConditions";

const queryClient = new QueryClient();

const App = () => {
  const [termsAccepted, setTermsAccepted] = useState(true); // Default to true to prevent flash
  const [showTerms, setShowTerms] = useState(false); // To manually show terms

  useEffect(() => {
    // Check if terms have been accepted already
    const accepted = localStorage.getItem('termsAccepted') === 'true';
    setTermsAccepted(accepted);
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
    setTermsAccepted(true);
    setShowTerms(false);
  };

  // If terms haven't been accepted or we're explicitly showing terms, show the terms page
  if (!termsAccepted || showTerms) {
    return <TermsAndConditions 
      onAccept={handleAcceptTerms} 
      onClose={() => setShowTerms(false)} 
      alreadyAccepted={termsAccepted}
    />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="fixed bottom-4 right-4 z-50">
            <button 
              onClick={() => setShowTerms(true)}
              className="px-3 py-1 bg-gray-800 text-xs text-retro-neon-green font-pixel hover:bg-gray-700 rounded-md"
            >
              View Terms
            </button>
          </div>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
