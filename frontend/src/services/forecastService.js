import api from "./api";

export const getDemandForecast = (skillId) =>
  api.get(`/forecast/${skillId}`);