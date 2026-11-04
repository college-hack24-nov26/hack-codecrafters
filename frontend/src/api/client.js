const API_BASE_URL = "http://localhost:8000";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail || `API request failed: ${response.status}`
    );
  }

  return data;
}

export const api = {
  // Authentication
  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => apiRequest("/auth/me"),

  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),

  // Batches
  getBatches: () => apiRequest("/batches/"),

  createBatch: (batchData) =>
    apiRequest("/batches/", {
      method: "POST",
      body: JSON.stringify(batchData),
    }),

  // Incidents
  getIncidents: () => apiRequest("/incidents/"),

  // Sensor Readings
  getSensorReadingsByBatch: (batchId) =>
    apiRequest(`/sensor-readings/batch/${batchId}`),

  // Alerts
  getAlerts: () => apiRequest("/alerts/"),

  markAlertRead: (alertId) =>
    apiRequest(`/alerts/${alertId}/read`, {
      method: "PATCH",
    }),

  // Facilities
  getFacilities: () => apiRequest("/facilities/"),

  getAvailableFacilities: () =>
    apiRequest("/facilities/available"),

  // Decisions
  getDecisions: () => apiRequest("/decisions/"),

  // QC Records
  getQCRecords: () => apiRequest("/qc-records/"),

  // Diversions
  getDiversions: () => apiRequest("/diversions/"),

  createDiversion: (diversionData) =>
    apiRequest("/diversions/", {
      method: "POST",
      body: JSON.stringify(diversionData),
    }),

  reviewDiversion: (diversionId, reviewData) =>
    apiRequest(`/diversions/${diversionId}`, {
      method: "PATCH",
      body: JSON.stringify(reviewData),
    }),
};
