/**
 * Custom Hooks for Data Fetching
 * Provides reusable patterns for fetching, loading, and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

/**
 * Generic data fetching hook
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  args: any[] = [],
  options: { autoFetch?: boolean; onError?: (error: Error) => void } = { autoFetch: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async (...fetchArgs: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...(fetchArgs.length > 0 ? fetchArgs : args));
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, args, options]);

  useEffect(() => {
    if (options.autoFetch) {
      fetch();
    }
  }, []);

  const refetch = useCallback(() => fetch(), [fetch]);

  return { data, loading, error, fetch, refetch };
}

/**
 * Hook for fetching ventures
 */
export function useVentures(filters?: { stage?: string; industry?: string }) {
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (filters?.stage || filters?.industry) {
        data = await apiClient.discoverVentures(filters.stage, filters.industry);
      } else {
        data = await apiClient.getVentures();
      }
      setVentures(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch ventures');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ventures, loading, error, refetch: fetch };
}

/**
 * Hook for creating/updating ventures
 */
export function useVentureActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createVenture = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.createVenture(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create venture');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVenture = useCallback(async (id: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.updateVenture(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update venture');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVenture = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.deleteVenture(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete venture');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createVenture, updateVenture, deleteVenture, loading, error };
}

/**
 * Hook for fetching mentors
 */
export function useMentors(expertise?: string) {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listMentors(expertise);
      setMentors(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch mentors');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [expertise]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { mentors, loading, error, refetch: fetch };
}

/**
 * Hook for mentor relationships
 */
export function useMentorships() {
  const [mentees, setMentees] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMentees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMyMentees();
      setMentees(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch mentees');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMyMentors();
      setMentors(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch mentors');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestMentorship = useCallback(async (mentorId: number) => {
    setError(null);
    try {
      const result = await apiClient.requestMentorship(mentorId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to request mentorship');
      setError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchMentees();
    fetchMentors();
  }, []);

  return {
    mentees,
    mentors,
    loading,
    error,
    refetch: () => {
      fetchMentees();
      fetchMentors();
    },
    requestMentorship,
  };
}

/**
 * Hook for pitch sessions
 */
export function usePitchSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPitchSessions();
      setSessions(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch pitch sessions');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (data: any) => {
    try {
      const result = await apiClient.createPitchSession(data);
      setSessions(prev => [...prev, result]);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create pitch session');
      setError(error);
      throw error;
    }
  }, []);

  const updateSession = useCallback(async (id: number, data: any) => {
    try {
      const result = await apiClient.updatePitchSession(id, data);
      setSessions(prev => prev.map(s => (s.id === id ? result : s)));
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update pitch session');
      setError(error);
      throw error;
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      return await apiClient.getPitchAnalytics();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch analytics');
      setError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  return { sessions, loading, error, refetch: fetch, createSession, updateSession, fetchAnalytics };
}

/**
 * Hook for deals
 */
export function useDeals() {
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMyInvestments();
      setMyInvestments(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch investments');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMyOffers();
      setMyOffers(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch offers');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeal = useCallback(async (data: any) => {
    try {
      return await apiClient.createDeal(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create deal');
      setError(error);
      throw error;
    }
  }, []);

  const updateDeal = useCallback(async (id: number, data: any) => {
    try {
      const result = await apiClient.updateDeal(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update deal');
      setError(error);
      throw error;
    }
  }, []);

  const fetchPortfolioSummary = useCallback(async () => {
    try {
      return await apiClient.getPortfolioSummary();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch portfolio summary');
      setError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
    fetchOffers();
  }, []);

  return {
    myInvestments,
    myOffers,
    loading,
    error,
    refetch: () => {
      fetchInvestments();
      fetchOffers();
    },
    createDeal,
    updateDeal,
    fetchPortfolioSummary,
  };
}

/**
 * Hook for settings/preferences
 */
export function useSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSettings();
      setSettings(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch settings');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.updateSettings(data);
      setSettings(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update settings');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  return { settings, loading, error, updateSettings, refetch: fetch };
}

/**
 * Hook for dashboard
 */
export function useDashboard(role: 'founder' | 'investor') {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDashboard(role);
      setDashboard(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch dashboard');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { dashboard, loading, error, refetch: fetch };
}
