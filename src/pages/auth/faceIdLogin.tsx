import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import Webcam from 'react-webcam';
import styles from '@/styles/faceIdLogin.module.scss';
import { callLoginWithFaceId } from '@/config/api';
import { Spin, Button, Typography, message } from 'antd';
import { SmileOutlined, LoadingOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

const FaceIdLogin: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const webcamRef = useRef<Webcam>(null);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const callback = params?.get("callback");


    useEffect(() => {
        //đã login => redirect to '/'
        if (isAuthenticated) {
            // navigate('/');
            window.location.href = '/admin';
        }
    }, [])

    const captureAndLogin = async () => {
        if (webcamRef.current) {
            setLoading(true);
            const imageSrc = webcamRef.current.getScreenshot();

            if (imageSrc) {
                const blob = await fetch(imageSrc).then((res) => res.blob());
                const fileName = `face-${Date.now()}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });

                try {
                    const response = await callLoginWithFaceId(file);
                    if (response.data) {
                        // Lưu token vào localStorage
                        localStorage.setItem('access_token', response.data.access_token);
                        message.success('Đăng nhập tài khoản thành công!');
                        window.location.href = callback ? callback : '/admin';
                    } else {
                        alert('Xác thực Face ID thất bại. Vui lòng thử lại.');
                    }
                } catch (error) {
                    console.error('Lỗi khi gọi API:', error);
                    alert('Đã xảy ra lỗi trong quá trình xác thực.');
                } finally {
                    setLoading(false);
                }
            } else {
                alert('Không thể chụp ảnh. Vui lòng thử lại.');
                setLoading(false);
            }
        }
    };

    return (
        <div className={styles.faceIdLogin}>
            <div className={styles.container}>
                <Title level={2} className={styles.title}>
                    Đăng nhập bằng Face ID
                </Title>
                <Text className={styles.description}>
                    Vui lòng nhìn vào camera để xác thực khuôn mặt của bạn.
                </Text>
                <div className={styles.webcamContainer}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className={styles.webcam}
                    />
                </div>
                <Button
                    type="primary"
                    icon={loading ? <LoadingOutlined /> : <SmileOutlined />}
                    onClick={captureAndLogin}
                    disabled={loading}
                    className={styles.loginButton}
                >
                    {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                </Button>
                {loading && (
                    <Spin tip="Đang xử lý..." className={styles.spinner} />
                )}
            </div>
        </div>
    );
};

export default FaceIdLogin;