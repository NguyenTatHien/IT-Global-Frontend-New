import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { Button, Space, Modal, Form, Input, DatePicker, message, Popconfirm, Select, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { callCreateUserShift, callDeleteUserShift, callGetUserShifts, callUpdateUserShift, callGetUsers, callGetShifts, callGetUserShiftById } from '@/config/api';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { ProTable } from '@ant-design/pro-components';
import { ActionType, ProColumns } from '@ant-design/pro-components';

interface IShift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
}

interface IUserShift {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        employeeType: string;
    };
    shiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
    date: string;
    status: 'active' | 'inactive' | 'pending';
    createdAt?: string;
    updatedAt?: string;
}

interface Meta {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

interface QueryParams {
    current?: number;
    pageSize?: number;
    filter?: {
        userId?: { name?: string };
        shiftId?: { name?: string };
        date?: string;
        status?: string;
    };
    sort?: Record<string, 1 | -1>;
}

interface QueryObject {
    'userId.name'?: string;
    'shiftId.name'?: string;
    date?: string;
    status?: string;
    sort?: Record<string, 1 | -1>;
    page: number;
    limit: number;
}

const UserShiftManagement: React.FC = () => {
    const [userShifts, setUserShifts] = useState<IUserShift[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearchCollapsed, setIsSearchCollapsed] = useState<boolean>(true);
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
    const [editData, setEditData] = useState<any>(null);
    const [meta, setMeta] = useState<Meta>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0
    });

    const tableRef = useRef<ActionType>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/face-id-login');
        }
        fetchUsersAndShifts();
    }, [isAuthenticated]);

    const fetchUsersAndShifts = async () => {
        try {
            setLoading(true);
            const [usersRes, shiftsRes] = await Promise.all([
                callGetUsers('current=1&pageSize=100'),
                callGetShifts('current=1&pageSize=100')
            ]);

            if (usersRes?.data?.result) {
                const userOptions = usersRes.data.result
                    .filter((user: any) => user.employeeType !== 'intern')
                    .map((user: any) => ({
                        label: `${user.name} (${user.email})${user.employeeType === 'official' ? ' - Nhân viên chính thức' :
                            user.employeeType === 'contract' ? ' - Nhân viên hợp đồng' : ''}`,
                        value: user._id,
                        employeeType: user.employeeType
                    }));
                setUsers(userOptions);
            }

            if (shiftsRes?.data?.result) {
                const shiftOptions = shiftsRes.data.result
                    .filter((shift: any) => shift.status === "active")
                    .map((shift: any) => ({
                        label: `${shift.name} (${shift.startTime}-${shift.endTime})`,
                        value: shift._id
                    }));
                setShifts(shiftOptions);
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditData(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = async (record: IUserShift) => {
        try {
            setLoading(true);
            const res = await callGetUserShiftById(record._id);
            if (res?.data) {
                setEditData(res.data);
                form.setFieldsValue({
                    userId: res.data.userId?._id,
                    shiftId: res.data.shiftId?._id,
                    date: dayjs(res.data.date),
                    status: res.data.status
                });
                setIsModalOpen(true);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải thông tin phân ca');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await callDeleteUserShift(id);
            if (res && res.data) {
                message.success('Xóa phân ca thành công');
                reloadTable();
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi xóa phân ca');
        }
    };

    const handleSubmit = async (values: any) => {
        setIsModalLoading(true);
        try {
            const { date, ...rest } = values;

            // Kiểm tra loại nhân viên và ngày được chọn
            const selectedUser = users.find(user => user.value === rest.userId);
            if (selectedUser?.employeeType === 'official') {
                const selectedDate = date.day();
                if (selectedDate === 0 || selectedDate === 6) {
                    message.error('Nhân viên chính thức chỉ được phân ca từ thứ 2 đến thứ 6');
                    setIsModalLoading(false);
                    return;
                }
            }

            // Format date to YYYY-MM-DD format
            const formatData = {
                userId: rest.userId,
                shiftId: rest.shiftId,
                date: date.format('YYYY-MM-DD'),
                status: rest.status || 'active'
            };

            let response;
            if (editData?._id) {
                response = await callUpdateUserShift(editData._id, formatData);
                if (response?.data?.statusCode === 200) {
                    message.success(response.data.message || 'Cập nhật phân ca thành công');
                    setIsModalOpen(false);
                    form.resetFields();
                    await reloadTable();
                } else {
                    throw new Error(response?.data?.message || 'Có lỗi xảy ra khi cập nhật phân ca');
                }
            } else {
                response = await callCreateUserShift(formatData);
                if (response?.data?.statusCode === 200) {
                    message.success(response.data.message || 'Thêm phân ca thành công');
                    setIsModalOpen(false);
                    form.resetFields();
                    await reloadTable();
                } else {
                    throw new Error(response?.data?.message || 'Có lỗi xảy ra khi thêm phân ca');
                }
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu phân ca');
        } finally {
            setIsModalLoading(false);
        }
    };

    const reloadTable = async () => {
        try {
            await tableRef?.current?.reload();
            const res = await callGetUserShifts(buildQuery({}));
            if (res?.data?.result) {
                setUserShifts(res.data.result);
            }
        } catch (error) {
            // Error handling without console.log
        }
    };

    const buildQuery = (params: QueryParams) => {
        const { current, pageSize, filter, sort } = params;
        const query: QueryObject = {
            page: current || 1,
            limit: pageSize || 10
        };

        // Handle search filters
        if (filter) {
            if (filter.userId?.name) {
                query['userId.name'] = filter.userId.name;
            }
            if (filter.shiftId?.name) {
                query['shiftId.name'] = filter.shiftId.name;
            }
            if (filter.date) {
                query.date = filter.date;
            }
            if (filter.status) {
                query.status = filter.status;
            }
        }

        // Handle sorting
        if (sort) {
            query.sort = sort;
        } else {
            query.sort = { createdAt: -1 };
        }

        const searchParams = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            searchParams.append(key, JSON.stringify(value));
        });

        return searchParams.toString();
    };

    const statusOptions = [
        { label: 'Đang hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' },
        { label: 'Chờ xử lý', value: 'pending' }
    ];

    const getStatusColor = (status: string, date: string) => {
        const shiftDate = dayjs(date).startOf('day');
        const today = dayjs().startOf('day');

        // Nếu ngày phân ca đã qua
        if (shiftDate.isBefore(today)) {
            return 'red';
        }

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

    const getStatusText = (status: string, date: string) => {
        const shiftDate = dayjs(date).startOf('day');
        const today = dayjs().startOf('day');

        // Nếu ngày phân ca đã qua
        if (shiftDate.isBefore(today)) {
            return 'Ngừng hoạt động';
        }

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

    const columns: ProColumns<IUserShift>[] = [
        {
            title: 'Nhân viên',
            dataIndex: ['userId', 'name'],
            key: 'userId',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <div>{record.userId?.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.userId?.email}</div>
                </Space>
            )
        },
        {
            title: 'Ca làm việc',
            dataIndex: ['shiftId', 'name'],
            key: 'shiftId',
            sorter: true,
            render: (_: any, record: IUserShift) => record.shiftId?.name || '-'
        },
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
            sorter: true,
            render: (_: any, record: IUserShift) => dayjs(record.date).format('DD/MM/YYYY'),
            renderFormItem: () => (
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            render: (_: any, record: IUserShift) => (
                <Tag color={getStatusColor(record.status, record.date)}>
                    {getStatusText(record.status, record.date)}
                </Tag>
            ),
            renderFormItem: () => (
                <Select
                    placeholder="Chọn trạng thái"
                    options={statusOptions}
                />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            hideInSearch: true,
            width: 50,
            render: (_: any, record: IUserShift) => (
                <Space>
                    <EditOutlined
                        style={{
                            fontSize: 20,
                            color: '#ffa500',
                        }}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        placement="topLeft"
                        title="Xác nhận xóa phân ca này?"
                        description="Bạn có chắc chắn muốn xóa phân ca này không?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <DeleteOutlined
                            style={{
                                fontSize: 20,
                                color: '#ff0000',
                            }}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const toolBarRender = (): ReactNode[] => {
        return [
            <Button
                key="add"
                icon={<PlusOutlined />}
                type="primary"
                onClick={handleAdd}
            >
                Thêm mới
            </Button>
        ];
    };

    const request = async (params: {
        current?: number;
        pageSize?: number;
        filter?: Record<string, any>;
        sort?: Record<string, any>;
    }) => {
        setLoading(true);
        try {
            const qs = buildQuery(params);
            const response = await callGetUserShifts(qs);
            if (response?.data?.result) {
                setUserShifts(response.data.result);
                if (response.meta) {
                    setMeta(response.meta);
                }
                return {
                    data: response.data.result,
                    success: true,
                    total: response.meta?.totalItems || 0
                };
            }
            return {
                data: [],
                success: true,
                total: 0
            };
        } catch (error) {
            // Error handling without console.log
            return {
                data: [],
                success: false,
                total: 0
            };
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ProTable<IUserShift>
                actionRef={tableRef}
                headerTitle="Danh sách phân ca nhân viên"
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={userShifts}
                search={{
                    labelWidth: 'auto',
                    defaultCollapsed: true,
                    layout: 'vertical',
                    span: {
                        xs: 24,
                        sm: 12,
                        md: 8,
                        lg: 6,
                        xl: 6,
                        xxl: 6
                    },
                }}
                request={request}
                pagination={{
                    current: meta?.currentPage || 1,
                    pageSize: meta?.itemsPerPage || 10,
                    total: meta?.totalItems || 0,
                }}
                toolBarRender={toolBarRender}
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title={editData?._id ? "Cập nhật phân ca" : "Thêm mới phân ca"}
                open={isModalOpen}
                onOk={() => {
                    form.submit();
                }}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditData(null);
                    form.resetFields();
                }}
                confirmLoading={isModalLoading}
                maskClosable={false}
            >
                <Form
                    name="basic"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    onFinish={handleSubmit}
                    autoComplete="off"
                    form={form}
                >
                    <Form.Item
                        label="Nhân viên"
                        name="userId"
                        rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Chọn nhân viên"
                            optionFilterProp="children"
                            options={users}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Ca làm việc"
                        name="shiftId"
                        rules={[{ required: true, message: 'Vui lòng chọn ca làm việc!' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Chọn ca làm việc"
                            optionFilterProp="children"
                            options={shifts}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Ngày"
                        name="date"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="status"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                        initialValue="active"
                    >
                        <Select options={statusOptions} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserShiftManagement; 