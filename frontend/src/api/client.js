const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.isApiError = true;
  }
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cleanup: () => clearTimeout(timeoutId) };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT) {
  const { signal, cleanup } = createTimeoutSignal(timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal,
    });
    return response;
  } finally {
    cleanup();
  }
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      // Retry on 5xx errors or network failures
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry if request was aborted (timeout) or it's the last attempt
      if (error.name === 'AbortError' || attempt === retries - 1) {
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;
  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const res = await fetchWithRetry(url, fetchOptions);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data.message || 'Request failed', res.status, data);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, {});
    }
    if (error.isApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error. Please check your connection.', 0, {});
  }
}

// Utility for file uploads with progress
export async function uploadFile(path, file, onProgress) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        let errorData;
        try {
          errorData = JSON.parse(xhr.responseText);
        } catch {
          errorData = { message: 'Upload failed' };
        }
        reject(new ApiError(errorData.message || 'Upload failed', xhr.status, errorData));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error during upload', 0, {}));
    });

    xhr.addEventListener('abort', () => {
      reject(new ApiError('Upload cancelled', 0, {}));
    });

    xhr.open('POST', `${API_BASE}${path}`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

export { ApiError };
