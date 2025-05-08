import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic, Button, DatePicker, Select, message, Tag, Space } from 'antd';
import { DollarOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { callGetPayroll, callGetMyPayroll, callGeneratePayroll } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import dayjs from 'dayjs';

const { MonthPicker } = DatePicker;

const PayrollPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [payrollData, setPayrollData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const user = useAppSelector(state => state.account.user);

    const fetchPayrollData = async () => {
        try {
            setLoading(true);
            const query = `current=${currentPage}&pageSize=${pageSize}&month=${selectedMonth.month() + 1}&year=${selectedMonth.year()}`;
            const response = user?.role?.name === 'SUPER_ADMIN'
                ? await callGetPayroll(query)
                : await callGetMyPayroll(query);

            if (response.data) {
                setPayrollData(response.data.result);
                setTotal(response.data.meta.total);
            }
        } catch (error) {
            console.error('Error fetching payroll data:', error);
            message.error('Có lỗi khi lấy dữ liệu bảng lương');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrollData();
    }, [currentPage, pageSize, selectedMonth]);

    const handleGeneratePayroll = async () => {
        try {
            setLoading(true);
            const response = await callGeneratePayroll({
                month: selectedMonth.month() + 1,
                year: selectedMonth.year()
            });

            if (response.data) {
                message.success('Tạo bảng lương thành công');
                fetchPayrollData(); 0
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            message.error('Có lỗi khi tạo bảng lương');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: ['user', 'name'],
            key: 'employee',
        },
        {
            title: 'Phòng ban',
            dataIndex: ['user', 'department', 'name'],
            key: 'department',
        },
        {
            title: 'Lương cơ bản',
            dataIndex: 'basicSalary',
            key: 'basicSalary',
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
            dataIndex: 'allowances',
            key: 'allowances',
            render: (allowances: number) => `${allowances.toLocaleString()}₫`,
        },
        {
            title: 'Khấu trừ',
            dataIndex: 'deductions',
            key: 'deductions',
            render: (deductions: number) => `${deductions.toLocaleString()}₫`,
        },
        {
            title: 'Thực lĩnh',
            dataIndex: 'netSalary',
            key: 'netSalary',
            render: (salary: number) => (
                <Tag color="green" style={{ fontSize: '16px' }}>
                    {salary.toLocaleString()}₫
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={
                    status === 'paid' ? 'green' :
                        status === 'pending' ? 'gold' : 'red'
                }>
                    {status === 'paid' ? 'Đã chi' : status === 'pending' ? 'Chờ duyệt' : status === 'rejected' ? 'Từ chối' : 'Đã duyệt'}
                </Tag>
            ),
        },
    ];

    const calculateTotals = () => {
        return payrollData.reduce((acc, curr) => ({
            basicSalary: acc.basicSalary + (curr.basicSalary || 0),
            overtimePay: acc.overtimePay + (curr.overtimePay || 0),
            allowances: acc.allowances + (curr.allowances || 0),
            deductions: acc.deductions + (curr.deductions || 0),
            netSalary: acc.netSalary + (curr.netSalary || 0),
        }), {
            basicSalary: 0,
            overtimePay: 0,
            allowances: 0,
            deductions: 0,
            netSalary: 0,
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
                            value={totals.basicSalary}
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
                            value={totals.allowances}
                            suffix="₫"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng thực lĩnh"
                            value={totals.netSalary}
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
                        onChange={(date) => date && setSelectedMonth(date)}
                        format="MM/YYYY"
                        placeholder="Chọn tháng/năm"
                    />
                    {user?.role?.name === 'SUPER_ADMIN' && (
                        <Button
                            type="primary"
                            onClick={handleGeneratePayroll}
                            loading={loading}
                        >
                            Tạo bảng lương
                        </Button>
                    )}
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={payrollData}
                rowKey="_id"
                loading={loading}
                locale={{ emptyText: 'Trống' }}
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
                            <Table.Summary.Cell index={0} colSpan={2}>
                                Tổng
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>
                                {totals.basicSalary.toLocaleString()}₫
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3}>
                                {totals.overtimePay.toLocaleString()}₫
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                                {totals.allowances.toLocaleString()}₫
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5}>
                                {totals.deductions.toLocaleString()}₫
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={6}>
                                <Tag color="green" style={{ fontSize: '16px' }}>
                                    {totals.netSalary.toLocaleString()}₫
                                </Tag>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={7} />
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />
        </div>
    );
};

export default PayrollPage; 