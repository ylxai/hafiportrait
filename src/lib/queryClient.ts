interface ApiRequestOptions {
  method: string;
  url: string;
  data?: FormData | Record<string, any>;
}

export async function apiRequest(method: string, url: string, data?: FormData | Record<string, any>) {
  const headers: HeadersInit = {};
  
  // Create AbortController for timeout handling
  const controller = new AbortController();
  
  // Set timeout based on request type
  const isFileUpload = data instanceof FormData;
  const timeoutMs = isFileUpload ? 120000 : 30000; // 2 minutes for uploads, 30s for regular requests
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const config: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  try {
    // Cek jika data yang dikirim adalah FormData (untuk upload file)
    if (data instanceof FormData) {
      // JANGAN atur 'Content-Type'. Biarkan browser yang melakukannya.
      config.body = data;
    } 
    // Untuk data JSON biasa (bukan GET)
    else if (data && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    // Clear timeout on successful response
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Coba dapatkan pesan error dari server untuk info yang lebih baik
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response;
    
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    // Handle abort/timeout errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutText = isFileUpload ? '2 minutes' : '30 seconds';
        throw new Error(`Request timeout after ${timeoutText}. Please try again with a smaller file or better internet connection.`);
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}