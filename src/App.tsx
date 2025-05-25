import { useEffect } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import RegisterPage from 'pages/auth/register';
import LayoutAdmin from 'components/admin/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import DashboardPage from './pages/admin/dashboard';
import HomePage from './pages/admin/home';
import PermissionPage from './pages/admin/permission';
import RolePage from './pages/admin/role';
import UserPage from './pages/admin/user';
import ReportsPage from './pages/admin/reports';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import FaceIdLogin from './pages/auth/faceIdLogin';
import FaceIdRegister from './pages/auth/faceIdRegister';
import CheckInOut from './components/admin/attendance/CheckInOut';
import Shifts from './components/admin/shifts/Shifts';
import UserShifts from './components/admin/user-shifts/UserShifts';
import { ConfigProvider } from 'antd';
import vi from 'antd/locale/vi_VN';
import MyShifts from './components/admin/user-shifts/MyShifts';
import Profile from './pages/admin/profile';
import LeaveRequestPage from './pages/admin/leave-request';
import PayrollPage from './pages/admin/payroll';
import FacePythonTest from 'pages/auth/facepythontest';
import CompanyPage from './pages/admin/company';
import DepartmentPage from './pages/admin/department';
import MyAttendanceHistory from './components/admin/attendance/MyAttendanceHistory';

export default function App() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.account.isLoading);


  useEffect(() => {
    if (
      window.location.pathname === '/login' ||
      // window.location.pathname === '/register' ||
      window.location.pathname === '/face-id-login'
      // window.location.pathname === '/face-id-register'
    )
      return;
    dispatch(fetchAccount())
  }, [])

  const router = createBrowserRouter([
    // {
    //   path: "/",
    //   element: (<LayoutApp><LayoutClient /></LayoutApp>),
    //   errorElement: <NotFound />,
    //   children: [
    //     { index: true, element: <HomePage /> },
    //     { path: "job", element: <ClientJobPage /> },
    //     { path: "job/:id", element: <ClientJobDetailPage /> },
    //     { path: "company", element: <ClientCompanyPage /> },
    //     { path: "company/:id", element: <ClientCompanyDetailPage /> }
    //   ],
    // },
    {
      path: "/",
      element: <Navigate to="/admin" replace />,
    },

    {
      path: "/admin",
      element: (<LayoutApp><LayoutAdmin /> </LayoutApp>),
      errorElement: <NotFound />,
      children: [
        {
          index: true, element:
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
        },
        {
          path: "dashboard",
          element:
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
        },
        {
          path: "user",
          element:
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
        },
        {
          path: "permission",
          element:
            <ProtectedRoute>
              <PermissionPage />
            </ProtectedRoute>
        },
        {
          path: "role",
          element:
            <ProtectedRoute>
              <RolePage />
            </ProtectedRoute>
        },
        {
          path: "reports",
          element:
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
        },
        {
          path: "check-in-out",
          element:
            <ProtectedRoute>
              <CheckInOut />
            </ProtectedRoute>
        },
        {
          path: "my-attendance-history",
          element:
            <ProtectedRoute>
              <MyAttendanceHistory />
            </ProtectedRoute>
        },
        {
          path: "shifts",
          element:
            <ProtectedRoute>
              <Shifts />
            </ProtectedRoute>
        },
        {
          path: "user-shifts",
          element:
            <ProtectedRoute>
              <UserShifts />
            </ProtectedRoute>
        },
        {
          path: "my-shifts",
          element:
            <ProtectedRoute>
              <MyShifts />
            </ProtectedRoute>
        },
        {
          path: "profile",
          element:
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
        },
        {
          path: "leave-request",
          element:
            <ProtectedRoute>
              <LeaveRequestPage />
            </ProtectedRoute>
        },
        {
          path: "payroll",
          element:
            <ProtectedRoute>
              <PayrollPage />
            </ProtectedRoute>
        },
        {
          path: "company",
          element: (
            <ProtectedRoute>
              <CompanyPage />
            </ProtectedRoute>
          )
        },
        {
          path: "department",
          element: (
            <ProtectedRoute>
              <DepartmentPage />
            </ProtectedRoute>
          )
        }
      ],
    },
    {
      path: "/face-id-test",
      element: <FacePythonTest />,
    },

    {
      path: "/login",
      element: <LoginPage />,
    },

    // {
    //   path: "/register",
    //   element: <RegisterPage />,
    // },
    {
      path: "/face-id-login",
      element: <FaceIdLogin />,
    },
    // {
    //   path: "/face-id-register",
    //   element: <FaceIdRegister />,
    // },
    {
      path: "*",
      element: <NotFound />,
    }
  ]);

  return (
    <ConfigProvider locale={vi}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}