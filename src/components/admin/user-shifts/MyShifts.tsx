import React, { useEffect, useState } from 'react';
import { Table, Tag, message, Card, Typography, Space, DatePicker } from 'antd';
import { callGetMyShifts } from '@/config/api';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface IUserShift {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    shiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
    date: string;
    status: 'active' | 'inactive' | 'pending';
}

const MyShifts: React.FC = () => {
    const [userShifts, setUserShifts] = useState<IUserShift[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);

    useEffect(() => {
        if (!user?._id) {
            navigate('/face-id-login');
            return;
        }
        fetchMyShifts();
    }, [user]);

    const fetchMyShifts = async () => {
        try {
            setLoading(true);
            const res = await callGetMyShifts();
            if (res?.data?.data) {
                setUserShifts(res.data.data);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải danh sách ca làm việc');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'green';
            case 'inactive':
                return 'red';
            case 'pending':
                return 'orange';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Đang hoạt động';
            case 'inactive':
                return 'Ngừng hoạt động';
            case 'pending':
                return 'Chờ xử lý';
            default:
                return 'Không xác định';
        }
    };

    const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
        setDateRange(dates);
    };

    const getFilteredShifts = () => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) {
            return userShifts;
        }

        const startDate = dateRange[0]!.startOf('day');
        const endDate = dateRange[1]!.endOf('day');

        return userShifts.filter(shift => {
            const shiftDate = dayjs(shift.date).startOf('day');
            return (shiftDate.isSame(startDate, 'day') || shiftDate.isAfter(startDate)) 
                && (shiftDate.isSame(endDate, 'day') || shiftDate.isBefore(endDate));
        });
    };

    const columns = [
        {
            title: 'Ca làm việc',
            dataIndex: ['shiftId', 'name'],
            key: 'shiftName',
        },
        {
            title: 'Thời gian',
            key: 'time',
            render: (_: any, record: IUserShift) => (
                <span>
                    {record.shiftId?.startTime} - {record.shiftId?.endTime}
                </span>
            ),
        },
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: IUserShift, b: IUserShift) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
        },
    ];

    return (
        <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Title level={4}>Danh sách ca làm việc của tôi</Title>
                <Space>
                    <RangePicker
                        onChange={handleDateRangeChange}
                        format="DD/MM/YYYY"
                        placeholder={['Từ ngày', 'Đến ngày']}
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={getFilteredShifts()}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng số ${total} ca làm việc`,
                    }}
                />
            </Space>
        </Card>
    );
};

export default MyShifts; 