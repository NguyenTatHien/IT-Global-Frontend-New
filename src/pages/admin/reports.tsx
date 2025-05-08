import { Card, Col, Row, DatePicker, Select, Table, Statistic } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ReportsPage = () => {
    const user = useAppSelector(state => state.account.user);
    const isAdmin = user?.role?.name === 'SUPER_ADMIN';

    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month')
    ]);

    const [reportType, setReportType] = useState('attendance');

    // Mock data - sau này sẽ lấy từ API
    const [reportData] = useState({
        totalEmployees: 150,
        presentToday: 142,
        onLeave: 5,
        lateToday: 3,
        averageAttendance: 95,
        totalLateDays: 12,
        totalLeaveDays: 25
    });

    // Data cho biểu đồ chấm công theo tháng
    const attendanceChart = {
        series: [{
            name: 'Đúng giờ',
            data: [44, 45, 42, 43, 48, 45, 42, 43, 48, 45, 42, 43]
        }, {
            name: 'Đi muộn',
            data: [3, 2, 5, 4, 2, 3, 2, 5, 4, 2, 3, 2]
        }],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                stacked: true,
                toolbar: {
                    show: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 4,
                    columnWidth: '60%',
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            },
            title: {
                text: 'Thống kê chấm công theo tháng',
                align: 'center',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            colors: ['#52c41a', '#ff4d4f'],
            legend: {
                position: 'bottom'
            },
            fill: {
                opacity: 1
            }
        }
    };

    // Data cho bảng chi tiết chấm công
    const attendanceColumns = [
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Tổng số nhân viên',
            dataIndex: 'totalEmployees',
            key: 'totalEmployees',
        },
        {
            title: 'Có mặt',
            dataIndex: 'present',
            key: 'present',
        },
        {
            title: 'Đi muộn',
            dataIndex: 'late',
            key: 'late',
        },
        {
            title: 'Nghỉ phép',
            dataIndex: 'onLeave',
            key: 'onLeave',
        },
        {
            title: 'Tỷ lệ đi muộn',
            dataIndex: 'lateRate',
            key: 'lateRate',
            render: (rate: number) => (
                <span style={{ color: rate > 10 ? '#ff4d4f' : '#52c41a' }}>
                    {rate}%
                </span>
            )
        }
    ];

    const attendanceData = [
        {
            key: '1',
            date: '2024-03-01',
            totalEmployees: 150,
            present: 145,
            late: 3,
            onLeave: 2,
            lateRate: 2
        },
        {
            key: '2',
            date: '2024-03-02',
            totalEmployees: 150,
            present: 142,
            late: 5,
            onLeave: 3,
            lateRate: 3.5
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={8}>
                        <Select
                            style={{ width: '100%' }}
                            value={reportType}
                            onChange={setReportType}
                            options={[
                                { value: 'attendance', label: 'Báo cáo chấm công' },
                                { value: 'leave', label: 'Báo cáo nghỉ phép' },
                                { value: 'late', label: 'Báo cáo đi muộn' }
                            ]}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <RangePicker
                            style={{ width: '100%' }}
                            value={dateRange}
                            onChange={(dates) => {
                                if (dates) {
                                    setDateRange([dates[0] as dayjs.Dayjs, dates[1] as dayjs.Dayjs]);
                                }
                            }}
                        />
                    </Col>
                </Row>
            </Card>

            {isAdmin && (
                <>
                    {/* Thống kê tổng quan */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Tổng số nhân viên</span>}
                                    value={reportData.totalEmployees}
                                    prefix={<TeamOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Tỷ lệ đi muộn trung bình</span>}
                                    value={reportData.totalLateDays}
                                    suffix="ngày"
                                    prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Tổng số ngày nghỉ phép</span>}
                                    value={reportData.totalLeaveDays}
                                    suffix="ngày"
                                    prefix={<CheckCircleOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#faad14', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Tỷ lệ chấm công trung bình</span>}
                                    value={reportData.averageAttendance}
                                    suffix="%"
                                    prefix={<UserOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Biểu đồ thống kê */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col span={24}>
                            <Card title="Biểu đồ thống kê chấm công">
                                <ReactApexChart
                                    options={attendanceChart.options as any}
                                    series={attendanceChart.series}
                                    type="bar"
                                    height={350}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Bảng chi tiết */}
                    <Row>
                        <Col span={24}>
                            <Card title="Chi tiết chấm công">
                                <Table
                                    columns={attendanceColumns}
                                    dataSource={attendanceData}
                                    pagination={{ pageSize: 10 }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default ReportsPage; 