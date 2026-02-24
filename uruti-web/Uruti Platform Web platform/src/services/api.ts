/**
 * API Client Service
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  data?: T;
  detail?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  full_name: string;
  password: string;
  role: 'founder' | 'investor' | 'mentor';
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

// Venture types
export interface Venture {
  id: number;
  founder_id: number;
  title: string;
  description?: string;
  industry?: string;
  stage?: string;
  pitch_score?: number;
  investment_score?: number;
  funding_target?: number;
  problem_statement?: string;
  solution?: string;
  target_market?: string;
  created_at?: string;
}

export interface VentureCreate {
  title: string;
  description?: string;
  industry?: string;
  stage?: string;
  funding_target?: number;
  problem_statement?: string;
  solution?: string;
  target_market?: string;
}

// Mentor types
export interface Mentor {
  id: number;
  user_id: number;
  expertise?: string;
  bio?: string;
  availability?: string;
  hourly_rate?: number;
  created_at?: string;
}

export interface Mentorship {
  id: number;
  mentor_id: number;
  mentee_id: number;
  status: string;
  started_at?: string;
  ended_at?: string;
}

// Deal types
export interface Deal {
  id: number;
  investor_id: number;
  venture_id: number;
  amount: number;
  equity_percentage?: number;
  status: 'interested' | 'negotiating' | 'completed' | 'declined';
  negotiation_notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Pitch types
export interface PitchSession {
  id: number;
  founder_id: number;
  venture_id?: number;
  pitch_text?: string;
  video_url?: string;
  duration?: number;
  overall_score?: number;
  delivery_score?: number;
  content_score?: number;
  engagement_score?: number;
  feedback?: string;
  created_at?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Generic fetch method
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    isFormData: boolean = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    // Handle request body
    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Auth Endpoints
   */
  async login(email: string, password: string): Promise<AuthToken> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/auth/login/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    this.setToken(result.access_token);
    return result;
  }

  async signup(data: SignupData): Promise<User> {
    return this.request<User>('POST', '/users/signup', data);
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('POST', '/auth/logout', {});
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('GET', '/users/me');
  }

  /**
   * Venture Endpoints
   */
  async createVenture(data: VentureCreate): Promise<Venture> {
    return this.request<Venture>('POST', '/ventures/', data);
  }

  async getVentures(): Promise<Venture[]> {
    return this.request<Venture[]>('GET', '/ventures/');
  }

  async getVenture(id: number): Promise<Venture> {
    return this.request<Venture>('GET', `/ventures/${id}`);
  }

  async updateVenture(id: number, data: Partial<VentureCreate>): Promise<Venture> {
    return this.request<Venture>('PUT', `/ventures/${id}`, data);
  }

  async deleteVenture(id: number): Promise<void> {
    return this.request<void>('DELETE', `/ventures/${id}`);
  }

  async discoverVentures(stage?: string, industry?: string): Promise<Venture[]> {
    const params = new URLSearchParams();
    if (stage) params.append('stage', stage);
    if (industry) params.append('industry', industry);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Venture[]>('GET', `/ventures/discover/all${query}`);
  }

  /**
   * Mentor Endpoints
   */
  async registerAsMentor(data: Partial<Mentor>): Promise<Mentor> {
    return this.request<Mentor>('POST', '/mentors/register', data);
  }

  async listMentors(expertise?: string): Promise<Mentor[]> {
    const query = expertise ? `?expertise=${expertise}` : '';
    return this.request<Mentor[]>('GET', `/mentors/list${query}`);
  }

  async requestMentorship(mentorId: number): Promise<Mentorship> {
    return this.request<Mentorship>('POST', '/mentors/request', { mentor_id: mentorId });
  }

  async getMyMentees(): Promise<Mentorship[]> {
    return this.request<Mentorship[]>('GET', '/mentors/my-mentees');
  }

  async getMyMentors(): Promise<Mentorship[]> {
    return this.request<Mentorship[]>('GET', '/mentors/my-mentors');
  }

  /**
   * Pitch Endpoints
   */
  async createPitchSession(data: Partial<PitchSession>): Promise<PitchSession> {
    return this.request<PitchSession>('POST', '/pitch/', data);
  }

  async getPitchSessions(): Promise<PitchSession[]> {
    return this.request<PitchSession[]>('GET', '/pitch/');
  }

  async getPitchSession(id: number): Promise<PitchSession> {
    return this.request<PitchSession>('GET', `/pitch/${id}`);
  }

  async updatePitchSession(id: number, data: Partial<PitchSession>): Promise<PitchSession> {
    return this.request<PitchSession>('PUT', `/pitch/${id}`, data);
  }

  async getPitchAnalytics(): Promise<any> {
    return this.request<any>('GET', '/pitch/performance/analytics');
  }

  /**
   * Deal Endpoints
   */
  async createDeal(data: Partial<Deal>): Promise<Deal> {
    return this.request<Deal>('POST', '/deals/', data);
  }

  async getMyInvestments(): Promise<Deal[]> {
    return this.request<Deal[]>('GET', '/deals/my-investments');
  }

  async getMyOffers(): Promise<Deal[]> {
    return this.request<Deal[]>('GET', '/deals/my-offers');
  }

  async updateDeal(id: number, data: Partial<Deal>): Promise<Deal> {
    return this.request<Deal>('PUT', `/deals/${id}`, data);
  }

  async getPortfolioSummary(): Promise<any> {
    return this.request<any>('GET', '/deals/portfolio/summary');
  }

  /**
   * Advisory Endpoints
   */
  async listAdvisoryTracks(category?: string): Promise<any[]> {
    const query = category ? `?category=${category}` : '';
    return this.request<any[]>('GET', `/advisory/tracks${query}`);
  }

  async enrollInTrack(trackId: number): Promise<any> {
    return this.request<any>('POST', '/advisory/enroll', { track_id: trackId });
  }

  async getMyEnrollments(): Promise<any[]> {
    return this.request<any[]>('GET', '/advisory/my-enrollments');
  }

  async updateEnrollment(enrollmentId: number, status: string, progress: number): Promise<any> {
    return this.request<any>(
      'PUT',
      `/advisory/enrollments/${enrollmentId}`,
      { status, progress_percentage: progress }
    );
  }

  /**
   * Scheduling Endpoints
   */
  async addAvailability(data: any): Promise<any> {
    return this.request<any>('POST', '/scheduling/availability', data);
  }

  async getAvailability(userId: number): Promise<any[]> {
    return this.request<any[]>('GET', `/scheduling/availability/${userId}`);
  }

  async scheduleSession(data: any): Promise<any> {
    return this.request<any>('POST', '/scheduling/sessions', data);
  }

  async getMyScheduledSessions(): Promise<any[]> {
    return this.request<any[]>('GET', '/scheduling/sessions/my-scheduled');
  }

  async getMentoringsessions(): Promise<any[]> {
    return this.request<any[]>('GET', '/scheduling/sessions/my-mentoring');
  }

  async updateSession(sessionId: number, status: string, notes?: string): Promise<any> {
    return this.request<any>('PUT', `/scheduling/sessions/${sessionId}`, {
      status,
      notes,
    });
  }

  /**
   * Settings Endpoints
   */
  async getSettings(): Promise<any> {
    return this.request<any>('GET', '/settings/settings');
  }

  async updateSettings(data: any): Promise<any> {
    return this.request<any>('PUT', '/settings/settings', data);
  }

  async updateNotificationPreferences(prefs: any): Promise<any> {
    return this.request<any>('POST', '/settings/settings/notification-preferences', prefs);
  }

  async updatePrivacySettings(data: any): Promise<any> {
    return this.request<any>('POST', '/settings/settings/privacy', data);
  }

  /**
   * Messages Endpoints
   */
  async getConversations(): Promise<any[]> {
    return this.request<any[]>('GET', '/messages/conversations');
  }

  async getMessages(conversationId: number): Promise<any[]> {
    return this.request<any[]>('GET', `/messages/conversation/${conversationId}`);
  }

  async sendMessage(recipientId: number, content: string): Promise<any> {
    return this.request<any>('POST', '/messages/', {
      recipient_id: recipientId,
      content,
    });
  }

  /**
   * Notifications Endpoints
   */
  async getNotifications(): Promise<any[]> {
    return this.request<any[]>('GET', '/notifications/');
  }

  async markNotificationAsRead(id: number): Promise<any> {
    return this.request<any>('PUT', `/notifications/${id}`, { is_read: true });
  }

  /**
   * Dashboard Endpoints
   */
  async getDashboard(role: 'founder' | 'investor'): Promise<any> {
    return this.request<any>('GET', '/dashboard/me');
  }

  /**
   * Profile Endpoints
   */
  async getProfile(): Promise<User & {
    bio?: string;
    avatar_url?: string;
    headline?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
    skills?: string;
    is_mentor?: boolean;
    expertise?: string;
    hourly_rate?: number;
  }> {
    return this.request('GET', '/profile/me');
  }

  async updateProfile(data: {
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    headline?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
    skills?: string;
    is_mentor?: boolean;
    expertise?: string;
    hourly_rate?: number;
  }): Promise<User> {
    return this.request<User>('PUT', '/profile/me', data);
  }

  /**
   * Password Reset Endpoints
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  }

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>('POST', '/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
