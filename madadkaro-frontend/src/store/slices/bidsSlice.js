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
      const { data } = await api.get(`/bids/task/${taskId}`);
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
      const { data } = await api.post(`/bids`, { ...bidData, task: taskId });
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
    // Real-time update reducers
    updateBidFromSocket: (state, action) => {
      const updatedBid = action.payload;

      // Update in my bids if exists
      state.myBids.data = state.myBids.data.map(bid =>
        bid._id === updatedBid._id ? { ...bid, ...updatedBid } : bid
      );

      // Update in task bids if exists
      state.taskBids.data = state.taskBids.data.map(bid =>
        bid._id === updatedBid._id ? { ...bid, ...updatedBid } : bid
      );

      // Update bid detail if it's the same bid
      if (state.bidDetail.data && state.bidDetail.data._id === updatedBid._id) {
        state.bidDetail.data = { ...state.bidDetail.data, ...updatedBid };
      }
    },
    updateTaskInBids: (state, action) => {
      const { taskId, status } = action.payload;
      console.log('[updateTaskInBids] Updating task', taskId, 'to status', status);

      let updatedCount = 0;

      // Update task status in my bids
      state.myBids.data = state.myBids.data.map(bid => {
        if (bid.task && String(bid.task._id) === String(taskId)) {
          console.log('[updateTaskInBids] Updating myBid', bid._id, 'task status from', bid.task.status, 'to', status);
          updatedCount++;
          return { ...bid, task: { ...bid.task, status } };
        }
        return bid;
      });

      // Update task status in task bids
      state.taskBids.data = state.taskBids.data.map(bid => {
        if (bid.task && String(bid.task._id) === String(taskId)) {
          console.log('[updateTaskInBids] Updating taskBid', bid._id, 'task status from', bid.task.status, 'to', status);
          updatedCount++;
          return { ...bid, task: { ...bid.task, status } };
        }
        return bid;
      });

      // Update task status in bid detail
      if (state.bidDetail.data && state.bidDetail.data.task && String(state.bidDetail.data.task._id) === String(taskId)) {
        console.log('[updateTaskInBids] Updating bidDetail task status');
        state.bidDetail.data.task = { ...state.bidDetail.data.task, status };
        updatedCount++;
      }

      console.log('[updateTaskInBids] Updated', updatedCount, 'items');
    },
    addBidToTask: (state, action) => {
      // Add new bid to task bids list
      const newBid = action.payload;
      state.taskBids.data = [newBid, ...state.taskBids.data];
      
      // Also add to my bids if it's the current user's bid
      if (!state.myBids.data.find(bid => bid._id === newBid._id)) {
        state.myBids.data = [newBid, ...state.myBids.data];
      }
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
export const { resetBidDetail, resetBidErrors, updateBidFromSocket, updateTaskInBids, addBidToTask } = bidsSlice.actions;

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

export const selectRejectedBids = createSelector(
  [selectMyBids],
  (myBids) => myBids.filter(bid => bid.status === 'rejected')
);

export default bidsSlice.reducer; 