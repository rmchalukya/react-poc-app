import React, { useEffect, useState, useMemo } from "react";
import { Line, Pie } from "react-chartjs-2";
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
import { getSummary, getTransactions, getAnalytics } from "../api/client";

import Card from "./Card";
import InfoEmpty from "./InfoEmpty";

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

const API_BASE = "http://localhost:8000";

// --- RESTORED: Helper component for status badges ---
function StatusBadge({ status }) {
    const lowerStatus = status?.toLowerCase() || '';
    const colorClasses = {
        approved: "bg-emerald-100 text-emerald-800",
        rejected: "bg-red-100 text-red-800",
        // Add other statuses if needed
    };
    const color = colorClasses[lowerStatus] || "bg-gray-100 text-gray-800";
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{status}</span>;
}

export default function Dashboard() {
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

          {/* Repayment Monitor and Pie Chart */}
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
                          borderColor: "#0EA5E9",
                          backgroundColor: "rgba(14, 165, 233, 0.2)",
                          pointBackgroundColor: "#0284C7",
                          tension: 0.3,
                          borderWidth: 3,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: "top" } },
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
                        backgroundColor: ["#10B981", "#EF4444", "#F59E0B"],
                        borderColor: "#ffffff",
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              ) : (
                <InfoEmpty message="No decisions yet to show distribution." />
              )}
            </Card>
          </div>

          {/* --- MERGED: Accepted / Rejected Tables Section with Clean Formatting --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <h4 className="font-semibold text-sky-700 text-lg mb-3">
                Accepted Loans ({(summary.accepted_details || []).length})
              </h4>
              {summary.accepted_details && summary.accepted_details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">App ID</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Suggested Offer</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.accepted_details.map((row) => (
                        <tr key={row.application_id}>
                          <td className="p-2">{row.application_id}</td>
                          <td className="p-2">{row.applicant_id}</td>
                          <td className="p-2">{row.score?.toFixed(3) ?? 'N/A'}</td>
                          <td className="p-2">
                            {row.suggested_offer ? `${row.suggested_offer.amount} AED for ${row.suggested_offer.tenure_months} months` : 'N/A'}
                          </td>
                          <td className="p-2"><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <InfoEmpty message="No accepted loans yet." />
              )}
            </Card>

            <Card>
              <h4 className="font-semibold text-red-600 text-lg mb-3">
                Conditional Approval ({(summary.rejected_details || []).length})
              </h4>
              {summary.rejected_details && summary.rejected_details.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">App ID</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Reasoning</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.rejected_details.map((row) => (
                        <tr key={row.application_id}>
                          <td className="p-2">{row.application_id}</td>
                          <td className="p-2">{row.applicant_id}</td>
                          <td className="p-2">{row.score?.toFixed(3) ?? 'N/A'}</td>
                          <td className="p-2 text-xs text-gray-600">
                            {row.reasoning?.replace(/['{}]/g, '') ?? 'N/A'}
                          </td>
                          <td className="p-2"><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <InfoEmpty message="No conditional approvals yet." />
              )}
            </Card>
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
                  value={summary.avg_score?.toFixed(2) ?? "N/A"}
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
                  <div className="flex justify-between">
                    <span>Avg Salary (AED)</span>
                    <span className="font-semibold">
                      {analytics.avg_salary?.toLocaleString() ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Tenure (Months)</span>
                    <span className="font-semibold">
                      {analytics.avg_tenure?.toFixed(1) ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remittance Reliability Index</span>
                    <span className="font-semibold">
                      {analytics.good_history_pct ?? "N/A"}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Delinquency</span>
                    <span className="font-semibold">
                      {analytics.avg_defaults ?? "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <InfoEmpty message="No analytics available" />
              )}
            </Card>
          </div>
        </>
      )}
    </section>
  );
}

// Helper Components
function KpiCard({ title, value, color = "bg-sky-500" }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold mt-1">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-90`} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
