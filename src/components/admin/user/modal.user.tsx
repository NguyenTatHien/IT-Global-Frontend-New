import { FooterToolbar, ModalForm, ProForm, ProFormDigit, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, Upload, Button, message, notification, Modal, ConfigProvider, Progress, Space } from "antd";
import { isMobile } from "react-device-detect";
import { useState, useEffect, useRef } from "react";
import { callCreateUser, callFetchRole, callScanFace, callUpdateUser, callUploadSingleFile } from "@/config/api";
import { IUser } from "@/types/backend";
import { DebounceSelect } from "./debouce.select";
import Webcam from "react-webcam";
import { CameraOutlined, SaveOutlined, CloseOutlined, PlusOutlined, RetweetOutlined, UserAddOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import enUS from 'antd/lib/locale/en_US';
import AddressForm, { IAddress } from '@/components/AddressForm';

// Constants for image capture
const CAPTURE_WIDTH = 640;
const CAPTURE_HEIGHT = 480;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const WEBCAM_CONSTRAINTS = {
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    facingMode: "user",
    aspectRatio: 4/3
};

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IUser | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

export interface ICompanySelect {
    label: string;
    value: string;
    key?: string;
}

const ModalUser = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [roles, setRoles] = useState<ICompanySelect[]>([]);
    const [animation, setAnimation] = useState<string>('open');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [dataFaceImage, setDataFaceImage] = useState<any[]>([]);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);
    const [imageName, setImageName] = useState<string>("");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const webcamRef = useRef<Webcam>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        if (dataInit?._id) {
            if (dataInit.image) {
                setDataFaceImage([
                    {
                        uid: uuidv4(),
                        name: dataInit.image,
                        status: "done",
                        url: `${import.meta.env.VITE_BACKEND_URL}/images/user/${dataInit.image}`,
                    },
                ]);
            }
            if (dataInit.role) {
                setRoles([
                    {
                        label: dataInit.role?.name,
                        value: dataInit.role?._id,
                        key: dataInit.role?._id,
                    },
                ]);
                form.setFieldsValue({ role: { label: dataInit.role.name, value: dataInit.role._id } });
            }
        }
    }, [dataInit, form]);

    const processImage = async (file: File) => {
        setLoading(true);
        setProgress(20);
        try {
            // Upload file
            const uploadRes = await callUploadSingleFile(file, "user");
            if (!uploadRes?.data?.fileName) {
                throw new Error('Không thể upload file');
            }
            setProgress(50);

            // Create FormData for face scan
            const formData = new FormData();
            formData.append('image', file);

            // Scan face
            const scanRes = await callScanFace(formData);
            if (!scanRes?.data) {
                throw new Error('Không thể nhận diện khuôn mặt');
            }
            setProgress(80);

            // Update state
            const fileName = uploadRes.data.fileName;
            setImageName(fileName);
            setDataFaceImage([{
                name: fileName,
                uid: uuidv4(),
                status: "done",
                url: `${import.meta.env.VITE_BACKEND_URL}/images/user/${fileName}`,
                originFileObj: file,
            }]);
            setFaceDescriptor(scanRes.data);
            setProgress(100);
            message.success("Xử lý ảnh khuôn mặt thành công!");
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            const errorMap: Record<string, string> = {
                'Không thể upload file': 'Không thể tải lên file. Vui lòng thử lại.',
                'Không thể nhận diện khuôn mặt': 'Không thể nhận diện khuôn mặt. Vui lòng thử lại.',
                'Khuôn mặt quá nhỏ': 'Khuôn mặt quá nhỏ. Vui lòng đứng gần camera hơn.',
                'Độ tin cậy phát hiện khuôn mặt quá thấp': 'Độ tin cậy phát hiện khuôn mặt quá thấp. Vui lòng thử lại.',
                'Phát hiện nhiều khuôn mặt': 'Phát hiện nhiều khuôn mặt. Vui lòng chỉ chụp một khuôn mặt.',
                'Vui lòng tháo kính mắt': 'Vui lòng tháo kính mắt để quét khuôn mặt chính xác hơn.',
                'Vui lòng giữ khuôn mặt tự nhiên': 'Vui lòng giữ khuôn mặt tự nhiên, không biểu cảm quá mức.',
                'Đã đạt giới hạn số lượng khuôn mặt': 'Người dùng đã đạt giới hạn 3 khuôn mặt. Vui lòng xóa khuôn mặt cũ trước khi thêm mới.',
                'Khuôn mặt quá giống với khuôn mặt đã đăng ký': 'Khuôn mặt này quá giống với khuôn mặt đã đăng ký. Vui lòng thử lại với khuôn mặt khác.',
            };
            message.error(errorMap[errorMessage] || errorMessage || "Đã xảy ra lỗi khi xử lý ảnh");
            setDataFaceImage([]);
            return false;
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const handleUploadFileFaceId = async ({ file, onSuccess, onError }: any) => {
        const success = await processImage(file);
        if (success && onSuccess) onSuccess("ok");
        else if (!success && onError) onError("Failed to process image");
    };

    const captureImage = async () => {
        if (!webcamRef.current) return;

        try {
            setLoading(true);
            // Add delay for camera focus
            await new Promise(resolve => setTimeout(resolve, 500));

            const imageSrc = webcamRef.current.getScreenshot({
                width: CAPTURE_WIDTH,
                height: CAPTURE_HEIGHT
            });
            if (!imageSrc) {
                throw new Error("Không thể chụp ảnh. Vui lòng thử lại.");
            }

            // Convert to File
            const blob = await fetch(imageSrc).then(res => res.blob());
            const file = new File([blob], `face-${Date.now()}.jpg`, { type: "image/jpeg" });

            const success = await processImage(file);
            if (success) {
                setIsCameraModalOpen(false);
            }
        } catch (error: any) {
            message.error(error.message || "Đã xảy ra lỗi khi chụp ảnh");
        } finally {
            setLoading(false);
        }
    };

    const handleCameraError = (error: string | DOMException) => {
        console.error('Camera error:', error);
        setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
    };

    const submitUser = async (valuesForm: any) => {
        if (!dataFaceImage.length) {
            message.error("Vui lòng thêm ảnh khuôn mặt");
            return;
        }

        const { name, email, password, age, gender, role, employeeType, city, district, ward, detail } = valuesForm;
        const file = dataFaceImage[0]?.originFileObj;

        // Tạo object address từ các trường địa chỉ
        const address: IAddress = {
            city: city?.toString() || "",
            district: district?.toString() || "",
            ward: ward?.toString() || "",
            detail: detail || ""
        };

        const user: IUser = {
            name,
            email,
            password,
            age,
            gender,
            address: JSON.stringify(address).replace(/\\"/g, '"'),
            role: role?.value || dataInit?.role?._id,
            employeeType,
            permissions: [],
        };

        // Only include image and faceDescriptor if they have been changed
        if (imageName && imageName !== dataInit?.image) {
            user.image = imageName;
            user.faceDescriptor = faceDescriptor;
        }

        try {
            setLoading(true);
            if (dataInit?._id) {
                const res = await callUpdateUser(dataInit._id, user, file);
                if (res.data) {
                    message.success("Cập nhật user thành công");
                    handleReset();
                    reloadTable();
                }
            } else {
                const res = await callCreateUser(user, file);
                if (res.data) {
                    message.success("Tạo mới user thành công");
                    handleReset();
                    reloadTable();
                }
            }
        } catch (error: any) {
            notification.error({
                message: "Có lỗi xảy ra",
                description: error.response?.data?.message || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setAnimation('close');
        setDataFaceImage([]);
        setRoles([]);
        setOpenModal(false);
        setAnimation('open');
        setFaceDescriptor([]);
        setImageName("");
    };

    const handlePreview = async (file: any) => {
        if (!file.originFileObj) {
            setPreviewImage(file.url);
            setPreviewOpen(true);
            setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
            return;
        }
        getBase64(file.originFileObj, (url: string) => {
            setPreviewImage(url);
            setPreviewOpen(true);
            setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
        });
    };

    const getBase64 = (img: any, callback: any) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(img);
    };

    async function fetchRoleList(name: string): Promise<ICompanySelect[]> {
        const res = await callFetchRole(`current=1&pageSize=100&name=/${name}/i`);
        if (res?.data?.result) {
            return res.data.result.map(item => ({
                label: item.name as string,
                value: item._id as string,
            }));
        }
        return [];
    }

    return (
        <>
            <ModalForm
                title={<>{dataInit?._id ? "Cập nhật User" : "Tạo mới User"}</>}
                open={openModal}
                modalProps={{
                    onCancel: handleReset,
                    afterClose: handleReset,
                    destroyOnClose: true,
                    width: isMobile ? "100%" : 900,
                    footer: null,
                    keyboard: false,
                    maskClosable: false,
                    className: `modal-company ${animation}`,
                    rootClassName: `modal-company-root ${animation}`
                }}
                scrollToFirstError={true}
                preserve={false}
                form={form}
                onFinish={submitUser}
                initialValues={{
                    ...dataInit,
                    ...(dataInit?.address ? (() => {
                        try {
                            // Try to parse as JSON first
                            try {
                                const parsedAddress = JSON.parse(dataInit.address.replace(/\\"/g, '"'));
                                return {
                                    city: parsedAddress.city || '',
                                    district: parsedAddress.district || '',
                                    ward: parsedAddress.ward || '',
                                    detail: parsedAddress.detail || ''
                                };
                            } catch {
                                // If not JSON, try to parse from string format
                                const address = dataInit.address;
                                const parts = address.split(',').map(part => part.trim());
                                
                                // Assuming format: detail, ward, district, city
                                return {
                                    detail: parts[0] || '', // "216/174, đường số 5"
                                    ward: (parts[1] || '').replace('phường ', ''), // "Bình Hưng Hòa"
                                    district: (parts[2] || '').replace('quận ', ''), // "Bình Tân"
                                    city: parts[3] || 'Hồ Chí Minh' // Default to HCM if not specified
                                };
                            }
                        } catch (error) {
                            console.error('Error parsing address:', error);
                            return {
                                city: '',
                                district: '',
                                ward: '',
                                detail: dataInit.address || ''
                            };
                        }
                    })() : {
                        city: '',
                        district: '',
                        ward: '',
                        detail: ''
                    }),
                    password: undefined,
                    employeeType: dataInit?.employeeType || "official"
                }}
                submitter={{
                    render: (props: any, dom: any) => {
                        return [
                            <Button
                                key="cancel"
                                onClick={() => handleReset()}
                                icon={<CloseOutlined />}
                            >
                                Hủy
                            </Button>,
                            <Button
                                key="submit"
                                type="primary"
                                loading={loading}
                                onClick={() => props.submit()}
                                icon={dataInit?._id ? <SaveOutlined /> : <UserAddOutlined />}
                            >
                                {dataInit?._id ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        ];
                    }
                }}
            >
                <Row gutter={24}>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Vui lòng không bỏ trống" },
                                { type: "email", message: "Vui lòng nhập email hợp lệ" },
                            ]}
                            placeholder="Nhập email"
                        />
                    </Col>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText.Password
                            disabled={dataInit?._id ? true : false}
                            label="Password"
                            name="password"
                            rules={[{ required: !dataInit?._id, message: "Vui lòng không bỏ trống" }]}
                            placeholder="Nhập password"
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormText
                            label="Tên hiển thị"
                            name="name"
                            rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                            placeholder="Nhập tên hiển thị"
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormDigit
                            label="Tuổi"
                            name="age"
                            rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                            placeholder="Nhập tuổi"
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormSelect
                            name="gender"
                            label="Giới Tính"
                            valueEnum={{
                                MALE: "Nam",
                                FEMALE: "Nữ",
                                OTHER: "Khác",
                            }}
                            placeholder="Chọn giới tính"
                            rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProForm.Item
                            name="role"
                            label="Vai trò"
                            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
                        >
                            <DebounceSelect
                                allowClear
                                showSearch
                                defaultValue={roles}
                                value={roles}
                                placeholder="Chọn vai trò"
                                fetchOptions={fetchRoleList}
                                onChange={(newValue: any) => {
                                    setRoles(newValue);
                                    form.setFieldsValue({ role: newValue });
                                }}
                                style={{ width: "100%" }}
                            />
                        </ProForm.Item>
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormSelect
                            name="employeeType"
                            label="Loại nhân viên"
                            valueEnum={{
                                official: "Nhân viên chính thức",
                                contract: "Nhân viên hợp đồng",
                                intern: "Thực tập sinh",
                            }}
                            placeholder="Chọn loại nhân viên"
                            rules={[{ required: true, message: "Vui lòng chọn loại nhân viên!" }]}
                        />
                    </Col>

                    <AddressForm 
                        form={form} 
                        initialAddress={dataInit?.address}
                    />

                    <Col lg={12} md={12} sm={24} xs={24}>
                        <Form.Item 
                            label="Ảnh Face ID"
                            required
                            help="Vui lòng giữ khuôn mặt tự nhiên, nhìn thẳng vào camera"
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <ConfigProvider locale={enUS}>
                                    <Upload
                                        listType="picture-card"
                                        maxCount={1}
                                        customRequest={handleUploadFileFaceId}
                                        fileList={dataFaceImage}
                                        onRemove={() => {
                                            setDataFaceImage([]);
                                            setFaceDescriptor([]);
                                            setImageName("");
                                        }}
                                        onPreview={handlePreview}
                                        accept="image/jpeg,image/png"
                                    >
                                        {dataFaceImage.length === 0 && (
                                            <div>
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        )}
                                    </Upload>
                                </ConfigProvider>
                                <Space>
                                    <Button
                                        icon={<CameraOutlined />}
                                        onClick={() => setIsCameraModalOpen(true)}
                                        loading={loading}
                                    >
                                        Chụp ảnh
                                    </Button>
                                    {loading && <Progress percent={progress} size="small" style={{ width: 100 }} />}
                                </Space>
                            </Space>
                        </Form.Item>
                    </Col>
                </Row>
            </ModalForm>

            <Modal
                open={previewOpen}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewOpen(false)}
                style={{ zIndex: 1500 }}
            >
                <img alt="example" style={{ width: '100%' }} src={previewImage} />
            </Modal>

            <Modal
                title="Chụp ảnh Face ID"
                open={isCameraModalOpen}
                onCancel={() => setIsCameraModalOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsCameraModalOpen(false)}>
                        Hủy
                    </Button>,
                    <Button
                        key="capture"
                        type="primary"
                        icon={<CameraOutlined />}
                        onClick={captureImage}
                        loading={loading}
                    >
                        Chụp ảnh
                    </Button>,
                ]}
                width={700}
            >
                {cameraError ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Space direction="vertical">
                            <div>{cameraError}</div>
                            <Button 
                                icon={<RetweetOutlined />}
                                onClick={() => {
                                    setCameraError(null);
                                    setIsCameraModalOpen(false);
                                    setTimeout(() => setIsCameraModalOpen(true), 500);
                                }}
                            >
                                Thử lại
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={WEBCAM_CONSTRAINTS}
                                onUserMediaError={handleCameraError}
                                style={{ width: '100%', borderRadius: '8px' }}
                            />
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '240px',
                                    height: '240px',
                                    border: '2px solid rgba(255, 255, 255, 0.8)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
                                }}
                            />
                        </div>
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <Space direction="vertical">
                                <div>Vui lòng đặt khuôn mặt vào giữa khung hình</div>
                                <div>Giữ khuôn mặt tự nhiên và nhìn thẳng vào camera</div>
                                {loading && <Progress percent={progress} size="small" />}
                            </Space>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};

export default ModalUser;