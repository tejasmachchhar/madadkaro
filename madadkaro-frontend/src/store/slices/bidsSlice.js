import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  myBids: {
    data: [],
    isLoading: false,
    error: null,
  },
  bidDetail: {
    data: null,
    isLoading: false,
    error: null,
  },
  taskBids: {
    data: [],
    isLoading: false,
    error: null,
  },
};

// Async thunks
export const fetchMyBids = createAsyncThunk(
  'bids/fetchMyBids',
  async (params = { limit: 3 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/bids/myBids', { params });
      return data;
    } catch (error) {
      console.error('Error fetching user bids:', error.response || error);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch bids'
      );
    }
  }
);

export const fetchBidDetail = createAsyncThunk(
  'bids/fetchBidDetail',
  async (bidId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/bids/${bidId}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch bid details'
      );
    }
  }
);

export const fetchTaskBids = createAsyncThunk(
  'bids/fetchTaskBids',
  async (taskId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/bids`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch task bids'
      );
    }
  }
);

export const createBid = createAsyncThunk(
  'bids/createBid',
  async ({ taskId, bidData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/tasks/${taskId}/bids`, bidData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to create bid'
      );
    }
  }
);

export const updateBid = createAsyncThunk(
  'bids/updateBid',
  async ({ bidId, bidData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/bids/${bidId}`, bidData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to update bid'
      );
    }
  }
);

export const updateBidStatus = createAsyncThunk(
  'bids/updateBidStatus',
  async ({ bidId, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/bids/${bidId}/status`, { status });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to update bid status'
      );
    }
  }
);

// Bids slice
const bidsSlice = createSlice({
  name: 'bids',
  initialState,
  reducers: {
    resetBidDetail: (state) => {
      state.bidDetail.data = null;
      state.bidDetail.error = null;
    },
    resetBidErrors: (state) => {
      state.myBids.error = null;
      state.bidDetail.error = null;
      state.taskBids.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my bids
      .addCase(fetchMyBids.pending, (state) => {
        state.myBids.isLoading = true;
        state.myBids.error = null;
      })
      .addCase(fetchMyBids.fulfilled, (state, action) => {
        state.myBids.isLoading = false;
        state.myBids.data = action.payload;
      })
      .addCase(fetchMyBids.rejected, (state, action) => {
        state.myBids.isLoading = false;
        state.myBids.error = action.payload;
      })
      
      // Fetch bid detail
      .addCase(fetchBidDetail.pending, (state) => {
        state.bidDetail.isLoading = true;
        state.bidDetail.error = null;
      })
      .addCase(fetchBidDetail.fulfilled, (state, action) => {
        state.bidDetail.isLoading = false;
        state.bidDetail.data = action.payload;
      })
      .addCase(fetchBidDetail.rejected, (state, action) => {
        state.bidDetail.isLoading = false;
        state.bidDetail.error = action.payload;
      })
      
      // Fetch task bids
      .addCase(fetchTaskBids.pending, (state) => {
        state.taskBids.isLoading = true;
        state.taskBids.error = null;
      })
      .addCase(fetchTaskBids.fulfilled, (state, action) => {
        state.taskBids.isLoading = false;
        state.taskBids.data = action.payload;
      })
      .addCase(fetchTaskBids.rejected, (state, action) => {
        state.taskBids.isLoading = false;
        state.taskBids.error = action.payload;
      })
      
      // Create bid
      .addCase(createBid.fulfilled, (state, action) => {
        state.myBids.data = [action.payload, ...state.myBids.data];
        state.taskBids.data = [action.payload, ...state.taskBids.data];
      })
      
      // Update bid 
      .addCase(updateBid.fulfilled, (state, action) => {
        const updatedBid = action.payload;
        
        // Update in my bids if exists
        state.myBids.data = state.myBids.data.map(bid => 
          bid._id === updatedBid._id ? updatedBid : bid
        );
        
        // Update in task bids if exists
        state.taskBids.data = state.taskBids.data.map(bid => 
          bid._id === updatedBid._id ? updatedBid : bid
        );
        
        // Update bid detail if it's the same bid
        if (state.bidDetail.data && state.bidDetail.data._id === updatedBid._id) {
          state.bidDetail.data = updatedBid;
        }
      })
      
      // Update bid status
      .addCase(updateBidStatus.fulfilled, (state, action) => {
        const updatedBid = action.payload;
        
        // Update in my bids if exists
        state.myBids.data = state.myBids.data.map(bid => 
          bid._id === updatedBid._id ? updatedBid : bid
        );
        
        // Update in task bids if exists
        state.taskBids.data = state.taskBids.data.map(bid => 
          bid._id === updatedBid._id ? updatedBid : bid
        );
        
        // Update bid detail if it's the same bid
        if (state.bidDetail.data && state.bidDetail.data._id === updatedBid._id) {
          state.bidDetail.data = updatedBid;
        }
      });
  },
});

// Export actions and reducer
export const { resetBidDetail, resetBidErrors } = bidsSlice.actions;

// Selectors
export const selectMyBids = (state) => state.bids.myBids.data;
export const selectMyBidsLoading = (state) => state.bids.myBids.isLoading;
export const selectMyBidsError = (state) => state.bids.myBids.error;

export const selectBidDetail = (state) => state.bids.bidDetail.data;
export const selectBidDetailLoading = (state) => state.bids.bidDetail.isLoading;
export const selectBidDetailError = (state) => state.bids.bidDetail.error;

export const selectTaskBids = (state) => state.bids.taskBids.data;
export const selectTaskBidsLoading = (state) => state.bids.taskBids.isLoading;
export const selectTaskBidsError = (state) => state.bids.taskBids.error;

// Helper selectors with memoization
export const selectActiveBids = createSelector(
  [selectMyBids],
  (myBids) => myBids.filter(bid => bid.status === 'accepted')
);

export const selectPendingBids = createSelector(
  [selectMyBids],
  (myBids) => myBids.filter(bid => bid.status === 'pending')
);

export default bidsSlice.reducer; 