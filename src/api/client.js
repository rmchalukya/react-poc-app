import axios from "axios";

// ----------------------------
// Configuration
// ----------------------------
const API_BASE = "https://my-poc-api.onrender.com";
const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

// ----------------------------
// API helpers
// ----------------------------
export const getSummary = async () => {
  try {
    const res = await api.get("/dashboard/summary");
    return res.status === 200 ? res.data : {};
  } catch (e) {
    console.error("getSummary error", e);
    return {};
  }
};

export const getTransactions = async () => {
  try {
    const res = await api.get("/transactions");
    return res.status === 200 ? res.data : [];
  } catch (e) {
    console.error("getTransactions error", e);
    return [];
  }
};

export const getAnalytics = async () => {
  try {
    const res = await api.get("/analytics");
    return res.status === 200 ? res.data : {};
  } catch (e) {
    console.error("getAnalytics error", e);
    return {};
  }
};

export const submitApp = async (applicant_id, amount, tenure) => {
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

export const getApp = async (app_id) => {
  try {
    const res = await api.get(`/applications/${app_id}`);
    return res.status === 200 ? res.data : null;
  } catch (e) {
    console.error("getApp error", e);
    return null;
  }
};

export const humanDecision = async (
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

export const getRecentApps = async () => {
  try {
    const res = await api.get("/applications/recent");
    return res.status === 200 ? res.data : [];
  } catch (e) {
    console.error("getRecentApps error", e);
    return [];
  }
};