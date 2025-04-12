import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Modal, Form, DatePicker, message, Popconfirm, Select, Tag } from 'antd';
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
    userId: string;
    shiftId: string;
    date: string;
    status: 'active' | 'inactive';
    user?: IUser;
    shift?: IShift;
}

const UserShiftManagement: React.FC = () => {
    const [userShifts, setUserShifts] = useState<IUserShift[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [shifts, setShifts] = useState<IShift[]>([]);
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
            const [usersRes, shiftsRes] = await Promise.all([
                callGetUsers(),
                callGetShifts('')
            ]);
            if (usersRes?.data) setUsers(usersRes.data.result);
            if (shiftsRes?.data) setShifts(shiftsRes.data.result);
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải dữ liệu');
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
            userId: record.userId,
            shiftId: record.shiftId,
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
            const { date, ...rest } = values;
            const formatData = {
                ...rest,
                date: date.format('YYYY-MM-DD'),
                status: rest.status || 'active'
            };

            if (editData?._id) {
                const res = await callUpdateUserShift(editData._id, formatData);
                if (res && res.data) {
                    message.success('Cập nhật phân ca thành công');
                }
            } else {
                const res = await callCreateUserShift(formatData);
                if (res && res.data) {
                    message.success('Thêm phân ca thành công');
                }
            }
            setIsModalOpen(false);
            form.resetFields();
            reloadTable();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu phân ca');
        } finally {
            setIsModalLoading(false);
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const buildQuery = (params: any, sort: any, filter: any) => {
        const clone = { ...params };
        if (clone.user) clone.user = `/${clone.user}/i`;
        if (clone.shift) clone.shift = `/${clone.shift}/i`;

        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.user) {
            sortBy = sort.user === 'ascend' ? "sort=user" : "sort=-user";
        }
        if (sort && sort.shift) {
            sortBy = sort.shift === 'ascend' ? "sort=shift" : "sort=-shift";
        }
        if (sort && sort.date) {
            sortBy = sort.date === 'ascend' ? "sort=date" : "sort=-date";
        }
        if (sort && sort.status) {
            sortBy = sort.status === 'ascend' ? "sort=status" : "sort=-status";
        }

        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=-updatedAt`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'green';
            case 'inactive':
                return 'red';
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
            default:
                return 'Không xác định';
        }
    };

    const columns: ProColumns<IUserShift>[] = [
        {
            title: 'Nhân viên',
            dataIndex: 'userId',
            sorter: true,
            render: (dom: any, entity: IUserShift) => {
                const user = users.find(u => u._id === entity.userId);
                return user ? user.name : entity.userId;
            }
        },
        {
            title: 'Ca làm việc',
            dataIndex: 'shiftId',
            sorter: true,
            render: (dom: any, entity: IUserShift) => {
                const shift = shifts.find(s => s._id === entity.shiftId);
                return shift ? shift.name : entity.shiftId;
            }
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
                    if (res?.data) {
                        setUserShifts(res.data.result);
                        setMeta({
                            current: res.data.meta.current,
                            pageSize: res.data.meta.pageSize,
                            total: res.data.meta.total,
                            pages: res.data.meta.pages
                        });
                    }
                    return res;
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
                onOk={() => form.submit()}
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
                        >
                            {users.map(user => (
                                <Select.Option key={user._id} value={user._id}>
                                    {user.name}
                                </Select.Option>
                            ))}
                        </Select>
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
                        >
                            {shifts.map(shift => (
                                <Select.Option key={shift._id} value={shift._id}>
                                    {shift.name} ({shift.startTime} - {shift.endTime})
                                </Select.Option>
                            ))}
                        </Select>
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
                        <Select>
                            <Select.Option value="active">Đang hoạt động</Select.Option>
                            <Select.Option value="inactive">Ngừng hoạt động</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserShiftManagement; 