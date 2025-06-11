import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic, Button, DatePicker, Select, message, Tag, Space, Modal, Form, Input, InputNumber } from 'antd';
import { DollarOutlined, UserOutlined, ClockCircleOutlined, EditOutlined, CheckOutlined, CloseOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { callGetSalary, callGetMySalary, callCreateSalary, callUpdateSalaryStatus, callUpdateSalary, callCreateSalaryForAll } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { MonthPicker } = DatePicker;

const SalaryPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [salaryData, setSalaryData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState<any>(null);
    const [form] = Form.useForm();
    const user = useAppSelector(state => state.account.user);
    const [searchCode, setSearchCode] = useState('');

    const fetchSalaryData = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: pageSize,
                ...(searchCode ? { employeeCode: searchCode } : {}),
                month: selectedMonth.month() + 1,
                year: selectedMonth.year()
            };
            const response = user?.role?.name === 'SUPER_ADMIN'
                ? await callGetSalary(params)
                : await callGetMySalary(params);

            if (response.data && Array.isArray(response.data.data)) {
                setSalaryData(response.data.data);
                setTotal(response.data.meta?.total || 0);
            } else {
                setSalaryData([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Error fetching salary data:', error);
            message.error('Có lỗi khi lấy dữ liệu bảng lương');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalaryData();
    }, [currentPage, pageSize, selectedMonth, searchCode]);

    // const handleCalculateSalary = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await callCreateSalary({
    //             userId: user._id,
    //             month: selectedMonth.month() + 1,
    //             year: selectedMonth.year()
    //         });

    //         if (response.data) {
    //             message.success('Tạo bảng lương thành công');
    //             fetchSalaryData();
    //         }
    //     } catch (error) {
    //         console.error('Error calculating salary:', error);
    //         message.error('Có lỗi khi tạo bảng lương');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const showModal = (salary: any) => {
        setSelectedSalary(salary);
        form.setFieldsValue({
            bonus: salary.bonus,
            deduction: salary.deduction,
            note: salary.note
        });
        setIsModalVisible(true);
    };

    const handleUpdateSalary = async (values: any) => {
        try {
            setLoading(true);
            const response = await callUpdateSalary(selectedSalary._id, values);

            if (response.data) {
                message.success('Cập nhật lương thành công');
                setIsModalVisible(false);
                fetchSalaryData();
            }
        } catch (error) {
            console.error('Error updating salary:', error);
            message.error('Có lỗi khi cập nhật lương');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateForAll = async () => {
        try {
            setLoading(true);
            const response = await callCreateSalaryForAll(
                selectedMonth.month() + 1,
                selectedMonth.year()
            );

            if (response.data.success === true) {
                message.success(response.data.message);
                fetchSalaryData();
            }
            else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error creating salary for all:', error);
        } finally {
            setLoading(false);
        }
    };

    // Export Excel
    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(salaryData.map(item => ({
            'Mã NV': item.userId?.employeeCode || '',
            'Tên NV': item.userId?.name || '',
            'Lương cơ bản': item.baseSalary,
            'Lương tăng ca': item.overtimePay,
            'Phụ cấp': item.allowance,
            'Thưởng': item.bonus,
            'Khấu trừ': item.deduction,
            'Thực lĩnh': item.totalSalary
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Salaries');
        XLSX.writeFile(wb, 'salaries.xlsx');
    };

    // Export PDF
    // const handleExportPDF = () => {
    //     const doc = new jsPDF();
    //     doc.text('Bảng lương', 14, 16);
    //     // @ts-ignore
    //     doc.autoTable({
    //         head: [[
    //             'Mã NV', 'Tên NV', 'Lương cơ bản', 'Lương tăng ca', 'Phụ cấp', 'Thưởng', 'Khấu trừ', 'Thực lĩnh'
    //         ]],
    //         body: salaryData.map(item => [
    //             item.userId?.employeeCode || '',
    //             item.userId?.name || '',
    //             item.baseSalary,
    //             item.overtimePay,
    //             item.allowance,
    //             item.bonus,
    //             item.deduction,
    //             item.totalSalary
    //         ]),
    //         startY: 22,
    //     });
    //     doc.save('salaries.pdf');
    // };

    const columns = [
        {
            title: 'Mã NV',
            dataIndex: ['userId', 'employeeCode'],
            key: 'employeeCode',
        },
        {
            title: 'Nhân viên',
            dataIndex: ['userId', 'name'],
            key: 'employee',
        },
        {
            title: 'Lương cơ bản',
            dataIndex: 'baseSalary',
            key: 'baseSalary',
            render: (salary: number) => `${salary.toLocaleString()}₫`,
        },
        {
            title: 'Lương tăng ca',
            dataIndex: 'overtimePay',
            key: 'overtimePay',
            render: (pay: number) => `${pay.toLocaleString()}₫`,
        },
        {
            title: 'Phụ cấp',
            dataIndex: 'allowance',
            key: 'allowance',
            render: (allowance: number) => `${allowance.toLocaleString()}₫`,
        },
        {
            title: 'Thưởng',
            dataIndex: 'bonus',
            key: 'bonus',
            render: (bonus: number) => `${bonus.toLocaleString()}₫`,
        },
        {
            title: 'Khấu trừ',
            dataIndex: 'deduction',
            key: 'deduction',
            render: (deduction: number) => `${deduction.toLocaleString()}₫`,
        },
        {
            title: 'Thực lĩnh',
            dataIndex: 'totalSalary',
            key: 'totalSalary',
            render: (salary: number) => (
                <Tag color="green" style={{ fontSize: '16px' }}>
                    {salary.toLocaleString()}₫
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: unknown, record: any) => (
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => showModal(record)}
                />
            ),
        },
    ];

    const calculateTotals = () => {
        return salaryData.reduce((acc, curr) => ({
            baseSalary: acc.baseSalary + (curr.baseSalary || 0),
            overtimePay: acc.overtimePay + (curr.overtimePay || 0),
            allowance: acc.allowance + (curr.allowance || 0),
            bonus: acc.bonus + (curr.bonus || 0),
            deduction: acc.deduction + (curr.deduction || 0),
            totalSalary: acc.totalSalary + (curr.totalSalary || 0),
        }), {
            baseSalary: 0,
            overtimePay: 0,
            allowance: 0,
            bonus: 0,
            deduction: 0,
            totalSalary: 0,
        });
    };

    const totals = calculateTotals();

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng lương cơ bản"
                            value={totals.baseSalary}
                            suffix="₫"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng lương tăng ca"
                            value={totals.overtimePay}
                            suffix="₫"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng phụ cấp"
                            value={totals.allowance}
                            suffix="₫"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng thực lĩnh"
                            value={totals.totalSalary}
                            suffix="₫"
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
                <Space>
                    <MonthPicker
                        value={selectedMonth}
                        onChange={date => date && setSelectedMonth(date)}
                        format="MM/YYYY"
                        placeholder="Chọn tháng/năm"
                    />
                    <Input.Search
                        placeholder="Nhập mã nhân viên"
                        allowClear
                        value={searchCode}
                        onChange={e => setSearchCode(e.target.value)}
                        onSearch={() => fetchSalaryData()}
                        style={{ width: 200 }}
                    />
                    <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                        Xuất Excel
                    </Button>
                    {/* <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                        Xuất PDF
                    </Button> */}
                    <Button
                        type="primary"
                        onClick={handleCreateForAll}
                        loading={loading}
                    >
                        Tạo bảng lương
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={Array.isArray(salaryData) ? salaryData : []}
                rowKey="_id"
                loading={loading}
                locale={{ emptyText: 'Trống' }}
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                summary={() => (
                    <Table.Summary fixed>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0}>Tổng</Table.Summary.Cell>
                            <Table.Summary.Cell index={1}></Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>{totals.baseSalary.toLocaleString()}₫</Table.Summary.Cell>
                            <Table.Summary.Cell index={3}>{totals.overtimePay.toLocaleString()}₫</Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>{totals.allowance.toLocaleString()}₫</Table.Summary.Cell>
                            <Table.Summary.Cell index={5}>{totals.bonus.toLocaleString()}₫</Table.Summary.Cell>
                            <Table.Summary.Cell index={6}>{totals.deduction.toLocaleString()}₫</Table.Summary.Cell>
                            <Table.Summary.Cell index={7}>
                                <Tag color="green" style={{ fontSize: '16px' }}>
                                    {totals.totalSalary.toLocaleString()}₫
                                </Tag>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={8} />
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />

            <Modal
                title="Cập nhật thông tin lương"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateSalary}
                >
                    <Form.Item
                        name="bonus"
                        label="Thưởng"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={(value: string | number | undefined) =>
                                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                            }
                            parser={(value: string | undefined) =>
                                value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0
                            }
                            min={0}
                        />
                    </Form.Item>
                    <Form.Item
                        name="deduction"
                        label="Khấu trừ"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={(value: string | number | undefined) =>
                                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                            }
                            parser={(value: string | undefined) =>
                                value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0
                            }
                            min={0}
                        />
                    </Form.Item>
                    <Form.Item
                        name="note"
                        label="Ghi chú"
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Cập nhật
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SalaryPage; 