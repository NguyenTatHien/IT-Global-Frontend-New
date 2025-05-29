// react-for-nest/src/components/attendance/CheckInOut.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, message, Space, Typography, notification, Modal, Alert, Spin, Progress } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppDispatch } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import { callCheckIn, callCheckOut, callGetTodayAttendance } from '@/config/api';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import styles from "styles/faceIdLogin.module.scss";
import { callScanFace } from '@/config/api';

const { Title, Text } = Typography;

const OPTIMAL_WIDTH = 470;
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
  const [isCheckingIn, setIsCheckingIn] = useState(true);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

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
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
        setCameraError('Không thể tải mô hình nhận diện. Vui lòng thử lại.');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const res = await callGetTodayAttendance() as any;
        if (res.data.data.checkInTime) {
          setHasCheckedIn(true);
        } else {
          setHasCheckedIn(false);
        }
      } catch {
        setHasCheckedIn(false);
      }
    };
    fetchTodayAttendance();
  }, []);

  const showModal = (isCheckIn: boolean) => {
    setIsCheckingIn(isCheckIn);
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

  const captureAndProcess = async () => {
    if (!webcamRef.current) return;

    try {
      setLoading(true);
      setProcessingProgress(0);

      // Chụp ảnh
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Không thể chụp ảnh');
      }

      // Chuyển base64 thành File
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });

      // Xử lý face recognition
      setProcessingProgress(30);
      const formData = new FormData();
      formData.append('image', file);
      const result = await callScanFace(formData);
      setProcessingProgress(60);

      if (!result) {
        throw new Error(result || 'Không nhận diện được khuôn mặt');
      }

      // Lấy vị trí hiện tại
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

      // Gọi API check-in/check-out
      setProcessingProgress(80);
      if (isCheckingIn) {
        if (!location) {
          throw new Error('Không thể lấy vị trí hiện tại');
        }
        await callCheckIn({ location }, file);
        message.success('Check-in thành công!');
        setHasCheckedIn(true);
      } else {
        await callCheckOut(file);
        message.success('Check-out thành công!');
        setHasCheckedIn(false);
      }

      setProcessingProgress(100);
      await dispatch(fetchAccount());
      setIsModalOpen(false);
    } catch (error: any) {
      if (error.message.includes('No face detected in the image')) {
        message.error('Không phát hiện thấy khuôn mặt trong ảnh');
      } else {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
      setProcessingProgress(0);
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
          {!hasCheckedIn && (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => showModal(true)}
              loading={loading}
            >
              Check-in
            </Button>
          )}
          {hasCheckedIn && (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => showModal(false)}
              loading={loading}
            >
              Check-out
            </Button>
          )}
        </Space>

        <Modal
          title={`Chấm công ${isCheckingIn ? 'check-in' : 'check-out'} bằng face ID`}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
          centered
          width={380}
          style={{ maxWidth: '98vw', padding: 0 }}
          styles={{ body: { padding: 0, background: '#fff', borderRadius: 16 } }}
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
                <div className={styles.webcamWrapper}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={styles.webcam}
                    videoConstraints={{
                      width: 320,
                      height: 240,
                      facingMode: "user",
                      aspectRatio: 4 / 3
                    }}
                    onUserMediaError={handleCameraError}
                    style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: 320, aspectRatio: '4/3', borderRadius: 16, background: '#eaf0fa', objectFit: 'cover', marginBottom: '10px' }}
                  />
                </div>
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
                    <Text>Đã phát hiện khuôn mặt, đang xử lý...</Text>
                  </div>
                )}
              </div>
              <div className={styles.buttonContainer}>
                <Button
                  type="primary"
                  onClick={captureAndProcess}
                  loading={loading}
                  disabled={!modelsLoaded}
                  block
                  style={{ width: '50%', marginLeft: '25%' }}
                >
                  {isCheckingIn ? 'Check-in' : 'Check-out'}
                </Button>
              </div>
            </>
          )}
        </Modal>
      </Space>
    </Card>
  );
};

export default CheckInOut;