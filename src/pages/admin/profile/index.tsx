import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Row, Col, Button, Form, Input, message, Divider, Select, Space } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { IUser } from '@/types/backend';
import { callUpdateUser, callGetProfile } from '@/config/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface IAddress {
    city: string;
    district: string;
    ward: string;
    detail: string;
}

const ProfilePage = () => {
    const user = useAppSelector(state => state.account.user);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [userData, setUserData] = useState<IUser | null>(null);
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // Đưa fetchUserData ra ngoài useEffect để có thể gọi lại sau khi cập nhật
    const fetchUserData = async () => {
        try {
            const res = await callGetProfile();
            if (res?.data) {
                setUserData(res.data);
                // Parse address from JSON string
                let addressObj = {
                    city: '',
                    district: '',
                    ward: '',
                    detail: ''
                };
                if (res.data.address) {
                    try {
                        const parsedAddress = JSON.parse(res.data.address.replace(/\\"/g, '"'));
                        addressObj = {
                            city: parsedAddress.city,
                            district: parsedAddress.district,
                            ward: parsedAddress.ward,
                            detail: parsedAddress.detail
                        };
                    } catch (error) {
                        console.error('Error parsing address:', error);
                    }
                }
                // Ánh xạ name -> code để fetch danh sách và set code vào form
                const fetchAll = async () => {
                    // Fetch cities
                    const citiesRes = await fetch('https://provinces.open-api.vn/api/');
                    const citiesData = await citiesRes.json();
                    setCities(citiesData);
                    const cityObj = citiesData.find((c: any) => c.name === addressObj.city);
                    if (cityObj) {
                        setSelectedCity(cityObj.code);
                        form.setFieldValue('city', cityObj.code); // set code vào form
                        // Fetch districts
                        const districtsRes = await fetch(`https://provinces.open-api.vn/api/p/${cityObj.code}?depth=2`);
                        const districtsData = await districtsRes.json();
                        setDistricts(districtsData.districts);
                        const districtObj = districtsData.districts.find((d: any) => d.name === addressObj.district);
                        if (districtObj) {
                            setSelectedDistrict(districtObj.code);
                            form.setFieldValue('district', districtObj.code); // set code vào form
                            // Fetch wards
                            const wardsRes = await fetch(`https://provinces.open-api.vn/api/d/${districtObj.code}?depth=2`);
                            const wardsData = await wardsRes.json();
                            setWards(wardsData.wards);
                            const wardObj = wardsData.wards.find((w: any) => w.name === addressObj.ward);
                            if (wardObj) {
                                form.setFieldValue('ward', wardObj.code); // set code vào form
                            }
                        }
                    }
                    // Set các trường còn lại
                    if (res.data) {
                        form.setFieldsValue({
                            name: res.data.name,
                            email: res.data.email,
                            age: res.data.age,
                            gender: res.data.gender,
                            employeeType: res.data.employeeType,
                            department: res.data.department?.name,
                            detail: addressObj.detail
                        });
                    }
                };
                fetchAll();
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải thông tin người dùng');
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch('https://provinces.open-api.vn/api/');
                const data = await response.json();
                setCities(data);

                // If we have userData with address, find the city code
                if (userData?.address) {
                    try {
                        const addressObj = JSON.parse(userData.address.replace(/\\"/g, '"'));
                        const cityData = data.find((city: any) => city.name === addressObj.city);
                        if (cityData) {
                            handleCityChange(cityData.code);
                        }
                    } catch (error) {
                        console.error('Error parsing address:', error);
                    }
                }
            } catch (error) {
                message.error('Có lỗi xảy ra khi tải danh sách tỉnh/thành phố');
            }
        };
        fetchCities();
    }, [userData]);

    const fetchDistrictsByCity = async (cityCode: string) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts);
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải danh sách quận/huyện');
        }
    };

    const fetchWardsByDistrict = async (districtCode: string) => {
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await response.json();
            setWards(data.wards);
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải danh sách phường/xã');
        }
    };

    const handleCityChange = async (value: string) => {
        setSelectedCity(value);
        setSelectedDistrict('');
        setWards([]);
        form.setFieldsValue({ district: undefined, ward: undefined });
        fetchDistrictsByCity(value);
    };

    const handleDistrictChange = async (value: string) => {
        setSelectedDistrict(value);
        setWards([]);
        form.setFieldsValue({ ward: undefined });
        fetchWardsByDistrict(value);
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            const cityObj = cities.find((c: any) => c.code === values.city);
            const districtObj = districts.find((d: any) => d.code === values.district);
            const wardObj = wards.find((w: any) => w.code === values.ward);
            const address = {
                city: cityObj?.name || '',
                district: districtObj?.name || '',
                ward: wardObj?.name || '',
                detail: values.detail
            };
            const res = await callUpdateUser(user._id, {
                ...values,
                address: JSON.stringify(address)
            });
            if (res?.data) {
                message.success('Cập nhật thông tin thành công');
                setIsEditing(false);
                // Gọi lại fetchUserData để ánh xạ lại code cho form
                await fetchUserData();
            }
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        form.setFieldsValue({
            name: userData?.name,
            email: userData?.email,
            age: userData?.age,
            gender: userData?.gender,
            address: userData?.address
        });
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card bordered={false}>
                <Row gutter={[24, 24]}>
                    {/* Cột trái - Avatar và thông tin cơ bản */}
                    <Col xs={24} md={8}>
                        <div style={{ textAlign: 'center' }}>
                            <Avatar
                                size={200}
                                src={userData?.image ? `${import.meta.env.VITE_BACKEND_URL}/images/user/${userData.image}` : null}
                                icon={!userData?.image && <UserOutlined />}
                                style={{
                                    border: '4px solid #fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            />
                            <Title level={3} style={{ marginTop: '16px', marginBottom: '4px' }}>
                                {userData?.name}
                            </Title>
                            <Text type="secondary">{userData?.role?.name}</Text>
                        </div>
                    </Col>

                    {/* Cột phải - Form thông tin */}
                    <Col xs={24} md={16}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <Title level={4} style={{ margin: 0 }}>Thông tin cá nhân</Title>
                            {isEditing ? (
                                <Space>
                                    <Button
                                        type="default"
                                        icon={<CloseOutlined />}
                                        onClick={handleCancel}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={() => form.submit()}
                                        loading={loading}
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </Space>
                            ) : (
                                <Button
                                    type="default"
                                    icon={<EditOutlined />}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Chỉnh sửa
                                </Button>
                            )}
                        </div>
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{
                                name: userData?.name,
                                email: userData?.email,
                                age: userData?.age,
                                gender: userData?.gender,
                                address: userData?.address
                            }}
                            onFinish={handleSubmit}
                        >
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="name"
                                        label="Họ tên"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                    >
                                        <Input disabled={!isEditing} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                    >
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="age"
                                        label="Tuổi"
                                        rules={[{ required: true, message: 'Vui lòng nhập tuổi' }]}
                                    >
                                        <Input type="number" disabled={!isEditing} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="gender"
                                        label="Giới tính"
                                        rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                                    >
                                        <Select disabled={!isEditing}>
                                            <Option value="MALE">Nam</Option>
                                            <Option value="FEMALE">Nữ</Option>
                                            <Option value="OTHER">Khác</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="employeeType"
                                        label="Loại nhân viên"
                                    >
                                        <Select disabled>
                                            <Option value="official">Chính thức</Option>
                                            <Option value="contract">Hợp đồng</Option>
                                            <Option value="intern">Thực tập</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="department"
                                        label="Phòng ban"
                                    >
                                        <Input type="string" disabled />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={24}>
                                    <Form.Item
                                        name="city"
                                        label="Tỉnh/Thành phố"
                                        rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                                    >
                                        <Select
                                            disabled={!isEditing}
                                            onChange={handleCityChange}
                                            placeholder="Chọn tỉnh/thành phố"
                                        >
                                            {cities.map(city => (
                                                <Option key={city.code} value={city.code}>
                                                    {city.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="district"
                                        label="Quận/Huyện"
                                        rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
                                    >
                                        <Select
                                            disabled={!isEditing || !selectedCity}
                                            onChange={handleDistrictChange}
                                            placeholder="Chọn quận/huyện"
                                        >
                                            {districts.map(district => (
                                                <Option key={district.code} value={district.code}>
                                                    {district.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="ward"
                                        label="Phường/Xã"
                                        rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                                    >
                                        <Select
                                            disabled={!isEditing || !selectedDistrict}
                                            placeholder="Chọn phường/xã"
                                        >
                                            {wards.map(ward => (
                                                <Option key={ward.code} value={ward.code}>
                                                    {ward.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={24}>
                                    <Form.Item
                                        name="detail"
                                        label="Địa chỉ chi tiết"
                                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết' }]}
                                    >
                                        <Input disabled={!isEditing} placeholder="Số nhà, tên đường..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>

                        <Divider />

                        {/* Thông tin khác */}
                        <Title level={4}>Thông tin khác</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Text type="secondary">Vai trò:</Text>
                                <div>{userData?.role?.name}</div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default ProfilePage; 