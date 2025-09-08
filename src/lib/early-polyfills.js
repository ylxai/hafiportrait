// Early polyfills that must be loaded before any other modules
// This file should be imported at the very beginning of the application

// Ensure globalThis is available (Node.js 12+ compatibility)
if (typeof globalThis === 'undefined') {
  if (typeof global !== 'undefined') {
    global.globalThis = global;
  } else if (typeof window !== 'undefined') {
    window.globalThis = window;
  } else if (typeof self !== 'undefined') {
    self.globalThis = self;
  }
}

// Define self globally before any vendor code loads
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  if (typeof globalThis.global === 'undefined') {
    globalThis.global = globalThis;
  }
}

// Immediate polyfill injection for server environments
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Server-side environment - DO NOT create fake window object
  global.self = global;
  
  // Only create minimal document polyfill, NOT window
  global.document = global.document || {};
  
  // Ensure these are also available on globalThis
  if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
    globalThis.document = globalThis.document || {};
    // DO NOT set globalThis.window = globalThis on server
  }
}

console.log('Early polyfills loaded:', {
  hasGlobalThis: typeof globalThis !== 'undefined',
  hasSelf: typeof self !== 'undefined',
  hasGlobal: typeof global !== 'undefined',
  hasWindow: typeof window !== 'undefined'
});