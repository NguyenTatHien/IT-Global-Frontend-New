import { Card, Col, Row, Statistic, Typography, Table, Calendar, Progress } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';

const { Title } = Typography;

const DashboardPage = () => {
    const user = useAppSelector(state => state.account.user);
    const isAdmin = user?.role?.name === 'SUPER_ADMIN';
    const isManager = user?.role?.name === 'MANAGER';

    // Mock data - sau này sẽ lấy từ API
    const [dashboardData] = useState({
        totalEmployees: 150,
        presentToday: 142,
        onLeave: 5,
        lateToday: 3,
        currentShift: {
            name: 'Ca sáng',
            time: '08:00 - 17:00',
            activeEmployees: 95
        },
        nextShift: {
            name: 'Ca chiều',
            time: '17:00 - 22:00',
            activeEmployees: 45
        },
        myAttendance: {
            checkIn: '08:00',
            checkOut: '17:00',
            status: 'Đúng giờ',
            lateMinutes: 0
        }
    });

    // Data cho biểu đồ chấm công theo tuần
    const weeklyChart = {
        series: [{
            name: 'Đúng giờ',
            data: [44, 45, 42, 43, 48, 0, 0]
        }, {
            name: 'Đi muộn',
            data: [3, 2, 5, 4, 2, 0, 0]
        }],
        options: {
            chart: {
                type: 'bar',
                height: 250,
                stacked: true,
                toolbar: {
                    show: false
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
                categories: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
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

    // Data cho bảng nhân viên đi muộn hôm nay
    const lateEmployeesColumns = [
        {
            title: 'Tên nhân viên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Thời gian đến',
            dataIndex: 'checkInTime',
            key: 'checkInTime',
        },
        {
            title: 'Trễ (phút)',
            dataIndex: 'lateMinutes',
            key: 'lateMinutes',
            render: (minutes: number) => (
                <span style={{ color: '#ff4d4f' }}>{minutes} phút</span>
            )
        }
    ];

    const lateEmployeesData = [
        {
            key: '1',
            name: 'Nguyễn Văn A',
            checkInTime: '8:45',
            lateMinutes: 15,
        },
        {
            key: '2',
            name: 'Trần Thị B',
            checkInTime: '8:30',
            lateMinutes: 10,
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '24px', color: '#1890ff' }}>
                {isAdmin ? 'Tổng quan hệ thống' : 'Thông tin chấm công của tôi'}
            </Title>

            {/* Thông tin chấm công cá nhân */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Giờ vào</span>}
                            value={dashboardData.myAttendance.checkIn}
                            prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Giờ ra</span>}
                            value={dashboardData.myAttendance.checkOut}
                            prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Trạng thái</span>}
                            value={dashboardData.myAttendance.status}
                            prefix={<CheckCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{
                                color: dashboardData.myAttendance.lateMinutes > 0 ? '#ff4d4f' : '#52c41a',
                                fontSize: '24px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Ca làm việc</span>}
                            value={dashboardData.currentShift.name}
                            prefix={<CalendarOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Thông tin tổng quan cho Admin và Manager */}
            {(isAdmin || isManager) && (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Tổng số nhân viên</span>}
                                    value={dashboardData.totalEmployees}
                                    prefix={<TeamOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Có mặt hôm nay</span>}
                                    value={dashboardData.presentToday}
                                    prefix={<UserOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Nghỉ phép</span>}
                                    value={dashboardData.onLeave}
                                    prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#faad14', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title={<span style={{ fontSize: '16px' }}>Đi muộn</span>}
                                    value={dashboardData.lateToday}
                                    prefix={<CheckCircleOutlined style={{ fontSize: '24px' }} />}
                                    valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Ca làm việc hiện tại và tiếp theo */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} md={12}>
                            <Card
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Ca làm việc hiện tại</span>}
                                hoverable
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <Title level={4} style={{ color: '#1890ff' }}>{dashboardData.currentShift.name}</Title>
                                    <p style={{ fontSize: '16px', marginBottom: '16px' }}>{dashboardData.currentShift.time}</p>
                                    <Progress
                                        type="circle"
                                        percent={Math.round((dashboardData.currentShift.activeEmployees / dashboardData.totalEmployees) * 100)}
                                        format={percent => `${dashboardData.currentShift.activeEmployees} người`}
                                    />
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Ca làm việc tiếp theo</span>}
                                hoverable
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <Title level={4} style={{ color: '#1890ff' }}>{dashboardData.nextShift.name}</Title>
                                    <p style={{ fontSize: '16px', marginBottom: '16px' }}>{dashboardData.nextShift.time}</p>
                                    <Progress
                                        type="circle"
                                        percent={Math.round((dashboardData.nextShift.activeEmployees / dashboardData.totalEmployees) * 100)}
                                        format={percent => `${dashboardData.nextShift.activeEmployees} người`}
                                    />
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Biểu đồ và Lịch */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} lg={16}>
                            <Card
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Thống kê chấm công tuần này</span>}
                                hoverable
                            >
                                <ReactApexChart
                                    options={weeklyChart.options as any}
                                    series={weeklyChart.series}
                                    type="bar"
                                    height={250}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Lịch</span>}
                                hoverable
                            >
                                <Calendar
                                    fullscreen={false}
                                    style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '8px' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Bảng nhân viên đi muộn */}
                    <Row>
                        <Col span={24}>
                            <Card
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Danh sách nhân viên đi muộn hôm nay</span>}
                                hoverable
                            >
                                <Table
                                    columns={lateEmployeesColumns}
                                    dataSource={lateEmployeesData}
                                    pagination={false}
                                    style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
}

export default DashboardPage;