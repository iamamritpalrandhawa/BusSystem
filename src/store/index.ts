import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import progressReducer from "./progressSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    progress: progressReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
