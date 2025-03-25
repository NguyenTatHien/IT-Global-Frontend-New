import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import styles from '@/styles/faceIdLogin.module.scss';

const FaceIdLogin: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const webcamRef = useRef<Webcam>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = "../../../public/models";
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        };

        loadModels();
    }, []);

    const handleFaceDetection = async () => {
        if (webcamRef.current) {
            const video = webcamRef.current.video;
            const detections = await faceapi.detectAllFaces(video!, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

            if (detections.length > 0) {
                setIsAuthenticated(true);
                dispatch(fetchAccount());
                navigate('/admin');
            } else {
                alert('Xác thực Face ID thất bại. Vui lòng thử lại.');
            }
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            handleFaceDetection();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.faceIdLogin}>
            <h1>Đăng nhập bằng Face ID</h1>
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={520}
                height={440}
            />
            {!isAuthenticated && <p>Đang xác thực...</p>}
        </div>
    );
};

export default FaceIdLogin;