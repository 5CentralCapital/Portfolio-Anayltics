import React from 'react';
import { Building2, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="h-8 w-8" />
              <span className="text-2xl font-bold">5Central Capital LLC</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 text-lg leading-relaxed max-w-md">
              Strategic multifamily real estate investments with exceptional value creation 
              and transparent performance reporting across Florida and Connecticut markets.
            </p>
            <div className="flex items-center space-x-3 text-primary-foreground/80">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span>Tampa, Florida</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
            <div className="space-y-3">
              <a 
                href="/portfolio" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200 flex items-center group"
              >
                <span>Portfolio</span>
                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="/founder" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200 flex items-center group"
              >
                <span>About Michael</span>
                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="/vision" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200 flex items-center group"
              >
                <span>Our Vision</span>
                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="/investor" 
                className="block text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200 flex items-center group"
              >
                <span>Investor Information</span>
                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-primary-foreground/80">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a 
                  href="mailto:contact@5central.capital" 
                  className="hover:text-primary-foreground transition-colors duration-200"
                >
                  contact@5central.capital
                </a>
              </div>
              <div className="flex items-center space-x-3 text-primary-foreground/80">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>Available by appointment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-foreground/80 text-center md:text-left">
              © {currentYear} 5Central Capital LLC. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-primary-foreground/80">
              <div className="flex space-x-6">
                <span>Professional Real Estate Investment</span>
                <span>•</span>
                <span>Tampa, FL</span>
              </div>
              <div className="hidden md:block">
                <a
                  href="/admin-login"
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 text-xs opacity-60 hover:opacity-100"
                  title="Administrator Access"
                >
                  Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;