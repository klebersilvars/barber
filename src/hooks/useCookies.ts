import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export const useCookies = () => {
  const [cookiesAccepted, setCookiesAccepted] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Carregar preferências salvas do localStorage
    const savedAcceptance = localStorage.getItem('cookiesAccepted');
    const savedPreferences = localStorage.getItem('cookiePreferences');
    
    if (savedAcceptance === 'true') {
      setCookiesAccepted(true);
    }
    
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(parsedPreferences);
      } catch (error) {
        console.error('Erro ao carregar preferências de cookies:', error);
      }
    }
  }, []);

  const acceptAllCookies = () => {
    const allPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(allPreferences));
    setCookiesAccepted(true);
    setPreferences(allPreferences);
  };

  const acceptNecessaryCookies = () => {
    const necessaryPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(necessaryPreferences));
    setCookiesAccepted(true);
    setPreferences(necessaryPreferences);
  };

  const updatePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(newPreferences));
    setCookiesAccepted(true);
    setPreferences(newPreferences);
  };

  const resetCookies = () => {
    localStorage.removeItem('cookiesAccepted');
    localStorage.removeItem('cookiePreferences');
    setCookiesAccepted(false);
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  };

  const isCookieEnabled = (type: keyof CookiePreferences): boolean => {
    return preferences[type];
  };

  return {
    cookiesAccepted,
    preferences,
    acceptAllCookies,
    acceptNecessaryCookies,
    updatePreferences,
    resetCookies,
    isCookieEnabled,
  };
}; 