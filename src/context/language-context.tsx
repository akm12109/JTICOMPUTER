"use client"

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import hn from '@/locales/hn.json';

type Language = 'en' | 'hi' | 'hn';

const translations = { en, hi, hn };

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getDescendantProp = (obj: any, desc: string): any => {
  const arr = desc.split('.');
  while (arr.length) {
    const next = arr.shift();
    if (next) {
       obj = obj[next];
       if (obj === undefined || obj === null) {
           return undefined;
       }
    }
  }
  return obj;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && ['en', 'hi', 'hn'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const translation = getDescendantProp(translations[language], key);
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
