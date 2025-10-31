import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  customerTasks: {
    data: [],
    isLoading: false,
    error: null,
  },
  availableTasks: {
    data: [],
    isLoading: false,
    error: null,
  },
  taskDetail: {
    data: null,
    isLoading: false,
    error: null,
  },
  categories: {
    data: [],
    isLoading: false,
    error: null,
  },
};

// Async thunks
export const fetchCustomerTasks = createAsyncThunk(
  'tasks/fetchCustomerTasks',
  async (params = { limit: 3 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/tasks/user/myTasks', { params });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch tasks'
      );
    }
  }
);

export const fetchAvailableTasks = createAsyncThunk(
  'tasks/fetchAvailableTasks',
  async (params = { limit: 3, status: 'open' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/tasks', { params });
      return data;
    } catch (error) {
      console.error('Error fetching available tasks:', error);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch available tasks'
      );
    }
  }
);

export const fetchTaskDetail = createAsyncThunk(
  'tasks/fetchTaskDetail',
  async ({ taskId, signal }, { rejectWithValue }) => {
    try {
      console.log('Fetching task details...');
      const { data } = await api.get(`/tasks/${taskId}`, { signal });
      console.log('Task details fetched:', data);
      return data;
    } catch (error) {
      if (error.name === 'CanceledError') {
        return rejectWithValue('Request aborted');
      }
      console.error('Error fetching task details11:', error);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch task details'
      );
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/tasks', taskData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to create task'
      );
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, taskData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to update task'
      );
    }
  }
);

export const requestTaskCompletion = createAsyncThunk(
  'tasks/requestTaskCompletion',
  async ({ taskId, completionNote }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}/request-completion`, { completionNote });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to request task completion'
      );
    }
  }
);

export const confirmTaskCompletion = createAsyncThunk(
  'tasks/confirmTaskCompletion',
  async ({ taskId, customerFeedback }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}/confirm-completion`, { customerFeedback });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to confirm task completion'
      );
    }
  }
);

export const rejectTaskCompletion = createAsyncThunk(
  'tasks/rejectTaskCompletion',
  async ({ taskId, rejectionReason }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}/reject-completion`, { rejectionReason });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to reject task completion'
      );
    }
  }
);

export const addTaskerFeedback = createAsyncThunk(
  'tasks/addTaskerFeedback',
  async ({ taskId, taskerFeedback }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}/tasker-feedback`, { taskerFeedback });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to add tasker feedback'
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'tasks/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/categories');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to fetch categories'
      );
    }
  }
);

// Tasks slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    resetTaskDetail: (state) => {
      state.taskDetail.data = null;
      state.taskDetail.error = null;
    },
    resetTaskErrors: (state) => {
      state.customerTasks.error = null;
      state.availableTasks.error = null;
      state.taskDetail.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.categories.isLoading = true;
        state.categories.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories.isLoading = false;
        state.categories.data = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categories.isLoading = false;
        state.categories.error = action.payload;
      })
      
      // Fetch customer tasks
      .addCase(fetchCustomerTasks.pending, (state) => {
        state.customerTasks.isLoading = true;
        state.customerTasks.error = null;
      })
      .addCase(fetchCustomerTasks.fulfilled, (state, action) => {
        state.customerTasks.isLoading = false;
        state.customerTasks.data = action.payload;
      })
      .addCase(fetchCustomerTasks.rejected, (state, action) => {
        state.customerTasks.isLoading = false;
        state.customerTasks.error = action.payload;
      })
      
      // Fetch available tasks
      .addCase(fetchAvailableTasks.pending, (state) => {
        state.availableTasks.isLoading = true;
        state.availableTasks.error = null;
      })
      .addCase(fetchAvailableTasks.fulfilled, (state, action) => {
        state.availableTasks.isLoading = false;
        state.availableTasks.data = action.payload.tasks || action.payload;
      })
      .addCase(fetchAvailableTasks.rejected, (state, action) => {
        state.availableTasks.isLoading = false;
        state.availableTasks.error = action.payload;
      })
      
      // Fetch task detail
      .addCase(fetchTaskDetail.pending, (state) => {
        state.taskDetail.isLoading = true;
        state.taskDetail.error = null;
      })
      .addCase(fetchTaskDetail.fulfilled, (state, action) => {
        state.taskDetail.isLoading = false;
        state.taskDetail.data = action.payload;
      })
      .addCase(fetchTaskDetail.rejected, (state, action) => {
        console.log("Error fetching task detail:", action.payload);
        state.taskDetail.isLoading = false;
        state.taskDetail.error = action.payload;
      })
      
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.customerTasks.data = [action.payload, ...state.customerTasks.data];
      })
      
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        
        // Update in customer tasks if exists
        state.customerTasks.data = state.customerTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update in available tasks if exists
        state.availableTasks.data = state.availableTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update task detail if it's the same task
        if (state.taskDetail.data && state.taskDetail.data._id === updatedTask._id) {
          state.taskDetail.data = updatedTask;
        }
      })
      
      // Request task completion
      .addCase(requestTaskCompletion.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        
        // Update in customer tasks if exists
        state.customerTasks.data = state.customerTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update in available tasks if exists
        state.availableTasks.data = state.availableTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update task detail if it's the same task
        if (state.taskDetail.data && state.taskDetail.data._id === updatedTask._id) {
          state.taskDetail.data = updatedTask;
        }
      })
      
      // Confirm task completion
      .addCase(confirmTaskCompletion.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        
        // Update in customer tasks if exists
        state.customerTasks.data = state.customerTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update in available tasks if exists
        state.availableTasks.data = state.availableTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update task detail if it's the same task
        if (state.taskDetail.data && state.taskDetail.data._id === updatedTask._id) {
          state.taskDetail.data = updatedTask;
        }
      })
      
      // Reject task completion
      .addCase(rejectTaskCompletion.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        
        // Update in customer tasks if exists
        state.customerTasks.data = state.customerTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update in available tasks if exists
        state.availableTasks.data = state.availableTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update task detail if it's the same task
        if (state.taskDetail.data && state.taskDetail.data._id === updatedTask._id) {
          state.taskDetail.data = updatedTask;
        }
      })
      
      // Add tasker feedback
      .addCase(addTaskerFeedback.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        
        // Update in customer tasks if exists
        state.customerTasks.data = state.customerTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update in available tasks if exists
        state.availableTasks.data = state.availableTasks.data.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update task detail if it's the same task
        if (state.taskDetail.data && state.taskDetail.data._id === updatedTask._id) {
          state.taskDetail.data = updatedTask;
        }
      });
  },
});

// Export actions and reducer
export const { resetTaskDetail, resetTaskErrors } = tasksSlice.actions;

// Selectors
export const selectCustomerTasks = (state) => state.tasks.customerTasks.data;
export const selectCustomerTasksLoading = (state) => state.tasks.customerTasks.isLoading;
export const selectCustomerTasksError = (state) => state.tasks.customerTasks.error;

export const selectAvailableTasks = (state) => state.tasks.availableTasks.data;
export const selectAvailableTasksLoading = (state) => state.tasks.availableTasks.isLoading;
export const selectAvailableTasksError = (state) => state.tasks.availableTasks.error;

export const selectTaskDetail = (state) => state.tasks.taskDetail.data;
export const selectTaskDetailLoading = (state) => state.tasks.taskDetail.isLoading;
export const selectTaskDetailError = (state) => state.tasks.taskDetail.error;

export const selectCategories = (state) => state.tasks.categories.data;
export const selectCategoriesLoading = (state) => state.tasks.categories.isLoading;
export const selectCategoriesError = (state) => state.tasks.categories.error;

// Create memoized selectors for any derived data
export const selectAvailableTasksByCategory = createSelector(
  [selectAvailableTasks, (state, category) => category],
  (tasks, category) => {
    if (!category) return tasks;
    return tasks.filter(task => task.category === category);
  }
);

export default tasksSlice.reducer;