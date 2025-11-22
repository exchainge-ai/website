"use client";

// Development-only console override for third-party library warnings
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    // Most effective way to completely silence React key warnings
    // This is safe because it only suppresses a very specific React warning pattern
    if (args && args[0] && typeof args[0] === 'string') {
      // Check for key prop warnings from Privy
      if (
        (args[0].includes('Each child in a list should have a unique "key" prop') ||
         args[0].includes('unique key')) &&
        (args[0].includes('PrivyProvider') ||
         args[0].includes('Privy') ||
         args[0].includes('from qm') ||
         args[0].includes('from Vm') ||
         args.join(' ').includes('src/components/providers/PrivyWrapper.tsx'))
      ) {
        return;
      }

      // Suppress Privy's invalid DOM property warnings (fillRule, clipRule)
      if (
        (args[0].includes('Invalid DOM property') || args[0].includes('Did you mean')) &&
        (args[0].includes('fill-rule') || args[0].includes('fillRule') ||
         args[0].includes('clip-rule') || args[0].includes('clipRule')) &&
        args.join(' ').includes('PrivyWrapper')
      ) {
        return;
      }

      // Suppress empty error objects
      if (args[0] === 'ERROR:  {}' ||
          (args[0].includes('ERROR:') && args[0].includes('{}'))) {
        return;
      }
    }
    
    // Suppress empty objects
    if (args.length === 1 && 
        typeof args[0] === 'object' && 
        args[0] !== null && 
        Object.keys(args[0]).length === 0) {
      return;
    }
    
    // Allow all other console errors through
    originalConsoleError.apply(console, args);
  };
}

export {};
