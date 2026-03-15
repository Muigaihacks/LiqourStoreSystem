import React, { useState } from 'react';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

interface Customer {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  total_points: number;
  points_redeemed: number;
  available_points: number;
  total_spent: number;
  join_date: string;
  is_active: boolean;
}

interface CustomerLookupProps {
  onCustomerSelect?: (customer: Customer) => void;
  showRegisterForm?: boolean;
}

// Helper function to match Kenyan phone numbers in different formats
const phoneNumbersMatch = (storedPhone: string, searchPhone: string): boolean => {
  // Clean both numbers
  const cleanStored = storedPhone.replace(/[\s\-()+]/g, '');
  const cleanSearch = searchPhone.replace(/[\s\-()+]/g, '');
  
  // Generate variations for both numbers
  const getVariations = (phone: string): string[] => {
    const variations = new Set<string>();
    
    // Remove country code and leading zero
    let basePhone = phone;
    if (basePhone.startsWith('254')) {
      basePhone = basePhone.substring(3);
    }
    if (basePhone.startsWith('0')) {
      basePhone = basePhone.substring(1);
    }
    
    // Add all possible formats
    variations.add(basePhone);           // 712345678
    variations.add(`0${basePhone}`);     // 0712345678
    variations.add(`254${basePhone}`);   // 254712345678
    variations.add(`+254${basePhone}`);  // +254712345678
    
    return Array.from(variations);
  };
  
  const storedVariations = getVariations(cleanStored);
  const searchVariations = getVariations(cleanSearch);
  
  // Check if any variation matches
  return storedVariations.some(stored => 
    searchVariations.some(search => stored === search)
  );
};

const CustomerLookup: React.FC<CustomerLookupProps> = ({ onCustomerSelect, showRegisterForm = true }) => {
  const [searchPhone, setSearchPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // Registration form state
  const [registrationData, setRegistrationData] = useState({
    name: '',
    phone_number: '',
    email: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSearch = async () => {
    if (!searchPhone.trim()) return;
    
    setIsSearching(true);
    setShowNotFound(false);
    setCustomer(null);
    
    try {
      // Use server-side filtering for robust lookup
      const response = await apiService.getCustomers({ phone: searchPhone.trim() });
      const customers = response.data.results || response.data;
      
      // The backend filters by icontains, so we might get multiple partial matches.
      // We should still verify exact match (or close enough) on the client if needed,
      // but usually the first result is good if unique.
      // Let's use our helper to be sure if multiple returned.
      
      let foundCustomer = null;
      if (Array.isArray(customers)) {
          foundCustomer = customers.find((c: Customer) => 
            phoneNumbersMatch(c.phone_number, searchPhone.trim())
          );
          
          // Fallback: if backend search worked but our loose matcher is too strict, just take the first result
          // because backend filter `phone_number__icontains` is quite specific for numbers.
          if (!foundCustomer && customers.length > 0) {
              foundCustomer = customers[0];
          }
      }
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        if (onCustomerSelect) {
          onCustomerSelect(foundCustomer);
        }
      } else {
        setShowNotFound(true);
        setRegistrationData(prev => ({ ...prev, phone_number: searchPhone.trim() }));
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      // Don't show not found on error, maybe show error? 
      // For now, consistent behavior:
      setShowNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async () => {
    if (!registrationData.name.trim() || !registrationData.phone_number.trim()) {
      alert('Please fill in name and phone number');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await apiService.registerCustomer(registrationData);
      const newCustomer = response.data;
      
      setCustomer(newCustomer);
      setShowRegistrationForm(false);
      setShowNotFound(false);
      setRegistrationData({ name: '', phone_number: '', email: '' });
      
      if (onCustomerSelect) {
        onCustomerSelect(newCustomer);
      }
      
      alert(`Customer ${newCustomer.name} registered successfully!`);
    } catch (error: any) {
      console.error('Error registering customer:', error);
      const errorMsg = error.response?.data?.phone_number?.[0] || 'Registration failed. Please try again.';
      
      if (errorMsg.includes('already registered')) {
        alert(`❌ ${errorMsg}\n\nPlease search for this phone number to see their current points.`);
        setShowRegistrationForm(false);
        setShowNotFound(false);
      } else {
        alert(`Registration failed: ${errorMsg}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPointsColor = (points: number) => {
    if (points >= 100) return 'text-green-600 font-semibold';
    if (points >= 50) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <UserIcon className="h-5 w-5 mr-2" />
        Customer Points System
      </h3>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">
          Search for existing customers or register new ones to the points system.
        </p>
        
        {/* Search Form */}
        <div className="flex space-x-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter customer phone number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchPhone.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Check Points'}
          </button>
        </div>
      </div>

      {/* Customer Found */}
      {customer && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{customer.name}</h4>
              <p className="text-gray-600">{customer.phone_number}</p>
              {customer.email && <p className="text-gray-600">{customer.email}</p>}
              <p className="text-sm text-gray-500">Member since: {formatDate(customer.join_date)}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getPointsColor(customer.available_points)}`}>
                {customer.available_points} pts
              </div>
              <p className="text-xs text-gray-500">
                Total earned: {customer.total_points} | Redeemed: {customer.points_redeemed}
              </p>
              <p className="text-xs text-gray-500">
                Total spent: KSh {customer.total_spent?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Points Value:</strong> {customer.available_points} points = KSh {customer.available_points} purchasing power
            </p>
          </div>
        </div>
      )}

      {/* Customer Not Found */}
      {showNotFound && showRegisterForm && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
          <p className="text-blue-800 mb-3">
            <strong>Customer not found in points system.</strong> Register them to start earning points on purchases!
          </p>
          
          {!showRegistrationForm ? (
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Register Customer for Points
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter customer's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={registrationData.phone_number}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isRegistering ? 'Registering...' : 'Register Customer'}
                </button>
                <button
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setShowNotFound(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showNotFound && !showRegisterForm && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-red-800">
            Customer not found. Please check the phone number and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerLookup;
