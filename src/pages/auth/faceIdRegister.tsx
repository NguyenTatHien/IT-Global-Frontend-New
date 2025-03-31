import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import styles from '@/styles/faceIdRegister.module.scss';
import { Spin, Button, Typography, message } from 'antd';
import { SmileOutlined, LoadingOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;


const FaceIdRegister: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const navigate = useNavigate();
    const webcamRef = useRef<Webcam>(null);

    const handleFaceRegistration = async () => {
        if (webcamRef.current) {
            const video = webcamRef.current.video;
            const detections = await faceapi.detectAllFaces(video!, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

            if (detections.length > 0) {
                const faceDescriptor = detections[0].descriptor;
                // Lưu trữ faceDescriptor vào cơ sở dữ liệu hoặc localStorage
                localStorage.setItem('faceDescriptor', JSON.stringify(faceDescriptor));
                setIsRegistered(true);
                alert('Đăng ký khuôn mặt thành công!');
                navigate('/face-id-login');
            } else {
                alert('Không tìm thấy khuôn mặt. Vui lòng thử lại.');
            }
        }
    };

    return (
        <div className={styles.faceIdRegister}>
            <div className={styles.container}>
                <Title level={2} className={styles.title}>
                    Đăng ký khuôn mặt
                </Title>
                <Text className={styles.description}>
                    Vui lòng nhìn vào camera và nhấn nút "Đăng ký" để lưu khuôn mặt của bạn.
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
                    onClick={handleFaceRegistration}
                    disabled={loading}
                    className={styles.registerButton}
                >
                    {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </Button>
                {isRegistered && (
                    <Text type="success" className={styles.successMessage}>
                        Đăng ký thành công! Chuyển hướng đến trang đăng nhập...
                    </Text>
                )}
                {loading && <Spin tip="Đang xử lý..." className={styles.spinner} />}
            </div>
        </div>
    );
};

export default FaceIdRegister;