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

export const banAdminUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/ban`);
  return response.data;
};

export const unbanAdminUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/unban`);
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const deleteAdminGeneration = async (id) => {
  const response = await api.delete(`/admin/generations/${id}`);
  return response.data;
};

export const getAdminConfigs = async () => {
  const response = await api.get("/admin/configs");
  return response.data;
};

export const updateAdminConfig = async (data) => {
  const response = await api.post("/admin/configs", data);
  return response.data;
};

export const getAdminModeration = async (params = {}) => {
  const response = await api.get("/admin/moderation", { params });
  return response.data;
};

export const moderateAdminGeneration = async (id, status) => {
  const response = await api.patch(`/admin/generations/${id}/moderate`, { status });
  return response.data;
};
