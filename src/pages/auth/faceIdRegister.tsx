import React, { useRef, useState, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, message, Card, Row, Col, Typography, Spin } from 'antd';
import { UploadOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';
import { callCreateUser, callFetchRole } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import styles from '@/styles/faceIdLogin.module.scss';
import AddressForm from '@/components/AddressForm';

const { Title } = Typography;
const { Option } = Select;

type EmployeeType = 'official' | 'contract' | 'intern';

const FaceIdRegister: React.FC = () => {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamImg, setWebcamImg] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch roles for dropdown
    const fetchRoles = async () => {
      try {
        const res = await callFetchRole('current=1&pageSize=100');
        if (res.data?.result) {
          setRoles(res.data.result.map((role: any) => ({ label: role.name, value: role._id })));
        }
      } catch (err) {
        message.error('Không thể tải danh sách vai trò');
      }
    };
    fetchRoles();
  }, []);

  const handleWebcamCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to File
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImageFile(file);
            setWebcamImg(imageSrc);
            setUseWebcam(false);
            message.success('Đã chụp ảnh thành công!');
          });
      }
    }
  };

  const handleUploadChange = (info: any) => {
    if (info.file.status === 'done' || info.file.status === 'uploading' || info.file.originFileObj) {
      setImageFile(info.file.originFileObj);
      setWebcamImg(null);
    }
  };

  const onFinish = async (values: any) => {
    if (!imageFile) {
      message.error('Vui lòng chọn hoặc chụp ảnh đại diện!');
      return;
    }
    setLoading(true);
    try {
      // Lấy địa chỉ từ AddressForm
      const addressObj = {
        city: values.city,
        district: values.district,
        ward: values.ward,
        detail: values.detail,
      };
      const user = {
        name: values.name,
        email: values.email,
        password: values.password,
        age: Number(values.age),
        gender: values.gender,
        address: JSON.stringify(addressObj),
        employeeType: values.employeeType as EmployeeType,
        permissions: [],
      };
      const res = await callCreateUser(user, imageFile);
      if (res.data) {
        message.success('Đăng ký thành công!');
        setTimeout(() => navigate('/face-id-login'), 1500);
      } else {
        message.error(res.message || 'Đăng ký thất bại!');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.faceIdLogin}>
      <div className={styles.container}>
        <Card bordered className={styles.loginCard} style={{ maxWidth: 480, margin: '0 auto' }}>
          <Title level={2} className={styles.title} style={{ marginBottom: 8 }}>Đăng ký tài khoản mới</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ marginTop: 16 }}
            requiredMark
          >
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Họ tên" name="name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}> <Input /> </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}> <Input /> </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}> <Input.Password /> </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tuổi" name="age" rules={[{ required: true, type: 'number', min: 10, max: 100, message: 'Vui lòng nhập tuổi hợp lệ!' }]}> <Input type="number" /> </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}> <Select placeholder="Chọn giới tính"> <Option value="male">Nam</Option> <Option value="female">Nữ</Option> <Option value="other">Khác</Option> </Select> </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Loại nhân viên" name="employeeType" rules={[{ required: true, message: 'Vui lòng chọn loại nhân viên!' }]}> <Select placeholder="Chọn loại nhân viên"> <Option value="official">Nhân viên chính thức</Option> <Option value="contract">Nhân viên hợp đồng</Option> <Option value="intern">Thực tập sinh</Option> </Select> </Form.Item>
              </Col>
            </Row>
            <AddressForm form={form} />
            <Form.Item label="Ảnh đại diện" required>
              <Row gutter={8} align="middle">
                <Col span={12}>
                  <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    accept="image/*"
                    showUploadList={false}
                    onChange={handleUploadChange}
                  >
                    <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                  </Upload>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Button icon={<CameraOutlined />} onClick={() => setUseWebcam(true)} type="dashed">Chụp webcam</Button>
                </Col>
              </Row>
              {(webcamImg || imageFile) && (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={webcamImg || (imageFile ? URL.createObjectURL(imageFile) : '')}
                    alt="avatar preview"
                    style={{ maxWidth: 120, maxHeight: 120, borderRadius: 12, border: '1.5px solid #eee' }}
                  />
                </div>
              )}
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={loading ? <LoadingOutlined /> : undefined} style={{ fontWeight: 600, fontSize: 16 }}>
                Đăng ký
              </Button>
            </Form.Item>
          </Form>
        </Card>
        {/* Webcam Modal */}
        {useWebcam && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card style={{ padding: 16, borderRadius: 16, textAlign: 'center', maxWidth: 400 }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{ width: 320, height: 240, borderRadius: 12, marginBottom: 12 }}
              />
              <div style={{ marginTop: 8 }}>
                <Button type="primary" icon={<CameraOutlined />} onClick={handleWebcamCapture} style={{ marginRight: 8 }}>Chụp ảnh</Button>
                <Button onClick={() => setUseWebcam(false)}>Hủy</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceIdRegister;