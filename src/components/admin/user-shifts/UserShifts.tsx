import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Modal, Form, Input, DatePicker, message, Popconfirm, Select, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { callCreateUserShift, callDeleteUserShift, callGetUserShifts, callUpdateUserShift, callGetUsers, callGetShifts } from '@/config/api';
import dayjs from 'dayjs';
import { IBackendRes, IModelPaginate, IUser } from '@/types/backend';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/share/data-table';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import queryString from 'query-string';

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

const UserShiftManagement: React.FC = () => {
    const [userShifts, setUserShifts] = useState<IUserShift[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
    const [editData, setEditData] = useState<any>(null);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        pages: 0
    });

    const tableRef = useRef<ActionType>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
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
                const userOptions = usersRes.data.result.map((user: any) => ({
                    label: `${user.name} (${user.email})`,
                    value: user._id
                }));
                setUsers(userOptions);
            }

            if (shiftsRes?.data?.result) {
                const shiftOptions = shiftsRes.data.result.map((shift: any) => ({
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

    const handleEdit = (record: IUserShift) => {
        setEditData(record);
        form.setFieldsValue({
            userId: record.userId?._id,
            shiftId: record.shiftId?._id,
            date: dayjs(record.date),
            status: record.status
        });
        setIsModalOpen(true);
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
            console.log('Form values:', values);
            const { date, ...rest } = values;
            
            // Format date to YYYY-MM-DD format
            const formatData = {
                userId: rest.userId,
                shiftId: rest.shiftId,
                date: date.format('YYYY-MM-DD'),
                status: rest.status
            };
            console.log('Formatted data:', formatData);

            let response;
            if (editData?._id) {
                console.log('Updating user shift:', editData._id);
                response = await callUpdateUserShift(editData._id, formatData);
                console.log('Update response:', response);
                
                if (response?.data?.statusCode === 200) {
                    message.success(response.data.message || 'Cập nhật phân ca thành công');
                    setIsModalOpen(false);
                    form.resetFields();
                    await reloadTable();  // Đợi reload table hoàn thành
                } else {
                    console.error('Update failed:', response);
                    throw new Error(response?.data?.message || 'Có lỗi xảy ra khi cập nhật phân ca');
                }
            } else {
                response = await callCreateUserShift(formatData);
                if (response?.data?.statusCode === 201) {
                    message.success('Thêm phân ca thành công');
                    setIsModalOpen(false);
                    form.resetFields();
                    await reloadTable();  // Đợi reload table hoàn thành
                } else {
                    throw new Error(response?.data?.message || 'Có lỗi xảy ra khi thêm phân ca');
                }
            }
        } catch (error: any) {
            console.error('Error in handleSubmit:', error);
            message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu phân ca');
        } finally {
            setIsModalLoading(false);
        }
    };

    const reloadTable = async () => {
        try {
            await tableRef?.current?.reload();
            // Fetch lại data sau khi reload
            const res = await callGetUserShifts(buildQuery({}, {}, {}));
            if (res?.data?.result) {
                setUserShifts(res.data.result);
            }
        } catch (error) {
            console.error('Error reloading table:', error);
        }
    };

    const buildQuery = (params: any, sort: any, filter: any) => {
        const clone = { ...params };
        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.userId) {
            sortBy = sort.userId === 'ascend' ? "sort=userId.name" : "sort=-userId.name";
        }
        if (sort && sort.shiftId) {
            sortBy = sort.shiftId === 'ascend' ? "sort=shiftId.name" : "sort=-shiftId.name";
        }
        if (sort && sort.date) {
            sortBy = sort.date === 'ascend' ? "sort=date" : "sort=-date";
        }
        if (sort && sort.status) {
            sortBy = sort.status === 'ascend' ? "sort=status" : "sort=-status";
        }

        if (sortBy) {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
    };

    const statusOptions = [
        { label: 'Đang hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' },
        { label: 'Chờ xử lý', value: 'pending' }
    ];

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

    const columns: ProColumns<IUserShift>[] = [
        {
            title: 'Nhân viên',
            dataIndex: ['userId', 'name'],
            sorter: true,
            render: (_: any, record: IUserShift) => record.userId?.name || '-'
        },
        {
            title: 'Ca làm việc',
            dataIndex: ['shiftId', 'name'],
            sorter: true,
            render: (_: any, record: IUserShift) => record.shiftId?.name || '-'
        },
        {
            title: 'Ngày',
            dataIndex: 'date',
            sorter: true,
            render: (dom: any, entity: IUserShift) => dayjs(entity.date).format('DD/MM/YYYY')
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            sorter: true,
            render: (dom: any, entity: IUserShift) => (
                <Tag color={getStatusColor(entity.status)}>
                    {getStatusText(entity.status)}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            hideInSearch: true,
            width: 50,
            render: (_value, entity, _index, _action) => (
                <Space>
                    <EditOutlined
                        style={{
                            fontSize: 20,
                            color: '#ffa500',
                        }}
                        onClick={() => handleEdit(entity)}
                    />
                    <Popconfirm
                        placement="topLeft"
                        title="Xác nhận xóa phân ca này?"
                        description="Bạn có chắc chắn muốn xóa phân ca này không?"
                        onConfirm={() => handleDelete(entity._id)}
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

    return (
        <div>
            <DataTable<IUserShift>
                actionRef={tableRef}
                headerTitle="Danh sách phân ca nhân viên"
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={userShifts}
                request={async (params, sort, filter): Promise<any> => {
                    const query = buildQuery(params, sort, filter);
                    const res = await callGetUserShifts(query);
                    if (res?.data?.result) {
                        setUserShifts(res.data.result);
                        setMeta({
                            current: res.data.meta.current,
                            pageSize: res.data.meta.pageSize,
                            total: res.data.meta.total,
                            pages: res.data.meta.pages
                        });
                        return {
                            data: res.data.result,
                            success: true,
                            total: res.data.meta.total
                        };
                    }
                    return {
                        data: [],
                        success: false,
                        total: 0
                    };
                }}
                scroll={{ x: true }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    showSizeChanger: true,
                    total: meta.total,
                    showTotal: (total: number, range: number[]) => { return (<div> {range[0]}-{range[1]} trên {total} rows</div>) }
                }}
                rowSelection={false}
                toolBarRender={(_action: any, _rows: any): any => {
                    return (
                        <Button
                            icon={<PlusOutlined />}
                            type="primary"
                            onClick={handleAdd}
                        >
                            Thêm mới
                        </Button>
                    );
                }}
            />

            <Modal
                title={editData?._id ? "Cập nhật phân ca" : "Thêm mới phân ca"}
                open={isModalOpen}
                onOk={() => {
                    console.log('Current form values:', form.getFieldsValue());
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