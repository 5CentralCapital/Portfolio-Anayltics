import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/founder', label: 'Founder' },
    { path: '/vision', label: 'Vision' },
    { path: '/investor', label: 'Investor' },
  ];

  return (
    <nav className={`bg-white shadow-lg sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'shadow-xl backdrop-blur-sm bg-white/95' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <Building2 className="h-8 w-8 text-primary group-hover:text-blue-700 transition-colors duration-200" />
            <span className="text-xl font-bold text-primary group-hover:text-blue-700 transition-colors duration-200">
              5Central Capital
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 hover:text-primary relative ${
                  isActive(link.path) 
                    ? 'text-primary' 
                    : 'text-gray-700 hover:text-primary'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
                )}
              </Link>
            ))}
            <Link
              to="/investor"
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Invest
            </Link>
            <Link
              to="/admin-login"
              className="text-gray-700 hover:text-primary text-sm font-medium transition-all duration-200"
            >
              Log in
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary transition-colors duration-200 p-2"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="flex flex-col space-y-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-medium py-3 px-4 rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/investor"
              onClick={() => setIsOpen(false)}
              className="bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 text-center mt-2"
            >
              Invest
            </Link>
            <Link
              to="/admin-login"
              onClick={() => setIsOpen(false)}
              className="text-gray-700 hover:text-primary py-3 px-4 text-sm font-medium transition-all duration-200"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;