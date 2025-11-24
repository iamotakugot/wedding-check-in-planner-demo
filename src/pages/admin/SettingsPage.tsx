/**
 * Admin Settings Page
 * รวม Card Management และ Link Management
 */

import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Button, Card, Row, Col, message, QRCode, Statistic, Spin } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useConfig } from '@/hooks/useConfig';
import { useRSVPs } from '@/hooks/useRSVPs';
import { ConfigService } from '@/services/firebase/ConfigService';
import { defaultWeddingCardConfig, type WeddingCardConfig } from '@/constants/weddingCard';
import { calculateTotalAttendees, calculateRsvpStats } from '@/utils/rsvpHelpers';

const { TabPane } = Tabs;

const SettingsPage: React.FC = () => {
  const { weddingCardConfig, isLoading: configLoading } = useConfig();
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs();
  const [form] = Form.useForm();
  const configService = ConfigService.getInstance();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (weddingCardConfig) {
      form.setFieldsValue(weddingCardConfig);
    } else {
      form.setFieldsValue(defaultWeddingCardConfig);
    }
  }, [weddingCardConfig, form]);

  const handleSave = async (values: WeddingCardConfig) => {
    setSaving(true);
    try {
      const configToSave: WeddingCardConfig = {
        ...defaultWeddingCardConfig,
        ...values,
      };
      await configService.updateWeddingCardConfig(configToSave);
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

  const rsvpStats = calculateRsvpStats(rsvps);
  const totalAttendees = calculateTotalAttendees(rsvps);

  if (configLoading || rsvpsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ตั้งค่า</h1>

      <Tabs defaultActiveKey="card">
        <TabPane tab="การ์ดแต่งงาน" key="card">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={defaultWeddingCardConfig}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card title="ข้อมูลเจ้าบ่าว">
                  <Form.Item name={['groom', 'firstName']} label="ชื่อ">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['groom', 'lastName']} label="นามสกุล">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['groom', 'nickname']} label="ชื่อเล่น">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['groom', 'fullNameThai']} label="ชื่อเต็มภาษาไทย">
                    <Input />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="ข้อมูลเจ้าสาว">
                  <Form.Item name={['bride', 'firstName']} label="ชื่อ">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['bride', 'lastName']} label="นามสกุล">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['bride', 'nickname']} label="ชื่อเล่น">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['bride', 'fullNameThai']} label="ชื่อเต็มภาษาไทย">
                    <Input />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="บิดามารดา">
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name={['parents', 'groom', 'father']} label="บิดาเจ้าบ่าว">
                        <Input />
                      </Form.Item>
                      <Form.Item name={['parents', 'groom', 'mother']} label="มารดาเจ้าบ่าว">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={['parents', 'bride', 'father']} label="บิดาเจ้าสาว">
                        <Input />
                      </Form.Item>
                      <Form.Item name={['parents', 'bride', 'mother']} label="มารดาเจ้าสาว">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="การตั้งค่า">
                  <Form.Item name="nameOrder" label="ลำดับการแสดงชื่อ">
                    <Input />
                  </Form.Item>
                  <Form.Item name="showParentsAtTop" label="แสดงบิดามารดาที่ด้านบน" valuePropName="checked">
                    <Input type="checkbox" />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" loading={saving} className="mt-4">
              บันทึก
            </Button>
          </Form>
        </TabPane>
        <TabPane tab="ลิงค์เชิญ" key="link">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="ตอบรับทั้งหมด" value={rsvpStats.totalForms} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="ยินดีร่วมงาน" value={rsvpStats.totalComingForms} valueStyle={{ color: '#3f8600' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="จำนวนคนเข้างาน" value={totalAttendees} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="ลิงค์เชิญ">
                <Input.Group compact>
                  <Input value={inviteLink} readOnly style={{ width: 'calc(100% - 100px)' }} />
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>
                    คัดลอก
                  </Button>
                </Input.Group>
                <div className="mt-4 flex justify-center">
                  <QRCode value={inviteLink} />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

