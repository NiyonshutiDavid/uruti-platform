// API Client Configuration for Uruti Digital Ecosystem
// Connects frontend to FastAPI backend

import config from './config';

const API_BASE_URL = config.apiUrl;
const CHATBOT_BASE_URL = config.chatbotApiUrl;

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private chatbotBaseUrl: string;

  constructor(baseUrl: string) {
    const normalized = baseUrl.replace(/\/+$/, '');
    this.baseUrl = normalized.endsWith('/api/v1')
      ? normalized.replace(/\/api\/v1$/, '')
      : normalized;

    const chatbotNormalized = CHATBOT_BASE_URL.replace(/\/+$/, '');
    this.chatbotBaseUrl = chatbotNormalized.endsWith('/api/v1')
      ? chatbotNormalized.replace(/\/api\/v1$/, '')
      : chatbotNormalized;
  }

  private getAuthToken(): string | null {
    // Use sessionStorage ONLY for per-tab token isolation
    // Never fall back to localStorage as it would cause cross-tab conflicts
    return sessionStorage.getItem('uruti_token');
  }

  private getHeaders(requiresAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private toAbsoluteMediaUrl(url?: string | null): string | null {
    if (!url) {
      return null;
    }

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }

    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private normalizeUserMedia<T extends Record<string, any>>(payload: T): T {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    return {
      ...payload,
      avatar_url: this.toAbsoluteMediaUrl(payload.avatar_url) || payload.avatar_url,
      cover_image_url: this.toAbsoluteMediaUrl(payload.cover_image_url) || payload.cover_image_url,
    };
  }

  private normalizeVentureMedia<T extends Record<string, any>>(payload: T): T {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    return {
      ...payload,
      logo_url: this.toAbsoluteMediaUrl(payload.logo_url) || payload.logo_url,
      banner_url: this.toAbsoluteMediaUrl(payload.banner_url) || payload.banner_url,
      pitch_deck_url: this.toAbsoluteMediaUrl(payload.pitch_deck_url) || payload.pitch_deck_url,
      demo_video_url: this.toAbsoluteMediaUrl(payload.demo_video_url) || payload.demo_video_url,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const rawBody = await response.text();
      if (!rawBody.trim()) {
        return undefined as T;
      }
      return JSON.parse(rawBody) as T;
    }

    return response.text() as any;
  }

  private isLocalhostBase(baseUrl: string): boolean {
    try {
      const parsed = new URL(baseUrl);
      return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }

  private withPort(baseUrl: string, port: number): string {
    const parsed = new URL(baseUrl);
    parsed.port = String(port);
    return parsed.origin;
  }

  private candidateBaseUrls(baseUrl: string, endpoint: string): string[] {
    const candidates: string[] = [baseUrl];
    if (!this.isLocalhostBase(baseUrl)) {
      return candidates;
    }

    const isAiEndpoint = endpoint.startsWith('/api/v1/ai');
    // Only AI endpoints should probe the dedicated chatbot service port.
    // Core endpoints (ventures, meetings, connections, etc.) must stay on core backend ports.
    const ports = isAiEndpoint ? [8020, 8010, 8000] : [8010, 8000];
    for (const port of ports) {
      try {
        const candidate = this.withPort(baseUrl, port);
        if (!candidates.includes(candidate)) {
          candidates.push(candidate);
        }
      } catch {
        // Keep existing candidates when URL parsing fails.
      }
    }

    return candidates;
  }

  private async fetchWithFallback<T>(
    baseUrl: string,
    endpoint: string,
    fetchConfig: RequestInit,
  ): Promise<T> {
    const candidates = this.candidateBaseUrls(baseUrl, endpoint);
    let lastError: unknown = null;

    for (const candidateBase of candidates) {
      const url = `${candidateBase}${endpoint}`;
      try {
        const response = await fetch(url, fetchConfig);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error;
        console.warn('⚠️ Fetch candidate failed:', { url, error });
      }
    }

    throw lastError ?? new Error('Failed to fetch from all configured API endpoints');
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchConfig } = config;

    const headers = this.getHeaders(requiresAuth);

    const isFormDataBody = typeof FormData !== 'undefined' && fetchConfig.body instanceof FormData;
    if (isFormDataBody) {
      delete (headers as Record<string, string>)['Content-Type'];
    }

    console.log('🌐 Fetching:', {
      baseUrl: this.baseUrl,
      endpoint,
      method: fetchConfig.method || 'GET',
      headers,
      body: fetchConfig.body ? '(data present)' : '(no body)'
    });

    try {
      return await this.fetchWithFallback<T>(this.baseUrl, endpoint, {
        ...fetchConfig,
        headers: {
          ...headers,
          ...fetchConfig.headers,
        },
      });
    } catch (error) {
      console.error('🔴 Fetch error:', { baseUrl: this.baseUrl, endpoint, error });
      throw error;
    }
  }

  async requestAgainstBase<T>(
    baseUrl: string,
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchConfig } = config;

    const headers = this.getHeaders(requiresAuth);

    const isFormDataBody = typeof FormData !== 'undefined' && fetchConfig.body instanceof FormData;
    if (isFormDataBody) {
      delete (headers as Record<string, string>)['Content-Type'];
    }

    return this.fetchWithFallback<T>(baseUrl, endpoint, {
      ...fetchConfig,
      headers: {
        ...headers,
        ...fetchConfig.headers,
      },
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    console.log('🔵 API Client - Login request:', { 
      email, 
      endpoint: '/api/v1/auth/login',
      baseUrl: this.baseUrl,
      fullUrl: `${this.baseUrl}/api/v1/auth/login`
    });
    
    try {
      const result = await this.request<{ access_token: string; token_type: string }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      console.log('✅ API Client - Login successful');
      return result;
    } catch (error) {
      console.error('❌ API Client - Login failed:', error);
      throw error;
    }
  }

  async requestQrLogin() {
    return this.request<{
      request_id: string;
      code: string;
      status: string;
      expires_at: string;
      qr_payload: string;
    }>('/api/v1/auth/qr/request', {
      method: 'POST',
    });
  }

  async getQrLoginStatus(requestId: string, code: string) {
    return this.request<{
      request_id: string;
      status: string;
      expires_at?: string;
      access_token?: string;
      token_type?: string;
      detail?: string;
    }>(`/api/v1/auth/qr/status/${encodeURIComponent(requestId)}?code=${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  }

  async signup(data: {
    email: string;
    full_name: string;
    password: string;
    role: string;
  }) {
    return this.request<any>(
      '/api/v1/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getCurrentUser() {
    const user = await this.request<any>('/api/v1/auth/me', {
      requiresAuth: true,
    });
    return this.normalizeUserMedia(user);
  }

  async logout() {
    return this.request<any>('/api/v1/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  }

  // User endpoints
  async getUsers(skip: number = 0, limit: number = 100) {
    const users = await this.request<any[]>(`/api/v1/users/?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
    return users.map((u) => this.normalizeUserMedia(u));
  }

  async getUserById(userId: number) {
    const user = await this.request<any>(`/api/v1/users/${userId}`, {
      requiresAuth: true,
    });
    return this.normalizeUserMedia(user);
  }

  async updateUser(userId: number, data: any) {
    return this.request<any>(`/api/v1/users/${userId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async createUserAsAdmin(data: {
    email: string;
    full_name: string;
    password: string;
    role: 'founder' | 'investor' | 'admin';
  }) {
    return this.request<any>('/api/v1/users/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async searchUsers(query: string, skip: number = 0, limit: number = 100) {
    return this.request<any[]>(`/api/v1/users/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
  }

  async getOnlineUserIds(): Promise<number[]> {
    return this.request<number[]>('/api/v1/users/online-ids', {
      requiresAuth: true,
    });
  }

  async getUserStats(): Promise<{
    total: number;
    founders: number;
    investors: number;
    admins: number;
  }> {
    return this.request<{
      total: number;
      founders: number;
      investors: number;
      admins: number;
    }>('/api/v1/users/stats', {
      requiresAuth: true,
    });
  }

  async deleteUserAsAdmin(userId: number) {
    return this.request<void>(`/api/v1/users/${userId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async updateUserAsAdmin(userId: number, data: {
    email?: string;
    full_name?: string;
    role?: 'founder' | 'investor' | 'admin';
    is_active?: boolean;
    password?: string;
  }) {
    return this.request<any>(`/api/v1/users/${userId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateAdminCredentials(data: { email: string; current_password: string; new_password: string }) {
    return this.request<any>('/api/v1/users/me/credentials', {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  // Venture endpoints
  async getVentures(skip: number = 0, limit: number = 100) {
    const ventures = await this.request<any[]>(`/api/v1/ventures/?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
    return (ventures || []).map((venture) => this.normalizeVentureMedia(venture));
  }

  async getVentureById(ventureId: number) {
    const venture = await this.request<any>(`/api/v1/ventures/${ventureId}`, {
      requiresAuth: true,
    });
    return this.normalizeVentureMedia(venture);
  }

  async createVenture(data: any) {
    const venture = await this.request<any>('/api/v1/ventures/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
    return this.normalizeVentureMedia(venture);
  }

  async getMyVentures(skip: number = 0, limit: number = 100) {
    const ventures = await this.request<any[]>(`/api/v1/ventures/my-ventures?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
    return (ventures || []).map((venture) => this.normalizeVentureMedia(venture));
  }

  async updateVenture(ventureId: number, data: any) {
    const venture = await this.request<any>(`/api/v1/ventures/${ventureId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
    return this.normalizeVentureMedia(venture);
  }

  async analyzeVenture(ventureId: number) {
    const venture = await this.request<any>(`/api/v1/ventures/${ventureId}/analyze`, {
      method: 'POST',
      requiresAuth: true,
    });
    return this.normalizeVentureMedia(venture);
  }

  async getAdminModelPerformance() {
    return this.request<any>('/api/v1/ventures/admin/model-performance', {
      requiresAuth: true,
    });
  }

  async deleteVenture(ventureId: number) {
    return this.request<any>(`/api/v1/ventures/${ventureId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  // Dashboard endpoints
  async getFounderDashboard() {
    return this.request<any>('/api/v1/dashboard/founder', {
      requiresAuth: true,
    });
  }

  async getInvestorDashboard() {
    return this.request<any>('/api/v1/dashboard/investor', {
      requiresAuth: true,
    });
  }

  async getAdminDashboard() {
    return this.request<any>('/api/v1/dashboard/admin', {
      requiresAuth: true,
    });
  }

  // Deals endpoints
  async getDeals(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/api/v1/deals/${query}`, {
      requiresAuth: true,
    });
  }

  async getDealById(dealId: number) {
    return this.request<any>(`/api/v1/deals/${dealId}`, {
      requiresAuth: true,
    });
  }

  async createDeal(data: any) {
    return this.request<any>('/api/v1/deals/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateDeal(dealId: number, data: any) {
    return this.request<any>(`/api/v1/deals/${dealId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  // Bookmarks endpoints
  async getBookmarks() {
    return this.request<any[]>('/api/v1/bookmarks/', {
      requiresAuth: true,
    });
  }

  async getBookmarkedVentures() {
    const bookmarks = await this.getBookmarks();
    // Flatten: extract the nested venture object from each bookmark, normalize media URLs
    return (bookmarks || []).map((b: any) => {
      const v = this.normalizeVentureMedia(b.venture || {});
      return { ...v, bookmarked: true, bookmark_id: b.id, bookmark_notes: b.notes, bookmark_tags: b.tags };
    }).filter((v: any) => v.id); // exclude bookmarks with missing/deleted ventures
  }

  async createBookmark(ventureId: number) {
    return this.request<any>('/api/v1/bookmarks/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ venture_id: ventureId }),
    });
  }

  async bookmarkVenture(ventureId: number) {
    return this.createBookmark(ventureId); // Alias for better clarity
  }

  async deleteBookmark(ventureId: number) {
    const bookmarks = await this.getBookmarks();
    const matchingBookmark = (bookmarks || []).find((bookmark: any) => bookmark?.venture_id === ventureId || bookmark?.venture?.id === ventureId);

    if (!matchingBookmark?.id) {
      throw new Error('Bookmark not found for selected venture');
    }

    return this.request<any>(`/api/v1/bookmarks/${matchingBookmark.id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async removeBookmark(ventureId: number) {
    return this.deleteBookmark(ventureId); // Alias for better clarity
  }

  // Messages endpoints
  async getInboxMessages(skip: number = 0, limit: number = 100) {
    return this.request<any[]>(`/api/v1/messages/inbox?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
  }

  async getSentMessages(skip: number = 0, limit: number = 100) {
    return this.request<any[]>(`/api/v1/messages/sent?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
  }

  async getConversations() {
    return this.request<any[]>('/api/v1/messages/inbox', {
      requiresAuth: true,
    });
  }

  async getMessages(userId: number, skip: number = 0, limit: number = 50) {
    const [inbox, sent] = await Promise.all([
      this.getInboxMessages(skip, limit),
      this.getSentMessages(skip, limit),
    ]);

    const merged = [...inbox, ...sent].filter((message: any) => (
      Number(message.sender_id) === Number(userId) || Number(message.receiver_id) === Number(userId)
    ));

    merged.sort((left: any, right: any) => {
      const a = new Date(left.created_at).getTime();
      const b = new Date(right.created_at).getTime();
      return a - b;
    });

    return merged;
  }

  async sendMessage(recipientId: number, content: string, attachments?: string[]) {
    return this.request<any>('/api/v1/messages/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({
        receiver_id: recipientId,
        body: content,
        ...(attachments ? { attachments } : {}),
      }),
    });
  }

  async uploadMessageAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/api/v1/messages/attachments/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return this.handleResponse<{ file_name: string; url: string; content_type: string; size: number }>(response);
  }

  async markAsRead(messageId: number) {
    return this.request<any>(`/api/v1/messages/${messageId}/read`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async deleteMessage(messageId: number) {
    return this.request<void>(`/api/v1/messages/${messageId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async deleteMessageThread(otherUserId: number) {
    return this.request<void>(`/api/v1/messages/threads/${otherUserId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async sendCallSignal(data: {
    receiver_id: number;
    action:
      | 'invite'
      | 'accept'
      | 'decline'
      | 'end'
      | 'webrtc_offer'
      | 'webrtc_answer'
      | 'webrtc_ice';
    call_id: string;
    is_video?: boolean;
    handle?: string;
    webrtc_data?: Record<string, unknown>;
  }) {
    return this.request<any>('/api/v1/messages/call/signal', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async consumePendingCallSignals() {
    return this.request<Array<{ event: string; data: Record<string, unknown> }>>('/api/v1/messages/call/pending', {
      requiresAuth: true,
    });
  }

  // Notifications endpoints
  async getNotifications(skip: number = 0, limit: number = 50) {
    return this.request<any[]>(`/api/v1/notifications?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
  }

  async markNotificationAsRead(notificationId: number) {
    return this.request<any>(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/api/v1/notifications/read-all', {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async deleteNotification(notificationId: number) {
    return this.request<any>(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  // Mentors endpoints
  async getMentors() {
    return this.request<any[]>('/api/v1/mentors/', {
      requiresAuth: true,
    });
  }

  async getMentorById(mentorId: number) {
    return this.request<any>(`/api/v1/mentors/${mentorId}`, {
      requiresAuth: true,
    });
  }

  // Scheduling endpoints
  async getAvailability(userId: number, weekStart?: string) {
    const query = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : '';
    return this.request<any[]>(`/api/v1/availability/${userId}${query}`, {
      requiresAuth: true,
    });
  }

  async getMyAvailability() {
    return this.request<any[]>('/api/v1/availability/my-slots', {
      requiresAuth: true,
    });
  }

  async createAvailability(data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }) {
    return this.request<any>('/api/v1/availability/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateAvailability(slotId: number, data: { is_available?: boolean }) {
    return this.request<any>(`/api/v1/availability/${slotId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async deleteAvailability(slotId: number) {
    return this.request<void>(`/api/v1/availability/${slotId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async getMeetings() {
    return this.request<any[]>('/api/v1/meetings/', {
      requiresAuth: true,
    });
  }

  async getUpcomingMeetings(days: number = 7) {
    return this.request<any[]>(`/api/v1/meetings/calendar/upcoming?days=${days}`, {
      requiresAuth: true,
    });
  }

  async createMeeting(data: any) {
    return this.request<any>('/api/v1/meetings/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateMeetingStatus(meetingId: number, status: string) {
    return this.request<any>(`/api/v1/meetings/${meetingId}/status`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify({ status }),
    });
  }

  async acceptMeeting(meetingId: number) {
    return this.request<any>(`/api/v1/meetings/${meetingId}/accept`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async rejectMeeting(meetingId: number) {
    return this.request<any>(`/api/v1/meetings/${meetingId}/reject`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async initiateCall(userId: number, type: 'video' | 'voice') {
    return this.request<any>('/api/v1/meetings/', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({
        participant_id: userId,
        title: `${type === 'video' ? 'Video' : 'Voice'} Call`,
        description: `Instant ${type} call`,
        meeting_type: type,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        meeting_url: type === 'video' ? `https://meet.uruti.rw/${Math.random().toString(36).substr(2, 9)}` : undefined
      }),
    });
  }

  // Pitch Performance endpoints
  async getPitchAnalyses() {
    return this.request<any[]>('/api/v1/pitch/analyses', {
      requiresAuth: true,
    });
  }

  async createPitchAnalysis(data: any) {
    return this.request<any>('/api/v1/pitch/analyses', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async getPitchLiveFeedback(data: {
    venture_id: number;
    pitch_type: string;
    duration_seconds: number;
    target_duration_seconds: number;
    current_slide: number;
    total_slides: number;
    slide_transitions: Array<{ slide: number; atSecond: number }>;
    transcript?: string;
  }) {
    return this.request<{
      tips: string[];
      metrics: {
        pacing: number;
        clarity: number;
        confidence: number;
        engagement: number;
        structure: number;
      };
      model_backend?: string;
      model_loaded?: boolean;
      model_error?: string | null;
    }>('/api/v1/pitch/live-feedback', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async deletePitchAnalysis(sessionId: string | number) {
    return this.request<void>(`/api/v1/pitch/analyses/${sessionId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  // Advisory endpoints
  async getAdvisoryTracks() {
    return this.request<any[]>('/api/v1/advisory/tracks', {
      requiresAuth: true,
    });
  }

  async getAdminAdvisoryTracks() {
    return this.request<any[]>('/api/v1/advisory/admin/tracks', {
      requiresAuth: true,
    });
  }

  async getAdvisoryTrackById(trackId: number) {
    return this.request<any>(`/api/v1/advisory/tracks/${trackId}`, {
      requiresAuth: true,
    });
  }

  async createAdvisoryTrack(data: any) {
    return this.request<any>('/api/v1/advisory/admin/tracks', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateAdvisoryTrack(trackId: number, data: any) {
    return this.request<any>(`/api/v1/advisory/admin/tracks/${trackId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async deleteAdvisoryTrack(trackId: number) {
    return this.request<any>(`/api/v1/advisory/admin/tracks/${trackId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async getUserTrackProgress(trackId: number) {
    return this.request<any>(`/api/v1/advisory/tracks/${trackId}/progress`, {
      requiresAuth: true,
    });
  }

  async markMaterialComplete(trackId: number, materialId: number) {
    return this.request<any>(`/api/v1/advisory/tracks/${trackId}/materials/${materialId}/complete`, {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async unmarkMaterialComplete(trackId: number, materialId: number) {
    return this.request<any>(`/api/v1/advisory/tracks/${trackId}/materials/${materialId}/complete`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async getAdvisoryMaterials(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<any[]>(`/api/v1/advisory/materials${query}`, {
      requiresAuth: true,
    });
  }

  async getAdvisoryMaterialById(materialId: number) {
    return this.request<any>(`/api/v1/advisory/materials/${materialId}`, {
      requiresAuth: true,
    });
  }

  async createAdvisoryMaterial(data: any) {
    return this.request<any>('/api/v1/advisory/materials', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateAdvisoryMaterial(materialId: number, data: any) {
    return this.request<any>(`/api/v1/advisory/materials/${materialId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async deleteAdvisoryMaterial(materialId: number) {
    return this.request<any>(`/api/v1/advisory/materials/${materialId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async trackMaterialProgress(materialId: number, progress: number) {
    return this.request<any>(`/api/v1/advisory/materials/${materialId}/progress`, {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ progress }),
    });
  }

  // Profile endpoints
  async updateProfile(data: any) {
    const user = await this.request<any>('/api/v1/users/me', {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
    return this.normalizeUserMedia(user);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/api/v1/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await this.handleResponse<any>(response);
    if (result?.avatar_url) {
      result.avatar_url = this.toAbsoluteMediaUrl(result.avatar_url);
    }
    return result;
  }

  async uploadCoverImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/api/v1/profile/cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await this.handleResponse<any>(response);
    if (result?.cover_image_url) {
      result.cover_image_url = this.toAbsoluteMediaUrl(result.cover_image_url);
    }
    return result;
  }

  async uploadPitchVideo(
    ventureId: number,
    file: File,
    metadata: {
      pitch_type: string;
      duration: number;
      target_duration: number;
      notes?: string;
    },
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pitch_type', metadata.pitch_type);
    formData.append('duration', metadata.duration.toString());
    formData.append('target_duration', metadata.target_duration.toString());
    if (metadata.notes && metadata.notes.trim().length > 0) {
      formData.append('notes', metadata.notes.trim());
    }

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/api/v1/ventures/${ventureId}/pitch-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return this.handleResponse<any>(response);
  }

  async uploadVentureLogo(ventureId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/api/v1/ventures/${ventureId}/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await this.handleResponse<any>(response);
    return this.normalizeVentureMedia(result);
  }

  async uploadVentureBanner(ventureId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/api/v1/ventures/${ventureId}/banner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await this.handleResponse<any>(response);
    return this.normalizeVentureMedia(result);
  }

  // Support endpoints (Customer Support)
  async getSupportMessages(skip: number = 0, limit: number = 100) {
    return this.request<any[]>(`/api/v1/support/messages?skip=${skip}&limit=${limit}`, {
      requiresAuth: true,
    });
  }

  async getPublicSupportMessages(visitorEmail: string, skip: number = 0, limit: number = 100) {
    return this.request<any[]>(`/api/v1/support/messages/public?visitor_email=${encodeURIComponent(visitorEmail)}&skip=${skip}&limit=${limit}`);
  }

  async createSupportMessage(data: { visitor_name: string; visitor_email: string; message: string }) {
    return this.request<any>('/api/v1/support/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async respondToSupportMessage(messageId: number, response: string) {
    return this.request<any>(`/api/v1/support/messages/${messageId}/respond`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify({ response }),
    });
  }

  async closeSupportMessage(messageId: number) {
    return this.request<any>(`/api/v1/support/messages/${messageId}/close`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  // Connection endpoints
  async getConnections() {
    const connections = await this.request<any[]>('/api/v1/connections/', {
      requiresAuth: true,
    });
    return connections.map((conn) => this.normalizeUserMedia(conn));
  }

  async sendConnectionRequest(userId: number) {
    return this.request<any>('/api/v1/connections/request', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async acceptConnectionRequest(requestId: number) {
    return this.request<any>(`/api/v1/connections/request/${requestId}/accept`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async rejectConnectionRequest(requestId: number) {
    return this.request<any>(`/api/v1/connections/request/${requestId}/reject`, {
      method: 'PUT',
      requiresAuth: true,
    });
  }

  async cancelSentConnectionRequest(requestId: number) {
    return this.request<any>(`/api/v1/connections/request/${requestId}/cancel`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async removeConnection(connectionId: number) {
    return this.request<any>(`/api/v1/connections/${connectionId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async getPendingConnectionRequests() {
    return this.request<any[]>('/api/v1/connections/requests/pending', {
      requiresAuth: true,
    });
  }

  async getSentConnectionRequests(status?: 'pending' | 'accepted' | 'rejected') {
    const query = status ? `?status_filter=${status}` : '';
    return this.request<any[]>(`/api/v1/connections/requests/sent${query}`, {
      requiresAuth: true,
    });
  }

  async getReceivedConnectionRequests(status?: 'pending' | 'accepted' | 'rejected') {
    const query = status ? `?status_filter=${status}` : '';
    return this.request<any[]>(`/api/v1/connections/requests/received${query}`, {
      requiresAuth: true,
    });
  }

  async checkConnectionStatus(userId: number) {
    return this.request<any>(`/api/v1/connections/status/${userId}`, {
      requiresAuth: true,
    });
  }

  async getConnectionCount(userId: number): Promise<number> {
    const data = await this.request<{ user_id: number; count: number }>(
      `/api/v1/connections/count/${userId}`,
      { requiresAuth: true }
    );
    return data.count;
  }

  async getMutualConnectionCounts(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/api/v1/connections/mutual-counts', {
      requiresAuth: true,
    });
  }

  // Availability/Time Slots endpoints
  async getTimeSlots() {
    return this.request<any[]>('/api/v1/scheduling/time-slots', {
      requiresAuth: true,
    });
  }

  async createTimeSlot(data: any) {
    return this.request<any>('/api/v1/scheduling/time-slots', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async updateTimeSlot(slotId: number, data: any) {
    return this.request<any>(`/api/v1/scheduling/time-slots/${slotId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async deleteTimeSlot(slotId: number) {
    return this.request<any>(`/api/v1/scheduling/time-slots/${slotId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  // WebSocket connection
  private createDisabledSocket(): WebSocket {
    const stub = {
      readyState: WebSocket.CLOSED,
      bufferedAmount: 0,
      extensions: '',
      protocol: '',
      binaryType: 'blob' as BinaryType,
      url: '',
      onopen: null,
      onerror: null,
      onclose: null,
      onmessage: null,
      close: () => {},
      send: (_data: string | ArrayBufferLike | Blob | ArrayBufferView) => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as WebSocket;
    return stub;
  }

  createWebSocket(token: string): WebSocket {
    const explicitWsBase = String((import.meta as any).env?.VITE_WS_URL || '').trim().replace(/\/$/, '');
    if (explicitWsBase) {
      const wsBaseUrl = explicitWsBase
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
      return new WebSocket(`${wsBaseUrl}/api/v1/messages/ws?token=${token}`);
    }

    // When running behind Netlify proxy without a dedicated WS endpoint,
    // avoid noisy failed reconnect loops in the browser console.
    if (!this.baseUrl || this.baseUrl.trim() === '') {
      return this.createDisabledSocket();
    }

    const wsBaseUrl = this.baseUrl
      .replace(/^http:\/\//, 'ws://')
      .replace(/^https:\/\//, 'wss://');
    return new WebSocket(`${wsBaseUrl}/api/v1/messages/ws?token=${token}`);
  }

  createMessagesWebSocket(token: string): WebSocket {
    return this.createWebSocket(token);
  }

  createNotificationsWebSocket(token: string): WebSocket {
    const explicitWsBase = String((import.meta as any).env?.VITE_WS_URL || '').trim().replace(/\/$/, '');
    if (explicitWsBase) {
      const wsBaseUrl = explicitWsBase
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
      return new WebSocket(`${wsBaseUrl}/api/v1/notifications/ws?token=${token}`);
    }

    if (!this.baseUrl || this.baseUrl.trim() === '') {
      return this.createDisabledSocket();
    }

    const wsBaseUrl = this.baseUrl
      .replace(/^http:\/\//, 'ws://')
      .replace(/^https:\/\//, 'wss://');
    return new WebSocket(`${wsBaseUrl}/api/v1/notifications/ws?token=${token}`);
  }

  // AI Chat endpoints
  async getChatConversations() {
    return this.request<any[]>('/api/v1/ai-chat/conversations', {
      requiresAuth: true,
    });
  }

  async getChatMessages(conversationId: string) {
    return this.request<any[]>(`/api/v1/ai-chat/conversations/${conversationId}/messages`, {
      requiresAuth: true,
    });
  }

  async createChatConversation(data: { title: string; startup_id?: number }) {
    return this.request<any>('/api/v1/ai-chat/conversations', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async sendChatMessage(conversationId: string, data: { role: string; content: string; startup_id?: number }) {
    return this.request<any>(`/api/v1/ai-chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async deleteChatConversation(conversationId: string) {
    return this.request<any>(`/api/v1/ai-chat/conversations/${conversationId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async updateChatConversation(conversationId: string, data: { title?: string }) {
    return this.request<any>(`/api/v1/ai-chat/conversations/${conversationId}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async getFounderProfile() {
    return this.request<{ founder_profile: string }>('/api/v1/chat/profile', {
      requiresAuth: true,
    });
  }

  async setFounderProfile(founder_profile: string) {
    return this.request<{ founder_profile: string }>('/api/v1/chat/profile', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ founder_profile }),
    });
  }

  async chatText(data: {
    user_query: string;
    founder_profile?: string;
    mode?: 'production' | 'research';
    model?: string;
  }) {
    return this.request<any>('/api/v1/chat/text', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async chatFile(data: {
    user_query: string;
    file: File;
    founder_profile?: string;
    mode?: 'production' | 'research';
    model?: string;
  }) {
    const form = new FormData();
    form.append('user_query', data.user_query);
    form.append('file', data.file);
    if (data.founder_profile) {
      form.append('founder_profile', data.founder_profile);
    }
    form.append('mode', data.mode || 'production');
    if (data.model) {
      form.append('model', data.model);
    }

    return this.request<any>('/api/v1/chat/file', {
      method: 'POST',
      requiresAuth: true,
      body: form,
    });
  }

  async chatAudio(data: {
    file: File;
    user_query?: string;
    founder_profile?: string;
    mode?: 'production' | 'research';
    model?: string;
  }) {
    const form = new FormData();
    form.append('file', data.file);
    form.append('user_query', data.user_query || '');
    if (data.founder_profile) {
      form.append('founder_profile', data.founder_profile);
    }
    form.append('mode', data.mode || 'production');
    if (data.model) {
      form.append('model', data.model);
    }

    return this.request<any>('/api/v1/chat/audio', {
      method: 'POST',
      requiresAuth: true,
      body: form,
    });
  }

  async getAiModels() {
    // /api/v1/ai/models is in ai.py registered on the core backend, not the chatbot service.
    return this.request<any[]>('/api/v1/ai/models', {
      requiresAuth: true,
    });
  }

  async getAdminAiRuntimeStatus() {
    // /api/v1/ai/admin/runtime-status is in ai.py on the core backend.
    return this.request<any>('/api/v1/ai/admin/runtime-status', {
      requiresAuth: true,
    });
  }

  async sendAiChat(data: {
    message: string;
    model?: string;
    session_id?: string;
    startup_context?: {
      venture_id?: number;
      name?: string;
      description?: string;
      stage?: string;
      industry?: string;
      problem_statement?: string;
      solution?: string;
      target_market?: string;
      business_model?: string;
      tagline?: string;
      funding_goal?: number;
      funding_raised?: number;
      revenue?: number;
      mrr?: number;
      customers?: number;
      team_size?: number;
      highlights?: string[];
      competitive_edge?: string;
      team_background?: string;
      funding_plans?: string;
      milestones?: any[];
      activities?: any[];
    };
    file_content?: string;
    file_name?: string;
  }) {
    return this.requestAgainstBase<any>(this.chatbotBaseUrl, '/api/v1/ai/chat', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    });
  }

  async getAiHistorySessions() {
    return this.requestAgainstBase<any[]>(this.chatbotBaseUrl, '/api/v1/ai/history', {
      requiresAuth: true,
    });
  }

  async getAiSessionMessages(sessionId: string) {
    return this.requestAgainstBase<any[]>(this.chatbotBaseUrl, `/api/v1/ai/history/${sessionId}`, {
      requiresAuth: true,
    });
  }

  async deleteAiSessionHistory(sessionId: string) {
    return this.requestAgainstBase<void>(this.chatbotBaseUrl, `/api/v1/ai/history/${sessionId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async renameAiSessionHistory(sessionId: string, title: string) {
    return this.requestAgainstBase<any>(this.chatbotBaseUrl, `/api/v1/ai/history/${sessionId}/title`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify({ title }),
    });
  }

  // Admin advisory track management
  async getAllAvailableTracks() {
    return this.request<any[]>('/api/v1/advisory/admin/tracks', {
      requiresAuth: true,
    });
  }

  async assignTrackToFounder(founderId: number, trackId: number) {
    return this.request<any>(`/api/v1/advisory/admin/founders/${founderId}/tracks/${trackId}`, {
      method: 'POST',
      requiresAuth: true,
    });
  }

  async removeTrackFromFounder(founderId: number, trackId: number) {
    return this.request<void>(`/api/v1/advisory/admin/founders/${founderId}/tracks/${trackId}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  }

  async getFounderTracks(founderId: number) {
    return this.request<any[]>(`/api/v1/advisory/admin/founders/${founderId}/tracks`, {
      requiresAuth: true,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;