import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ScanBarcode from "./pages/ScanBarcode";
import Dashboard from "./pages/Dashboard";
import ClickSpark from './components/ClickSpark';

const queryClient = new QueryClient();

const App = () => (
  <ClickSpark sparkColor="#2563eb" sparkSize={12} sparkRadius={24} sparkCount={12} duration={500} extraScale={1.2}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results" element={<Results />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/scan-barcode" element={<ScanBarcode />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClickSpark>
);

export default App;
