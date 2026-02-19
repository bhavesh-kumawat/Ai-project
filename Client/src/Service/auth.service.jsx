import api from "../utils/api";

export const loginUser = async (identifier, password, rememberMe = false) => {
    try {
        const response = await api.post("/auth/login", { identifier, password, rememberMe });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Login failed" };
    }
};

export const registerUser = async (payload) => {
    try {
        const response = await api.post("/auth/register", payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Registration failed" };
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await api.post("/auth/forgot-password", { email });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to send OTP" };
    }
};

export const verifyOTP = async (email, otp) => {
    try {
        const response = await api.post("/auth/verify-otp", { email, otp });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Invalid OTP" };
    }
};

export const resetPassword = async (token, password) => {
    try {
        const response = await api.post(`/auth/reset-password/${token}`, { password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Password reset failed" };
    }
};
