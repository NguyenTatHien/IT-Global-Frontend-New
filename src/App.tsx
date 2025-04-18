import { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import RegisterPage from 'pages/auth/register';
import LayoutAdmin from 'components/admin/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import DashboardPage from './pages/admin/dashboard';
import PermissionPage from './pages/admin/permission';
import RolePage from './pages/admin/role';
import UserPage from './pages/admin/user';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import FaceIdLogin from './pages/auth/faceIdLogin';
import FaceIdRegister from './pages/auth/faceIdRegister';
import CheckInOut from './components/admin/attendance/CheckInOut';
import AttendanceHistory from './components/admin/attendance/AttendanceHistory';
import Shifts from './components/admin/shifts/Shifts';
import UserShifts from './components/admin/user-shifts/UserShifts';
import { ConfigProvider } from 'antd';
import vi from 'antd/locale/vi_VN';
import MyShifts from './components/admin/user-shifts/MyShifts';

export default function App() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.account.isLoading);


  useEffect(() => {
    if (
      window.location.pathname === '/login'
      || window.location.pathname === '/register'
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
      path: "/admin",
      element: (<LayoutApp><LayoutAdmin /> </LayoutApp>),
      errorElement: <NotFound />,
      children: [
        {
          index: true, element:
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
          path: "check-in-out",
          element:
            <ProtectedRoute>
              <CheckInOut />
            </ProtectedRoute>
        },
        {
          path: "attendance-history",
          element:
            <ProtectedRoute>
              <AttendanceHistory />
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
        }
      ],
    },


    {
      path: "/login",
      element: <LoginPage />,
    },

    {
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/face-id-login",
      element: <FaceIdLogin />,
    },
    {
      path: "/face-id-register",
      element: <FaceIdRegister />,
    },
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