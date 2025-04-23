import React, { useState } from 'react';
import { Card, Typography, Row, Col, Button, Space } from 'antd';
import { 
    ClockCircleOutlined, 
    TeamOutlined, 
    CalendarOutlined, 
    BarChartOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const HomePage = () => {
    const navigate = useNavigate();
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    const features = [
        {
            icon: <ClockCircleOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
            title: 'Chấm công thông minh',
            description: 'Chấm công tự động, chính xác',
            route: '/admin/check-in-out',
            color: '#1890ff',
            hoverGradient: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
        },
        {
            icon: <TeamOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
            title: 'Quản lý nhân viên',
            description: 'Quản lý thông tin hiệu quả',
            route: '/admin/user',
            color: '#52c41a',
            hoverGradient: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
        },
        {
            icon: <CalendarOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
            title: 'Lịch làm việc',
            description: 'Phân ca làm việc linh hoạt',
            route: '/admin/shifts',
            color: '#722ed1',
            hoverGradient: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)'
        },
        {
            icon: <BarChartOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />,
            title: 'Báo cáo & Thống kê',
            description: 'Phân tích dữ liệu chi tiết',
            route: '/admin/dashboard',
            color: '#fa8c16',
            hoverGradient: 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)'
        }
    ];

    return (
        <div style={{ 
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px'
        }}>
            {/* Hero Section */}
            <Row justify="center" align="middle" style={{ marginBottom: '40px' }}>
                <Col xs={24} md={12} style={{ textAlign: 'center' }}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <div 
                            style={{ 
                                display: 'inline-block',
                                padding: '15px',
                                borderRadius: '12px',
                                background: isLogoHovered ? 'linear-gradient(45deg, #e6f7ff, #f0f5ff)' : 'transparent',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={() => setIsLogoHovered(true)}
                            onMouseLeave={() => setIsLogoHovered(false)}
                        >
                            <img 
                                src={`${import.meta.env.VITE_BACKEND_URL}/images/company/logo.jpg`} 
                                alt="Company Logo" 
                                style={{ 
                                    height: '160px',
                                    width: 'auto',
                                    borderRadius: '10px',
                                    boxShadow: isLogoHovered 
                                        ? '0 8px 20px rgba(24,144,255,0.15)' 
                                        : '0 4px 12px rgba(0,0,0,0.1)',
                                    transform: isLogoHovered ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>
                        <Title level={2} style={{ 
                            margin: 0,
                            background: 'linear-gradient(45deg, #1890ff, #722ed1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Hệ thống Quản lý Chấm công
                        </Title>
                        <Paragraph style={{ 
                            fontSize: '16px',
                            color: '#666',
                            margin: 0
                        }}>
                            Giải pháp quản lý nhân sự toàn diện cho doanh nghiệp
                        </Paragraph>
                    </Space>
                </Col>
            </Row>

            {/* Features Section */}
            <Row gutter={[16, 16]} justify="center">
                {features.map((feature, index) => (
                    <Col xs={24} sm={12} md={6} key={index}>
                        <Card
                            hoverable
                            style={{ 
                                height: '100%',
                                textAlign: 'center',
                                borderRadius: '8px',
                                background: hoveredCard === index ? feature.hoverGradient : '#fff',
                                boxShadow: hoveredCard === index 
                                    ? `0 8px 16px ${feature.color}20` 
                                    : '0 2px 8px rgba(0,0,0,0.05)',
                                transform: hoveredCard === index ? 'translateY(-5px)' : 'none',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                border: hoveredCard === index ? `1px solid ${feature.color}40` : '1px solid #f0f0f0'
                            }}
                            bodyStyle={{ 
                                padding: '20px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                            onClick={() => navigate(feature.route)}
                            onMouseEnter={() => setHoveredCard(index)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                {feature.icon}
                                <Title level={4} style={{ 
                                    margin: '8px 0', 
                                    fontSize: '16px',
                                    color: hoveredCard === index ? feature.color : 'inherit'
                                }}>
                                    {feature.title}
                                </Title>
                                <Paragraph style={{ 
                                    color: '#666',
                                    margin: '0 0 16px 0',
                                    fontSize: '14px'
                                }}>
                                    {feature.description}
                                </Paragraph>
                                <div style={{
                                    opacity: hoveredCard === index ? 1 : 0,
                                    transform: hoveredCard === index ? 'translateY(0)' : 'translateY(10px)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <ArrowRightOutlined style={{ 
                                        fontSize: '18px', 
                                        color: feature.color,
                                        transition: 'all 0.3s ease'
                                    }} />
                                </div>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default HomePage; 