import React, { useState, useEffect } from "react";
import { submitApp, getRecentApps } from "../api/client";
import Card from "./Card";
import InfoEmpty from "./InfoEmpty";

// --- Simulated database of 25 applicants ---
const SIMULATED_APPLICANTS = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Emily Johnson" },
  { id: 3, name: "Michael Williams" },
  { id: 4, name: "Jessica Brown" },
  { id: 5, name: "David Jones" },
  { id: 6, name: "Sarah Garcia" },
  { id: 7, name: "James Miller" },
  { id: 8, name: "Linda Davis" },
  { id: 9, name: "Robert Rodriguez" },
  { id: 10, name: "Mary Martinez" },
  { id: 11, name: "William Hernandez" },
  { id: 12, name: "Jennifer Lopez" },
  { id: 13, name: "Richard Gonzalez" },
  { id: 14, name: "Patricia Wilson" },
  { id: 15, name: "Charles Anderson" },
  { id: 16, name: "Barbara Thomas" },
  { id: 17, name: "Joseph Taylor" },
  { id: 18, name: "Elizabeth Moore" },
  { id: 19, name: "Thomas Jackson" },
  { id: 20, name: "Susan Martin" },
  { id: 21, name: "Daniel Lee" },
  { id: 22, name: "Karen Perez" },
  { id: 23, name: "Matthew Thompson" },
  { id: 24, name: "Nancy White" },
  { id: 25, name: "Anthony Harris" },
];


// --- Modal Component for Adding an Applicant ---
function NewApplicantModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(30);
  const [salary, setSalary] = useState(5000);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name && age && salary) {
      onSave({ name, age, salary });
      setName("");
      setAge(30);
      setSalary(5000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Add New Applicant</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Applicant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Monthly Salary (AED)</label>
            <input
              type="number"
              step="500"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-sky-600 text-white rounded">
            Save Applicant
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modal for Displaying the AI-Generated Summary ---
function SummaryModal({ isOpen, onClose, summary, isLoading, appData }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-lg font-bold mb-2 text-sky-700">
                    AI Eligibility Analysis for Application #{appData?.application_id}
                </h3>
                <div className="mt-4 p-4 bg-gray-50 rounded border min-h-[150px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 animate-pulse">🧠 Analyzing data and generating summary...</p>
                        </div>
                    ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- NEW: Modal for Displaying Raw Score Features ---
function ExplainScoreModal({ isOpen, onClose, features, appId }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <h3 className="text-lg font-bold mb-4 text-sky-700">
                    Score Calculation Features for Application #{appId}
                </h3>
                <div className="mt-4 p-4 bg-gray-50 rounded border max-h-[60vh] overflow-y-auto">
                    {features ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            {Object.entries(features).map(([key, value]) => (
                                <li key={key} className="flex justify-between border-b py-1">
                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="font-semibold text-gray-800">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No feature data available for this application.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main SubmitApplication Component ---
export default function SubmitApplication() {
  const [applicantId, setApplicantId] = useState(1);
  const [amount, setAmount] = useState(1000);
  const [tenure, setTenure] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [apps, setApps] = useState([]);
  const [message, setMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicants, setApplicants] = useState(SIMULATED_APPLICANTS);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedAppData, setSelectedAppData] = useState(null);
  const [llmSummary, setLlmSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // --- NEW: State for the Explain Score Modal ---
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [selectedAppFeatures, setSelectedAppFeatures] = useState(null);


  const fetchApps = async () => {
    const recent = await getRecentApps();
    setApps(recent || []);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await submitApp(applicantId, amount, tenure);
    setSubmitting(false);

    if (res.error) {
      setMessage({ type: "error", text: JSON.stringify(res.error) });
    } else {
      setMessage({
        type: "success",
        text: `Application Submitted! ID: ${res.application_id}`,
      });
      fetchApps();
    }
  };

  const handleSaveApplicant = (newApplicantData) => {
    const newId = 100 + applicants.filter(a => a.id >= 100).length;
    const newApplicant = {
      id: newId,
      name: `${newApplicantData.name} (New)`,
    };

    setApplicants([...applicants, newApplicant]);
    setApplicantId(newId);
    setIsModalOpen(false);
  };

  const generateLoanSummary = async (applicationData) => {
    const prompt = `Analyze the following loan application data for eligibility and provide a short summary: \n\n${JSON.stringify(applicationData, null, 2)}`;
    console.log("--- SIMULATED LLM PROMPT ---");
    console.log(prompt);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const score = applicationData.score?.toFixed(2);
    const decision = applicationData.decision;
    const amount = applicationData.requested_amount;

    let summaryText = `The applicant (ID: ${applicationData.applicant_id}) has applied for a loan of ${amount} AED. `;
    if (score > 0.7) {
        summaryText += `With a high confidence score of ${score}, eligibility is strong. The AI's initial decision is to '${decision}'. The applicant shows a reliable financial history.`;
    } else if (score > 0.4) {
        summaryText += `The confidence score is moderate at ${score}. The AI suggests a '${decision}', possibly with adjusted terms, to mitigate potential risk. Further review of income stability is recommended.`;
    } else {
        summaryText += `With a low confidence score of ${score}, this application presents a higher risk. The AI's decision is '${decision}', indicating a need for significant adjustments or manual intervention.`;
    }

    return summaryText;
  };

  const handleAnalyzeClick = async (applicationData) => {
    setSelectedAppData(applicationData);
    setIsSummaryModalOpen(true);
    setIsGeneratingSummary(true);
    setLlmSummary("");

    const summary = await generateLoanSummary(applicationData);

    setLlmSummary(summary);
    setIsGeneratingSummary(false);
  };

  // --- NEW: Click handler for the "Explain Score" button ---
  const handleExplainScoreClick = (applicationData) => {
    setSelectedAppData(applicationData);
    setSelectedAppFeatures(applicationData.features);
    setIsExplainModalOpen(true);
  };

  return (
    <section>
      <NewApplicantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApplicant}
      />
      
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={llmSummary}
        isLoading={isGeneratingSummary}
        appData={selectedAppData}
      />

      {/* --- NEW: Render the Explain Score Modal --- */}
      <ExplainScoreModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        features={selectedAppFeatures}
        appId={selectedAppData?.application_id}
      />

      <h2 className="text-xl font-semibold text-sky-700 mb-4">
        📝 Submit New Loan Application
      </h2>

      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="flex items-end gap-2">
            <div className="flex-grow">
                <label className="block text-sm text-gray-600">Applicant ID</label>
                <select
                    value={applicantId}
                    onChange={(e) => setApplicantId(Number(e.target.value))}
                    className="mt-1 w-full border rounded px-3 py-2"
                    required
                >
                    {applicants.map(app => (
                        <option key={app.id} value={app.id}>
                            {app.id} - {app.name}
                        </option>
                    ))}
                </select>
            </div>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded h-10"
                title="Add New Applicant"
            >
                +
            </button>
        </div>

        <div>
          <label className="block text-sm text-gray-600">
            Requested Loan Amount (&le; 2500 AED)
          </label>
          <input
            type="number"
            min={1000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">
            Requested Tenure (&le; 24 Months)
          </label>
          <input
            type="number"
            min={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="md:col-span-3 flex items-center gap-4 mt-2">
          <button
            disabled={submitting}
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white rounded shadow disabled:bg-sky-300"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>

      <Card>
        <h3 className="text-lg font-medium mb-3">📋 All Applications</h3>
        {apps && apps.length > 0 ? (
          <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Decision</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {apps.map((a) => (
                          <tr key={a.application_id}>
                              <td className="p-2">{a.application_id}</td>
                              <td className="p-2">{a.applicant_id}</td>
                              <td className="p-2">{a.requested_amount}</td>
                              <td className="p-2">{a.requested_tenure_months}</td>
                              <td className="p-2">{a.decision}</td>
                              <td className="p-2">{a.score?.toFixed(2)}</td>
                              <td className="p-2 space-x-2">
                                  <button
                                      onClick={() => handleAnalyzeClick(a)}
                                      className="px-2 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded hover:bg-sky-200"
                                  >
                                      Analyze with AI
                                  </button>
                                  {/* --- NEW: Explain Score Button --- */}
                                  <button
                                      onClick={() => handleExplainScoreClick(a)}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200"
                                  >
                                      Explain Score
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        ) : (
          <InfoEmpty message="No applications submitted yet." />
        )}
      </Card>
    </section>
  );
}

