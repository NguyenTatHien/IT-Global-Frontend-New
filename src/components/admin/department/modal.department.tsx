import { ModalForm, ProFormText, ProFormSelect, ProForm } from '@ant-design/pro-components';
import { Form } from 'antd';

interface IProps {
    open: boolean;
    onClose: () => void;
    onOk: (values: any) => void;
    initialValues: any;
    setDataInit?: (v: any) => void;
}

const ModalDepartment = (props: IProps) => {
    const { open, onClose, onOk, initialValues, setDataInit } = props;
    const [form] = Form.useForm();

    return (
        <ModalForm
            title={initialValues ? "Cập nhật phòng ban" : "Thêm phòng ban"}
            open={open}
            modalProps={{
                onCancel: () => {
                    if (setDataInit) setDataInit(null);
                    onClose();
                },
                afterClose: () => {
                    if (setDataInit) setDataInit(null);
                },
                destroyOnClose: true,
            }}
            initialValues={{
                ...initialValues,
                isActive: initialValues?.isActive ?? true,
            }}
            onFinish={async (values) => {
                if (initialValues && initialValues._id) {
                    await onOk({ ...values, _id: initialValues._id });
                } else {
                    await onOk(values);
                }
                return true;
            }}
            width={500}
            form={form}
        >
            <ProFormText
                name="name"
                label="Tên phòng ban"
                rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
            />
            <ProFormText
                name="prefix"
                label="Mã phòng ban"
                rules={[{ required: true, message: 'Vui lòng nhập mã phòng ban' }]}
            />
            <ProFormText
                name="description"
                label="Mô tả"
            />
            <ProFormSelect
                name="isActive"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                options={[
                    { label: 'Đang hoạt động', value: true },
                    { label: 'Ngừng hoạt động', value: false },
                ]}
            />
        </ModalForm>
    );
};

export default ModalDepartment;
