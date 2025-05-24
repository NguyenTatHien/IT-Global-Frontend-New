import {
  Action,
  configureStore,
  ThunkAction,
} from '@reduxjs/toolkit';
import accountReducer from './slice/accountSlide';
import userReducer from './slice/userSlide';
import permissionReducer from './slice/permissionSlide';
import roleReducer from './slice/roleSlide';
import companyReducer from './slice/companySlide';
import departmentReducer from './slice/departmentSlide';
export const store = configureStore({
  reducer: {
    account: accountReducer,
    user: userReducer,
    permission: permissionReducer,
    role: roleReducer,
    company: companyReducer,
    department: departmentReducer,
  },
});


export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;