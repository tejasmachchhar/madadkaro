import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Get user from localStorage
const userInfo = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const token = localStorage.getItem('token') || null;

// Initial state
const initialState = {
  currentUser: userInfo,
  token: token,
  isLoading: false,
  isAuthenticated: !!userInfo,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users/login', { email, password });
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Invalid email or password'
      );
    }
  }
);

export const register = createAsyncThunk(
  'user/register',
  async ({ name, email, password, role, phone }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users', {
        name,
        email,
        password,
        role,
        phone,
      });
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Registration failed'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/users/profile', userData);
      
      // Update localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to update profile'
      );
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { logout, resetError } = userSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.user.currentUser;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectIsCustomer = (state) => 
  state.user.currentUser && state.user.currentUser.role === 'customer';
export const selectIsTasker = (state) => 
  state.user.currentUser && state.user.currentUser.role === 'tasker';
export const selectIsAdmin = (state) => 
  state.user.currentUser && state.user.currentUser.role === 'admin';
export const selectToken = (state) => state.user.token;
export const selectUserLoading = (state) => state.user.isLoading;
export const selectUserError = (state) => state.user.error;

export default userSlice.reducer; 