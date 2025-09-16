// src/App.jsx

import React, { useState } from "react";

// Import the newly created components
import Dashboard from "./components/Dashboard";
import SubmitApplication from "./components/SubmitApplication";
import ManualReview from "./components/ManualReview";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-sky-700">
              💳 FinYo POC
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