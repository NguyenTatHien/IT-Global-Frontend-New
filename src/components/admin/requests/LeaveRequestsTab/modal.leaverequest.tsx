import { FooterToolbar, ModalForm, ProForm, ProFormDateRangePicker, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, Button, message, notification } from "antd";
import { isMobile } from "react-device-detect";
import { useState } from "react";
import { callCreateLeaveRequest, callUpdateLeaveRequest, callGetUsers, callFetchUser } from "@/config/api";
import { ILeaveRequest } from "@/types/backend";
import { CloseOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import vn from 'antd/lib/locale/vi_VN'
import dayjs from 'dayjs';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ILeaveRequest | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalLeaveRequest = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [animation, setAnimation] = useState<string>('open');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const submitLeaveRequest = async (valuesForm: any) => {
        const { employee, dateRange, reason, leaveType, status } = valuesForm;

        const leaveRequest: ILeaveRequest = {
            _id: dataInit?._id || '',
            employee,
            startDate: dayjs(dateRange[0]).format('YYYY-MM-DD'),
            endDate: dayjs(dateRange[1]).format('YYYY-MM-DD'),
            reason,
            leaveType,
            status,
            approvedAt: dayjs(new Date).format('YYYY-MM-DD'),
        };

        try {
            setLoading(true);
            if (dataInit?._id) {
                const res = await callUpdateLeaveRequest(dataInit._id, leaveRequest);
                if (res.data) {
                    message.success("Cập nhật yêu cầu nghỉ phép thành công");
                    handleReset();
                    reloadTable();
                }
            } else {
                const res = await callCreateLeaveRequest(leaveRequest);
                if (res.data) {
                    message.success("Tạo mới yêu cầu nghỉ phép thành công");
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
                title={<>{dataInit?._id ? "Cập nhật yêu cầu nghỉ phép" : "Tạo mới yêu cầu nghỉ phép"}</>}
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
                onFinish={submitLeaveRequest}
                initialValues={{
                    ...dataInit,
                    employeeName: dataInit?.employee.name,
                    dateRange: dataInit?.startDate && dataInit?.endDate ? [dayjs(dataInit.startDate), dayjs(dataInit.endDate)] : undefined,
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
                            name="employeeName"
                            label="Nhân viên"
                            placeholder="Chọn nhân viên"
                            rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
                            request={async () => {
                                const res = await callFetchUser("current=1&pageSize=100");
                                if (res?.data?.result) {
                                    return res.data.result
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
                        <ProFormSelect
                            name="leaveType"
                            label="Loại nghỉ phép"
                            valueEnum={{
                                annual: "Nghỉ phép năm",
                                sick: "Nghỉ ốm",
                                personal: "Nghỉ việc riêng",
                                other: "Khác"
                            }}
                            placeholder="Chọn loại nghỉ phép"
                            rules={[{ required: true, message: "Vui lòng chọn loại nghỉ phép!" }]}
                        />
                    </Col>
                    <Col lg={24} md={24} sm={24} xs={24}>
                        <ProFormDateRangePicker
                            name="dateRange"
                            label="Thời gian nghỉ phép"
                            rules={[{ required: true, message: "Vui lòng chọn thời gian nghỉ phép!" }]}
                            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                        />
                    </Col>
                    <Col lg={24} md={24} sm={24} xs={24}>
                        <ProFormText
                            name="reason"
                            label="Lý do"
                            rules={[{ required: true, message: "Vui lòng nhập lý do!" }]}
                            placeholder="Nhập lý do nghỉ phép"
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

export default ModalLeaveRequest; 