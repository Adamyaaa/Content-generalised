import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') 
  : '';

const API_BASE = `${BACKEND_URL}/api/v1`;

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

export const keyStorage = {
  getKey: (service) => {
    try {
      return localStorage.getItem(`user_${service}_key`) || '';
    } catch {
      return '';
    }
  },
  setKey: (service, val) => {
    try {
      if (val && val.trim()) {
        localStorage.setItem(`user_${service}_key`, val.trim());
      } else {
        localStorage.removeItem(`user_${service}_key`);
      }
    } catch (e) {
      console.error(e);
    }
  },
  removeKey: (service) => {
    try {
      localStorage.removeItem(`user_${service}_key`);
    } catch (e) {
      console.error(e);
    }
  },
  getAllKeys: () => {
    return {
      gemini: keyStorage.getKey('gemini'),
      groq: keyStorage.getKey('groq'),
      rapidapi: keyStorage.getKey('rapidapi'),
      cobalt: keyStorage.getKey('cobalt'),
    };
  }
};

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach user's personal API keys from their browser localStorage to every request
apiClient.interceptors.request.use((config) => {
  try {
    const geminiKey = keyStorage.getKey('gemini');
    const groqKey = keyStorage.getKey('groq');
    const rapidapiKey = keyStorage.getKey('rapidapi');
    const cobaltUrl = keyStorage.getKey('cobalt');

    if (geminiKey) config.headers['X-Gemini-Key'] = geminiKey;
    if (groqKey) config.headers['X-Groq-Key'] = groqKey;
    if (rapidapiKey) config.headers['X-RapidAPI-Key'] = rapidapiKey;
    if (cobaltUrl) config.headers['X-Cobalt-URL'] = cobaltUrl;
  } catch (e) {
    console.warn('Could not read user keys from localStorage:', e);
  }
  return config;
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Profiles
  getProfiles: async () => {
    const res = await apiClient.get('/profiles');
    return res.data;
  },

  getProfile: async (id) => {
    const res = await apiClient.get(`/profiles/${id}`);
    return res.data;
  },

  createProfile: async (profileData) => {
    const res = await apiClient.post('/profiles', profileData);
    return res.data;
  },

  updateProfile: async (id, profileData) => {
    const res = await apiClient.put(`/profiles/${id}`, profileData);
    return res.data;
  },

  deleteProfile: async (id) => {
    const res = await apiClient.delete(`/profiles/${id}`);
    return res.data;
  },

  // Ingestion
  ingestUrl: async (url, clientId) => {
    const res = await apiClient.post('/ingest/url', { url, client_id: clientId });
    return res.data;
  },

  ingestFile: async (file, clientId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', clientId);
    const res = await apiClient.post('/ingest/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getQueueStatus: async (queueId) => {
    const res = await apiClient.get(`/ingest/queue/${queueId}`);
    return res.data;
  },

  // Concepts & Dashboard
  getConcepts: async (clientId = null) => {
    const params = clientId ? { client_id: clientId } : {};
    const res = await apiClient.get('/dashboard/concepts', { params });
    return res.data;
  },

  getConceptDetails: async (conceptId) => {
    const res = await apiClient.get(`/dashboard/concepts/${conceptId}`);
    return res.data;
  },

  deleteConcept: async (conceptId) => {
    const res = await apiClient.delete(`/dashboard/concepts/${conceptId}`);
    return res.data;
  },

  // Settings & API Keys (Per-user test endpoint)
  testKey: async (service, keyValue = null) => {
    const res = await apiClient.post('/settings/keys/test', {
      service,
      key_value: keyValue || keyStorage.getKey(service),
    });
    return res.data;
  },

  // Content Calendar
  getCalendarEvents: async (params = {}) => {
    const res = await apiClient.get('/calendar', { params });
    return res.data;
  },

  getCalendarEvent: async (eventId) => {
    const res = await apiClient.get(`/calendar/${eventId}`);
    return res.data;
  },

  createCalendarEvent: async (eventData) => {
    const res = await apiClient.post('/calendar', eventData);
    return res.data;
  },

  updateCalendarEvent: async (eventId, eventData) => {
    const res = await apiClient.put(`/calendar/${eventId}`, eventData);
    return res.data;
  },

  rescheduleCalendarEvent: async (eventId, scheduledDate, scheduledTime = null) => {
    const res = await apiClient.patch(`/calendar/${eventId}/reschedule`, {
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
    });
    return res.data;
  },

  updateCalendarEventStatus: async (eventId, status) => {
    const res = await apiClient.patch(`/calendar/${eventId}/status`, { status });
    return res.data;
  },

  deleteCalendarEvent: async (eventId) => {
    const res = await apiClient.delete(`/calendar/${eventId}`);
    return res.data;
  },

  getExportCsvUrl: (clientId = null) => {
    const base = `${API_BASE}/calendar/export/csv`;
    return clientId ? `${base}?client_id=${encodeURIComponent(clientId)}` : base;
  },

  getExportIcsUrl: (clientId = null) => {
    const base = `${API_BASE}/calendar/export/ics`;
    return clientId ? `${base}?client_id=${encodeURIComponent(clientId)}` : base;
  },
};
