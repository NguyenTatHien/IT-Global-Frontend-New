import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Modal, Form, Input, TimePicker, message, Popconfirm, Select, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { callCreateShift, callDeleteShift, callGetShifts, callUpdateShift } from '@/config/api';
import dayjs from 'dayjs';
import { IBackendRes, IModelPaginate } from '@/types/backend';
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
        const clone = { ...params };
        if (clone.name) clone.name = `/${clone.name}/i`;

        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.name) {
            sortBy = sort.name === 'ascend' ? "sort=name" : "sort=-name";
        }
        if (sort && sort.startTime) {
            sortBy = sort.startTime === 'ascend' ? "sort=startTime" : "sort=-startTime";
        }
        if (sort && sort.endTime) {
            sortBy = sort.endTime === 'ascend' ? "sort=endTime" : "sort=-endTime";
        }
        if (sort && sort.status) {
            sortBy = sort.status === 'ascend' ? "sort=status" : "sort=-status";
        }

        //mặc định sort theo updatedAt
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=-updatedAt`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
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

    return (
        <div>
            <DataTable<IShift>
                actionRef={tableRef}
                headerTitle="Danh sách ca làm việc"
                rowKey="_id"
                loading={loading}
                columns={columns}
                dataSource={shifts}
                request={async (params, sort, filter): Promise<any> => {
                    const query = buildQuery(params, sort, filter);
                    const res = await callGetShifts(query);
                    if (res?.data) {
                        setShifts(res.data.result);
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