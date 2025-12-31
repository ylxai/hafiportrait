export interface XhrUploadProgress {
  loaded: number;
  total: number;
  percent: number; // 0-100
}

export interface XhrUploadOptions {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  formData: FormData;
  withCredentials?: boolean;
  headers?: Record<string, string>;
  onProgress?: (progress: XhrUploadProgress) => void;
  signal?: AbortSignal;
}

export interface XhrUploadResponse {
  status: number;
  ok: boolean;
  responseText: string;
  json?: unknown;
}

/**
 * Upload via XHR to get upload progress events.
 * Note: fetch() does not provide upload progress in browsers.
 */
export function xhrUpload({
  url,
  method = 'POST',
  formData,
  withCredentials = true,
  headers = {},
  onProgress,
  signal,
}: XhrUploadOptions): Promise<XhrUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.withCredentials = withCredentials;

    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }

    const abortHandler = () => {
      xhr.abort();
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) {
        abortHandler();
        return;
      }
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const percent = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.({ loaded: evt.loaded, total: evt.total, percent });
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.onload = () => {
      const responseText = xhr.responseText ?? '';
      let json: unknown | undefined;
      try {
        json = responseText ? JSON.parse(responseText) : undefined;
      } catch {
        json = undefined;
      }

      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        responseText,
        json,
      });
    };

    xhr.send(formData);
  });
}
