import axios from 'axios';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
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

  // Settings & API Keys
  getKeysStatus: async () => {
    const res = await apiClient.get('/settings/keys');
    return res.data;
  },

  saveKey: async (service, keyValue, secondaryValue = null) => {
    const res = await apiClient.post('/settings/keys', {
      service,
      key_value: keyValue,
      secondary_value: secondaryValue,
    });
    return res.data;
  },

  testKey: async (service, keyValue = null) => {
    const res = await apiClient.post('/settings/keys/test', {
      service,
      key_value: keyValue,
    });
    return res.data;
  },

  removeKey: async (service) => {
    const res = await apiClient.delete(`/settings/keys/${service}`);
    return res.data;
  },
};
