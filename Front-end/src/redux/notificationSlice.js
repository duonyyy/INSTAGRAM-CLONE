// redux/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload); // Thêm vào đầu mảng
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (item) => item._id !== action.payload
      );
    },
  },
});

export const { addNotification, clearNotifications, removeNotification } =
  notificationSlice.actions;
export default notificationSlice.reducer;
