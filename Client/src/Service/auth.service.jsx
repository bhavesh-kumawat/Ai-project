import api from "../utils/api";

export const loginUser = async (identifier, password) => {
    try {
        const response = await api.post("/auth/login", {
            identifier,
            password,
        });

        return response.data;

    } catch (error) {
        throw error.response?.data || {message: "Login failed"};
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

