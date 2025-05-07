import React, { useEffect, useState } from 'react';
import { Form, Select, Input, Col, message } from 'antd';
import { FormInstance } from 'antd/lib/form';

const { Option } = Select;

interface IAddressFormProps {
    disabled?: boolean;
    form: FormInstance;
    initialAddress?: string;
}

export interface IAddress {
    city: string;
    district: string;
    ward: string;
    detail: string;
}

export interface ILocation {
    code: string;
    name: string;
}

const AddressForm: React.FC<IAddressFormProps> = ({ disabled = false, form, initialAddress }) => {
    const [cities, setCities] = useState<ILocation[]>([]);
    const [districts, setDistricts] = useState<ILocation[]>([]);
    const [wards, setWards] = useState<ILocation[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [cityName, setCityName] = useState<string>('');
    const [districtName, setDistrictName] = useState<string>('');
    const [wardName, setWardName] = useState<string>('');
    const [isLegacyAddress, setIsLegacyAddress] = useState<boolean>(false);

    // Fetch cities khi component mount
    useEffect(() => {
        fetchCities();
    }, []);

    // Xử lý initialAddress khi có dữ liệu
    useEffect(() => {
        const initializeAddress = async () => {
            if (initialAddress) {
                try {
                    // Thử parse như JSON
                    const addressObj = JSON.parse(initialAddress);
                    if (addressObj && typeof addressObj === 'object') {
                        setIsLegacyAddress(false);

                        // Fetch cities first
                        const citiesData = await fetchCities();
                        let cityCode = addressObj.city;
                        let districtCode = addressObj.district;
                        let wardCode = addressObj.ward;

                        // Nếu city là name, ánh xạ sang code
                        if (citiesData && citiesData.length && !citiesData.find((c: ILocation) => c.code === addressObj.city)) {
                            const foundCity = citiesData.find((c: ILocation) => c.name === addressObj.city);
                            if (foundCity) {
                                cityCode = foundCity.code;
                            }
                        }
                        setSelectedCity(cityCode);
                        form.setFieldValue('city', addressObj.city); // vẫn set name vào form

                        // Fetch districts
                        if (cityCode) {
                            const districtResponse = await fetch(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
                            const districtData = await districtResponse.json();
                            setDistricts(districtData.districts);
                            setCityName(districtData.name);

                            // Nếu district là name, ánh xạ sang code
                            if (districtData.districts && districtData.districts.length && !districtData.districts.find((d: ILocation) => d.code === addressObj.district)) {
                                const foundDistrict = districtData.districts.find((d: ILocation) => d.name === addressObj.district);
                                if (foundDistrict) {
                                    districtCode = foundDistrict.code;
                                }
                            }
                            setSelectedDistrict(districtCode);
                            form.setFieldValue('district', addressObj.district); // vẫn set name vào form

                            // Fetch wards
                            if (districtCode) {
                                const wardResponse = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
                                const wardData = await wardResponse.json();
                                setWards(wardData.wards);
                                setDistrictName(wardData.name);

                                // Nếu ward là name, ánh xạ sang code
                                if (wardData.wards && wardData.wards.length && !wardData.wards.find((w: ILocation) => w.code === addressObj.ward)) {
                                    const foundWard = wardData.wards.find((w: ILocation) => w.name === addressObj.ward);
                                    if (foundWard) {
                                        wardCode = foundWard.code;
                                    }
                                }
                                form.setFieldValue('ward', addressObj.ward); // vẫn set name vào form
                            }
                        }
                        if (addressObj.detail) {
                            form.setFieldValue('detail', addressObj.detail);
                        }
                    } else {
                        setIsLegacyAddress(true);
                        form.setFieldValue('detail', initialAddress);
                    }
                } catch (error) {
                    // Nếu không parse được JSON, xử lý như địa chỉ cũ
                    setIsLegacyAddress(true);
                    form.setFieldValue('detail', initialAddress);
                }
            }
        };
        initializeAddress();
    }, [initialAddress, form]);

    const fetchCities = async () => {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setCities(data);
            return data;
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải danh sách tỉnh/thành phố');
            return [];
        }
    };

    const handleCityChange = async (value: string) => {
        setSelectedCity(value);
        setSelectedDistrict('');
        setWards([]);
        form.setFieldsValue({ district: undefined, ward: undefined });

        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${value}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts);
            setCityName(data.name);

            form.setFieldValue('city', data.name);
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải danh sách quận/huyện');
        }
    };

    const handleDistrictChange = async (value: string) => {
        setSelectedDistrict(value);
        setWards([]);
        form.setFieldsValue({ ward: undefined });

        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${value}?depth=2`);
            const data = await response.json();
            setWards(data.wards);
            setDistrictName(data.name);

            form.setFieldValue('district', data.name);
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải danh sách phường/xã');
        }
    };

    const handleWardChange = (value: string) => {
        const selectedWard = wards.find(w => w.code === value);
        if (selectedWard) {
            setWardName(selectedWard.name);
        }

        form.setFieldValue('ward', selectedWard?.name);
    };

    return (
        <>
            {!isLegacyAddress ? (
                <>
                    <Col xs={24} md={24}>
                        <Form.Item
                            name="city"
                            label="Tỉnh/Thành phố"
                            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                        >
                            <Select
                                disabled={disabled}
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
                                disabled={disabled || !selectedCity}
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
                                disabled={disabled || !selectedDistrict}
                                placeholder="Chọn phường/xã"
                                onChange={handleWardChange}
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
                            <Input disabled={disabled} placeholder="Số nhà, tên đường..." />
                        </Form.Item>
                    </Col>
                    {(cityName || districtName || wardName) && (
                        <Col xs={24} md={24}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Địa chỉ đầy đủ: </strong>
                                {[form.getFieldValue('detail'), wardName, districtName, cityName]
                                    .filter(Boolean)
                                    .join(', ')}
                            </div>
                        </Col>
                    )}
                </>
            ) : (
                <Col xs={24} md={24}>
                    <div style={{ marginBottom: '1rem', color: '#ff4d4f' }}>
                        <strong>Lưu ý: </strong>
                        Địa chỉ này đang ở định dạng cũ. Sau khi cập nhật, địa chỉ sẽ được chuyển sang định dạng mới.
                    </div>
                    <Form.Item
                        name="detail"
                        label="Địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <Input.TextArea
                            disabled={disabled}
                            placeholder="Nhập địa chỉ đầy đủ"
                            rows={3}
                        />
                    </Form.Item>
                </Col>
            )}
        </>
    );
};

export default AddressForm; 