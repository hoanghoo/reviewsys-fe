import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import logo from '../assets/logo.png';

const LoadingContext = createContext({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);

  const startLoading = () => setActiveRequests(prev => prev + 1);
  const stopLoading = () => setActiveRequests(prev => Math.max(0, prev - 1));

  useEffect(() => {
    // Add interceptors
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Skip loader if config has silent flag
        if (!config.silent) {
          startLoading();
        }
        return config;
      },
      (error) => {
        stopLoading();
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        if (!response.config?.silent) {
          stopLoading();
        }
        return response;
      },
      (error) => {
        if (!error.config?.silent) {
          stopLoading();
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const isLoading = activeRequests > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="relative flex items-center justify-center">
            {/* Spinning green gradient border */}
            <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-purple-600 border-r-purple-600 animate-spin"></div>
            {/* Centered logo */}
            <img 
              src={logo} 
              alt="Loading logo" 
              className="absolute w-14 h-14 object-contain animate-pulse" 
            />
          </div>
          <p className="mt-4 text-xs font-bold text-purple-700 tracking-wider uppercase animate-pulse">
            Đang tải dữ liệu...
          </p>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
