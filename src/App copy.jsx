import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SimpleTable from "@/components/SimpleTable";
import InfoEmpty from "@/components/InfoEmpty";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ----------------------------
// Configuration
// ----------------------------
const API_BASE = "http://localhost:8000";

// ----------------------------
// API helpers (mirror your Python helpers)
// ----------------------------
const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

const getSummary = async () => {
  try {
    const res = await api.get("/dashboard/summary");
    return res.status === 200 ? res.data : {};
  } catch (e) {
    console.error("getSummary error", e);
    return {};
  }
};

const getTransactions = async () => {
  try {
    const res = await api.get("/transactions");
    return res.status === 200 ? res.data : [];
  } catch (e) {
    console.error("getTransactions error", e);
    return [];
  }
};

const getAnalytics = async () => {
  try {
    const res = await api.get("/analytics");
    return res.status === 200 ? res.data : {};
  } catch (e) {
    console.error("getAnalytics error", e);
    return {};
  }
};

const submitApp = async (applicant_id, amount, tenure) => {
  try {
    const payload = {
      applicant_id,
      requested_amount: amount,
      requested_tenure_months: tenure,
    };
    const res = await api.post("/applications/submit", payload);
    return res.status === 200
      ? res.data
      : { error: res.data || res.statusText };
  } catch (e) {
    console.error("submitApp error", e);
    return { error: e.message };
  }
};

const getApp = async (app_id) => {
  try {
    const res = await api.get(`/applications/${app_id}`);
    return res.status === 200 ? res.data : null;
  } catch (e) {
    console.error("getApp error", e);
    return null;
  }
};

const humanDecision = async (
  app_id,
  decision,
  comment = null,
  new_offer = null
) => {
  try {
    const payload = { human_decision: decision, comment, new_offer };
    const res = await api.post(
      `/applications/${app_id}/human_decision`,
      payload
    );
    return res.status === 200
      ? res.data
      : { error: res.data || res.statusText };
  } catch (e) {
    console.error("humanDecision error", e);
    return { error: e.message };
  }
};

const getRecentApps = async () => {
  try {
    const res = await api.get("/applications/recent");
    return res.status === 200 ? res.data : [];
  } catch (e) {
    console.error("getRecentApps error", e);
    return [];
  }
};

// ----------------------------
// Small UI Helpers
// ----------------------------
const Badge = ({ children, color = "bg-blue-500" }) => (
  <span
    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full text-white ${color}`}
  >
    {children}
  </span>
);

// ----------------------------
// Main App
// ----------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-sky-700">
              💳 Alternative Credit Score POC
            </h1>
            <span className="text-sm text-gray-500">Confidence Dashboard</span>
          </div>

          <nav className="flex items-center gap-2">
            <TabButton
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </TabButton>
            <TabButton
              active={activeTab === "submit"}
              onClick={() => setActiveTab("submit")}
            >
              📝 Submit
            </TabButton>
            <TabButton
              active={activeTab === "review"}
              onClick={() => setActiveTab("review")}
            >
              ✅ Review
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "submit" && <SubmitApplication />}
        {activeTab === "review" && <ManualReview />}
      </main>
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none transition ${
        active
          ? "bg-sky-600 text-white shadow"
          : "bg-white text-sky-700 border border-sky-100 hover:bg-sky-50"
      }`}
    >
      {children}
    </button>
  );
}

// ----------------------------
// Dashboard Component
// ----------------------------
function Dashboard() {
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [s, t, a] = await Promise.all([
        getSummary(),
        getTransactions(),
        getAnalytics(),
      ]);
      if (!mounted) return;
      setSummary(s || {});
      setTransactions(t || []);
      setAnalytics(a || {});
      setLoading(false);
    };
    load();
    return () => (mounted = false);
  }, []);

  const repaymentData = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;
    // expecting transactions have timestamp and amount_aed
    const df = [...transactions]
      .filter((r) => r.timestamp && r.amount_aed != null)
      .map((r) => ({
        month: new Date(r.timestamp).toISOString().slice(0, 7),
        amount: Number(r.amount_aed),
      }));

    const grouped = df.reduce((acc, cur) => {
      acc[cur.month] = (acc[cur.month] || 0) + cur.amount;
      return acc;
    }, {});

    const months = Object.keys(grouped).sort();
    const amounts = months.map((m) => grouped[m]);

    return { months, amounts };
  }, [transactions]);

  const pieData = useMemo(() => {
    const values = [
      summary.approved || 0,
      summary.rejected || 0,
      summary.offers || 0,
    ];
    const total = values.reduce((a, b) => a + b, 0);
    return { values, total };
  }, [summary]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-sky-700">
          📊 Alternative Credit Score Dashboard
        </h2>
        <div className="text-sm text-gray-500">
          API: <code className="bg-gray-100 px-2 py-1 rounded">{API_BASE}</code>
        </div>
      </div>

      {loading ? (
        <div className="p-6 bg-white rounded shadow">Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Total Cases" value={summary.total_cases ?? 0} />
            <KpiCard
              title="Approved Loans"
              value={summary.approved ?? 0}
              color="bg-emerald-500"
            />
            <KpiCard
              title="Conditional Approval"
              value={summary.rejected ?? 0}
              color="bg-red-500"
            />
            <KpiCard
              title="Offers Made"
              value={summary.offers ?? 0}
              color="bg-amber-500"
            />
          </div>

          {/* Repayment Monitor and Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-medium mb-3">💸 Repayment Monitor</h3>
              {repaymentData ? (
                <div>
                  <Line
                    data={{
                      labels: repaymentData.months,
                      datasets: [
                        {
                          label: "Amount Paid (AED)",
                          data: repaymentData.amounts,
                          borderColor: "#0EA5E9", // Tailwind sky-500
                          backgroundColor: "rgba(14, 165, 233, 0.2)", // light fill under the line
                          pointBackgroundColor: "#0284C7", // Tailwind sky-600 for points
                          pointBorderColor: "#ffffff",
                          pointHoverRadius: 6,
                          tension: 0.3,
                          borderWidth: 3,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            font: {
                              size: 12,
                            },
                          },
                        },
                        tooltip: {
                          mode: "index",
                          intersect: false,
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            color: "#E5E7EB", // Tailwind gray-200
                          },
                        },
                        y: {
                          grid: {
                            color: "#E5E7EB",
                          },
                          ticks: {
                            beginAtZero: true,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <InfoEmpty message="No repayment transactions available" />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-medium mb-3">
                📊 Credit Access Results
              </h3>
              {pieData.total > 0 ? (
                <Pie
                  data={{
                    labels: ["Approved", "Conditional", "Offers"],
                    datasets: [
                      {
                        data: pieData.values,
                        backgroundColor: ["#10B981", "#EF4444", "#F59E0B"], // green, red, amber
                        borderColor: "#ffffff", // white border between slices
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          font: {
                            size: 12,
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: function (tooltipItem) {
                            const value = tooltipItem.raw;
                            const total = pieData.total;
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${tooltipItem.label}: ${value} (${percent}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <InfoEmpty message="No decisions yet to show distribution." />
              )}
            </Card>
          </div>

                    {/* Accepted / Rejected Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sky-700 text-lg">
                  Accepted Loans ({(summary.accepted_details || []).length})
                </h4>
              </div>

              {summary.accepted_details &&
              summary.accepted_details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(summary.accepted_details[0]).map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b whitespace-normal break-words max-w-[150px]"
                          >
                            {col.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.accepted_details.map((row, idx) => (
                        <tr
                          key={idx}
                          className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                        >
                          {Object.keys(row).map((col) => (
                            <td
                              key={col}
                              className="px-4 py-2 border-b text-gray-700 whitespace-normal break-words max-w-[200px]"
                            >
                              {col === "decision" || col === "status" ? (
                                <span
                                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                    row[col] === "approved"
                                      ? "bg-emerald-500 text-white"
                                      : row[col] === "rejected"
                                      ? "bg-red-500 text-white"
                                      : "bg-amber-500 text-white"
                                  }`}
                                >
                                  {row[col]}
                                </span>
                              ) : typeof row[col] === "object" ? (
                                JSON.stringify(row[col])
                              ) : (
                                row[col]
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No accepted loans yet.
                </div>
              )}
            </div>

            <div className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-red-600 text-lg">
                  Conditional Approval ({(summary.rejected_details || []).length})
                </h4>
              </div>

              {summary.rejected_details &&
              summary.rejected_details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(summary.rejected_details[0]).map((col) => (
                          <th
                            key={col}
                            className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b"
                          >
                            {col.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.rejected_details.map((row, idx) => (
                        <tr
                          key={idx}
                          className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                        >
                          {Object.keys(row).map((col) => (
                            <td
                              key={col}
                              className="px-4 py-2 border-b text-gray-700"
                            >
                              {col === "decision" || col === "status" ? (
                                <span
                                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                    row[col] === "approved"
                                      ? "bg-emerald-500 text-white"
                                      : row[col] === "rejected"
                                      ? "bg-red-500 text-white"
                                      : "bg-amber-500 text-white"
                                  }`}
                                >
                                  {row[col]}
                                </span>
                              ) : typeof row[col] === "object" ? (
                                JSON.stringify(row[col])
                              ) : (
                                row[col]
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No conditional approval yet.
                </div>
              )}
            </div>
          </div>

          {/* Performance & Extra Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-medium mb-3">
                📈 Performance Indicators
              </h3>
              <div className="space-y-3">
                <Stat
                  label="Avg Confidence Score"
                  value={summary.avg_score ?? "N/A"}
                />
                <Stat
                  label="Acceptance Ratio (%)"
                  value={summary.acceptance_ratio ?? "N/A"}
                />
                <Stat
                  label="Conditional Approval (%)"
                  value={summary.rejection_ratio ?? "N/A"}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-medium mb-3">
                📊 Extra Insights (Analytics)
              </h3>
              {analytics ? (
                <div className="space-y-2 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-1">Avg Salary (AED)</div>
                    <div className="font-semibold">
                      {analytics.avg_salary ?? "N/A"}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">Avg Tenure (Months)</div>
                    <div className="font-semibold">
                      {analytics.avg_tenure ?? "N/A"}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">Remittance Reliability Index</div>
                    <div className="font-semibold">
                      {analytics.good_history_pct ?? "N/A"}%
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">Avg Delinquency</div>
                    <div className="font-semibold">
                      {analytics.avg_defaults ?? "N/A"}
                    </div>
                  </div>
                </div>
              ) : (
                <InfoEmpty message="No analytics available" />
              )}
            </Card>

            {/* <Card>
              <h3 className="text-lg font-medium mb-3">🌍 Market Snapshot</h3>
              {summary.market_snapshot ? (
                <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(summary.market_snapshot, null, 2)}</pre>
              ) : (
                <InfoEmpty message="No market data available" />
              )}
            </Card> */}
          </div>
        </>
      )}
    </section>
  );
}

function KpiCard({ title, value, color = "bg-sky-500" }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold mt-1">
          {typeof value === "number" ? value : value}
        </div>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-90`} />
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded shadow p-4 ${className}`}>{children}</div>
  );
}

function DetailPanel({ title, children }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sky-700">{title}</h4>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SimpleTable({ data = [] }) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((c) => (
              <th
                key={c}
                className="text-left p-2 text-xs text-gray-500 border-b"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {columns.map((c) => (
                <td key={c} className="p-2 text-xs border-b">
                  {String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoEmpty({ message }) {
  return <div className="text-sm text-gray-500 italic">{message}</div>;
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

// ----------------------------
// Submit Application Component
// ----------------------------
function SubmitApplication() {
  const [applicantId, setApplicantId] = useState(1);
  const [amount, setAmount] = useState(1000);
  const [tenure, setTenure] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [apps, setApps] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const recent = await getRecentApps();
      if (!mounted) return;
      setApps(recent || []);
    })();
    return () => (mounted = false);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await submitApp(applicantId, amount, tenure);
    setSubmitting(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({
        type: "success",
        text: `Application Submitted! ID: ${res.application_id}`,
      });
      // refresh list
      const recent = await getRecentApps();
      setApps(recent || []);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold text-sky-700 mb-4">
        📝 Submit New Loan Application
      </h2>

      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <label className="block text-sm text-gray-600">Applicant ID</label>
          <input
            type="number"
            min={1}
            value={applicantId}
            onChange={(e) => setApplicantId(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">
            Requested Loan Amount (AED)
          </label>
          <input
            type="number"
            min={1000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">
            Requested Tenure (Months)
          </label>
          <input
            type="number"
            min={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div className="md:col-span-3 flex gap-2 mt-2">
          <button
            disabled={submitting}
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white rounded shadow"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>

          <button
            type="button"
            onClick={async () => {
              const recent = await getRecentApps();
              setApps(recent || []);
            }}
            className="px-4 py-2 bg-white border rounded"
          >
            Refresh Applications
          </button>

          {message && (
            <div
              className={`px-3 py-2 rounded ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </form>

      <Card>
        <h3 className="text-lg font-medium mb-3">📋 All Applications</h3>
        {apps && apps.length > 0 ? (
          <SimpleTable
            data={apps.map((a) => ({
              application_id: a.application_id,
              applicant_id: a.applicant_id,
              requested_amount: a.requested_amount,
              requested_tenure_months: a.requested_tenure_months,
              decision: a.decision,
              status: a.status,
              score: a.score,
              suggested_offer: JSON.stringify(a.suggested_offer || "-"),
            }))}
          />
        ) : (
          <InfoEmpty message="No applications submitted yet." />
        )}
      </Card>
    </section>
  );
}

// ----------------------------
// Manual Review Component
// ----------------------------
function ManualReview() {
  const [appId, setAppId] = useState(1);
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState("approve");
  const [comment, setComment] = useState("");
  const [offerAmount, setOfferAmount] = useState(500);
  const [offerTenure, setOfferTenure] = useState(1);
  const [result, setResult] = useState(null);

  const fetchApplication = async () => {
    setLoading(true);
    const data = await getApp(appId);
    setAppData(data);
    setLoading(false);
  };

  const submitDecision = async () => {
    setLoading(true);
    const new_offer =
      decision === "offer"
        ? { amount: offerAmount, tenure_months: offerTenure }
        : null;
    const res = await humanDecision(appId, decision, comment, new_offer);
    setResult(res);
    setLoading(false);
  };

  return (
    <section>
      <h2 className="text-xl font-semibold text-sky-700 mb-4">
        ✅ Manual Review & Intervention
      </h2>

      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600">
              Application ID
            </label>
            <input
              type="number"
              value={appId}
              min={1}
              onChange={(e) => setAppId(Number(e.target.value))}
              className="mt-1 w-48 border rounded px-3 py-2"
            />
          </div>
          <div>
            <button
              onClick={fetchApplication}
              className="px-4 py-2 bg-sky-600 text-white rounded"
            >
              Fetch Application
            </button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div>Loading...</div>
          ) : appData ? (
            <div>
              <h3 className="font-medium mb-2">Application Details</h3>
              <pre className="text-sm bg-gray-50 p-3 rounded">
                {JSON.stringify(appData, null, 2)}
              </pre>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">
                    Manual Decision
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2"
                  >
                    <option value="approve">approve</option>
                    <option value="rejected">rejected</option>
                    <option value="offer">offer</option>
                    <option value="manual_review">manual_review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">
                    Reviewer Comments
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2 h-24"
                  />
                </div>

                {decision === "offer" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600">
                        New Offer Amount
                      </label>
                      <input
                        type="number"
                        min={500}
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(Number(e.target.value))}
                        className="mt-1 w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">
                        New Offer Tenure (Months)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={offerTenure}
                        onChange={(e) => setOfferTenure(Number(e.target.value))}
                        className="mt-1 w-full border rounded px-3 py-2"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex gap-2">
                  <button
                    onClick={submitDecision}
                    className="px-4 py-2 bg-emerald-600 text-white rounded"
                  >
                    Submit Decision
                  </button>
                  <button
                    onClick={() => {
                      setAppData(null);
                      setResult(null);
                    }}
                    className="px-4 py-2 bg-white border rounded"
                  >
                    Clear
                  </button>
                </div>

                {result && (
                  <div className="md:col-span-2 mt-2">
                    <h4 className="font-semibold">Result</h4>
                    <pre className="text-sm bg-gray-50 p-3 rounded">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <InfoEmpty message="No application loaded." />
          )}
        </div>
      </div>
    </section>
  );
}
