const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY;
const TENOR_BASE_URL = 'https://tenor.googleapis.com/v2';



export interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif: {
      url: string;
      dims: [number, number];
      size: number;
    };
    tinygif: {
      url: string;
      dims: [number, number];
      size: number;
    };
    mp4: {
      url: string;
      dims: [number, number];
      size: number;
    };
  };
  created: number;
  content_description: string;
  itemurl: string;
  url: string;
  tags: string[];
  flags: string[];
}

export interface TenorSearchResponse {
  results: TenorGif[];
  next: string;
}

export async function searchTenorGifs(
  query: string,
  limit: number = 20,
  pos?: string
): Promise<TenorSearchResponse> {
  if (!TENOR_API_KEY) {
    throw new Error('Tenor API key is not configured');
  }

  const params = new URLSearchParams({
    q: query,
    key: TENOR_API_KEY,
    limit: limit.toString(),
    client_key: 'my-fancy-app',
    ...(pos && { pos }),
  });

  const url = `${TENOR_BASE_URL}/search?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Tenor API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getTrendingGifs(limit: number = 20): Promise<TenorSearchResponse> {
  if (!TENOR_API_KEY) {
    throw new Error('Tenor API key is not configured');
  }

  // Since trending endpoint doesn't exist, we'll use a popular search term
  const params = new URLSearchParams({
    q: 'trending',
    key: TENOR_API_KEY,
    limit: limit.toString(),
    client_key: 'my-fancy-app',
  });

  const url = `${TENOR_BASE_URL}/search?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Tenor API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function copyGifToClipboard(gifUrl: string): Promise<void> {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(gifUrl);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = gifUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
        throw new Error('Copy failed');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    throw error;
  }
}

export function downloadGif(gifUrl: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = gifUrl;
  link.download = filename || 'tenor-gif.gif';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
