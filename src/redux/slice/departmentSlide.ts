import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callGetDepartments } from '@/config/api';

export const fetchDepartment = createAsyncThunk(
    'department/fetchDepartment',
    async ({ query }: { query: string }) => {
        const res = await callGetDepartments(query);
        return res;
    }
);

const initialState: { result: any[]; meta: any; isFetching: boolean } = { result: [], meta: {}, isFetching: false };

const departmentSlice = createSlice({
    name: 'department',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDepartment.pending, (state) => { state.isFetching = true; })
            .addCase(fetchDepartment.fulfilled, (state, action) => {
                state.result = action.payload.data?.result || [];
                state.meta = action.payload.data?.meta || {};
                state.isFetching = false;
            })
            .addCase(fetchDepartment.rejected, (state) => { state.isFetching = false; });
    },
});
export default departmentSlice.reducer;
