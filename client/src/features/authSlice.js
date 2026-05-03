import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

// Register user
export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        const response = await axios.post(API_URL + 'register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Login user
export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
    try {
        const response = await axios.post(API_URL + 'login', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get current user
export const getMe = createAsyncThunk('auth/me', async (_, thunkAPI) => {
    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'x-auth-token': token
            }
        };
        const response = await axios.get(API_URL + 'me', config);
        return response.data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Logout
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('token');
});

const initialState = {
    user: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ''
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // We don't set user here immediately, or we could if backend returns user
                // But for now we just store token and maybe redirect
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // We will fetch user in a separate call or decode token
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            .addCase(getMe.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getMe.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(getMe.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
            });
    }
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
