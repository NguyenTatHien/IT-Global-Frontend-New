import React, { FC, useState, useEffect } from 'react';
import { Table, DatePicker, Space, Tag, Typography, message } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import { callGetMyAttendance } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import queryString from 'query-string';
// import { getAttendanceHistory } from '@/components/admin/attendance/attendance.service';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface IShift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
}

interface IUserShift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    shiftId: IShift | null;
}

interface IAttendance {
    _id: string;
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: 'on-time' | 'late' | 'early' | 'absent';
    lateMinutes: number;
    earlyMinutes: number;
    totalHours: string;
    overtimeHours: number;
}

interface IState {
    dateRange: RangePickerProps['value'];
    attendanceData: IAttendance[];
    loading: boolean;
    pagination: TablePaginationConfig;
    sortField: string;
    sortOrder: 'ascend' | 'descend';
}

const AttendanceHistory: FC = () => {
    const [dateRange, setDateRange] = useState<RangePickerProps['value']>(() => {
        const today = dayjs();
        const monday = today.startOf('week').add(1, 'day');
        const sunday = monday.add(6, 'day');
        return [monday, sunday] as RangePickerProps['value'];
    });
    const [attendanceData, setAttendanceData] = useState<IAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [sortField, setSortField] = useState<string>('checkInTime');
    const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            message.error('Vui lòng đăng nhập để xem lịch sử chấm công');
            navigate('/face-id-login');
            return;
        }
    }, [isAuthenticated, navigate]);

    const fetchData = async (params: Record<string, any>) => {
        try {
            setLoading(true);
            const query: Record<string, any> = {
                page: params.page,
                limit: params.limit,
            };

            if (params.startDate && params.endDate) {
                query.startDate = params.startDate;
                query.endDate = params.endDate;
            } else {
                message.error('Vui lòng chọn khoảng thời gian');
                return;
            }

            if (params.sortField) {
                query.sort = `${params.sortOrder === 'descend' ? '-' : ''}${params.sortField}`;
            }

            const response = await callGetMyAttendance(queryString.stringify(query));

            const responseData = response?.data?.data;
            if (responseData?.result && Array.isArray(responseData.result)) {

                const mappedData = responseData.result.map((item: any) => ({
                    ...item,
                    key: item._id,
                }));

                setAttendanceData(mappedData);

                if (responseData.meta) {
                    setPagination(prev => ({
                        ...prev,
                        total: responseData.meta.total || 0,
                        current: responseData.meta.current || 1,
                        pageSize: responseData.meta.pageSize || 10
                    }));
                }

                if (responseData.result.length === 0) {
                    message.info('Không có dữ liệu chấm công trong khoảng thời gian này');
                }
            } else {
                message.error('Không thể tải dữ liệu chấm công: Dữ liệu không hợp lệ');
            }
        } catch (error: any) {
            console.error('Full error object:', error);
            if (error.response?.status === 401) {
                message.error('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
                navigate('/face-id-login');
            } else {
                message.error('Không thể tải dữ liệu chấm công: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && dateRange?.[0] && dateRange?.[1]) {
            fetchData({ 
                page: 1, 
                limit: 10,
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD')
            });
        }
    }, [dateRange, pagination.current, pagination.pageSize, sortField, sortOrder, isAuthenticated]);

    const handleTableChange = (
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<IAttendance> | SorterResult<IAttendance>[],
        extra: TableCurrentDataSource<IAttendance>
    ) => {
        setPagination(pagination);
        if (Array.isArray(sorter)) {
            // Handle multiple sorters if needed
            return;
        }
        
        const params = {
            page: pagination.current,
            limit: pagination.pageSize,
            sortField: sorter.field,
            sortOrder: sorter.order,
            startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
            endDate: dateRange?.[1]?.format('YYYY-MM-DD')
        };
        
        fetchData(params);
    };

    const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
        setDateRange(dates);
        setPagination({ ...pagination, current: 1 });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on-time':
                return 'success';
            case 'late':
                return 'warning';
            case 'early':
                return 'warning';
            case 'absent':
                return 'error';
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
                return status;
        }
    };

    const formatTimeDisplay = (minutes: number): string => {
        if (!minutes || minutes <= 0) return '-';
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            if (remainingMinutes > 0) {
                return `${hours} giờ ${remainingMinutes} phút`;
            }
            return `${hours} giờ`;
        }
        return `${remainingMinutes} phút`;
    };

    const formatWorkHours = (hours: string | number): string => {
        if (!hours) return '-';
        
        const totalHours = typeof hours === 'string' ? parseFloat(hours) : hours;
        if (totalHours <= 0) return '-';
        
        const wholeHours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - wholeHours) * 60);
        
        if (wholeHours > 0) {
            if (minutes > 0) {
                return `${wholeHours} giờ ${minutes} phút`;
            }
            return `${wholeHours} giờ`;
        }
        if (minutes > 0) {
            return `${minutes} phút`;
        }
        return '-';
    };

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'checkInTime',
            key: 'date',
            width: 120,
            sorter: true,
            render: (text: string) => dayjs(text).format('DD/MM/YYYY')
        },
        {
            title: 'Giờ vào',
            dataIndex: 'checkInTime',
            key: 'checkInTime',
            width: 100,
            sorter: true,
            render: (text: string) => dayjs(text).format('HH:mm:ss')
        },
        {
            title: 'Giờ ra',
            dataIndex: 'checkOutTime',
            key: 'checkOutTime',
            width: 100,
            sorter: true,
            render: (text: string) => text ? dayjs(text).format('HH:mm:ss') : '-'
        },
        {
            title: 'Ca làm việc',
            dataIndex: 'userShiftId',
            key: 'userShift',
            width: 200,
            render: (userShift: IUserShift | null) => {
                if (!userShift) return '-';
                const shiftName = userShift.name || userShift.shiftId?.name || 'Ca làm việc';
                const startTime = userShift.startTime || userShift.shiftId?.startTime || '';
                const endTime = userShift.endTime || userShift.shiftId?.endTime || '';
                
                const formatTime = (timeStr: string) => {
                    if (!timeStr) return '';
                    // Nếu timeStr đã là định dạng "HH:mm" thì trả về luôn
                    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
                        return timeStr;
                    }
                    // Nếu là timestamp hoặc date string thì parse và format
                    const parsed = dayjs(timeStr);
                    return parsed.isValid() ? parsed.format('HH:mm') : '';
                };

                const formattedStartTime = formatTime(startTime);
                const formattedEndTime = formatTime(endTime);
                
                return (
                    <Text>
                        {shiftName}
                        <br />
                        <Text type="secondary">
                            {formattedStartTime && formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : ''}
                        </Text>
                    </Text>
                );
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            sorter: true,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            )
        },
        {
            title: 'Đi muộn',
            dataIndex: 'lateMinutes',
            key: 'lateMinutes',
            width: 120,
            sorter: true,
            render: (minutes: number) => (
                <Text type={minutes > 0 ? "warning" : undefined}>
                    {formatTimeDisplay(minutes)}
                </Text>
            )
        },
        {
            title: 'Về sớm',
            dataIndex: 'earlyMinutes',
            key: 'earlyMinutes',
            width: 120,
            sorter: true,
            render: (minutes: number) => (
                <Text type={minutes > 0 ? "warning" : undefined}>
                    {formatTimeDisplay(minutes)}
                </Text>
            )
        },
        {
            title: 'Số giờ làm',
            dataIndex: 'totalHours',
            key: 'totalHours',
            width: 120,
            sorter: true,
            render: (hours: string) => (
                <Text strong>
                    {formatWorkHours(hours)}
                </Text>
            )
        },
        {
            title: 'Tăng ca',
            dataIndex: 'overtimeHours',
            key: 'overtimeHours',
            width: 100,
            sorter: true,
            render: (hours: number) => hours > 0 ? (
                <Text type="success">{hours.toFixed(2)} giờ</Text>
            ) : '-'
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space style={{ marginBottom: 16 }}>
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        allowClear={false}
                    />
                </Space>

                <Table
                    columns={columns}
                    dataSource={attendanceData}
                    rowKey="_id"
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng số: ${total} bản ghi`,
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                    onChange={handleTableChange}
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    locale={{
                        emptyText: 'Không có dữ liệu'
                    }}
                />
            </Space>
        </div>
    );
};

export default AttendanceHistory;