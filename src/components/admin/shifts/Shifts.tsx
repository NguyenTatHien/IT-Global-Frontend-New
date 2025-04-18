import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Modal, Form, Input, TimePicker, message, Popconfirm, Select, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { callCreateShift, callDeleteShift, callGetShifts, callUpdateShift } from '@/config/api';
import dayjs from 'dayjs';
import { IBackendRes, IModelPaginate } from '@/types/backend';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import queryString from 'query-string';

interface IShift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    status: 'active' | 'inactive';
}

const ShiftManagement: React.FC = () => {
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
    }, [isAuthenticated]);

    const handleAdd = () => {
        setEditData(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: IShift) => {
        setEditData(record);
        form.setFieldsValue({
            ...record,
            startTime: dayjs(record.startTime, 'HH:mm'),
            endTime: dayjs(record.endTime, 'HH:mm'),
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await callDeleteShift(id);
            if (res && res.data) {
                message.success('Xóa ca làm việc thành công');
                reloadTable();
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi xóa ca làm việc');
        }
    };

    const handleSubmit = async (values: any) => {
        setIsModalLoading(true);
        try {
            const { startTime, endTime, ...rest } = values;
            const formatData = {
                ...rest,
                startTime: startTime.format('HH:mm'),
                endTime: endTime.format('HH:mm'),
                status: rest.status || 'active'
            };

            if (editData?._id) {
                const res = await callUpdateShift(editData._id, formatData);
                if (res && res.data) {
                    message.success('Cập nhật ca làm việc thành công');
                }
            } else {
                const res = await callCreateShift(formatData);
                if (res && res.data) {
                    message.success('Thêm ca làm việc thành công');
                }
            }
            setIsModalOpen(false);
            form.resetFields();
            reloadTable();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu ca làm việc');
        } finally {
            setIsModalLoading(false);
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const buildQuery = (params: any, sort: any, filter: any) => {
        // Handle pagination
        const { current, pageSize, ...restParams } = params;
        const queryParams = new URLSearchParams();

        // Add pagination params
        queryParams.append('current', current?.toString() || '1');
        queryParams.append('pageSize', pageSize?.toString() || '10');

        // Build search query
        const searchQuery: any = {};

        // Handle text search
        if (restParams.name) {
            searchQuery.name = {
                $regex: restParams.name.trim(),
                $options: 'i'
            };
        }

        // Handle status filter
        if (restParams.status) {
            searchQuery.status = restParams.status;
        }

        // Handle sort
        if (sort && Object.keys(sort).length > 0) {
            const sortField = Object.keys(sort)[0];
            const sortOrder = sort[sortField] === 'ascend' ? 1 : -1;
            searchQuery.sort = { [sortField]: sortOrder };
        } else {
            searchQuery.sort = { updatedAt: -1 };
        }

        // Add search query to URL params
        if (Object.keys(searchQuery).length > 0) {
            queryParams.append('qs', JSON.stringify(searchQuery));
        }

        return queryParams.toString();
    };

    const statusOptions = [
        { label: 'Đang hoạt động', value: 'active' },
        { label: 'Ngừng hoạt động', value: 'inactive' }
    ];

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

    const columns: ProColumns<IShift>[] = [
        {
            title: 'Tên ca',
            dataIndex: 'name',
            sorter: true,
        },
        {
            title: 'Giờ bắt đầu',
            dataIndex: 'startTime',
            sorter: true,
        },
        {
            title: 'Giờ kết thúc',
            dataIndex: 'endTime',
            sorter: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            sorter: true,
            render: (dom: any, entity: IShift) => (
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
                        title="Xác nhận xóa ca làm việc này?"
                        description="Bạn có chắc chắn muốn xóa ca làm việc này không?"
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

    const request = async (params: {
        current?: number;
        pageSize?: number;
        filter?: Record<string, any>;
        sort?: Record<string, any>;
    }) => {
        setLoading(true);
        try {
            const query = buildQuery(params, params.sort || {}, params.filter || {});
            const res = await callGetShifts(query);
            if (res?.data?.result) {
                setShifts(res.data.result);
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
                success: true,
                total: 0
            };
        } catch (error) {
            message.error('Có lỗi xảy ra khi tải dữ liệu');
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
            <ProTable<IShift>
                actionRef={tableRef}
                headerTitle="Danh sách ca làm việc"
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={shifts}
                search={{
                    labelWidth: 'auto',
                    defaultCollapsed: false,
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
                title={editData?._id ? "Cập nhật ca làm việc" : "Thêm mới ca làm việc"}
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
                        label="Tên ca"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên ca!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Giờ bắt đầu"
                        name="startTime"
                        rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
                    >
                        <TimePicker format="HH:mm" />
                    </Form.Item>

                    <Form.Item
                        label="Giờ kết thúc"
                        name="endTime"
                        rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc!' }]}
                    >
                        <TimePicker format="HH:mm" />
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

export default ShiftManagement; 