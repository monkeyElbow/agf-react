export function isCalculatorRoutePath(pathname) {
  const value = String(pathname || '').trim();
  return value === '/calculators' || value.startsWith('/calculators/');
}
