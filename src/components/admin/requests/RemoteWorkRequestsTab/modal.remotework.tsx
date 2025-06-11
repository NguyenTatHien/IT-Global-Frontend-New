import { FooterToolbar, ModalForm, ProForm, ProFormDatePicker, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, Button, message, notification } from "antd";
import { isMobile } from "react-device-detect";
import { useState } from "react";
import { callCreateRemoteWorkRequest, callUpdateRemoteWorkRequest, callGetUsers } from "@/config/api";
import { IRemoteWorkRequest } from "@/types/backend";
import { CloseOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import vn from 'antd/lib/locale/vi_VN'
import dayjs from 'dayjs';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IRemoteWorkRequest | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalRemoteWork = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [animation, setAnimation] = useState<string>('open');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const submitRemoteWork = async (valuesForm: any) => {
        const { employee, startDate, endDate, reason, status, location, workPlan } = valuesForm;

        const remoteWork: IRemoteWorkRequest = {
            _id: dataInit?._id || '',
            employee,
            startDate: dayjs(startDate).format('YYYY-MM-DD'),
            endDate: dayjs(endDate).format('YYYY-MM-DD'),
            reason,
            status,
            location,
            workPlan
        };

        try {
            setLoading(true);
            if (dataInit?._id) {
                const res = await callUpdateRemoteWorkRequest(dataInit._id, remoteWork);
                if (res.data) {
                    message.success("Cập nhật yêu cầu làm việc từ xa thành công");
                    handleReset();
                    reloadTable();
                }
            } else {
                const res = await callCreateRemoteWorkRequest(remoteWork);
                if (res.data) {
                    message.success("Tạo mới yêu cầu làm việc từ xa thành công");
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
        setOpenModal(false);
        setAnimation('open');
    };

    return (
        <>
            <ModalForm
                title={<>{dataInit?._id ? "Cập nhật yêu cầu làm việc từ xa" : "Tạo mới yêu cầu làm việc từ xa"}</>}
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
                onFinish={submitRemoteWork}
                initialValues={{
                    ...dataInit,
                    startDate: dataInit?.startDate ? dayjs(dataInit.startDate) : undefined,
                    endDate: dataInit?.endDate ? dayjs(dataInit.endDate) : undefined,
                    status: dataInit?.status || "pending"
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
                                icon={dataInit?._id ? <SaveOutlined /> : <PlusOutlined />}
                            >
                                {dataInit?._id ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        ];
                    }
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormSelect
                            name="userId"
                            label="Nhân viên"
                            placeholder="Chọn nhân viên"
                            rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
                            request={async () => {
                                const res = await callGetUsers("current=1&pageSize=100");
                                if (res?.data?.result) {
                                    return res.data.result
                                        .filter((item: any) => item.isActive === true)
                                        .map((user: any) => ({
                                            label: user.name,
                                            value: user._id,
                                        }));
                                }
                                return [];
                            }}
                        />
                    </Col>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormDatePicker
                            name="date"
                            label="Ngày làm việc từ xa"
                            rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
                            placeholder="Chọn ngày"
                        />
                    </Col>
                    <Col lg={24} md={24} sm={24} xs={24}>
                        <ProFormText
                            name="reason"
                            label="Lý do"
                            rules={[{ required: true, message: "Vui lòng nhập lý do!" }]}
                            placeholder="Nhập lý do làm việc từ xa"
                        />
                    </Col>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormSelect
                            name="status"
                            label="Trạng thái"
                            valueEnum={{
                                pending: "Chờ duyệt",
                                approved: "Đã duyệt",
                                rejected: "Từ chối"
                            }}
                            placeholder="Chọn trạng thái"
                            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
                        />
                    </Col>
                </Row>
            </ModalForm>
        </>
    );
};

export default ModalRemoteWork; 