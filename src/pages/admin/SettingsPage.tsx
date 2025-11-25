/**
 * Admin Settings Page
 * รวม Card Management และ Link Management
 */

import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Button, Card, Row, Col, App, QRCode, Statistic, Spin, Space } from 'antd';
import { CopyOutlined, HeartOutlined, LinkOutlined } from '@ant-design/icons';
import { useConfig } from '@/hooks/useConfig';
import { useRSVPs } from '@/hooks/useRSVPs';
import { ConfigService } from '@/services/firebase/ConfigService';
import { defaultWeddingCardConfig, type WeddingCardConfig } from '@/constants/weddingCard';
import { calculateTotalAttendees, calculateRsvpStats } from '@/utils/rsvpHelpers';
import { logger } from '@/utils/logger';


const SettingsPage: React.FC = () => {
  const { message } = App.useApp();
  const { weddingCardConfig, isLoading: configLoading } = useConfig();
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs();
  const [form] = Form.useForm();
  const configService = ConfigService.getInstance();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!form) return;
    
    const timer = setTimeout(() => {
      if (weddingCardConfig) {
        form.setFieldsValue(weddingCardConfig);
      } else {
        form.setFieldsValue(defaultWeddingCardConfig);
      }
    }, 100);

    return () => clearTimeout(timer);
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
      logger.error('Error saving config:', error);
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
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">ตั้งค่า</h1>

      <Tabs 
        defaultActiveKey="card"
        items={[
          {
            key: 'card',
            label: (
              <span>
                <HeartOutlined className="mr-2" />
                การ์ดแต่งงาน
              </span>
            ),
            children: (
              <Form
                key={weddingCardConfig?.groom?.firstName || 'new'}
                form={form}
                layout="vertical"
                onFinish={handleSave}
                preserve={false}
                initialValues={defaultWeddingCardConfig}
              >
            <Row gutter={[16, 16]} className="md:gutter-[24px]">
              <Col xs={24} md={12}>
                <Card title="ข้อมูลเจ้าบ่าว" className="shadow-sm">
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
                <Card title="ข้อมูลเจ้าสาว" className="shadow-sm">
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
                <Card title="บิดามารดา" className="shadow-sm">
                  <Row gutter={[16, 16]}>
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
                <Card title="การตั้งค่า" className="shadow-sm">
                  <Form.Item name="nameOrder" label="ลำดับการแสดงชื่อ">
                    <Input />
                  </Form.Item>
                  <Form.Item name="showParentsAtTop" label="แสดงบิดามารดาที่ด้านบน" valuePropName="checked">
                    <Input type="checkbox" />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" loading={saving} size="large" className="mt-4 md:mt-6">
              บันทึก
            </Button>
          </Form>
            ),
          },
          {
            key: 'link',
            label: (
              <span>
                <LinkOutlined className="mr-2" />
                ลิงค์เชิญ
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic title="ตอบรับทั้งหมด" value={rsvpStats.totalForms} valueStyle={{ fontSize: '20px', fontWeight: 600 }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic title="ยินดีร่วมงาน" value={rsvpStats.totalComingForms} valueStyle={{ color: '#3f8600', fontSize: '20px', fontWeight: 600 }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <Statistic title="จำนวนคนเข้างาน" value={totalAttendees} valueStyle={{ fontSize: '20px', fontWeight: 600 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="ลิงค์เชิญ" className="shadow-sm">
                <Space.Compact style={{ width: '100%' }}>
                  <Input value={inviteLink} readOnly style={{ flex: 1 }} />
                  <Button icon={<CopyOutlined />} onClick={handleCopy}>
                    คัดลอก
                  </Button>
                </Space.Compact>
                <div className="mt-4 md:mt-6 flex justify-center">
                  <QRCode value={inviteLink} size={200} />
                </div>
              </Card>
            </Col>
          </Row>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SettingsPage;

