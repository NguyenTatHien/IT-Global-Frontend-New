// react-for-nest/src/components/attendance/CheckInOut.tsx
import React, { useState } from 'react';
import { Button, Card, message, Space, Typography } from 'antd';
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

      console.log('Sending check-in request with location:', location);
      const response = await callCheckIn(location as any);
      console.log('Check-in response:', response);
      message.success('Check-in thành công!');
      await dispatch(fetchAccount());
    } catch (error: any) {
      console.error('Check-in error:', error);
      message.error(error.response?.data?.message || 'Check-in thất bại');
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
      message.error(error.response?.data?.message || 'Check-out thất bại');
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