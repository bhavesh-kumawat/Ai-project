import api from "../utils/api";

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

export const getAdminUsers = async (params = {}) => {
  const response = await api.get("/admin/users", { params });
  return response.data;
};

export const getAdminGenerations = async (params = {}) => {
  const response = await api.get("/admin/generations", { params });
  return response.data;
};
