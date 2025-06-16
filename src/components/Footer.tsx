import React from 'react';
import { Building2, MapPin, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-6 w-6" />
              <span className="text-lg font-bold">5Central Capital LLC</span>
            </div>
            <p className="text-gray-300 mb-4">
              Strategic multifamily investments with aggressive value creation in Tampa, Florida.
            </p>
            <div className="flex items-center space-x-2 text-gray-300">
              <MapPin className="h-4 w-4" />
              <span>Tampa, FL</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="/portfolio" className="block text-gray-300 hover:text-white transition-colors">
                Portfolio
              </a>
              <a href="/founder" className="block text-gray-300 hover:text-white transition-colors">
                About Michael
              </a>
              <a href="/goals" className="block text-gray-300 hover:text-white transition-colors">
                Our Goals
              </a>
              <a href="/investor" className="block text-gray-300 hover:text-white transition-colors">
                Investor Information
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>contact@5central.capital</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
          <p>© 2024 5Central Capital LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;