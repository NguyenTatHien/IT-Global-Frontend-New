import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, message, Tag } from 'antd';
import moment from 'moment';
import { ShiftChangeRequest, RequestStatus } from '@/types/requests';

const ShiftChangeRequestsTab: React.FC = () => {
    const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ShiftChangeRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/requests/shift-change');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            message.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: ShiftChangeRequest) => {
        try {
            const response = await fetch(`/api/requests/shift-change/${request.id}/approve`, {
                method: 'POST',
            });
            if (response.ok) {
                message.success('Request approved successfully');
                fetchRequests();
            } else {
                message.error('Failed to approve request');
            }
        } catch (error) {
            message.error('Failed to approve request');
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason) return;

        try {
            const response = await fetch(`/api/requests/shift-change/${selectedRequest.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: rejectReason }),
            });

            if (response.ok) {
                message.success('Request rejected successfully');
                setModalVisible(false);
                setRejectReason('');
                setSelectedRequest(null);
                fetchRequests();
            } else {
                message.error('Failed to reject request');
            }
        } catch (error) {
            message.error('Failed to reject request');
        }
    };

    const showRejectModal = (request: ShiftChangeRequest) => {
        setSelectedRequest(request);
        setModalVisible(true);
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: ['employee', 'name'],
            key: 'employee',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => moment(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Current Shift',
            dataIndex: 'currentShift',
            key: 'currentShift',
        },
        {
            title: 'New Shift',
            dataIndex: 'newShift',
            key: 'newShift',
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: RequestStatus) => {
                const statusColors = {
                    [RequestStatus.PENDING]: 'warning',
                    [RequestStatus.APPROVED]: 'success',
                    [RequestStatus.REJECTED]: 'error',
                    [RequestStatus.CANCELLED]: 'default',
                };
                return <Tag color={statusColors[status]}>{status}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: ShiftChangeRequest) => {
                if (record.status !== RequestStatus.PENDING) return null;
                return (
                    <div>
                        <Button
                            type="primary"
                            onClick={() => handleApprove(record)}
                            style={{ marginRight: 8 }}
                        >
                            Approve
                        </Button>
                        <Button danger onClick={() => showRejectModal(record)}>
                            Reject
                        </Button>
                    </div>
                );
            },
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
                title="Reject Request"
                open={modalVisible}
                onOk={handleReject}
                onCancel={() => {
                    setModalVisible(false);
                    setRejectReason('');
                    setSelectedRequest(null);
                }}
                okText="Reject"
                okButtonProps={{ danger: true }}
            >
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason"
                />
            </Modal>
        </div>
    );
};

export default ShiftChangeRequestsTab; 