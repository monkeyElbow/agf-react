import { createContext, useContext } from 'react';

export const FrontHudContext = createContext({
  enabled: false,
  opacity: 15,
  revealToken: 0,
  setEnabled: () => {},
  setOpacity: () => {},
});

export function useFrontHud() {
  return useContext(FrontHudContext);
}
