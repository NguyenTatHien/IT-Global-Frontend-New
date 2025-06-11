import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, message, Tag } from 'antd';
import moment from 'moment';
import { LateEarlyRequest, RequestType, RequestStatus } from '@/types/requests';

const LateEarlyRequestsTab: React.FC = () => {
    const [requests, setRequests] = useState<LateEarlyRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LateEarlyRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/requests/late-early');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            message.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: LateEarlyRequest) => {
        try {
            const response = await fetch(`/api/requests/late-early/${request.id}/approve`, {
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
            const response = await fetch(`/api/requests/late-early/${selectedRequest.id}/reject`, {
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

    const showRejectModal = (request: LateEarlyRequest) => {
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
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: RequestType) => (
                <Tag color={type === RequestType.LATE ? 'orange' : 'blue'}>
                    {type === RequestType.LATE ? 'Late' : 'Early'}
                </Tag>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => moment(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            render: (time: string) => moment(time, 'HH:mm').format('HH:mm'),
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
            render: (_: any, record: LateEarlyRequest) => {
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

export default LateEarlyRequestsTab; 