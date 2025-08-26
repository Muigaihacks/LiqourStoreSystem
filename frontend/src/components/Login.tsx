import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import loginBackground from '../assets/images/login-background.jpeg';
import liquorIcon from '../assets/icons/liqour-icon.png';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading = false, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin(username.trim(), password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Custom Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBackground})` }}
      ></div>
      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 p-2">
            {/* Custom Liquor Icon */}
            <img 
              src={liquorIcon} 
              alt="Liquor Store Icon" 
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Liquor Store Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Sign in to access the system
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white border-opacity-30 placeholder-gray-300 text-white bg-white bg-opacity-10 rounded-t-md focus:outline-none focus:ring-2 focus:ring-white focus:border-white focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-white border-opacity-30 placeholder-gray-300 text-white bg-white bg-opacity-10 rounded-b-md focus:outline-none focus:ring-2 focus:ring-white focus:border-white focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-300" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-300">
              Demo credentials: <span className="font-medium text-white">admin / admin123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
