import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import PortfolioCards from './pages/PortfolioCards';
import Founder from './pages/Founder';
import Vision from './pages/Vision';
import Investor from './pages/Investor';
import InvestorPortal from './pages/InvestorPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DealAnalysis from './pages/DealAnalysis';
import DealAnalysisSimple from './pages/DealAnalysisSimple';
import DealsList from './pages/DealsList';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-white flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio-cards" element={<PortfolioCards />} />
              <Route path="/deals" element={<Portfolio />} /> {/* Redirect old URL */}
              <Route path="/founder" element={<Founder />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/goals" element={<Vision />} /> {/* Redirect old URL */}
              <Route path="/investor" element={<Investor />} />
              <Route path="/investor-portal" element={<InvestorPortal />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/deals" element={<DealsList />} />
              <Route path="/deal-analysis/:id" element={<DealAnalysis />} />
              <Route path="/deal-demo" element={<DealAnalysisSimple />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;