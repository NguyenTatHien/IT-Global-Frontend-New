import React, { useState, useRef } from 'react';
import { DatePicker, Space, Tag, Typography, Card } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns, RequestData } from '@ant-design/pro-components';
import { callGetMyAttendance } from '@/config/api';
import ViewDetailAttendance from './ViewDetailAttendance';
import FaceAttendanceImage from './attendance.image';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface IAttendance {
    _id: string;
    userId: {
        _id: string;
        name: string;
        employeeCode: string;
    };
    userName: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: string;
    lateMinutes: number;
    earlyMinutes: number;
    totalHours: string;
    overtimeHours: number;
    checkInImage: string;
    checkOutImage: string;
    userShiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    } | null;
    ipAddress: string;
    location: string;
}

const MyAttendanceHistory: React.FC = () => {
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
        const today = dayjs();
        return [today.startOf('month'), today.endOf('month')];
    });
    const [loading, setLoading] = useState(false);
    const tableRef = useRef<ActionType>();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<IAttendance | null>(null);

    const columns: ProColumns<IAttendance>[] = [
        {
            title: 'Ngày',
            dataIndex: 'checkInTime',
            key: 'date',
            render: (dom, entity) => (
                <a
                    style={{ cursor: 'pointer' }}
                    onClick={e => {
                        e.stopPropagation();
                        setSelectedRecord(entity);
                        setDrawerOpen(true);
                    }}
                >
                    {dayjs(entity.checkInTime).format('DD/MM/YYYY')}
                </a>
            ),
            sorter: true,
        },
        {
            title: 'Giờ check-in',
            dataIndex: 'checkInTime',
            key: 'checkInTime',
            render: (dom, entity) => dayjs(entity.checkInTime).format('HH:mm:ss'),
            sorter: true,
        },
        {
            title: 'Ảnh check-in',
            dataIndex: 'checkInImage',
            key: 'checkInImage',
            render: (dom, entity) => entity.checkInImage ? <FaceAttendanceImage attendanceId={entity._id} type="check-in" width={80} height={80} /> : '-',
            hideInSearch: true,
        },
        {
            title: 'Giờ check-out',
            dataIndex: 'checkOutTime',
            key: 'checkOutTime',
            render: (dom, entity) => entity.checkOutTime ? dayjs(entity.checkOutTime).format('HH:mm:ss') : '-',
            sorter: true,
        },
        {
            title: 'Ảnh check-out',
            dataIndex: 'checkOutImage',
            key: 'checkOutImage',
            render: (dom, entity) => entity.checkOutImage ? <FaceAttendanceImage attendanceId={entity._id} type="check-out" width={80} height={80} /> : '-',
            hideInSearch: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (dom, entity) => {
                let color = 'green';
                if (entity.status === 'late') color = 'orange';
                if (entity.status === 'absent') color = 'red';
                if (entity.status === 'early') color = 'blue';
                return <Tag color={color}>{getStatusText(entity.status)}</Tag>;
            },
            sorter: true,
        },
        {
            title: 'Đi muộn',
            dataIndex: 'lateMinutes',
            key: 'lateMinutes',
            render: (dom, entity) => entity.lateMinutes > 0 ? `${entity.lateMinutes} phút` : '-',
            hideInSearch: true,
        },
        {
            title: 'Về sớm',
            dataIndex: 'earlyMinutes',
            key: 'earlyMinutes',
            render: (dom, entity) => entity.earlyMinutes > 0 ? `${entity.earlyMinutes} phút` : '-',
            hideInSearch: true,
        },
        {
            title: 'Tổng giờ',
            dataIndex: 'totalHours',
            key: 'totalHours',
            render: (dom, entity) => entity.totalHours || '-',
            hideInSearch: true,
        },
        {
            title: 'Tăng ca',
            dataIndex: 'overtimeHours',
            key: 'overtimeHours',
            render: (dom, entity) => entity.overtimeHours > 0 ? `${entity.overtimeHours} giờ` : '-',
            hideInSearch: true,
        },
    ];

    const request = async (
        params: {
            current?: number;
            pageSize?: number;
            [key: string]: any;
        },
        sort: Record<string, 'ascend' | 'descend' | null>,
        filter: Record<string, any>
    ): Promise<Partial<RequestData<IAttendance>>> => {
        setLoading(true);
        try {
            if (!dateRange[0] || !dateRange[1]) {
                setLoading(false);
                return { data: [], success: true, total: 0 };
            }
            const startDate = dateRange[0].startOf('day').format('YYYY-MM-DD');
            const endDate = dateRange[1].endOf('day').format('YYYY-MM-DD');

            let sortString = '';
            if (sort) {
                const sortField = Object.keys(sort)[0];
                const sortOrder = sort[sortField];
                if (sortOrder) {
                    sortString = sortOrder === 'ascend' ? sortField : `-${sortField}`;
                }
            }

            const res = await callGetMyAttendance({
                current: params.current || 1,
                pageSize: params.pageSize || 10,
                startDate,
                endDate,
                ...(sortString ? { sort: sortString } : {})
            });

            const mappedData = (res.data?.result || []).map((item: any) => ({
                ...item,
                key: item._id,
                userId: typeof item.userId === 'object' ? item.userId : { _id: '', name: '', employeeCode: '' },
                userName: item.userName || (item.userId && item.userId.name) || '',
                userShiftId: item.userShiftId || null,
            }));

            return {
                data: mappedData,
                success: true,
                total: res.data?.meta?.total || 0
            };
        } catch (error) {
            return {
                data: [],
                success: false,
                total: 0
            };
        } finally {
            setLoading(false);
        }
    };

    const toolBarRender = () => {
        return [
            <Space key="search">
                <RangePicker
                    value={dateRange}
                    onChange={val => {
                        if (val) {
                            setDateRange(val as [Dayjs, Dayjs]);
                            setTimeout(() => {
                                tableRef.current?.reload();
                            }, 0);
                        }
                    }}
                    allowClear={false}
                />
            </Space>
        ];
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'on-time':
                return 'Đúng giờ';
            case 'late':
                return 'Đi muộn';
            case 'early':
                return 'Về sớm';
            case 'absent':
                return 'Vắng mặt';
            default:
                return status;
        }
    };

    return (
        <Card>
            <ProTable<IAttendance>
                actionRef={tableRef}
                headerTitle="Lịch sử chấm công của tôi"
                rowKey="_id"
                loading={loading}
                columns={columns}
                request={request}
                search={false}
                pagination={{
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} bản ghi`,
                }}
                toolBarRender={toolBarRender}
                scroll={{ x: 'max-content' }}
            />
            <ViewDetailAttendance
                open={drawerOpen}
                onClose={setDrawerOpen}
                dataInit={selectedRecord}
                setDataInit={setSelectedRecord}
            />
        </Card>
    );
};

export default MyAttendanceHistory;