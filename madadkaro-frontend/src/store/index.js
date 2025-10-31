import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import tasksReducer from './slices/tasksSlice';
import bidsReducer from './slices/bidsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    tasks: tasksReducer,
    bids: bidsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 