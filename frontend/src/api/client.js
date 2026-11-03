
const API_BASE_URL = "http://127.0.0.1:8000";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
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
  getBatches: () => apiRequest("/batches/"),

  createBatch: (batchData) =>
    apiRequest("/batches/", {
      method: "POST",
      body: JSON.stringify(batchData),
    }),

  getIncidents: () => apiRequest("/incidents/"),
  getAlerts: () => apiRequest("/alerts/"),
  getFacilities: () => apiRequest("/facilities/"),
  getDecisions: () => apiRequest("/decisions/"),
  getQCRecords: () => apiRequest("/qc-records/"),
};
