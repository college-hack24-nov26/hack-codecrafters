import { useEffect, useState } from "react";
import { Activity, Thermometer, AlertTriangle, ShieldCheck, RefreshCw, Clock } from "lucide-react";
import { api } from "./api/client";

export default function SensorMonitoring() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReadings() {
    setLoading(true);
    setError("");

    try {
      const batches = await api.getBatches();

      const results = await Promise.all(
        (Array.isArray(batches) ? batches : []).map(async (batch) => {
          const data = await api.getSensorReadingsByBatch(batch.id);

          return (Array.isArray(data) ? data : []).map((reading) => ({
            ...reading,
            batch_code: batch.batch_code,
          }));
        })
      );

      const allReadings = results.flat().sort(
        (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
      );

      setReadings(allReadings);
    } catch (err) {
      setError(err.message || "Unable to load sensor readings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReadings();
  }, []);

  const anomalies = readings.filter((r) => r.anomaly_flag === true).length;
  const pending = readings.filter(
    (r) => r.reliability_status === "PENDING"
  ).length;

  const latest = readings[0];

  const formatDate = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Not available"
      : date.toLocaleString();
  };

  const cardClass = "bg-white border border-slate-200 rounded-2xl p-5 shadow-sm";

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
        <div>
          <h2 className="text-2xl font-bold">Sensor Monitoring</h2>
          <p className="text-sm text-slate-500 mt-1">
            Batch-wise cold-chain temperature and sensor reliability records.
          </p>
        </div>

        <button
          onClick={loadReadings}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh Readings"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl mb-6">
          {error}
          <button onClick={loadReadings} className="ml-3 underline font-semibold">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <div className={cardClass}>
          <Activity className="text-cyan-600 mb-3" />
          <p className="text-sm text-slate-500">Total Readings</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : readings.length}
          </h3>
        </div>

        <div className={cardClass}>
          <Thermometer className="text-blue-600 mb-3" />
          <p className="text-sm text-slate-500">Latest Temperature</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : latest?.temperature_c != null
              ? `${latest.temperature_c} °C`
              : "—"}
          </h3>
        </div>

        <div className={cardClass}>
          <AlertTriangle className="text-red-600 mb-3" />
          <p className="text-sm text-slate-500">Anomaly Flags</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : anomalies}
          </h3>
        </div>

        <div className={cardClass}>
          <ShieldCheck className="text-amber-600 mb-3" />
          <p className="text-sm text-slate-500">Pending Reliability</p>
          <h3 className="text-3xl font-bold mt-2">
            {loading ? "..." : pending}
          </h3>
        </div>
      </div>

      <div className={cardClass + " mb-7"}>
        <h3 className="font-bold text-lg mb-2">Latest Sensor Reading</h3>

        {latest ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <div>
              <p className="text-xs text-slate-500">Batch</p>
              <p className="font-semibold mt-1">{latest.batch_code}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sensor ID</p>
              <p className="font-semibold mt-1">{latest.sensor_id || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Recorded At</p>
              <p className="font-semibold mt-1">{formatDate(latest.recorded_at)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-4">
            {loading ? "Loading latest reading..." : "No sensor readings available."}
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg">Sensor Reading History</h3>
          <p className="text-sm text-slate-500 mt-1">
            Actual records retrieved from the DairySync backend.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4">Batch</th>
                <th className="p-4">Sensor ID</th>
                <th className="p-4">Temperature</th>
                <th className="p-4">Anomaly</th>
                <th className="p-4">Reliability</th>
                <th className="p-4">Recorded At</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    Loading sensor readings...
                  </td>
                </tr>
              )}

              {!loading && readings.map((reading) => (
                <tr key={reading.id} className="border-t border-slate-100">
                  <td className="p-4 font-semibold">{reading.batch_code}</td>
                  <td className="p-4">{reading.sensor_id || "—"}</td>
                  <td className="p-4 font-semibold">
                    {reading.temperature_c != null
                      ? `${reading.temperature_c} °C`
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reading.anomaly_flag
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {reading.anomaly_flag ? "ANOMALY" : "No Anomaly"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                      {reading.reliability_status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {formatDate(reading.recorded_at)}
                  </td>
                </tr>
              ))}

              {!loading && readings.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No sensor records found for available batches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex gap-3">
        <Clock className="text-cyan-700 shrink-0" />
        <p className="text-sm text-cyan-900">
          <strong>Note:</strong> This page displays recorded sensor data.
          It does not represent a live sensor feed or independently certify milk safety.
          Anomaly flags are displayed as reported by the backend.
        </p>
      </div>
    </div>
  );
}
