import api from "./api";

export const loginUser = (payload) => api.post("/users/login", payload);
export const getCurrentUser = () => api.get("/users/me");