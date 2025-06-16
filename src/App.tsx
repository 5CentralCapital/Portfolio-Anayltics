import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Deals from './pages/Deals';
import Founder from './pages/Founder';
import Goals from './pages/Goals';
import Investor from './pages/Investor';
import InvestorPortal from './pages/InvestorPortal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/founder" element={<Founder />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/investor" element={<Investor />} />
            <Route path="/investor-portal" element={<InvestorPortal />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;