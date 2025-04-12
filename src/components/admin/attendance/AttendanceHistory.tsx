import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Tag, DatePicker } from 'antd';
import { callGetMyAttendance } from '@/config/api';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import queryString from 'query-string';
import DataTable from '@/components/share/data-table';

const { RangePicker } = DatePicker;

interface IAttendance {
    _id: string;
    userId: string;
    userShiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
    checkInTime: string;
    checkOutTime?: string;
    status: 'on-time' | 'late' | 'early' | 'absent';
    location?: {
        latitude: number;
        longitude: number;
    };
    lateMinutes?: number;
    earlyMinutes?: number;
    totalHours?: number;
    overtimeHours?: number;
    createdAt: string;
    updatedAt: string;
}

const AttendanceHistory: React.FC = () => {
    const [attendanceHistory, setAttendanceHistory] = useState<IAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        pages: 0
    });
    
    // Set initial date range to current month
    const now = dayjs();
    const [dateRange, setDateRange] = useState<any>([
        now.startOf('month'),
        now.endOf('month')
    ]);

    const tableRef = useRef<ActionType>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!isAuthenticated || !token) {
            navigate('/login');
            return;
        }
        if (!user?._id) {
            console.error('User information not found');
            return;
        }
    }, [isAuthenticated, user]);

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const buildQuery = (params: any, sort: any, filter: any) => {
        if (!user?._id) {
            console.error('User ID not found');
            return null;
        }

        // Ensure we have a valid date range
        const currentDateRange = dateRange || [dayjs().startOf('month'), dayjs().endOf('month')];
        
        if (!currentDateRange[0] || !currentDateRange[1]) {
            console.error('Invalid date range');
            return null;
        }

        // Build query parameters
        const queryParams = {
            current: params.current || 1,
            pageSize: params.pageSize || 10,
            startDate: currentDateRange[0].format('YYYY-MM-DD'),
            endDate: currentDateRange[1].format('YYYY-MM-DD')
        };

        // Add sorting if present
        if (sort && Object.keys(sort).length > 0) {
            const sortField = Object.keys(sort)[0];
            const sortOrder = sort[sortField] === 'ascend' ? '' : '-';
            (queryParams as any).sort = `${sortOrder}${sortField}`;
        }

        console.log('Query parameters:', queryParams);
        return queryString.stringify(queryParams);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on-time':
                return 'green';
            case 'late':
                return 'orange';
            case 'early':
                return 'blue';
            case 'absent':
                return 'red';
            default:
                return 'default';
        }
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
                return 'Không xác định';
        }
    };

    const columns: ProColumns<IAttendance>[] = [
        {
            title: 'Ngày',
            dataIndex: ['checkInTime', 'date'],
            key: 'date',
            sorter: true,
            render: (_, record) => dayjs(record.checkInTime).format('DD/MM/YYYY')
        },
        {
            title: 'Giờ vào',
            dataIndex: ['checkInTime', 'time'],
            key: 'checkInTime',
            sorter: true,
            render: (_, record) => dayjs(record.checkInTime).format('HH:mm:ss')
        },
        {
            title: 'Giờ ra',
            dataIndex: 'checkOutTime',
            key: 'checkOutTime',
            sorter: true,
            render: (_, record) => record.checkOutTime ? dayjs(record.checkOutTime).format('HH:mm:ss') : '-'
        },
        {
            title: 'Ca làm việc',
            dataIndex: ['userShiftId', 'name'],
            key: 'userShift',
            render: (_, record) => {
                if (!record.userShiftId) return '-';
                return `${record.userShiftId.name} (${dayjs(record.userShiftId.startTime).format('HH:mm')} - ${dayjs(record.userShiftId.endTime).format('HH:mm')})`;
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (_, record) => (
                <Tag color={getStatusColor(record.status)}>
                    {getStatusText(record.status)}
                </Tag>
            )
        },
        {
            title: 'Số giờ làm',
            dataIndex: 'totalHours',
            key: 'totalHours',
            render: (_, record) => record.totalHours ? `${record.totalHours.toFixed(2)} giờ` : '-'
        }
    ];

    return (
        <div>
            <DataTable<IAttendance>
                actionRef={tableRef}
                headerTitle="Lịch sử chấm công"
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={attendanceHistory}
                request={async (params, sort, filter): Promise<any> => {
                    try {
                        setLoading(true);
                        console.log('Request params:', { params, sort, filter });
                        console.log('Current date range:', dateRange);

                        const queryStr = buildQuery(params, sort, filter);
                        if (!queryStr) {
                            console.error('Failed to build query string');
                            return {
                                data: [],
                                success: false,
                                total: 0
                            };
                        }

                        console.log('Query string:', queryStr);
                        const response = await callGetMyAttendance(queryStr);
                        console.log('API Response:', response);

                        if (response?.data) {
                            setAttendanceHistory(response.data.result as IAttendance[]);
                            setMeta(response.data.meta);
                            return {
                                data: response.data.result,
                                meta: response.data.meta
                            };
                        }

                        return {
                            data: [],
                            success: false,
                            total: 0
                        };
                    } catch (error) {
                        console.error('Error fetching attendance history:', error);
                        return {
                            data: [],
                            success: false,
                            total: 0
                        };
                    } finally {
                        setLoading(false);
                    }
                }}
                toolBarRender={(_action: any, _rows: any): any => {
                    return (
                        <Space>
                            <RangePicker 
                                value={dateRange}
                                onChange={(dates) => {
                                    if (dates && dates[0] && dates[1]) {
                                        setDateRange([
                                            dates[0].startOf('day'),
                                            dates[1].endOf('day')
                                        ]);
                                        console.log('New date range:', {
                                            start: dates[0].format('YYYY-MM-DD'),
                                            end: dates[1].format('YYYY-MM-DD')
                                        });
                                    } else {
                                        // If dates is null, reset to current month
                                        const now = dayjs();
                                        setDateRange([now.startOf('month'), now.endOf('month')]);
                                        console.log('Reset to current month');
                                    }
                                    tableRef.current?.reload(true);
                                }}
                            />
                        </Space>
                    );
                }}
            />
        </div>
    );
};

export default AttendanceHistory; 