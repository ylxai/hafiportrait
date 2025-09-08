interface ApiRequestOptions {
  method: string;
  url: string;
  data?: FormData | Record<string, any>;
}

export async function apiRequest(method: string, url: string, data?: FormData | Record<string, any>) {
  const headers: HeadersInit = {};
  const config: RequestInit = {
    method,
    headers,
  };

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

  if (!response.ok) {
    // Coba dapatkan pesan error dari server untuk info yang lebih baik
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response;
}