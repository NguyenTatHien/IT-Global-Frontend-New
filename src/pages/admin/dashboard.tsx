import { Card, Col, Row, Statistic, Typography, Table, Calendar } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

const { Title } = Typography;

const DashboardPage = () => {
    // Mock data - sau này sẽ lấy từ API
    const [attendanceData] = useState({
        totalEmployees: 150,
        presentToday: 142,
        onLeave: 5,
        lateToday: 3
    });

    // Data cho biểu đồ chấm công theo tuần
    const attendanceChart = {
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
                height: 350,
                stacked: true,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                    }
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
            title: {
                text: 'Thống kê chấm công theo tuần',
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
            <Title level={2} style={{ marginBottom: '24px', color: '#1890ff' }}>Tổng quan hệ thống</Title>
            
            {/* Thẻ thống kê */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Tổng số nhân viên</span>}
                            value={attendanceData.totalEmployees}
                            prefix={<TeamOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Có mặt hôm nay</span>}
                            value={attendanceData.presentToday}
                            prefix={<UserOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Nghỉ phép</span>}
                            value={attendanceData.onLeave}
                            prefix={<ClockCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#faad14', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title={<span style={{ fontSize: '16px' }}>Đi muộn</span>}
                            value={attendanceData.lateToday}
                            prefix={<CheckCircleOutlined style={{ fontSize: '24px' }} />}
                            valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Biểu đồ và Lịch */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={16}>
                    <Card 
                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Biểu đồ chấm công</span>}
                        hoverable
                    >
                        <ReactApexChart 
                            options={attendanceChart.options as any}
                            series={attendanceChart.series}
                            type="bar"
                            height={350}
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
        </div>
    );
}

export default DashboardPage;