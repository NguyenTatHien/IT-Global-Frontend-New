import { FooterToolbar, ModalForm, ProForm, ProFormDigit, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, Upload, Button, message, notification, Modal, ConfigProvider } from "antd";
import { isMobile } from "react-device-detect";
import { useState, useEffect, useRef } from "react";
import { callCreateUser, callFetchRole, callScanFace, callUpdateUser, callUploadSingleFile } from "@/config/api";
import { IUser } from "@/types/backend";
import { DebounceSelect } from "./debouce.select";
import Webcam from "react-webcam";
import { CameraOutlined, CheckSquareOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import enUS from 'antd/lib/locale/en_US';

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

    const [dataFaceImage, setDataFaceImage] = useState<any[]>([]);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);
    const [imageName, setImageName] = useState<string>("");
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
                form.setFieldsValue({ role: { label: dataInit.role.name, value: dataInit.role._id } }); // Đặt giá trị mặc định cho form
            }
        }
    }, [dataInit, form]);

    const handleUploadFileFaceId = async ({ file, onSuccess, onError }: any) => {
        let loadingMessage: any;
        try {
            loadingMessage = message.loading("Đang kiểm tra khuôn mặt...", 0);

            // Gửi file lên backend
            const res = await callUploadSingleFile(file, "user");
            if (res && res.data) {
                const fileName = res.data.fileName as any;

                // Lưu tên file và file gốc vào trạng thái
                setImageName(fileName);
                setDataFaceImage([
                    {
                        name: fileName,
                        uid: uuidv4(),
                        status: "done",
                        url: `${import.meta.env.VITE_BACKEND_URL}/images/user/${fileName}`,
                        originFileObj: file, // Lưu file gốc tại đây
                    },
                ]);

                if (onSuccess) onSuccess("ok");

                // Gọi API nhận diện khuôn mặt
                const recognizeRes = await callScanFace(file);
                if (recognizeRes && recognizeRes.data) {
                    setFaceDescriptor(recognizeRes); // Lưu faceDescriptor vào trạng thái
                    message.success("Nhận diện khuôn mặt thành công!");
                } else {
                    message.warning("Không thể nhận diện khuôn mặt. Vui lòng thử lại với ảnh khác.");
                }
            } else {
                throw new Error(res.message || "Không thể upload file");
            }
        } catch (error: any) {
            setDataFaceImage([]);
            if (onError) {
                onError({ event: error });
            }
            message.error(error.message || "Đã xảy ra lỗi khi upload file");
        } finally {
            if (loadingMessage) loadingMessage();
        }
    };

    const captureImage = async () => {
        let loadingMessage: any;
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                message.error("Không thể chụp ảnh. Vui lòng thử lại.");
                return;
            }

            const blob = await fetch(imageSrc).then((res) => res.blob());
            const fileName = `face-${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: "image/jpeg" });

            try {
                // Hiển thị thông báo "Đang kiểm tra khuôn mặt"
                loadingMessage = message.loading("Đang kiểm tra khuôn mặt...", 0);

                // Gửi file lên backend
                const res = await callUploadSingleFile(file, "user");
                if (res && res.data) {
                    const uploadedFileName = res.data.fileName;

                    // Lưu file gốc và thông tin vào trạng thái
                    setImageName(uploadedFileName);
                    setDataFaceImage([
                        {
                            name: uploadedFileName,
                            uid: uuidv4(),
                            status: "done",
                            url: `${import.meta.env.VITE_BACKEND_URL}/images/user/${uploadedFileName}`,
                            originFileObj: file, // Lưu file gốc tại đây
                        },
                    ]);
                    setIsCameraModalOpen(false);
                    message.success("Chụp ảnh Face ID thành công!");

                    // Gọi API nhận diện khuôn mặt
                    const recognizeRes = await callScanFace(file);
                    if (recognizeRes && recognizeRes.data) {
                        setFaceDescriptor(recognizeRes.data); // Lưu faceDescriptor vào trạng thái
                        message.success("Nhận diện khuôn mặt thành công!");
                        console.log("Kết quả nhận diện:", recognizeRes.data);
                    } else {
                        message.warning("Không thể nhận diện khuôn mặt. Vui lòng thử lại.");
                    }
                } else {
                    throw new Error("Không thể lưu ảnh. Vui lòng thử lại.");
                }
            } catch (error: any) {
                console.error("Lỗi khi xử lý ảnh:", error);
                message.error(error.message || "Đã xảy ra lỗi khi xử lý ảnh.");
            } finally {
                // Đóng thông báo "Đang kiểm tra khuôn mặt"
                if (loadingMessage) loadingMessage();
            }
        }
    };

    const submitUser = async (valuesForm: any) => {
        const { name, email, password, address, age, gender, role } = valuesForm;

        const file = dataFaceImage.length > 0 ? dataFaceImage[0]?.originFileObj : undefined;

        const user: IUser = {
            name,
            email,
            password,
            age,
            gender,
            address,
            role: role?.value || dataInit?.role?._id,
            faceDescriptor: faceDescriptor, // Sử dụng faceDescriptor từ trạng thái
            image: imageName, // Tên file ảnh
        };

        try {
            if (dataInit?._id) {
                const res = await callUpdateUser(dataInit._id, user, file);
                if (res.data) {
                    message.success("Cập nhật user thành công");
                    handleReset();
                    reloadTable();
                } else {
                    notification.error({
                        message: "Có lỗi xảy ra",
                    });
                }
            } else {
                const res = await callCreateUser(user, file);
                if (res.data) {
                    message.success("Tạo user thành công");
                    handleReset();
                    reloadTable();
                } else {
                    notification.error({
                        message: "Có lỗi xảy ra",
                    });
                }
            }
        } catch (error) {
            console.error("Lỗi khi submit user:", error);
            message.error("Đã xảy ra lỗi khi submit user.");
        }
    };

    const handleReset = async () => {
        form.resetFields();
        setDataInit(null);

        setAnimation('close')
        setDataFaceImage([]);
        setRoles([]);
        setOpenModal(false);
        setAnimation('open')
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
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map((item) => ({
                label: item.name as string,
                value: item._id as string,
            }));
            return temp;
        } else {
            return [];
        }
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
                initialValues={dataInit?._id ? dataInit : {}}
                submitter={{
                    render: (_: any, dom: any) => <FooterToolbar>{dom}</FooterToolbar>,
                    submitButtonProps: {
                        icon: <CheckSquareOutlined />
                    },
                    searchConfig: {
                        resetText: "Hủy",
                        submitText: <>{dataInit?._id ? "Cập nhật" : "Tạo mới"}</>,
                    }
                }}
            >
                <Row gutter={16}>
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
                                    setRoles(newValue); // Cập nhật giá trị vai trò
                                    form.setFieldsValue({ role: newValue }); // Cập nhật giá trị vào form
                                }}
                                style={{ width: "100%" }}
                            />
                        </ProForm.Item>
                    </Col>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText
                            label="Địa chỉ"
                            name="address"
                            rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                            placeholder="Nhập địa chỉ"
                        />
                    </Col>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <Form.Item label="Ảnh Face ID"
                            rules={[{
                                required: true,
                                message: 'Vui lòng không bỏ trống',
                                validator: () => {
                                    if (dataFaceImage.length > 0) return Promise.resolve();
                                    else return Promise.reject(false);
                                }
                            }]}
                            required>
                            <ConfigProvider locale={enUS}>
                                <Upload
                                    listType="picture-card"
                                    maxCount={1}
                                    customRequest={handleUploadFileFaceId}
                                    fileList={dataFaceImage}
                                    onRemove={() => setDataFaceImage([])}
                                    onPreview={handlePreview}
                                    defaultFileList={
                                        dataInit?._id ?
                                            [
                                                {
                                                    uid: uuidv4(),
                                                    name: dataInit.image ?? "",
                                                    status: 'done',
                                                    url: `${import.meta.env.VITE_BACKEND_URL}/images/user/${dataInit.image}`,
                                                }
                                            ] : []
                                    }
                                >
                                    {dataFaceImage.length === 0 && (
                                        <div>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </div>
                                    )}
                                </Upload>
                            </ConfigProvider>
                            <Button
                                icon={<CameraOutlined />}
                                onClick={() => setIsCameraModalOpen(true)}
                                style={{ marginTop: 8 }}
                            >
                                Chụp ảnh
                            </Button>
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
                footer={null}
                destroyOnClose
            >
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    style={{ width: "100%", borderRadius: "8px" }}
                />
                <Button
                    icon={<CameraOutlined />}
                    onClick={captureImage}
                    style={{ marginTop: 8 }}
                >
                    Chụp ảnh
                </Button>
            </Modal>
        </>
    );
};

export default ModalUser;