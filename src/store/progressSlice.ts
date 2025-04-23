import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ProgressState {
  value: number;
}

const initialState: ProgressState = {
  value: 0,
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    setProgress: (state, action: PayloadAction<number>) => {
      state.value = action.payload;
    },
    resetProgress: (state) => {
      state.value = 0;
    },
  },
});

export const { setProgress, resetProgress } = progressSlice.actions;
export default progressSlice.reducer;
