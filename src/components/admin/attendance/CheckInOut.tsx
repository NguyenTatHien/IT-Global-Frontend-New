// react-for-nest/src/components/attendance/CheckInOut.tsx
import React, { useState } from 'react';
import { Button, Card, message, Space, Typography, notification } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppDispatch } from '@/redux/hooks';
import { fetchAccount } from '@//redux/slice/accountSlide';
import { callCheckIn, callCheckOut } from '@/config/api';

const { Title, Text } = Typography;

const CheckInOut: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dispatch = useAppDispatch();

  // Cập nhật thời gian mỗi giây
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      // Lấy vị trí hiện tại nếu có
      let location;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }

      const response = await callCheckIn(location as any);
      message.success('Check-in thành công!');
      await dispatch(fetchAccount());
    } catch (error: any) {
      message.error(error.message);
      // let errorMessage = 'Check-in thất bại';
      // if (error.response?.data?.message) {
      //   errorMessage = error.response.data.message;
      // } else if (error.message) {
      //   errorMessage = error.message;
      // }

      // notification.error({
      //   message: 'Không thể check-in',
      //   description: (
      //     <div>
      //       <p>{errorMessage}</p>
      //       {error.response?.data?.error && (
      //         <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
      //           Chi tiết lỗi: {error.response.data.error}
      //         </p>
      //       )}
      //     </div>
      //   ),
      //   duration: 5
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await callCheckOut();
      message.success('Check-out thành công!');
      await dispatch(fetchAccount());
    } catch (error: any) {
      message.error(error.message);
      // let errorMessage = 'Check-out thất bại';
      // if (error.response?.data?.message) {
      //   errorMessage = error.response.data.message;
      // } else if (error.message) {
      //   errorMessage = error.message;
      // }

      // notification.error({
      //   message: 'Không thể check-out',
      //   description: (
      //     <div>
      //       <p>{errorMessage}</p>
      //       {error.response?.data?.error && (
      //         <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
      //           Chi tiết lỗi: {error.response.data.error}
      //         </p>
      //       )}
      //     </div>
      //   ),
      //   duration: 5
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3}>Chấm công</Title>
        
        <div style={{ textAlign: 'center' }}>
          <ClockCircleOutlined style={{ fontSize: 48 }} />
          <Title level={2}>
            {currentTime.toLocaleTimeString()}
          </Title>
          <Text type="secondary">
            {currentTime.toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </div>

        <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleCheckIn}
            loading={loading}
          >
            Check-in
          </Button>
          <Button 
            type="primary" 
            size="large"
            danger
            icon={<CheckCircleOutlined />}
            onClick={handleCheckOut}
            loading={loading}
          >
            Check-out
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default CheckInOut;