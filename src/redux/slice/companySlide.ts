import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callGetCompanies } from '@/config/api';

export const fetchCompany = createAsyncThunk(
    'company/fetchCompany',
    async ({ query }: { query: string }) => {
        const res = await callGetCompanies(query);
        return res;
    }
);

const initialState: { result: any[]; meta: any; isFetching: boolean } = { result: [], meta: {}, isFetching: false };

const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCompany.pending, (state) => { state.isFetching = true; })
            .addCase(fetchCompany.fulfilled, (state, action) => {
                state.result = action.payload.data?.result || [];
                state.meta = action.payload.data?.meta || {};
                state.isFetching = false;
            })
            .addCase(fetchCompany.rejected, (state) => { state.isFetching = false; });
    },
});
export default companySlice.reducer;
