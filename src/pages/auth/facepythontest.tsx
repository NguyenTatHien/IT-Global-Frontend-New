import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Typography, Card, Space, Alert, Spin, Progress } from 'antd';
import { SafetyOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import styles from '@/styles/faceIdLogin.module.scss';
import { useAppSelector } from '@/redux/hooks';

const { Title, Text } = Typography;

const OPTIMAL_WIDTH = 640;
const OPTIMAL_HEIGHT = 480;

export default function FaceAutoDetect() {
    const webcamRef = useRef<Webcam>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    // Load face-api.js models
    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = '/admin';
        }
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
    }, [isAuthenticated]);

    const handleCameraError = (error: string | DOMException) => {
        console.error('Camera error:', error);
        setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
    };

    // Hàm kiểm tra có khuôn mặt không
    const detectFace = async (imageSrc: string) => {
        const img = await faceapi.fetchImage(imageSrc);
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
        return detections.length > 0 && detections.length <= 1;
    };

    // Hàm chụp và gửi khi có mặt
    const captureAndSend = useCallback(async () => {
        if (!webcamRef.current) return;

        setLoading(true);
        setProcessingProgress(30);

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                throw new Error('Không thể chụp ảnh');
            }

            setProcessingProgress(50);
            // Kiểm tra có khuôn mặt không
            const hasFace = await detectFace(imageSrc);
            if (!hasFace) {
                setResult({ success: false, message: 'Không phát hiện khuôn mặt' });
                setProcessingProgress(0);
                setLoading(false);
                return;
            }

            setProcessingProgress(70);
            // Chuyển base64 sang blob
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('https://192.168.31.104:9000/compare-image', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setResult(data);
            setProcessingProgress(100);
        } catch (err) {
            setResult({ success: false, message: 'Lỗi kết nối Flask API' });
            setProcessingProgress(0);
        }
        setLoading(false);
    }, []);

    // Tự động chụp và gửi mỗi 2 giây nếu models đã load
    useEffect(() => {
        if (!modelsLoaded) return;
        const interval = setInterval(() => {
            captureAndSend();
        }, 2000);
        return () => clearInterval(interval);
    }, [captureAndSend, modelsLoaded]);

    return (
        <div className={styles.faceIdLogin}>
            <div className={styles.container}>
                <Card className={styles.loginCard}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div className={styles.header}>
                            <Title level={2} className={styles.title}>
                                <SafetyOutlined /> Nhận diện khuôn mặt tự động
                            </Title>
                            <Text type="secondary" className={styles.subtitle}>
                                Hệ thống nhận diện khuôn mặt an toàn và bảo mật
                            </Text>
                        </div>

                        {cameraError ? (
                            <Alert
                                message="Lỗi Camera"
                                description={cameraError}
                                type="error"
                                showIcon
                                className={styles.errorAlert}
                                action={
                                    <button onClick={() => window.location.reload()}>
                                        Thử lại
                                    </button>
                                }
                            />
                        ) : (
                            <>
                                <div className={styles.instructions}>
                                    <Card className={styles.instructionCard}>
                                        <Space direction="vertical" size="middle">
                                            <div className={styles.instructionHeader}>
                                                <InfoCircleOutlined /> Hướng dẫn chụp ảnh
                                            </div>
                                            <div className={styles.instructionList}>
                                                <div className={styles.instructionItem}>
                                                    <UserOutlined /> Đảm bảo khuôn mặt nằm giữa khung hình
                                                </div>
                                                <div className={styles.instructionItem}>
                                                    <UserOutlined /> Ánh sáng đầy đủ, tránh ngược sáng
                                                </div>
                                                <div className={styles.instructionItem}>
                                                    <UserOutlined /> Không đeo kính râm hoặc khẩu trang
                                                </div>
                                                <div className={styles.instructionItem}>
                                                    <UserOutlined /> Giữ khuôn mặt thẳng và tự nhiên
                                                </div>
                                                <div className={styles.instructionItem}>
                                                    <UserOutlined /> Nhìn thẳng vào camera
                                                </div>
                                                <div className={styles.instructionItem}>
                                                    <UserOutlined /> Giữ khoảng cách 30-50cm với camera
                                                </div>
                                            </div>
                                        </Space>
                                    </Card>
                                </div>

                                <div className={styles.webcamContainer}>
                                    <div className={styles.faceGuide}>
                                        <div className={styles.faceGuideInner}></div>
                                    </div>
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
                                    {/* {loading && (
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
                                    )} */}
                                </div>

                                {result && (
                                    <Alert
                                        message={result.success ? "Thành công" : "Lỗi"}
                                        description={result.message}
                                        type={result.success ? "success" : "error"}
                                        showIcon
                                        className={styles.errorAlert}
                                    />
                                )}
                            </>
                        )}
                    </Space>
                </Card>
            </div>
        </div>
    );
}
