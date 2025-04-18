import React, { useState, useEffect } from 'react';
import { Button, Card, Space, message, Spin, notification, Alert } from 'antd';
import { useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { callCheckIn, callCheckOut, callGetTodayAttendance } from '@/config/api';
import dayjs from 'dayjs';
import { IBackendRes } from '@/types/backend';

interface IAttendance {
    _id: string;
    checkInTime: string;
    checkOutTime?: string;
    status: 'on-time' | 'late' | 'early';
    lateMinutes?: number;
    earlyMinutes?: number;
    totalHours?: number;
    overtimeHours?: number;
    userShiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
}

const AttendanceActions: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [todayAttendance, setTodayAttendance] = useState<IAttendance | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (!isAuthenticated || !token) {
                message.error('Vui lòng đăng nhập để tiếp tục');
                navigate('/login');
                return;
            }

            try {
                const response = await callGetTodayAttendance();
                if (response.data) {
                    setTodayAttendance(response.data);
                    setError(null);
                }
            } catch (error: any) {
                console.error('Error fetching today attendance:', error);
                if (error.message === 'Không có ca làm việc hôm nay') {
                    setError('Bạn không có ca làm việc nào trong hôm nay');
                }
            }
        };

        checkAuth();
    }, [isAuthenticated, user]);

    const handleCheckIn = async () => {
        try {
            setLoading(true);
            
            // Validate authentication
            if (!isAuthenticated || !user?._id) {
                throw new Error('Vui lòng đăng nhập lại để tiếp tục');
            }

            // Get current location
            let location;
            try {
                const position = await getCurrentPosition();
                location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            } catch (error) {
                message.warning('Không thể lấy vị trí của bạn. Hệ thống sẽ tiếp tục check-in mà không có thông tin vị trí.');
            }
            
            const response = await callCheckIn({ location });
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu từ server');
            }
            setTodayAttendance(response.data);
            message.success('Check-in thành công');
            
        } catch (error: any) {
            console.error('Check-in error:', error);
            
            let errorMessage = 'Check-in thất bại';
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            notification.error({
                message: 'Không thể check-in',
                description: errorMessage,
                duration: 5
            });
            
            if (error.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setLoading(true);

            if (!isAuthenticated || !user?._id) {
                throw new Error('Vui lòng đăng nhập lại để tiếp tục');
            }

            const response = await callCheckOut();
            if (!response.data) {
                throw new Error('Không nhận được dữ liệu từ server');
            }
            setTodayAttendance(response.data);
            message.success('Check-out thành công');
            
        } catch (error: any) {
            console.error('Check-out error:', error);
            
            let errorMessage = 'Check-out thất bại';
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            notification.error({
                message: 'Không thể check-out',
                description: errorMessage,
                duration: 5
            });
            
            if (error.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPosition = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Trình duyệt không hỗ trợ định vị'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
    };

    const renderAttendanceStatus = () => {
        if (!todayAttendance) return null;

        return (
            <div>
                <p>Ca làm việc: {todayAttendance.userShiftId.name}</p>
                <p>Trạng thái: {getStatusText(todayAttendance.status)}</p>
                <p>Giờ vào: {dayjs(todayAttendance.checkInTime).format('HH:mm:ss')}</p>
                {todayAttendance.lateMinutes && todayAttendance.lateMinutes > 0 && (
                    <p>Đi muộn: {todayAttendance.lateMinutes} phút</p>
                )}
                {todayAttendance.checkOutTime && (
                    <>
                        <p>Giờ ra: {dayjs(todayAttendance.checkOutTime).format('HH:mm:ss')}</p>
                        <p>Tổng giờ làm: {todayAttendance.totalHours?.toFixed(2)} giờ</p>
                        {todayAttendance.overtimeHours && todayAttendance.overtimeHours > 0 && (
                            <p>Giờ tăng ca: {todayAttendance.overtimeHours.toFixed(2)} giờ</p>
                        )}
                        {todayAttendance.earlyMinutes && todayAttendance.earlyMinutes > 0 && (
                            <p>Về sớm: {todayAttendance.earlyMinutes} phút</p>
                        )}
                    </>
                )}
            </div>
        );
    };

    const getStatusText = (status: 'on-time' | 'late' | 'early') => {
        switch (status) {
            case 'on-time':
                return 'Đúng giờ';
            case 'late':
                return 'Đi muộn';
            case 'early':
                return 'Về sớm';
            default:
                return 'Không xác định';
        }
    };

    const renderShiftInfo = () => {
        if (error) {
            return (
                <Alert
                    message="Thông báo"
                    description={error}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            );
        }

        if (!todayAttendance && user?.userShiftId) {
            return (
                <Alert
                    message="Thông tin ca làm việc"
                    description={
                        <>
                            <p>Bạn chưa check-in hôm nay</p>
                            <p>Ca làm việc: {user.userShiftId.name}</p>
                            <p>Thời gian: {dayjs(user.userShiftId.startTime).format('HH:mm')} - {dayjs(user.userShiftId.endTime).format('HH:mm')}</p>
                        </>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            );
        }

        if (!user?.userShiftId) {
            return (
                <Alert
                    message="Thông báo"
                    description="Bạn chưa được phân ca làm việc. Vui lòng liên hệ quản lý."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            );
        }

        return null;
    };

    return (
        <Card title="Điểm danh" style={{ maxWidth: 400, margin: '20px auto' }}>
            <Spin spinning={loading}>
                {renderShiftInfo()}
                {renderAttendanceStatus()}
                <Space style={{ marginTop: 16 }}>
                    <Button
                        type="primary"
                        onClick={handleCheckIn}
                        disabled={!!todayAttendance || !user?.userShiftId || !!error}
                    >
                        Check-in
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleCheckOut}
                        disabled={!todayAttendance || !!todayAttendance?.checkOutTime}
                    >
                        Check-out
                    </Button>
                </Space>
            </Spin>
        </Card>
    );
};

export default AttendanceActions; 