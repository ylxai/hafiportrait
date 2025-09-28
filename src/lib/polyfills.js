// Enhanced polyfills for server-side rendering and vendor chunks
if (typeof globalThis !== 'undefined') {
  // Ensure self is defined globally
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  
  // Ensure global is defined
  if (typeof globalThis.global === 'undefined') {
    globalThis.global = globalThis;
  }
  
  // DO NOT create window polyfill - causes Next.js routing issues
  
  // Document polyfill for SSR
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {};
  }
}

// Fallback for older environments
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  if (typeof self === 'undefined') {
    global.self = global;
  }
}