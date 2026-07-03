
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Cabinet from "./pages/Cabinet";
import SupplierProfile from "./pages/SupplierProfile";
import Suppliers from "./pages/Suppliers";
import Products from "./pages/Products";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Logistics from "./pages/Logistics";
import Feed from "./pages/Feed";
import Admin from "./pages/Admin";
import BuyerCabinet from "./pages/BuyerCabinet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/supplier/:id" element={<SupplierProfile />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<BuyerCabinet />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;