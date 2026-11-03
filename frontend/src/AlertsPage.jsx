import { useEffect, useState } from "react";
import { Bell, RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { api } from "./api/client";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadAlerts() {
    setLoading(true);
    setError("");

    try {
      const data = await api.getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function markAsRead(alertId) {
    setUpdatingId(alertId);
    setError("");

    try {
      const updated = await api.markAlertRead(alertId);
      setAlerts((previous) =>
        previous.map((item) => item.id === alertId ? updated : item)
      );
    } catch (err) {
      setError(err.message || "Unable to update alert.");
    } finally {
      setUpdatingId(null);
    }
  }

  const unread = alerts.filter((item) => !item.is_read).length;
  const actionRequired = alerts.filter((item) => item.action_required).length;

  const severityClass = (severity) => {
    const value = (severity || "INFO").toUpperCase();

    if (value === "CRITICAL" || value === "HIGH") {
      return "bg-red-100 text-red-700";
    }
    if (value === "MEDIUM" || value === "WARNING") {
      return "bg-amber-100 text-amber-700";
    }
    if (value === "LOW") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-slate-100 text-slate-700";
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  };

  const cardClass = "bg-white border border-slate-200 rounded-2xl p-5 shadow-sm";

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
        <div>
          <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
          <p className="text-sm text-slate-500 mt-1">
            Review cold-chain alerts and required actions.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh Alerts"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
        <div className={cardClass}>
          <Bell className="text-cyan-600 mb-3" />
          <p className="text-sm text-slate-500">Total Alerts</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : alerts.length}
          </h3>
        </div>

        <div className={cardClass}>
          <AlertTriangle className="text-amber-600 mb-3" />
          <p className="text-sm text-slate-500">Unread Alerts</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : unread}
          </h3>
        </div>

        <div className={cardClass}>
          <CheckCircle className="text-red-600 mb-3" />
          <p className="text-sm text-slate-500">Action Required</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : actionRequired}
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className={cardClass + " text-center text-slate-500"}>
            Loading alerts...
          </div>
        )}

        {!loading && alerts.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-2xl p-5 shadow-sm ${
              item.is_read ? "border-slate-200" : "border-cyan-300"
            }`}
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="bg-cyan-50 text-cyan-700 rounded-xl p-3 h-fit">
                  <Bell size={21} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold">{item.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityClass(item.severity)}`}>
                      {item.severity || "INFO"}
                    </span>
                    {!item.is_read && (
                      <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-semibold">
                        UNREAD
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600">{item.message}</p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                    <span>Type: {item.alert_type}</span>
                    <span>Batch ID: {item.batch_id ?? "—"}</span>
                    <span>Incident ID: {item.incident_id ?? "—"}</span>
                    <span>Created: {new Date(item.created_at).toLocaleString()}</span>
                  </div>

                  {item.action_required && (
                    <p className="text-xs font-semibold text-red-600 mt-3">
                      Action required
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.is_read ? (
                  <span className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle size={15} /> Read
                  </span>
                ) : (
                  <button
                    onClick={() => markAsRead(item.id)}
                    disabled={updatingId === item.id}
                    className="bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {updatingId === item.id ? "Updating..." : "Mark as Read"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && alerts.length === 0 && (
          <div className={cardClass + " text-center py-12"}>
            <Bell size={35} className="mx-auto text-slate-400 mb-3" />
            <h3 className="font-bold">No Alerts Found</h3>
            <p className="text-sm text-slate-500 mt-2">
              No alert records are currently available in the backend.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex gap-3">
        <Clock className="text-cyan-700 shrink-0" />
        <p className="text-sm text-cyan-900">
          Alerts shown here are retrieved from the DairySync backend.
          Mark as Read updates the saved alert record.
        </p>
      </div>
    </div>
  );
}
