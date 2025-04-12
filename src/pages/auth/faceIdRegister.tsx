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

            // Tạo FormData để gửi lên server
            const formDataToSend = new FormData();
            formDataToSend.append('image', file);
            formDataToSend.append('name', name);
            formDataToSend.append('email', email);
            formDataToSend.append('password', password);
            formDataToSend.append('age', age);
            formDataToSend.append('gender', gender);
            formDataToSend.append('address', address);

            // Gọi API đăng ký
            const response = await callRegister(
                formDataToSend.get('name') as string,
                formDataToSend.get('email') as string,
                formDataToSend.get('password') as string,
                parseInt(formDataToSend.get('age') as string),
                formDataToSend.get('gender') as string,
                formDataToSend.get('address') as string,
                formDataToSend.get('image') as File
            );

            if (response.data) {
                message.success('Đăng ký thành công!');
                setIsRegistered(true);
                setTimeout(() => {
                    navigate('/face-id-login');
                }, 2000);
            }
        } catch (error: any) {
            console.error('Lỗi khi đăng ký:', error);
            const errorMessage = error.response?.data?.message || error.message;
            const errorMap: Record<string, string> = {
                'Không phát hiện khuôn mặt trong ảnh.': 'Không phát hiện khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung camera và ánh sáng đủ.',
                'Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn.': 'Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn để có thể nhận diện tốt hơn.',
                'Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng thử lại.': 'Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng đảm bảo ánh sáng đủ và khuôn mặt rõ ràng.',
                'Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt.': 'Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt của bạn.',
                'Vui lòng tháo kính mắt và giữ khuôn mặt tự nhiên để quét khuôn mặt chính xác hơn.': 'Vui lòng tháo kính mắt và giữ khuôn mặt tự nhiên để quét khuôn mặt chính xác hơn.',
                'Vui lòng giữ khuôn mặt tự nhiên, không biểu cảm quá mức.': 'Vui lòng giữ khuôn mặt tự nhiên, không biểu cảm quá mức.',
                'Đã đạt giới hạn số lượng khuôn mặt': 'Bạn đã đạt giới hạn 3 khuôn mặt. Vui lòng xóa khuôn mặt cũ trước khi thêm mới.',
                'Khuôn mặt quá giống với khuôn mặt đã đăng ký': 'Khuôn mặt này quá giống với khuôn mặt đã đăng ký. Vui lòng thử lại với khuôn mặt khác.',
            };
            setError(errorMap[errorMessage] || errorMessage);
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