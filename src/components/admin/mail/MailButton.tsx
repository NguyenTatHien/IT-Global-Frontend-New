import { Button, Modal, Form, Input, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useState } from 'react';
import axios from 'config/axios-customize';

interface MailButtonProps {
  recipientEmail?: string;
  recipientName?: string;
}

const MailButton = ({ recipientEmail, recipientName }: MailButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSendMail = async (values: any) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/v1/mail/test', {
        to: values.email || recipientEmail,
        subject: values.subject,
        content: values.content
      });

      if (response.data) {
        message.success('Email sent successfully');
        setIsModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      message.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="primary" 
        icon={<MailOutlined />}
        onClick={() => setIsModalOpen(true)}
      >
        Send Email
      </Button>

      <Modal
        title="Send Email"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSendMail}
          initialValues={{
            email: recipientEmail,
            name: recipientName
          }}
        >
          <Form.Item
            label="Recipient Email"
            name="email"
            rules={[{ required: true, message: 'Please input recipient email!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please input email subject!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Content"
            name="content"
            rules={[{ required: true, message: 'Please input email content!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Send
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MailButton; 