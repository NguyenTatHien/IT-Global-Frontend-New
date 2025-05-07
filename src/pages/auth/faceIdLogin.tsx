import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import Webcam from 'react-webcam';
import styles from '@/styles/faceIdLogin.module.scss';
import { callLoginWithFaceId } from '@/config/api';
import { Spin, Button, Typography, message, Alert, Modal, Progress, Card, Space } from 'antd';
import { CameraOutlined, LoadingOutlined, RedoOutlined, InfoCircleOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

const OPTIMAL_WIDTH = 640;
const OPTIMAL_HEIGHT = 480;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const JPEG_QUALITY = 0.9;

const FaceIdLogin: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const webcamRef = useRef<Webcam>(null);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const callback = params?.get("callback");

    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = '/admin';
        }
    }, [isAuthenticated]);

    const handleCameraError = (error: string | DOMException) => {
        console.error('Camera error:', error);
        setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
    };

    const handleCapture = async () => {
        if (!webcamRef.current) return;

        try {
            setLoading(true);
            setError(null);
            setProcessingProgress(0);

            // Add delay to ensure proper camera focus
            await new Promise(resolve => setTimeout(resolve, 500));

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

                    // Optimize image quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw with white background for better contrast
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    
                    // Draw image with proper centering
                    const scale = Math.min(width / img.width, height / img.height);
                    const x = (width - img.width * scale) / 2;
                    const y = (height - img.height * scale) / 2;
                    
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                    // Convert to JPEG with quality setting
                    const optimizedImage = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                    
                    // Validate file size
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
        if (!webcamRef.current) return;
        
        setLoading(true);
        setError(null);
        setProcessingProgress(0);

        try {
            // Chụp ảnh từ camera
            const imageSrc = webcamRef.current.getScreenshot({
                width: OPTIMAL_WIDTH,
                height: OPTIMAL_HEIGHT
            });

            if (!imageSrc) {
                throw new Error('Không thể chụp ảnh. Vui lòng thử lại.');
            }

            setProcessingProgress(30);

            // Chuyển đổi base64 thành File
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

            // Gọi API đăng nhập
            const response = await callLoginWithFaceId(file);
            
            setProcessingProgress(80);

            // Kiểm tra cấu trúc response
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

            // Lưu token và cập nhật trạng thái
            localStorage.setItem('access_token', access_token);
            
            try {
                await dispatch(fetchAccount());
                setProcessingProgress(100);
                message.success('Đăng nhập thành công!');
                
                // Kiểm tra token trước khi chuyển hướng
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
        } finally {
            setLoading(false);
        }
    };

    const handleLoginError = (error: any) => {
        console.error('Full error object:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        
        const errorMessage = error.response?.data?.message || error.message;
        const errorMap: Record<string, string> = {
            'Image is required': 'Vui lòng chụp ảnh trước khi đăng nhập',
            'Không nhận diện được khuôn mặt': 'Không phát hiện khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung camera và ánh sáng đủ',
            'No face detected': 'Không phát hiện khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung camera và ánh sáng đủ',
            'Không có người dùng nào trong hệ thống': 'Hệ thống chưa có dữ liệu người dùng. Vui lòng đăng ký trước',
            'No users found': 'Hệ thống chưa có dữ liệu người dùng. Vui lòng đăng ký trước',
            'Token không hợp lệ': 'Xác thực không thành công. Vui lòng thử lại',
            'Invalid response format': 'Lỗi định dạng phản hồi từ server',
            'File không hợp lệ': 'File ảnh không hợp lệ. Vui lòng thử lại',
            'Kích thước ảnh quá lớn': 'Kích thước ảnh quá lớn. Vui lòng thử lại',
            'Vui lòng giữ khuôn mặt tự nhiên, không biểu cảm quá mức.': 'Vui lòng giữ khuôn mặt tự nhiên và thẳng, không cười quá lớn hoặc có biểu cảm mạnh',
            'Vui lòng tháo kính mắt và giữ khuôn mặt tự nhiên để quét khuôn mặt chính xác hơn.': 'Vui lòng tháo kính mắt và giữ khuôn mặt tự nhiên để quét khuôn mặt chính xác hơn.',
            'Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn.': 'Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn để có thể nhận diện tốt hơn.',
            'Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng thử lại.': 'Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng đảm bảo ánh sáng đủ và khuôn mặt rõ ràng.',
            'Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt.': 'Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt của bạn.',
            'Không tìm thấy khuôn mặt phù hợp.': 'Không tìm thấy khuôn mặt phù hợp trong hệ thống. Vui lòng đăng ký trước.',
            'Role not found': 'Không tìm thấy vai trò người dùng. Vui lòng liên hệ admin.',
        };

        setError(errorMap[errorMessage] || errorMessage || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    };

    const handleConfirmImage = async () => {
        if (previewImage) {
            setShowPreview(false);
            await handleLogin();
        }
    };

    const handleRetakeImage = () => {
        setShowPreview(false);
        setPreviewImage(null);
        setError(null);
        setProcessingProgress(0);
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
                                            aspectRatio: 4/3
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

                                <div className={styles.buttonContainer}>
                                    <Button
                                        type="primary"
                                        icon={loading ? <LoadingOutlined /> : <CameraOutlined />}
                                        onClick={handleLogin}
                                        disabled={loading}
                                        className={styles.loginButton}
                                        size="large"
                                        block
                                    >
                                        {loading ? 'Đang xử lý...' : 'Đăng nhập bằng Face ID'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Space>
                </Card>
            </div>
        </div>
    );
};

export default FaceIdLogin;