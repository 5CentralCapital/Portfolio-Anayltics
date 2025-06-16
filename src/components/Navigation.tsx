import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/founder', label: 'Founder' },
    { path: '/vision', label: 'Vision' },
    { path: '/investor', label: 'Investor' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <Building2 className="h-8 w-8 text-primary group-hover:text-primary-light transition-colors" />
            <span className="text-xl font-bold text-primary">5Central Capital</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? 'text-primary border-b-2 border-primary' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/investor"
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Invest
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium py-2 px-4 rounded transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/investor"
                onClick={() => setIsOpen(false)}
                className="bg-primary text-white py-2 px-4 rounded font-semibold hover:bg-primary-dark transition-colors text-center"
              >
                Invest
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;