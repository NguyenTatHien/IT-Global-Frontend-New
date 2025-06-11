import React, { useEffect, useState, useRef } from 'react';
import { Table, DatePicker, Space, Tag, Typography, Image, Input, Button, Card, Drawer, Descriptions } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import { callGetAllAttendance } from '@/config/api';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns, RequestData } from '@ant-design/pro-components';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import FaceAttendanceImage from './attendance.image';
import ViewDetailAttendance from './ViewDetailAttendance';
import queryString from 'query-string';

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
    location: string
}

interface IRequestParams {
    current?: number;
    pageSize?: number;
    startDate: string;
    endDate: string;
    search?: string;
    sort?: string;
}

const AllAttendanceHistory: React.FC = () => {
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
        const today = dayjs();
        return [today.startOf('month'), today.endOf('month')];
    });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const tableRef = useRef<ActionType>();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<IAttendance | null>(null);

    const columns: ProColumns<IAttendance>[] = [
        {
            title: 'Mã nhân viên',
            dataIndex: 'userId',
            key: 'employeeCode',
            render: (dom, entity) => (
                <a
                    style={{ cursor: 'pointer' }}
                    onClick={e => {
                        e.stopPropagation();
                        setSelectedRecord(entity);
                        setDrawerOpen(true);
                    }}
                >
                    {entity.userId?.employeeCode || '-'}
                </a>
            ),
            sorter: true,
        },
        {
            title: 'Tên nhân viên',
            dataIndex: 'userName',
            key: 'userName',
            render: (dom, entity) => <Text strong>{entity.userId?.name}</Text>,
            sorter: true,
        },
        {
            title: 'Ngày',
            dataIndex: 'checkInTime',
            key: 'date',
            render: (dom, entity) => dayjs(entity.checkInTime).format('DD/MM/YYYY'),
            sorter: true,
            hideInSearch: true,
        },
        {
            title: 'Ảnh check-in',
            dataIndex: 'checkInImage',
            key: 'checkInImage',
            render: (dom, entity) => entity.checkInImage ? <FaceAttendanceImage type='check-in' attendanceId={entity._id} width={80} height={80} /> : '-',
            hideInSearch: true,
        },
        {
            title: 'Ảnh check-out',
            dataIndex: 'checkOutImage',
            key: 'checkOutImage',
            render: (dom, entity) => entity.checkOutImage ? <FaceAttendanceImage type='check-out' attendanceId={entity._id} width={80} height={80} /> : '-',
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
            hideInSearch: true,
        },
    ];

    const request = async (
        params: any,
        sort: Record<string, 'ascend' | 'descend' | null>,
        filter: Record<string, any>
    ): Promise<Partial<RequestData<IAttendance>>> => {
        setLoading(true);
        try {
            const { current, pageSize, ...rest } = params;
            const queryObj: any = {
                current,
                pageSize,
                ...rest,
                ...filter,
                startDate: dateRange[0].startOf('day').format('YYYY-MM-DD'),
                endDate: dateRange[1].endOf('day').format('YYYY-MM-DD'),
            };

            if (sort && Object.keys(sort).length > 0) {
                const sortField = Object.keys(sort)[0];
                const sortOrder = sort[sortField];
                if (sortOrder) {
                    queryObj.sort = sortOrder === 'ascend' ? sortField : `-${sortField}`;
                }
            }

            const res = await callGetAllAttendance(queryObj);

            const mappedData = (res.data?.result || []).map((item: any) => ({
                ...item,
                userName: item.userName || (item.user && item.user.name) || '',
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

    // Thêm hàm chuyển trạng thái sang tiếng Việt
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
                headerTitle="Lịch sử chấm công"
                rowKey="_id"
                loading={loading}
                columns={columns}
                request={request}
                search={{
                    labelWidth: 'auto',
                    defaultCollapsed: true,
                    layout: 'vertical',
                    span: {
                        xs: 24,
                        sm: 12,
                        md: 8,
                        lg: 6,
                        xl: 6,
                        xxl: 6
                    },
                }}
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

export default AllAttendanceHistory;
