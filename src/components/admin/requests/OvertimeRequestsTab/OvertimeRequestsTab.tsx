import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import { OvertimeRequest, RequestStatus } from '@/types/requests';

const { TextArea } = Input;

const OvertimeRequestsTab: React.FC = () => {
    const [requests, setRequests] = useState<OvertimeRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            // TODO: Call API to fetch overtime requests
            const response = await fetch('/api/requests/overtime');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            message.error('Failed to fetch overtime requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            // TODO: Call API to approve request
            await fetch(`/api/requests/overtime/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: RequestStatus.APPROVED,
                    approvedBy: 'current-user-id', // TODO: Get from auth context
                }),
            });
            message.success('Request approved successfully');
            fetchRequests();
        } catch (error) {
            message.error('Failed to approve request');
        }
    };

    const handleReject = async (id: string, reason: string) => {
        try {
            // TODO: Call API to reject request
            await fetch(`/api/requests/overtime/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: RequestStatus.REJECTED,
                    approvedBy: 'current-user-id', // TODO: Get from auth context
                    rejectionReason: reason,
                }),
            });
            message.success('Request rejected successfully');
            fetchRequests();
        } catch (error) {
            message.error('Failed to reject request');
        }
    };

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: ['employee', 'name'],
            key: 'employee',
        },
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => moment(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Thời gian',
            key: 'time',
            render: (record: OvertimeRequest) => (
                <span>
                    {moment(record.startTime).format('HH:mm')} - {moment(record.endTime).format('HH:mm')}
                </span>
            ),
        },
        {
            title: 'Tổng giờ',
            dataIndex: 'totalHours',
            key: 'totalHours',
            render: (hours: number) => `${hours} giờ`,
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: RequestStatus) => {
                const colors = {
                    [RequestStatus.PENDING]: 'gold',
                    [RequestStatus.APPROVED]: 'green',
                    [RequestStatus.REJECTED]: 'red',
                    [RequestStatus.CANCELLED]: 'gray',
                };
                return <Tag color={colors[status]}>{status}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (record: OvertimeRequest) => (
                <div className="space-x-2">
                    {record.status === RequestStatus.PENDING && (
                        <>
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => handleApprove(record.id)}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                Duyệt
                            </Button>
                            <Button
                                type="primary"
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => {
                                    setSelectedRequest(record);
                                    setModalVisible(true);
                                }}
                            >
                                Từ chối
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <Table
                columns={columns}
                dataSource={requests}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Từ chối đơn xin tăng ca"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setSelectedRequest(null);
                    form.resetFields();
                }}
                onOk={() => {
                    form.validateFields().then((values) => {
                        if (selectedRequest) {
                            handleReject(selectedRequest.id, values.reason);
                            setModalVisible(false);
                            setSelectedRequest(null);
                            form.resetFields();
                        }
                    });
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="Lý do từ chối"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default OvertimeRequestsTab; 