// react-for-nest/src/components/attendance/CheckInOut.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, message, Space, Typography, notification, Modal, Alert, Spin, Progress } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, AlignCenterOutlined } from '@ant-design/icons';
import { useAppDispatch } from '@/redux/hooks';
import { fetchAccount } from '@//redux/slice/accountSlide';
import { callCheckIn, callCheckOut } from '@/config/api';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import styles from "styles/faceIdLogin.module.scss";

const { Title, Text } = Typography;

const OPTIMAL_WIDTH = 470; // Giảm kích thước xuống
const OPTIMAL_HEIGHT = 410;

const CheckInOut: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);


  const dispatch = useAppDispatch();

  // Cập nhật thời gian mỗi giây
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        // Chỉ load model cần thiết
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
        setCameraError('Không thể tải mô hình nhận diện. Vui lòng thử lại.');
      }
    };
    loadModels();
  }, []);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleCameraError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
  };

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
      } else {
        // fallback nếu không lấy được vị trí
        location = {
          latitude: 0,
          longitude: 0
        };
      }

      // Đúng format cho backend
      const response = await callCheckIn({ location });
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
            onClick={showModal}
            loading={loading}
          >
            Check-in
          </Button>
          <Modal
            title="Chấm công bằng faceid"
            // closable={{ 'aria-label': 'Custom Close Button' }}
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
          >
            {cameraError ? (
              <Alert
                message="Lỗi Camera"
                description={cameraError}
                type="error"
                showIcon
                className={styles.errorAlert}
                action={
                  <Button type="primary" onClick={() => window.location.reload()}>
                    Thử lại
                  </Button>
                }
              />
            ) : (
              <>
                <div className={styles.webcamContainer}>
                  {/* <div className={styles.faceGuide}>
                                        <div className={styles.faceGuideInner}></div>
                                    </div> */}
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={styles.webcam}
                    videoConstraints={{
                      width: OPTIMAL_WIDTH,
                      height: OPTIMAL_HEIGHT,
                      facingMode: "user",
                      aspectRatio: 4 / 3
                    }}
                    onUserMediaError={handleCameraError}
                  />
                  {loading && (
                    <div className={styles.processingOverlay}>
                      <Spin size="large" />
                      <Progress
                        type="circle"
                        percent={processingProgress}
                        width={80}
                        status={processingProgress === 100 ? "success" : "active"}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                      <Text>Đang xử lý...</Text>
                    </div>
                  )}
                  {faceDetected && !loading && (
                    <div className={styles.faceDetectedOverlay}>
                      <Text>Đã phát hiện khuôn mặt, đang đăng nhập...</Text>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    className={styles.errorAlert}
                    closable
                    onClose={() => setError(null)}
                  />
                )}
              </>
            )}
          </Modal>
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