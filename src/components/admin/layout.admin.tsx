import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined,
    ExceptionOutlined,
    ApiOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    BugOutlined,
    ClockCircleOutlined,
    HistoryOutlined,
    TeamOutlined,
    CalendarOutlined,
    BarChartOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, message, Avatar, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { callLogout, callGetProfile } from 'config/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { isMobile } from 'react-device-detect';
import type { MenuProps } from 'antd';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { IAccount } from '@/types/backend';

const { Content, Footer, Sider } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');
    const user = useAppSelector(state => state.account.user) as IAccount['user'];

    const permissions = useAppSelector(state => state.account.user.permissions);
    const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (permissions?.length) {
            const viewUser = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.USERS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method
            )

            const viewRole = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.ROLES.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.ROLES.GET_PAGINATE.method
            )

            const viewPermission = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method
            )

            const viewShifts = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.SHIFTS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.SHIFTS.GET_PAGINATE.method
            )

            const viewUserShifts = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.USER_SHIFTS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.USER_SHIFTS.GET_PAGINATE.method
            )

            const viewReport = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.REPORTS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.REPORTS.GET_PAGINATE.method
            )

            const viewLeaveRequest = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.LEAVE_REQUESTS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.LEAVE_REQUESTS.GET_PAGINATE.method
            )

            const viewPayroll = permissions.find(item =>
                item.apiPath === ALL_PERMISSIONS.PAYROLL.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.PAYROLL.GET_PAGINATE.method
            )

            const full = [
                {
                    label: <Link to='/admin/dashboard'>Bảng điều khiển</Link>,
                    key: '/admin/dashboard',
                    icon: <AppstoreOutlined />
                },
                ...(viewUser ? [{
                    label: <Link to='/admin/user'>Người dùng</Link>,
                    key: '/admin/user',
                    icon: <UserOutlined />
                }] : []),
                ...(viewPermission ? [{
                    label: <Link to='/admin/permission'>Quyền</Link>,
                    key: '/admin/permission',
                    icon: <ApiOutlined />
                }] : []),
                ...(viewRole ? [{
                    label: <Link to='/admin/role'>Vai trò</Link>,
                    key: '/admin/role',
                    icon: <ExceptionOutlined />
                }] : []),
                {
                    label: <Link to='/admin/check-in-out'>Chấm công</Link>,
                    key: '/admin/check-in-out',
                    icon: <ClockCircleOutlined />
                },
                {
                    label: <Link to='/admin/attendance-history'>Lịch sử chấm công</Link>,
                    key: '/admin/attendance-history',
                    icon: <HistoryOutlined />
                },
                ...(viewShifts ? [{
                    label: <Link to='/admin/shifts'>Quản lý ca làm việc</Link>,
                    key: '/admin/shifts',
                    icon: <ClockCircleOutlined />
                }] : []),
                ...(viewUserShifts ? [{
                    label: <Link to='/admin/user-shifts'>Phân ca nhân viên</Link>,
                    key: '/admin/user-shifts',
                    icon: <TeamOutlined />
                }] : []),
                {
                    label: <Link to='/admin/my-shifts'>Ca làm việc của tôi</Link>,
                    key: '/admin/my-shifts',
                    icon: <CalendarOutlined />
                },
                ...(viewLeaveRequest ? [{
                    label: <Link to='/admin/leave-request'>Đơn xin nghỉ phép</Link>,
                    key: '/admin/leave-request',
                    icon: <CalendarOutlined />
                }] : []),
                ...(viewPayroll ? [{
                    label: <Link to='/admin/payroll'>Bảng lương</Link>,
                    key: '/admin/payroll',
                    icon: <DollarOutlined />
                }] : []),
                ...(viewReport ? [{
                    label: <Link to='/admin/reports'>Thống kê báo cáo</Link>,
                    key: '/admin/reports',
                    icon: <BarChartOutlined />
                }] : []),
            ];

            setMenuItems(full);
        }
    }, [permissions, user])
    useEffect(() => {
        setActiveMenu(location.pathname)
    }, [location])

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && res.data) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/')
        }
    }

    const itemsDropdown = [
        {
            label: <Link to={'/admin'}>Trang chủ</Link>,
            key: 'home',
            icon: <AppstoreOutlined />,
        },
        {
            label: <Link to={'/admin/profile'}>Thông tin cá nhân</Link>,
            key: 'profile',
            icon: <UserOutlined />,
        },
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
            icon: <LogoutOutlined />,
        },
    ];

    return (
        <>
            <Layout
                style={{ minHeight: '100vh' }}
                className="layout-admin"
            >
                {!isMobile ?
                    <Sider
                        theme='light'
                        collapsible
                        collapsed={collapsed}
                        onCollapse={(value) => setCollapsed(value)}>
                        <div
                            style={{
                                margin: 16,
                                textAlign: 'center',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => navigate('/admin')}
                        >
                            <img
                                src={`${import.meta.env.VITE_BACKEND_URL}/images/company/logo.jpg`}
                                alt="Company Logo"
                                style={{
                                    height: collapsed ? '50px' : '90px',
                                    width: 'auto',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>
                        <Menu
                            selectedKeys={[activeMenu]}
                            mode="inline"
                            items={menuItems}
                            onClick={(e) => setActiveMenu(e.key)}
                        />
                    </Sider>
                    :
                    <Menu
                        selectedKeys={[activeMenu]}
                        items={menuItems}
                        onClick={(e) => setActiveMenu(e.key)}
                        mode="horizontal"
                    />
                }

                <Layout>
                    {!isMobile &&
                        <div className='admin-header' style={{ display: "flex", justifyContent: "space-between", marginRight: 20 }}>
                            <Button
                                type="text"
                                icon={collapsed ? React.createElement(MenuUnfoldOutlined) : React.createElement(MenuFoldOutlined)}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    fontSize: '16px',
                                    width: 64,
                                    height: 64,
                                }}
                            />

                            <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                <Space style={{ cursor: "pointer" }}>
                                    {user?.name}
                                    <Avatar
                                        src={user?.image ? `${import.meta.env.VITE_BACKEND_URL}/images/user/${user.image}` : null}
                                        icon={!user?.image && <UserOutlined />}
                                    >
                                    </Avatar>
                                </Space>
                            </Dropdown>
                        </div>
                    }
                    <Content style={{ padding: '15px' }}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </>
    );
};

export default LayoutAdmin;