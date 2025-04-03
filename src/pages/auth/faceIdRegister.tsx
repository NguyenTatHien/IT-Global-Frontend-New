import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import styles from '@/styles/faceIdRegister.module.scss';
import { Spin, Button, Typography, message, Alert, Steps, Form, Input, Select, Row, Col, Modal } from 'antd';
import { CameraOutlined, LoadingOutlined, CheckCircleOutlined, RetweetOutlined } from '@ant-design/icons';
import { callScanFace, callRegister } from '@/config/api';
const { Title, Text } = Typography;
const { Option } = Select;

const { Step } = Steps;

const FaceIdRegister: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const webcamRef = useRef<Webcam>(null);

    useEffect(() => {
        setCurrentStep(0);
    }, []);

    const handleNextStep = async () => {
        try {
            const values = await form.validateFields();
            setFormData(values);
            setCurrentStep(1);
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    const handleCapture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot({
                width: 640,
                height: 480
            });
            if (imageSrc) {
                setPreviewImage(imageSrc);
                setShowPreview(true);
            }
        }
    };

    const handleConfirmImage = async () => {
        if (previewImage && formData) {
            setShowPreview(false);
            await handleFaceRegistration(previewImage);
        }
    };

    const handleRetakeImage = () => {
        setShowPreview(false);
        setPreviewImage(null);
    };

    const handleFaceRegistration = async (imageSrc: string) => {
        setLoading(true);
        setError(null);

        try {
            if (!formData) {
                throw new Error('Vui lòng nhập đầy đủ thông tin trước khi đăng ký khuôn mặt');
            }

            const { name, email, password, age, gender, address } = formData;

            // Chuyển đổi base64 thành blob với chất lượng cao
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
            const fileName = `face-${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            // Kiểm tra kích thước file
            if (file.size > 5 * 1024 * 1024) { // 5MB
                throw new Error('Kích thước ảnh quá lớn. Vui lòng chụp lại.');
            }

            console.log('Sending registration data:', {
                name,
                email,
                password,
                age,
                gender,
                address,
                fileSize: file.size,
                fileType: file.type
            });

            // Gọi API đăng ký với thông tin người dùng và ảnh khuôn mặt
            const registerResponse = await callRegister(
                name,
                email,
                password,
                +age,
                gender,
                address,
                file
            );

            if (registerResponse?.data?._id) {
                setIsRegistered(true);
                setCurrentStep(2);
                message.success('Đăng ký tài khoản thành công!');
                setTimeout(() => {
                    navigate('/face-id-login');
                }, 2000);
            } else {
                setError('Đăng ký tài khoản thất bại. Vui lòng thử lại.');
            }
        } catch (error: any) {
            console.error('Lỗi khi đăng ký:', error);
            // Xử lý các loại lỗi từ face recognition service
            if (error.response?.data?.message) {
                // Lỗi từ backend
                const errorMessage = error.response.data.message;
                switch (errorMessage) {
                    case 'Không phát hiện khuôn mặt trong ảnh.':
                        setError('Không phát hiện khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung camera và ánh sáng đủ.');
                        break;
                    case 'Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn.':
                        setError('Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn để có thể nhận diện tốt hơn.');
                        break;
                    case 'Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng thử lại.':
                        setError('Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng đảm bảo ánh sáng đủ và khuôn mặt rõ ràng.');
                        break;
                    case 'Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt.':
                        setError('Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt của bạn.');
                        break;
                    case 'Vui lòng giữ khuôn mặt tự nhiên, không biểu cảm quá mức.':
                        setError('Vui lòng giữ khuôn mặt tự nhiên, không biểu cảm quá mức.');
                        break;
                    default:
                        setError(errorMessage);
                }
            } else if (error.response?.data?.error) {
                // Lỗi validation từ backend
                setError(error.response.data.error);
            } else if (error.message) {
                // Lỗi từ frontend
                setError(error.message);
            } else {
                // Lỗi không xác định
                setError('Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.faceIdRegister}>
            <div className={styles.container}>
                <Title level={2} className={styles.title}>
                    Đăng ký tài khoản với Face ID
                </Title>
                <Steps current={currentStep} className={styles.steps}>
                    <Step title="Thông tin" description="Nhập thông tin cá nhân" />
                    <Step title="Face ID" description="Đăng ký khuôn mặt" />
                    <Step title="Hoàn thành" description="Đăng ký thành công" />
                </Steps>

                {currentStep === 0 && (
                    <Form
                        form={form}
                        layout="vertical"
                        className={styles.form}
                        initialValues={formData}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Họ tên"
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email!' },
                                        { type: 'email', message: 'Email không hợp lệ!' }
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Mật khẩu"
                                    name="password"
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                                >
                                    <Input.Password />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Tuổi"
                                    name="age"
                                    rules={[{ required: true, message: 'Vui lòng nhập tuổi!' }]}
                                >
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Giới tính"
                                    name="gender"
                                    rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                                >
                                    <Select>
                                        <Option value="male">Nam</Option>
                                        <Option value="female">Nữ</Option>
                                        <Option value="other">Khác</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Địa chỉ"
                                    name="address"
                                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                )}

                {currentStep === 1 && (
                    <>
                        <Text className={styles.description}>
                            Vui lòng nhìn vào camera và nhấn nút "Chụp ảnh" để lưu khuôn mặt của bạn.
                            <br />
                            Đảm bảo khuôn mặt của bạn:
                            <ul>
                                <li>Nằm trong khung camera</li>
                                <li>Được chiếu sáng đủ</li>
                                <li>Không đeo kính râm</li>
                                <li>Giữ khuôn mặt tự nhiên</li>
                            </ul>
                        </Text>
                        <div className={styles.webcamContainer}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className={styles.webcam}
                            />
                        </div>
                    </>
                )}

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
                    {currentStep === 0 && (
                        <Button
                            type="primary"
                            onClick={handleNextStep}
                            className={styles.registerButton}
                        >
                            Tiếp tục
                        </Button>
                    )}
                    {currentStep === 1 && (
                        <Button
                            type="primary"
                            icon={loading ? <LoadingOutlined /> : <CameraOutlined />}
                            onClick={handleCapture}
                            disabled={loading}
                            className={styles.registerButton}
                        >
                            Chụp ảnh
                        </Button>
                    )}
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <Spin>
                                <div style={{ padding: '8px' }}>Đang xử lý...</div>
                            </Spin>
                        </div>
                    )}
                </div>

                {isRegistered && (
                    <div className={styles.successMessage}>
                        <CheckCircleOutlined /> Đăng ký thành công! Chuyển hướng đến trang đăng nhập...
                    </div>
                )}

                <Modal
                    title="Xem trước ảnh"
                    open={showPreview}
                    onOk={handleConfirmImage}
                    onCancel={handleRetakeImage}
                    okText="Xác nhận"
                    cancelText="Chụp lại"
                >
                    <div style={{ textAlign: 'center' }}>
                        <img src={previewImage || ''} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default FaceIdRegister;