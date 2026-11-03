
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Thermometer, AlertTriangle, ClipboardCheck,
  GitBranch, Building2, RefreshCw, Bell, Search, Menu, Milk,
  Activity, Clock, ShieldCheck, Plus, X, Truck, ArrowLeft
} from "lucide-react";
import { api } from "./api/client";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Batches", icon: Milk },
  { name: "Sensor Monitoring", icon: Thermometer },
  { name: "Incidents", icon: AlertTriangle },
  { name: "QC Records", icon: ClipboardCheck },
  { name: "Decisions", icon: GitBranch },
  { name: "Facilities", icon: Building2 },
  { name: "Diversions", icon: RefreshCw },
];

const emptyForm = {
  batch_code: "",
  supplier: "",
  quantity_liters: "",
  origin: "",
  destination: "",
  route: "",
  expected_arrival_at: "",
};

function App() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [batches, setBatches] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [qcRecords, setQCRecords] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [batchData, incidentData, alertData, qcData, decisionData, facilityData] = await Promise.all([
        api.getBatches(),
        api.getIncidents(),
        api.getAlerts(),
        api.getQCRecords(),
        api.getDecisions(),
        api.getFacilities(),
      ]);

      setBatches(Array.isArray(batchData) ? batchData : []);
      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setQCRecords(Array.isArray(qcData) ? qcData : []);
      setDecisions(Array.isArray(decisionData) ? decisionData : []);
      setFacilities(Array.isArray(facilityData) ? facilityData : []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCreateBatch(event) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (
      !form.batch_code.trim() ||
      !form.supplier.trim() ||
      !form.quantity_liters ||
      !form.origin.trim() ||
      !form.destination.trim() ||
      !form.route.trim() ||
      !form.expected_arrival_at
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    const quantity = Number(form.quantity_liters);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Quantity must be greater than zero.");
      return;
    }

    const arrivalDate = new Date(form.expected_arrival_at);

    if (Number.isNaN(arrivalDate.getTime())) {
      setFormError("Please enter a valid expected arrival date and time.");
      return;
    }

    const payload = {
      batch_code: form.batch_code.trim(),
      supplier: form.supplier.trim(),
      quantity_liters: quantity,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      route: form.route.trim(),
      expected_arrival_at: arrivalDate.toISOString(),
    };

    try {
      setSaving(true);

      await api.createBatch(payload);

      setForm(emptyForm);
      setShowBatchForm(false);
      setSuccessMessage("New batch created successfully!");

      await loadDashboard();
      setActive("Batches");
    } catch (err) {
      setFormError(err.message || "Unable to create batch.");
    } finally {
      setSaving(false);
    }
  }

  const highRisk = incidents.filter(
    (item) => item.severity === "HIGH"
  ).length;

  const mediumRisk = incidents.filter(
    (item) => item.severity === "MEDIUM"
  ).length;

  const lowRisk = incidents.filter(
    (item) => item.severity === "LOW"
  ).length;

  const openIncidents = incidents.filter(
    (item) => !["RESOLVED", "CLOSED"].includes(item.status)
  ).length;

  const pendingQC = batches.filter(
    (item) => item.status === "UNDER_REVIEW"
  ).length;

  const stats = [
    { label: "Total Batches", value: batches.length, note: "Database records", icon: Milk },
    { label: "Active Monitoring", value: batches.filter((b) => b.status === "IN_TRANSIT").length, note: "Currently in transit", icon: Activity },
    { label: "Open Incidents", value: openIncidents, note: "Require investigation", icon: AlertTriangle },
    { label: "Pending QC", value: pendingQC, note: "Based on batch status", icon: ClipboardCheck },
  ];

  const inputClass =
    "w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-950 text-white min-h-screen p-5 transition-all duration-300 shrink-0`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-cyan-400 text-slate-950 rounded-xl p-2">
            <Milk size={25} />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">DairySync</h1>
              <p className="text-xs text-slate-400">Cold Chain Intelligence</p>
            </div>
          )}
        </div>

        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
          {sidebarOpen ? "Main Menu" : "Menu"}
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActive(item.name);
                  setShowBatchForm(false);
                  setSuccessMessage("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition ${
                  active === item.name
                    ? "bg-cyan-400 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={19} />
                {sidebarOpen && item.name}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="mt-12 rounded-xl bg-slate-900 p-4">
            <ShieldCheck className="text-cyan-400 mb-2" />
            <p className="text-sm font-semibold">Decision Support</p>
            <p className="text-xs text-slate-400 mt-1">
              Final quality decisions remain with authorized QC personnel.
            </p>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-xl font-bold">{active}</h2>
              <p className="text-xs text-slate-500">DairySync / {active}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
              <Search size={16} className="text-slate-400" />
              <input className="bg-transparent outline-none text-sm w-36" placeholder="Search..." />
            </div>
            <button className="relative">
              <Bell size={21} />
            </button>
            <div className="bg-cyan-100 text-cyan-800 rounded-full w-9 h-9 flex items-center justify-center font-bold">
              QC
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8">

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-6">
              API Error: {error}
              <button onClick={loadDashboard} className="ml-3 underline font-semibold">Retry</button>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-xl p-4 mb-6">
              {successMessage}
            </div>
          )}

          {active === "Batches" ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">Milk Batch Management</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Create and monitor milk batches using database records.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowBatchForm(!showBatchForm);
                    setFormError("");
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center gap-2"
                >
                  {showBatchForm ? <X size={18} /> : <Plus size={18} />}
                  {showBatchForm ? "Close Form" : "Create New Batch"}
                </button>
              </div>

              {showBatchForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                  <h3 className="text-lg font-bold mb-2">Create New Milk Batch</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter the batch details. The record will be saved to the backend database.
                  </p>

                  <form onSubmit={handleCreateBatch}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <label className="text-sm font-medium">
                        Batch Code *
                        <input className={`${inputClass} mt-2`} placeholder="e.g. DS-BATCH-002" value={form.batch_code}
                          onChange={(e) => setForm({ ...form, batch_code: e.target.value })} required />
                      </label>

                      <label className="text-sm font-medium">
                        Supplier Name *
                        <input className={`${inputClass} mt-2`} placeholder="Supplier name" value={form.supplier}
                          onChange={(e) => setForm({ ...form, supplier: e.target.value })} required />
                      </label>

                      <label className="text-sm font-medium">
                        Quantity (Litres) *
                        <input className={`${inputClass} mt-2`} type="number" min="0.01" step="0.01" placeholder="5000" value={form.quantity_liters}
                          onChange={(e) => setForm({ ...form, quantity_liters: e.target.value })} required />
                      </label>

                      <label className="text-sm font-medium">
                        Origin / Collection Center *
                        <input className={`${inputClass} mt-2`} placeholder="Phaltan Collection Center" value={form.origin}
                          onChange={(e) => setForm({ ...form, origin: e.target.value })} required />
                      </label>

                      <label className="text-sm font-medium">
                        Destination / Processing Plant *
                        <input className={`${inputClass} mt-2`} placeholder="Pune Processing Plant" value={form.destination}
                          onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
                      </label>

                      <label className="text-sm font-medium">
                        Route *
                        <input className={`${inputClass} mt-2`} placeholder="Phaltan - Baramati - Pune" value={form.route}
                          onChange={(e) => setForm({ ...form, route: e.target.value })} required />
                      </label>

                      <label className="text-sm font-medium md:col-span-2">
                        Expected Arrival Date & Time *
                        <input className={`${inputClass} mt-2`} type="datetime-local" value={form.expected_arrival_at}
                          onChange={(e) => setForm({ ...form, expected_arrival_at: e.target.value })} required />
                      </label>
                    </div>

                    {formError && (
                      <p className="mt-5 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                        {formError}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-slate-950 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50"
                      >
                        {saving ? "Saving Batch..." : "Save Batch"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowBatchForm(false);
                          setForm(emptyForm);
                          setFormError("");
                        }}
                        className="border border-slate-300 px-6 py-3 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-sm text-slate-500">Total Batches</p>
                  <h3 className="text-3xl font-bold mt-2">{loading ? "..." : batches.length}</h3>
                </div>
                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-sm text-slate-500">In Transit</p>
                  <h3 className="text-3xl font-bold mt-2">{batches.filter(b => b.status === "IN_TRANSIT").length}</h3>
                </div>
                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-sm text-slate-500">Arrived</p>
                  <h3 className="text-3xl font-bold mt-2">{batches.filter(b => b.status === "ARRIVED").length}</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">All Milk Batches</h3>
                    <p className="text-sm text-slate-500">Live database records</p>
                  </div>
                  <button onClick={loadDashboard} className="text-cyan-700 text-sm font-semibold flex items-center gap-2">
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Batch ID</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Origin</th>
                        <th className="px-6 py-4">Destination</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && <tr><td colSpan="7" className="p-6 text-center">Loading batches...</td></tr>}
                      {!loading && batches.map((batch) => (
                        <tr key={batch.id} className="border-t border-slate-100">
                          <td className="px-6 py-4 font-semibold">{batch.batch_code}</td>
                          <td className="px-6 py-4">{batch.supplier}</td>
                          <td className="px-6 py-4">{Number(batch.quantity_liters).toLocaleString()} L</td>
                          <td className="px-6 py-4">{batch.origin}</td>
                          <td className="px-6 py-4">{batch.destination}</td>
                          <td className="px-6 py-4">{batch.status}</td>
                          <td className="px-6 py-4">{batch.risk_level}</td>
                        </tr>
                      ))}
                      {!loading && !error && batches.length === 0 && (
                        <tr><td colSpan="7" className="p-6 text-center">No batches found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : active === "Incidents" ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">Incident Management</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Review cold-chain incidents reported in the backend.
                  </p>
                </div>

                <button
                  onClick={loadDashboard}
                  disabled={loading}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh Incidents
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {[
                  {
                    label: "Total Incidents",
                    value: incidents.length,
                    style: "bg-slate-100 text-slate-800",
                  },
                  {
                    label: "High Severity",
                    value: highRisk,
                    style: "bg-red-100 text-red-700",
                  },
                  {
                    label: "Medium Severity",
                    value: mediumRisk,
                    style: "bg-amber-100 text-amber-700",
                  },
                  {
                    label: "Open Incidents",
                    value: openIncidents,
                    style: "bg-cyan-100 text-cyan-700",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                  >
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <div className="flex items-center justify-between mt-3">
                      <h3 className="text-3xl font-bold">
                        {loading ? "..." : item.value}
                      </h3>
                      <span className={`px-3 py-2 rounded-lg text-sm font-bold ${item.style}`}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold">All Reported Incidents</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Incident records fetched from the DairySync backend.
                  </p>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-slate-500">
                    Loading incidents...
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="p-10 text-center">
                    <AlertTriangle size={35} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-semibold">No incidents found</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      No incident records are currently available.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Incident ID</th>
                          <th className="px-5 py-4">Batch ID</th>
                          <th className="px-5 py-4">Incident Type</th>
                          <th className="px-5 py-4">Severity</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Started At</th>
                          <th className="px-5 py-4">Duration</th>
                        </tr>
                      </thead>

                      <tbody>
                        {incidents.map((incident) => (
                          <tr
                            key={incident.id}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold">
                              #{incident.id}
                            </td>
                            <td className="px-5 py-4">#{incident.batch_id}</td>
                            <td className="px-5 py-4 font-medium">
                              {incident.incident_type || "—"}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  incident.severity === "HIGH"
                                    ? "bg-red-100 text-red-700"
                                    : incident.severity === "MEDIUM"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {incident.severity || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {incident.status || "—"}
                            </td>
                            <td className="px-5 py-4">
                              {incident.started_at
                                ? new Date(incident.started_at).toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-5 py-4">
                              {incident.duration_minutes != null
                                ? `${incident.duration_minutes} min`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="font-bold text-lg">Incident Summaries</h3>
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-white border border-slate-200 rounded-xl p-5"
                  >
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <p className="font-semibold">
                        Incident #{incident.id} — Batch #{incident.batch_id}
                      </p>
                      <span className="text-xs text-slate-500">
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {incident.summary || "No incident summary available."}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900">
                  <strong>Important:</strong> DairySync provides incident
                  information for investigation and decision support. Final
                  quality decisions remain with authorized QC personnel.
                </p>
              </div>
            </>
          ) : active === "QC Records" ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">QC Records Management</h2>
                  <p className="text-slate-500 text-sm mt-1">Review recorded milk quality measurements and verification status.</p>
                </div>
                <button onClick={loadDashboard} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center gap-2">
                  <RefreshCw size={16} /> Refresh QC Records
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {[
                  { label: "Total QC Records", value: qcRecords.length, style: "bg-slate-100 text-slate-800" },
                  { label: "Under Review", value: qcRecords.filter((r) => r.qc_status === "UNDER_REVIEW").length, style: "bg-amber-100 text-amber-700" },
                  { label: "Approved", value: qcRecords.filter((r) => r.qc_status === "APPROVED").length, style: "bg-green-100 text-green-700" },
                  { label: "Rejected", value: qcRecords.filter((r) => r.qc_status === "REJECTED").length, style: "bg-red-100 text-red-700" },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <div className="flex items-center justify-between mt-3">
                      <h3 className="text-3xl font-bold">{loading ? "..." : item.value}</h3>
                      <span className={`px-3 py-2 rounded-lg text-xs font-bold ${item.style}`}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold">Milk Quality Test Records</h3>
                  <p className="text-sm text-slate-500 mt-1">Measurements and statuses returned by the DairySync QC API.</p>
                </div>
                {loading ? (
                  <div className="p-10 text-center text-slate-500">Loading QC records...</div>
                ) : qcRecords.length === 0 ? (
                  <div className="p-10 text-center">
                    <ClipboardCheck size={35} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-semibold">No QC records found</h3>
                    <p className="text-sm text-slate-500 mt-1">No quality records are currently available in the database.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-4">QC ID</th>
                          <th className="px-5 py-4">Batch ID</th>
                          <th className="px-5 py-4">Fat %</th>
                          <th className="px-5 py-4">SNF %</th>
                          <th className="px-5 py-4">Acidity</th>
                          <th className="px-5 py-4">Inspector ID</th>
                          <th className="px-5 py-4">QC Status</th>
                          <th className="px-5 py-4">Sample Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qcRecords.map((record) => (
                          <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-5 py-4 font-semibold">#{record.id}</td>
                            <td className="px-5 py-4">#{record.batch_id}</td>
                            <td className="px-5 py-4">{record.fat_percent ?? "—"}</td>
                            <td className="px-5 py-4">{record.snf_percent ?? "—"}</td>
                            <td className="px-5 py-4">{record.acidity ?? "—"}</td>
                            <td className="px-5 py-4">{record.inspector_id ?? "Not assigned"}</td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.qc_status === "APPROVED" ? "bg-green-100 text-green-700" : record.qc_status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                {record.qc_status || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-5 py-4">{record.sample_time ? new Date(record.sample_time).toLocaleString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {qcRecords.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-bold text-lg">QC Notes</h3>
                  {qcRecords.map((record) => (
                    <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="font-semibold mb-2">QC Record #{record.id} — Batch #{record.batch_id}</p>
                      <p className="text-sm text-slate-600">{record.notes || "No notes provided."}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900"><strong>QC verification notice:</strong> Displayed measurements are recorded data, not an automatic safety certification. Final quality decisions must be made by authorized QC personnel.</p>
              </div>
            </>
          ) : active === "Decisions" ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">Decision Management</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Review recorded recommendations, evidence and approval status.
                  </p>
                </div>
                <button
                  onClick={loadDashboard}
                  disabled={loading}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh Decisions
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {[
                  { label: "Total Decisions", value: decisions.length, style: "bg-slate-100 text-slate-800" },
                  { label: "Pending", value: decisions.filter((d) => d.approval_status === "PENDING").length, style: "bg-amber-100 text-amber-700" },
                  { label: "Approved", value: decisions.filter((d) => d.approval_status === "APPROVED").length, style: "bg-green-100 text-green-700" },
                  { label: "Rejected", value: decisions.filter((d) => d.approval_status === "REJECTED").length, style: "bg-red-100 text-red-700" },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <div className="flex items-center justify-between mt-3">
                      <h3 className="text-3xl font-bold">{loading ? "..." : item.value}</h3>
                      <span className={`px-3 py-2 rounded-lg text-xs font-bold ${item.style}`}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold">Decision Records</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Recommendations and review information returned by the DairySync Decision API.
                  </p>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-slate-500">Loading decisions...</div>
                ) : decisions.length === 0 ? (
                  <div className="p-10 text-center">
                    <GitBranch size={35} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-semibold">No decision records found</h3>
                    <p className="text-sm text-slate-500 mt-1">No decisions are currently available in the database.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Decision ID</th>
                          <th className="px-5 py-4">Batch ID</th>
                          <th className="px-5 py-4">Incident ID</th>
                          <th className="px-5 py-4">Recommended Action</th>
                          <th className="px-5 py-4">Final Action</th>
                          <th className="px-5 py-4">Approval Status</th>
                          <th className="px-5 py-4">Recommended At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {decisions.map((decision) => (
                          <tr key={decision.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-5 py-4 font-semibold">#{decision.id}</td>
                            <td className="px-5 py-4">#{decision.batch_id}</td>
                            <td className="px-5 py-4">{decision.incident_id == null ? "—" : `#${decision.incident_id}`}</td>
                            <td className="px-5 py-4 font-medium">{decision.recommended_action || "—"}</td>
                            <td className="px-5 py-4">{decision.final_action || "Not set"}</td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                decision.approval_status === "APPROVED"
                                  ? "bg-green-100 text-green-700"
                                  : decision.approval_status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {decision.approval_status || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {decision.recommended_at ? new Date(decision.recommended_at).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="font-bold text-lg">Decision Evidence & Explanation</h3>
                {decisions.map((decision) => (
                  <div key={decision.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <h4 className="font-semibold">Decision #{decision.id} — Batch #{decision.batch_id}</h4>
                      <span className="text-xs text-slate-500">Incident {decision.incident_id == null ? "not linked" : `#${decision.incident_id}`}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-4">{decision.explanation || "No explanation provided."}</p>

                    {decision.evidence_summary && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold mb-3">Evidence Summary</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {Object.entries(decision.evidence_summary).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-slate-500">{key.replaceAll("_", " ")}</p>
                              <p className="text-sm font-medium break-words">{value == null ? "—" : String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4 text-sm">
                      <div><span className="text-slate-500">Reviewed by:</span> {decision.reviewed_by ?? "Not assigned"}</div>
                      <div><span className="text-slate-500">Approved by:</span> {decision.approved_by ?? "Not assigned"}</div>
                      <div><span className="text-slate-500">Approved at:</span> {decision.approved_at ? new Date(decision.approved_at).toLocaleString() : "—"}</div>
                      <div><span className="text-slate-500">Override reason:</span> {decision.reason_for_override || "None recorded"}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900">
                  <strong>Approval workflow notice:</strong> This page displays saved decision and approval records. Approval identities are shown only when returned by the API. Final operational and milk-quality decisions remain with authorized personnel.
                </p>
              </div>
            </>
          ) : active === "Facilities" ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">Facilities & Nearby Centres</h2>
                  <p className="text-slate-500 text-sm mt-1">Review registered facilities, availability and recorded distance estimates.</p>
                </div>
                <button onClick={loadDashboard} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center gap-2">
                  <RefreshCw size={16} /> Refresh Facilities
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {[
                  { label: "Total Facilities", value: facilities.length, style: "bg-slate-100 text-slate-800" },
                  { label: "Available", value: facilities.filter((f) => f.is_available).length, style: "bg-green-100 text-green-700" },
                  { label: "Unavailable", value: facilities.filter((f) => !f.is_available).length, style: "bg-red-100 text-red-700" },
                  { label: "Available Capacity", value: `${facilities.reduce((sum, f) => sum + (Number(f.available_capacity_liters) || 0), 0).toLocaleString()} L`, style: "bg-cyan-100 text-cyan-700" },
                ].map((item) => (
                  <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <div className="flex items-center justify-between mt-3 gap-2">
                      <h3 className="text-2xl font-bold">{loading ? "..." : item.value}</h3>
                      <span className={`px-3 py-2 rounded-lg text-xs font-bold ${item.style}`}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl p-10 text-center text-slate-500">Loading facilities...</div>
              ) : facilities.length === 0 ? (
                <div className="bg-white border rounded-2xl p-10 text-center">
                  <Building2 size={36} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="font-semibold">No facilities found</h3>
                  <p className="text-sm text-slate-500 mt-1">No facility records are currently available in the database.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {facilities.map((facility) => {
                    const total = Number(facility.total_capacity_liters) || 0;
                    const available = Number(facility.available_capacity_liters) || 0;
                    const usedPercent = total > 0 ? Math.min(100, Math.max(0, ((total - available) / total) * 100)) : 0;
                    return (
                      <div key={facility.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="flex gap-3">
                            <div className="bg-cyan-50 text-cyan-700 p-3 rounded-xl h-fit"><Building2 size={23} /></div>
                            <div>
                              <h3 className="font-bold text-lg">{facility.name}</h3>
                              <p className="text-xs text-slate-500 mt-1">Facility #{facility.id} · {facility.facility_type?.replaceAll("_", " ") || "Type not specified"}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${facility.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{facility.is_available ? "AVAILABLE" : "UNAVAILABLE"}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500">Total Capacity</p>
                            <p className="text-xl font-bold mt-1">{total.toLocaleString()} L</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500">Available Capacity</p>
                            <p className="text-xl font-bold mt-1">{available.toLocaleString()} L</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Capacity utilization</span><span>{usedPercent.toFixed(0)}%</span></div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{ width: `${usedPercent}%` }} /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                          <div className="flex items-center gap-2"><Truck size={17} className="text-cyan-700" /><span>{facility.estimated_distance_km == null ? "Distance not recorded" : `${facility.estimated_distance_km} km estimated`}</span></div>
                          <div className="flex items-center gap-2"><Clock size={17} className="text-cyan-700" /><span>{facility.estimated_travel_minutes == null ? "Travel time not recorded" : `${facility.estimated_travel_minutes} min estimated`}</span></div>
                        </div>

                        <div className="mt-5 border-t border-slate-100 pt-4">
                          <p className="text-xs text-slate-500 mb-2">Processing Compatibility</p>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(facility.processing_compatibility) ? facility.processing_compatibility : []).length > 0 ? facility.processing_compatibility.map((item) => (
                              <span key={item} className="bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">{String(item).replaceAll("_", " ")}</span>
                            )) : <span className="text-sm text-slate-400">Not specified</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900"><strong>Location note:</strong> Distance and travel time are estimates stored in the facility records. This page does not perform live GPS-based nearby-centre search or navigation.</p>
              </div>
            </>
          ) : active === "Dashboard" ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">Cold Chain Overview</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Monitor batches, investigate incidents and support decisions.
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-3 py-2 rounded-full font-semibold">
                  LIVE DATABASE CONNECTION
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">{stat.label}</p>
                        <div className="bg-cyan-50 text-cyan-700 p-2 rounded-lg"><Icon size={20} /></div>
                      </div>
                      <h3 className="text-3xl font-bold mt-4">{loading ? "..." : stat.value}</h3>
                      <p className="text-xs text-slate-400 mt-2">{stat.note}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2 bg-white border rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-lg">Temperature Monitoring</h3>
                      <p className="text-sm text-slate-500">Sensor integration pending</p>
                    </div>
                    <Thermometer className="text-cyan-600" />
                  </div>
                  <div className="h-44 flex items-center justify-center bg-slate-50 rounded-xl">
                    <div className="text-center">
                      <Thermometer size={35} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">No live sensor chart connected yet</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-5">Incident Risk Summary</h3>
                  {[
                    { name: "HIGH", count: highRisk, style: "bg-red-100 text-red-700" },
                    { name: "MEDIUM", count: mediumRisk, style: "bg-amber-100 text-amber-700" },
                    { name: "LOW", count: lowRisk, style: "bg-green-100 text-green-700" },
                  ].map((risk) => (
                    <div key={risk.name} className="flex justify-between items-center mb-5">
                      <span className="text-sm">{risk.name} Risk</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${risk.style}`}>{loading ? "..." : risk.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Recent Milk Batches</h3>
                    <p className="text-sm text-slate-500">Records fetched from DairySync backend</p>
                  </div>
                  <button onClick={() => setActive("Batches")} className="text-cyan-700 text-sm font-semibold">
                    View All Batches →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Batch ID</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch) => (
                        <tr key={batch.id} className="border-t border-slate-100">
                          <td className="px-6 py-4 font-semibold">{batch.batch_code}</td>
                          <td className="px-6 py-4">{batch.supplier}</td>
                          <td className="px-6 py-4">{Number(batch.quantity_liters).toLocaleString()} L</td>
                          <td className="px-6 py-4">{batch.status}</td>
                          <td className="px-6 py-4">{batch.risk_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 bg-cyan-50 border border-cyan-100 rounded-xl p-4 flex gap-3">
                <Clock className="text-cyan-700 shrink-0" />
                <p className="text-sm text-cyan-900">
                  <strong>Workflow:</strong> Detect → Investigate → Decide → Recover.
                  DairySync provides decision support. It does not independently certify milk as safe.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white border rounded-2xl p-10 text-center">
              <Truck size={40} className="mx-auto text-cyan-600 mb-4" />
              <h2 className="text-xl font-bold">{active}</h2>
              <p className="text-slate-500 mt-2">
                This module will be connected to its backend API in the next development step.
              </p>
              <button onClick={() => setActive("Dashboard")} className="mt-5 text-cyan-700 font-semibold">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;