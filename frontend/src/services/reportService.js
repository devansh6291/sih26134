import api from "./api";

export const getWeeklyReport = () => api.get("/reports/weekly");
export const getMonthlyReport = () => api.get("/reports/monthly");
export const getDistrictReport = () => api.get("/reports/district");