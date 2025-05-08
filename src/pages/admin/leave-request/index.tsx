import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Upload, message, Tag, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { callCreateLeaveRequest, callGetLeaveRequests, callGetMyLeaveRequests, callUpdateLeaveRequest } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const LeaveRequestPage: React.FC = () => {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const user = useAppSelector(state => state.account.user);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const query = `current=${currentPage}&pageSize=${pageSize}`;
            const response = user?.role?.name === 'SUPER_ADMIN'
                ? await callGetLeaveRequests(query)
                : await callGetMyLeaveRequests(query);

            if (response.data) {
                setLeaveRequests(response.data.result);
                setTotal(response.data.meta.total);
            }
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            message.error('Lỗi khi lấy danh sách đơn xin nghỉ phép');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, [currentPage, pageSize]);

    const handleCreateRequest = async (values: any) => {
        try {
            setLoading(true);
            const [startDate, endDate] = values.dateRange;
            const data = {
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD'),
                reason: values.reason,
                type: values.type,
                attachments: fileList.map(file => file.originFileObj)
            };

            const response = await callCreateLeaveRequest(data as any);
            if (response.data) {
                message.success('Đơn xin nghỉ phép đã được tạo thành công');
                setIsModalOpen(false);
                form.resetFields();
                setFileList([]);
                fetchLeaveRequests();
            }
        } catch (error) {
            console.error('Error creating leave request:', error);
            message.error('Có lỗi khi tạo đơn xin nghỉ phép');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRequest = async (id: string, status: 'approved' | 'rejected', comment?: string) => {
        try {
            setLoading(true);
            const response = await callUpdateLeaveRequest(id, { status, comment });
            if (response.data) {
                message.success(`Đơn xin nghỉ phép đã ${status} thành công`);
                fetchLeaveRequests();
            }
        } catch (error) {
            console.error('Error updating leave request:', error);
            message.error('Có lỗi khi cập nhật đơn xin nghỉ phép');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: ['user', 'name'],
            key: 'employee',
        },
        {
            title: 'Loại nghỉ',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={
                    type === 'sick' ? 'red' :
                        type === 'annual' ? 'green' : 'blue'
                }>
                    {type === 'sick' ? 'Nghỉ ốm' : type === 'annual' ? 'Nghỉ phép năm' : 'Nghỉ cá nhân'}
                </Tag>
            ),
        },
        {
            title: 'Từ ngày',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Đến ngày',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={
                    status === 'approved' ? 'green' :
                        status === 'rejected' ? 'red' : 'gold'
                }>
                    {status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: any) => (
                user?.role?.name === 'SUPER_ADMIN' && record.status === 'pending' ? (
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => handleUpdateRequest(record._id, 'approved')}
                        >
                            Duyệt
                        </Button>
                        <Button
                            danger
                            onClick={() => handleUpdateRequest(record._id, 'rejected')}
                        >
                            Từ chối
                        </Button>
                    </Space>
                ) : null
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Tạo đơn xin nghỉ phép
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={leaveRequests}
                rowKey="_id"
                loading={loading}
                locale={{ emptyText: 'Trống' }}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
            />

            <Modal
                title="Tạo đơn xin nghỉ phép"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateRequest}
                >
                    <Form.Item
                        name="dateRange"
                        label="Khoảng thời gian"
                        rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
                    >
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Loại nghỉ"
                        rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ' }]}
                    >
                        <Select placeholder="Chọn loại nghỉ">
                            <Select.Option value="sick">Nghỉ ốm</Select.Option>
                            <Select.Option value="annual">Nghỉ phép năm</Select.Option>
                            <Select.Option value="personal">Nghỉ cá nhân</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Lý do"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập lý do xin nghỉ" />
                    </Form.Item>

                    <Form.Item
                        name="attachments"
                        label="Tệp đính kèm"
                    >
                        <Upload
                            listType="picture"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false}
                        >
                            <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Gửi đơn
                            </Button>
                            <Button onClick={() => setIsModalOpen(false)}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LeaveRequestPage; 