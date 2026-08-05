import { createContext, useContext } from 'react';

export const ContentAdminContext = createContext(null);

export function useContentAdmin() {
  const context = useContext(ContentAdminContext);
  if (!context) {
    throw new Error('useContentAdmin must be used within ContentAdminProvider');
  }
  return context;
}

export function useOptionalContentAdmin() {
  return useContext(ContentAdminContext);
}
