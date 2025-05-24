import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import Webcam from 'react-webcam';
import styles from '@/styles/faceIdLogin.module.scss';
import { callLoginWithFaceId } from '@/config/api';
import { Spin, Button, Typography, message, Alert, Modal, Progress, Card, Space } from 'antd';
import { CameraOutlined, LoadingOutlined, RedoOutlined, InfoCircleOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import * as faceapi from 'face-api.js';

const { Title, Text } = Typography;

// Tối ưu kích thước ảnh để xử lý nhanh hơn
const OPTIMAL_WIDTH = 320; // Giảm kích thước xuống
const OPTIMAL_HEIGHT = 240;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const JPEG_QUALITY = 0.8; // Giảm chất lượng ảnh để tăng tốc độ
const FACE_DETECTION_INTERVAL = 200; // Tăng interval để giảm tải
const FACE_DETECTION_THRESHOLD = 0.3; // Giảm ngưỡng để phát hiện nhanh hơn
const FACE_DETECTION_DELAY = 500; // Giảm thời gian chờ
const FACE_DETECTION_INPUT_SIZE = 320; // Giảm kích thước input để tăng tốc độ

const FaceIdLogin: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [lastDetectionTime, setLastDetectionTime] = useState(0);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const webcamRef = useRef<Webcam>(null);
    const detectionInterval = useRef<NodeJS.Timeout | null>(null);
    const loginTimeout = useRef<NodeJS.Timeout | null>(null);
    const detectionCount = useRef(0);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const callback = params?.get("callback");

    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = '/admin';
        }
    }, [isAuthenticated]);

    // Load face-api.js models
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

    // Bắt đầu phát hiện khuôn mặt khi models đã load
    useEffect(() => {
        if (modelsLoaded && !loading) {
            startFaceDetection();
        }
        return () => {
            if (detectionInterval.current) {
                clearInterval(detectionInterval.current);
            }
            if (loginTimeout.current) {
                clearTimeout(loginTimeout.current);
            }
        };
    }, [modelsLoaded, loading]);

    const startFaceDetection = () => {
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
        }
        detectionCount.current = 0;
        detectionInterval.current = setInterval(async () => {
            if (!webcamRef.current || loading) return;

            // Kiểm tra thời gian giữa các lần phát hiện
            const now = Date.now();
            if (now - lastDetectionTime < FACE_DETECTION_INTERVAL) return;
            setLastDetectionTime(now);

            try {
                const imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) return;

                // Tối ưu kích thước ảnh trước khi xử lý
                const img = await faceapi.fetchImage(imageSrc);
                const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
                    inputSize: FACE_DETECTION_INPUT_SIZE,
                    scoreThreshold: FACE_DETECTION_THRESHOLD
                }));

                if (detections.length === 1) {
                    setFaceDetected(true);
                    detectionCount.current++;

                    // Chỉ đăng nhập sau khi phát hiện khuôn mặt ổn định
                    if (detectionCount.current >= 2 && !loginTimeout.current) {
                        // Dừng interval để không gửi nhiều request
                        if (detectionInterval.current) {
                            clearInterval(detectionInterval.current);
                        }
                        loginTimeout.current = setTimeout(() => {
                            handleLogin();
                        }, FACE_DETECTION_DELAY);
                    }
                } else {
                    setFaceDetected(false);
                    detectionCount.current = 0;
                    if (loginTimeout.current) {
                        clearTimeout(loginTimeout.current);
                        loginTimeout.current = null;
                    }
                }
            } catch (error) {
                console.error('Face detection error:', error);
            }
        }, FACE_DETECTION_INTERVAL);
    };

    const handleCameraError = (error: string | DOMException) => {
        console.error('Camera error:', error);
        setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
    };

    const handleCapture = async () => {
        if (!webcamRef.current || loading) return;

        try {
            setLoading(true);
            setError(null);
            setProcessingProgress(0);

            const imageSrc = webcamRef.current.getScreenshot({
                width: OPTIMAL_WIDTH,
                height: OPTIMAL_HEIGHT
            });

            if (!imageSrc) {
                throw new Error('Không thể chụp ảnh. Vui lòng thử lại.');
            }

            setProcessingProgress(30);
            const optimizedImage = await optimizeImage(imageSrc);
            setProcessingProgress(60);

            setPreviewImage(optimizedImage);
            setShowPreview(true);
            setProcessingProgress(100);
        } catch (error: any) {
            console.error('Capture error:', error);
            setError(error.message || 'Lỗi khi chụp ảnh. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const optimizeImage = async (base64String: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let { width, height } = calculateDimensions(img.width, img.height);

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        throw new Error('Không thể tạo context canvas');
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);

                    const scale = Math.min(width / img.width, height / img.height);
                    const x = (width - img.width * scale) / 2;
                    const y = (height - img.height * scale) / 2;

                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                    const optimizedImage = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

                    const size = calculateBase64Size(optimizedImage);
                    if (size > MAX_FILE_SIZE) {
                        throw new Error('Kích thước ảnh quá lớn sau khi tối ưu');
                    }

                    resolve(optimizedImage);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Không thể tải ảnh'));
            img.src = base64String;
        });
    };

    const calculateDimensions = (width: number, height: number) => {
        const aspectRatio = width / height;
        const targetAspectRatio = OPTIMAL_WIDTH / OPTIMAL_HEIGHT;

        if (aspectRatio > targetAspectRatio) {
            return {
                width: OPTIMAL_WIDTH,
                height: OPTIMAL_WIDTH / aspectRatio
            };
        } else {
            return {
                width: OPTIMAL_HEIGHT * aspectRatio,
                height: OPTIMAL_HEIGHT
            };
        }
    };

    const calculateBase64Size = (base64String: string): number => {
        const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
        return (base64String.length * 3) / 4 - padding;
    };

    const handleLogin = async () => {
        if (!webcamRef.current || loading) return;

        setLoading(true);
        setError(null);
        setProcessingProgress(0);

        try {
            const imageSrc = webcamRef.current.getScreenshot();

            if (!imageSrc) {
                throw new Error('Không thể chụp ảnh. Vui lòng thử lại.');
            }

            setProcessingProgress(30);

            // Tối ưu xử lý ảnh
            const base64Data = imageSrc.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
                const slice = byteCharacters.slice(offset, offset + 1024);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: 'image/jpeg' });
            const file = new File([blob], `face-login-${Date.now()}.jpg`, { type: 'image/jpeg' });

            setProcessingProgress(50);

            const response = await callLoginWithFaceId(file);

            setProcessingProgress(80);

            if (!response.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const { access_token, user } = response.data;

            if (!access_token) {
                throw new Error('Token không hợp lệ');
            }

            if (!user) {
                throw new Error('Thông tin người dùng không hợp lệ');
            }

            localStorage.setItem('access_token', access_token);

            try {
                await dispatch(fetchAccount());
                setProcessingProgress(100);
                message.success('Đăng nhập thành công!');

                const token = localStorage.getItem('access_token');
                if (!token) {
                    throw new Error('Token không tồn tại');
                }

                const redirectUrl = callback || '/admin';
                window.location.href = redirectUrl;
            } catch (error) {
                localStorage.removeItem('access_token');
                throw new Error('Không thể lấy thông tin tài khoản');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            handleLoginError(error);
            // Sau khi lỗi, cho phép detect lại
            setTimeout(() => {
                setLoading(false);
                startFaceDetection();
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginError = (error: any) => {
        // Ưu tiên lấy message từ nhiều nguồn
        let errorMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            (typeof error === 'string' ? error : '') ||
            'Đã xảy ra lỗi. Vui lòng thử lại.';

        // Map sang tiếng Việt thân thiện
        const errorMap: Record<string, string> = {
            'Image is required': 'Vui lòng chụp ảnh trước khi đăng nhập',
            'Không nhận diện được khuôn mặt': 'Không phát hiện khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung camera và ánh sáng đủ',
            'No face detected in the image': 'Không phát hiện khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung camera và ánh sáng đủ',
            'No users found': 'Hệ thống chưa có dữ liệu người dùng. Vui lòng đăng ký trước',
            'Token không hợp lệ': 'Xác thực không thành công. Vui lòng thử lại',
            'Invalid response format': 'Lỗi định dạng phản hồi từ server',
            'File không hợp lệ': 'File ảnh không hợp lệ. Vui lòng thử lại',
            'Kích thước ảnh quá lớn': 'Kích thước ảnh quá lớn. Vui lòng thử lại',
            'Không tìm thấy khuôn mặt phù hợp': 'Không tìm thấy khuôn mặt phù hợp trong hệ thống. Vui lòng đăng ký trước.',
            'Role not found': 'Không tìm thấy vai trò người dùng. Vui lòng liên hệ admin.',
            'Không nhận được phản hồi từ server': 'Không nhận được phản hồi từ server. Vui lòng thử lại.',
            'Thông tin người dùng không hợp lệ': 'Không tìm thấy thông tin người dùng. Vui lòng thử lại.',
            'Token không tồn tại': 'Token không tồn tại. Vui lòng đăng nhập lại.',
            'Không thể lấy thông tin tài khoản': 'Không thể lấy thông tin tài khoản. Vui lòng thử lại.',
            // ... bổ sung thêm nếu cần ...
        };

        setError(errorMap[errorMessage] || errorMessage);
    };

    return (
        <div className={styles.faceIdLogin}>
            <div className={styles.container}>
                <Card className={styles.loginCard}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div className={styles.header}>
                            <Title level={2} className={styles.title}>
                                <SafetyOutlined /> Đăng nhập bằng Face ID
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
                    </Space>
                </Card>
            </div>
        </div>
    );
};

export default FaceIdLogin;