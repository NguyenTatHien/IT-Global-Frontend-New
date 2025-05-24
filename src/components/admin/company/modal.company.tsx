import { ModalForm, ProFormText, ProFormSelect, ProForm } from '@ant-design/pro-components';
import { message, Form } from 'antd';
import AddressForm from '@/components/AddressForm';
import { useForm } from 'antd/es/form/Form';

interface IProps {
    open: boolean;
    onClose: () => void;
    onOk: (values: any) => void;
    initialValues: any;
    setDataInit?: (v: any) => void;
}

const ModalCompany = (props: IProps) => {
    const { open, onClose, onOk, initialValues, setDataInit } = props;
    const [form] = Form.useForm();

    return (
        <ModalForm
            title={initialValues ? "Cập nhật công ty" : "Thêm công ty"}
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
                let addressValue = values.address;
                if (typeof addressValue === 'object') {
                    addressValue = JSON.stringify(addressValue);
                }
                if (initialValues && initialValues._id) {
                    await onOk({ ...values, address: addressValue, _id: initialValues._id });
                } else {
                    await onOk({ ...values, address: addressValue });
                }
                return true;
            }}
            width={600}
            form={form}
        >
            <ProFormText
                name="name"
                label="Tên công ty"
                rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
            />
            <ProFormText
                name="phone"
                label="Số điện thoại"
            />
            <ProFormText
                name="email"
                label="Email"
            />
            <ProFormText
                name="ipAddress"
                label="IP Address"
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
            <ProForm.Item
                name="address"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
            >
                <AddressForm form={form} initialAddress={initialValues?.address} />
            </ProForm.Item>
        </ModalForm>
    );
};

export default ModalCompany;
