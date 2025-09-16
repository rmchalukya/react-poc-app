import React, { useState, useEffect } from "react";
import { getApp, humanDecision, getRecentApps } from "../api/client";
import InfoEmpty from "./InfoEmpty";

// --- Helper Components (No changes) ---
function Badge({ text }) {
    const lowerText = text?.toLowerCase() || '';
    const colorClasses = {
        approve: "bg-emerald-100 text-emerald-800",
        approved: "bg-emerald-100 text-emerald-800",
        rejected: "bg-red-100 text-red-800",
        offer: "bg-amber-100 text-amber-800",
        manual_review: "bg-sky-100 text-sky-800",
        under_process: "bg-gray-100 text-gray-800",
    };
    const color = colorClasses[lowerText] || "bg-gray-100 text-gray-800";
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{text}</span>;
}

function DetailItem({ label, children }) {
    return (
        <div>
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-base font-semibold text-gray-800">{children}</div>
        </div>
    );
}

function ApplicationDetails({ data }) {
    if (!data) return null;
    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="text-lg font-bold text-sky-700 mb-4">Application Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                <DetailItem label="Application ID">#{data.application_id}</DetailItem>
                <DetailItem label="Applicant ID">#{data.applicant_id}</DetailItem>
                <DetailItem label="Status"><Badge text={data.status} /></DetailItem>
                <DetailItem label="Created At">{new Date(data.created_at).toLocaleString()}</DetailItem>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold mb-2">Loan Request</h4>
                    <div className="space-y-3">
                        <DetailItem label="Requested Amount">
                            {data.requested_amount?.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                        </DetailItem>
                        <DetailItem label="Requested Tenure">{data.requested_tenure_months} months</DetailItem>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-2">AI Assessment</h4>
                    <div className="space-y-3">
                        <DetailItem label="Confidence Score">{data.score?.toFixed(2)}</DetailItem>
                        <DetailItem label="AI Decision"><Badge text={data.decision} /></DetailItem>
                        {data.suggested_offer && (
                             <DetailItem label="Suggested Offer">
                                {data.suggested_offer.amount?.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                                {' for '}
                                {data.suggested_offer.tenure_months} months
                            </DetailItem>
                        )}
                        <DetailItem label="Reasoning">
                            <span className="text-sm font-normal text-gray-600">{data.reasoning}</span>
                        </DetailItem>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main ManualReview Component ---
export default function ManualReview() {
  const [appId, setAppId] = useState('');
  const [allApps, setAllApps] = useState([]);
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState("approve");
  const [comment, setComment] = useState("");
  const [offerAmount, setOfferAmount] = useState(500);
  const [offerTenure, setOfferTenure] = useState(1);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadApps = async () => {
      const recent = await getRecentApps();
      setAllApps(recent || []);
      if (recent && recent.length > 0) {
        setAppId(recent[0].application_id);
      }
    };
    loadApps();
  }, []);

  const fetchApplication = async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setResult(null);
    const data = await getApp(idToFetch);
    setAppData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplication(appId);
  }, [appId]);

  const submitDecision = async () => {
    setLoading(true);
    const new_offer =
      decision === "offer"
        ? { amount: offerAmount, tenure_months: offerTenure }
        : null;
    const res = await humanDecision(appId, decision, comment, new_offer);
    setResult(res);
    setLoading(false);
    if (res && !res.error) {
      fetchApplication(appId);
    }
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
              Select Application to Review
            </label>
            <select
              value={appId}
              onChange={(e) => setAppId(Number(e.target.value))}
              className="mt-1 w-64 border rounded px-3 py-2"
              disabled={allApps.length === 0}
            >
              {allApps.length > 0 ? (
                allApps.map(app => (
                  <option key={app.application_id} value={app.application_id}>
                    ID: {app.application_id} - Applicant: {app.applicant_id} ({app.status})
                  </option>
                ))
              ) : (
                <option>No applications found</option>
              )}
            </select>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          {loading ? (
            <div>Loading application details...</div>
          ) : appData ? (
            <div className="space-y-6">
              <ApplicationDetails data={appData} />

              {/* --- NEW: Conditional rendering for the decision form --- */}
              {appData.status === 'under_process' ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <label className="block text-sm text-gray-600">
                      Your Decision
                    </label>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      className="mt-1 w-full border rounded px-3 py-2"
                    >
                      <option value="approve">Approve</option>
                      <option value="rejected">Reject</option>
                      <option value="offer">Make New Offer (Conditional)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">
                      Reviewer Comments (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="e.g., Verified income with payslip."
                      className="mt-1 w-full border rounded px-3 py-2 h-24"
                    />
                  </div>
                  {decision === "offer" && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600">
                          New Offer Amount (AED)
                        </label>
                        <input
                          type="number"
                          min={500}
                          step={100}
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
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-600 text-white rounded disabled:bg-emerald-300"
                    >
                      {loading ? "Submitting..." : "Submit Decision"}
                    </button>
                  </div>
                  {result && result.error && (
                    <div className="md:col-span-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                        Error: {JSON.stringify(result.error)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 border-t pt-4">
                    <InfoEmpty message={`This application has already been processed with a final status of '${appData.status}'. No further action is needed.`} />
                </div>
              )}
            </div>
          ) : (
            <InfoEmpty message="Select an application from the dropdown to begin." />
          )}
        </div>
      </div>
    </section>
  );
}