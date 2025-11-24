import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Divider, 
  Switch, 
  Select, 
  Space, 
  message,
  QRCode,
  Tooltip,
  Spin,
} from 'antd';
import { 
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { 
  getWeddingCardConfig, 
  updateWeddingCardConfig
} from '@/services/firebaseService';
import { defaultWeddingCardConfig } from '@/constants/weddingCard';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CardManagementPageProps {
  onPreview: () => void;
}

const CardManagementPage: React.FC<CardManagementPageProps> = ({ onPreview }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const config = await getWeddingCardConfig();
        if (config) {
          form.setFieldsValue(config);
        } else {
          // ใช้ default config
          form.setFieldsValue(defaultWeddingCardConfig);
        }
      } catch (error) {
        console.error('Error loading config:', error);
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [form]);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      // แปลง dressCode.colors จาก string เป็น array (ถ้าเป็น string)
      const configToSave: any = { ...values };
      if (configToSave.dressCode?.colors) {
        const colorsValue = configToSave.dressCode.colors;
        if (typeof colorsValue === 'string') {
          configToSave.dressCode.colors = colorsValue
            .split(',')
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0);
        }
      }
      
      await updateWeddingCardConfig(configToSave);
      message.success('บันทึกข้อมูลการ์ดแต่งงานเรียบร้อย');
    } catch (error) {
      console.error('Error saving config:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const inviteLink = 'https://got-nan-wedding.web.app/';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    message.success('คัดลอกลิงค์แล้ว!');
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        จัดการการ์ดแต่งงาน
      </Title>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={defaultWeddingCardConfig}
        >
          <Row gutter={[24, 24]}>
            {/* ชื่อเจ้าบ่าว */}
            <Col xs={24} md={12}>
              <Card title="ข้อมูลเจ้าบ่าว">
                <Form.Item name={['groom', 'firstName']} label="ชื่อ (First Name)">
                  <Input />
                </Form.Item>
                <Form.Item name={['groom', 'lastName']} label="นามสกุล (Last Name)">
                  <Input />
                </Form.Item>
                <Form.Item name={['groom', 'nickname']} label="ชื่อเล่น (Nickname)">
                  <Input />
                </Form.Item>
                <Form.Item name={['groom', 'fullNameThai']} label="ชื่อเต็มภาษาไทย">
                  <Input />
                </Form.Item>
              </Card>
            </Col>

            {/* ชื่อเจ้าสาว */}
            <Col xs={24} md={12}>
              <Card title="ข้อมูลเจ้าสาว">
                <Form.Item name={['bride', 'firstName']} label="ชื่อ (First Name)">
                  <Input />
                </Form.Item>
                <Form.Item name={['bride', 'lastName']} label="นามสกุล (Last Name)">
                  <Input />
                </Form.Item>
                <Form.Item name={['bride', 'nickname']} label="ชื่อเล่น (Nickname)">
                  <Input />
                </Form.Item>
                <Form.Item name={['bride', 'fullNameThai']} label="ชื่อเต็มภาษาไทย">
                  <Input />
                </Form.Item>
              </Card>
            </Col>

            {/* ชื่อบิดามารดา */}
            <Col xs={24} md={12}>
              <Card title="บิดามารดาเจ้าบ่าว">
                <Form.Item name={['parents', 'groom', 'father']} label="บิดา">
                  <Input />
                </Form.Item>
                <Form.Item name={['parents', 'groom', 'mother']} label="มารดา">
                  <Input />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="บิดามารดาเจ้าสาว">
                <Form.Item name={['parents', 'bride', 'father']} label="บิดา">
                  <Input />
                </Form.Item>
                <Form.Item name={['parents', 'bride', 'mother']} label="มารดา">
                  <Input />
                </Form.Item>
              </Card>
            </Col>

            {/* การตั้งค่าการแสดงผล */}
            <Col xs={24}>
              <Card title="การตั้งค่าการแสดงผล">
                <Form.Item name="nameOrder" label="ลำดับการแสดงชื่อ">
                  <Select>
                    <Select.Option value="bride-first">เจ้าสาวก่อน (ตามธรรมเนียมไทย)</Select.Option>
                    <Select.Option value="groom-first">เจ้าบ่าวก่อน</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="showParentsAtTop" valuePropName="checked" label="แสดงชื่อบิดามารดาที่ด้านบนสุด">
                  <Switch />
                </Form.Item>
              </Card>
            </Col>

            {/* Dress Code */}
            <Col xs={24}>
              <Card title="Dress Code">
                <Form.Item name={['dressCode', 'label']} label="Label">
                  <Input placeholder="เช่น Dress Code:" />
                </Form.Item>
                <Form.Item 
                  name={['dressCode', 'colors']} 
                  label="สี (Hex Codes)"
                  getValueFromEvent={(e) => {
                    const value = e.target.value;
                    return value;
                  }}
                  normalize={(value) => {
                    if (Array.isArray(value)) {
                      return value.join(', ');
                    }
                    return value;
                  }}
                >
                  <TextArea 
                    rows={3} 
                    placeholder="ใส่สีแต่ละสีแยกด้วย comma เช่น #FFE082, #F8BBD0, #B3E5FC"
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 ตัวอย่าง: #FFE082, #F8BBD0, #B3E5FC, #C8E6C9
                </Text>
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* ปุ่มบันทึก */}
          <Space>
            <Button type="primary" htmlType="submit" loading={saving} size="large">
              บันทึกข้อมูลการ์ด
            </Button>
            <Button onClick={onPreview} size="large" icon={<EyeOutlined />}>
              ดูตัวอย่างการ์ด
            </Button>
          </Space>
        </Form>
      </Spin>

      {/* QR Code และลิงค์ */}
      <Card title="ลิงค์เชิญ" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>ลิงค์สำหรับส่งให้แขก:</Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input value={inviteLink} readOnly />
            <Tooltip title="คัดลอก">
              <Button icon={<CopyOutlined />} onClick={handleCopy} />
            </Tooltip>
          </Space.Compact>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              QR Code สำหรับลิงค์เชิญ:
            </Text>
            <QRCode value={inviteLink} size={200} />
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default CardManagementPage;

