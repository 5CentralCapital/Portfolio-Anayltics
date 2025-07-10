import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalculationsProvider } from './contexts/CalculationsContext';
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
import AccountSetup from './pages/AccountSetup';
import DealAnalysis from './pages/DealAnalysis';
import DealAnalysisSimple from './pages/DealAnalysisSimple';
import DealAnalyzer from './pages/DealAnalyzer';
import DealsList from './pages/DealsList';

// Create a client with default fetcher
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalculationsProvider>
        <Router>
          <div className="min-h-screen bg-white flex flex-col">
            <Navigation />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio-cards" element={<PortfolioCards />} />
                <Route path="/founder" element={<Founder />} />
                <Route path="/vision" element={<Vision />} />
                <Route path="/goals" element={<Vision />} /> {/* Redirect old URL */}
                <Route path="/investor" element={<Investor />} />
                <Route path="/investor-portal" element={<InvestorPortal />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/account-setup" element={<AccountSetup />} />
                <Route path="/deals" element={<DealsList />} />
                <Route path="/deal-analysis/:id" element={<DealAnalysis />} />
                <Route path="/deal-demo" element={<DealAnalyzer />} />
                <Route path="/demo-deal" element={<DealAnalyzer />} />
                <Route path="/demodeal" element={<DealAnalyzer />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CalculationsProvider>
    </QueryClientProvider>
  );
}

export default App;