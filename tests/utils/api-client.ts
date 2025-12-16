/**
 * API Client untuk Testing
 * Simplified API client untuk test automation
 */

export class TestApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.authToken = undefined;
  }

  /**
   * Make authenticated request
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * Authentication APIs
   */
  async login(username: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setAuthToken(data.token);
      return data;
    }
    
    throw new Error('Login failed');
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearAuth();
    return response;
  }

  async getCurrentUser() {
    const response = await this.request('/auth/me');
    return response.json();
  }

  /**
   * Event APIs
   */
  async getEvents(params?: { page?: number; limit?: number; status?: string }) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const response = await this.request(`/admin/events${queryString}`);
    return response.json();
  }

  async getEvent(id: string) {
    const response = await this.request(`/admin/events/${id}`);
    return response.json();
  }

  async createEvent(eventData: any) {
    const response = await this.request('/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    return response.json();
  }

  async updateEvent(id: string, eventData: any) {
    const response = await this.request(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    return response.json();
  }

  async deleteEvent(id: string) {
    const response = await this.request(`/admin/events/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  /**
   * Gallery APIs
   */
  async galleryAccess(eventSlug: string, accessCode: string, guestName: string) {
    const response = await this.request(`/gallery/${eventSlug}/access`, {
      method: 'POST',
      body: JSON.stringify({ accessCode, guestName }),
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setAuthToken(data.token);
      return data;
    }
    
    throw new Error('Gallery access failed');
  }

  async getGalleryPhotos(eventSlug: string, params?: { page?: number; limit?: number }) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const response = await this.request(`/gallery/${eventSlug}/photos${queryString}`);
    return response.json();
  }

  async likePhoto(eventSlug: string, photoId: string) {
    const response = await this.request(`/gallery/${eventSlug}/photos/${photoId}/like`, {
      method: 'POST',
    });
    return response.json();
  }

  async downloadPhoto(eventSlug: string, photoId: string) {
    const response = await this.request(`/gallery/${eventSlug}/photos/${photoId}/download`);
    return response.json();
  }

  async addComment(eventSlug: string, commentData: any) {
    const response = await this.request(`/gallery/${eventSlug}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return response.json();
  }

  /**
   * Photo Management APIs
   */
  async uploadPhoto(eventId: string, photoData: any) {
    const response = await this.request(`/admin/events/${eventId}/photos/upload`, {
      method: 'POST',
      body: JSON.stringify(photoData),
    });
    return response.json();
  }

  async updatePhoto(photoId: string, photoData: any) {
    const response = await this.request(`/admin/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify(photoData),
    });
    return response.json();
  }

  async deletePhoto(photoId: string) {
    const response = await this.request(`/admin/photos/${photoId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  async getTrashPhotos() {
    const response = await this.request('/admin/photos/trash');
    return response.json();
  }

  async restorePhoto(photoId: string) {
    const response = await this.request(`/admin/photos/${photoId}/restore`, {
      method: 'POST',
    });
    return response.json();
  }

  /**
   * Contact API
   */
  async submitContactForm(contactData: any) {
    const response = await this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
    return response.json();
  }

  /**
   * Analytics API
   */
  async getEventAnalytics(eventId: string) {
    const response = await this.request(`/admin/events/${eventId}/analytics`);
    return response.json();
  }

  /**
   * Health Check
   */
  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

export default TestApiClient;
