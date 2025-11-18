import React, { useEffect } from 'react';
import { Card, Row, Col, Typography, Input, Button, Space, Statistic, List, Tag, Tooltip, message, Form, Divider, Select, InputNumber } from 'antd';
import {
  LinkOutlined,
  CopyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface LinkManagerPageProps {
  onPreview: () => void;
}

interface ScheduleItem { time: string; title: string; desc?: string }

const STORAGE_KEY = 'invitation_config_v1';

const LinkManagerPage: React.FC<LinkManagerPageProps> = ({ onPreview }) => {
  const [form] = Form.useForm();
  const inviteLink = 'https://wedding-planner.app/rsvp/jane-joe-2025';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    message.success('คัดลอกลิงค์แล้ว!');
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        form.setFieldsValue(data);
      } catch {}
    } else {
      form.setFieldsValue({
        eventTitle: "Jane & Joe's Wedding",
        eventDate: '12 ธันวาคม 2025',
        venueName: 'แกรนด์บอลรูม',
        address: 'โรงแรมสุดหรู, กรุงเทพฯ',
        bannerImage: 'https://images.unsplash.com/photo-1519225468359-69df3ef39f67?q=80&w=1200&auto=format&fit=crop',
        bannerHeight: 220,
        bannerObjectFit: 'cover',
        schedule: [
          { time: '07:09', title: 'พิธีสงฆ์', desc: 'เจริญพระพุทธมนต์' },
          { time: '09:09', title: 'พิธีขันหมาก', desc: 'ตั้งขบวนขันหมาก' },
          { time: '18:30', title: 'งานฉลองมงคลสมรส', desc: 'เริ่มงานเลี้ยงภาคค่ำ' },
        ],
      });
    }
  }, [form]);

  const persist = () => {
    const data = form.getFieldsValue();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    message.success('บันทึกข้อมูลการ์ดเชิญแล้ว');
  };

  const values = Form.useWatch([], form) || {};
  const mapsQuery = encodeURIComponent(`${values.venueName || ''} ${values.address || ''}`.trim());
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} className="mb-6">
        <LinkOutlined /> จัดการลิงค์เชิญ & RSVP
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="🔧 แก้ไขรายละเอียดการ์ดเชิญ" variant="borderless" className="shadow-sm rounded-xl">
            <Form form={form} layout="vertical" onFinish={persist}>
              <Form.Item label="รูปภาพปก (Banner Image URL)" name="bannerImage">
                <Input allowClear placeholder="https://..." />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="ความสูงแบนเนอร์ (px)" name="bannerHeight">
                    <InputNumber style={{ width: '100%' }} min={120} max={800} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="การย่อ/ขยายรูป (object-fit)" name="bannerObjectFit">
                    <Select options={[{ value: 'cover', label: 'cover' }, { value: 'contain', label: 'contain' }]} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="ชื่องาน (Event Title)" name="eventTitle" rules={[{ required: true, message: 'กรอกชื่องาน' }]}>
                <Input allowClear placeholder="เช่น Jane & Joe's Wedding" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="วัน-เวลา (แสดงผล)" name="eventDate" rules={[{ required: true }]}>
                    <Input allowClear placeholder="เช่น 12 ธันวาคม 2025" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="สถานที่ (Venue)" name="venueName" rules={[{ required: true }]}>
                    <Input allowClear placeholder="เช่น แกรนด์บอลรูม" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="ที่อยู่ (Address)" name="address">
                <Input allowClear placeholder="พิมพ์ที่อยู่สำหรับนำทาง" />
              </Form.Item>

              <Divider orientation="left">กำหนดการ (Schedule)</Divider>
              <Form.List name="schedule">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => {
                      const { key, ...restField } = field;
                      return (
                        <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                          <Col span={5}>
                            <Form.Item {...restField} name={[field.name, 'time']} rules={[{ required: true }]} noStyle>
                              <Input allowClear placeholder="เวลา" />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item {...restField} name={[field.name, 'title']} rules={[{ required: true }]} noStyle>
                              <Input allowClear placeholder="หัวข้อ" />
                            </Form.Item>
                          </Col>
                          <Col span={9}>
                            <Form.Item {...restField} name={[field.name, 'desc']} noStyle>
                              <Input allowClear placeholder="รายละเอียด (ถ้ามี)" />
                            </Form.Item>
                          </Col>
                          <Col span={2} style={{ textAlign: 'right' }}>
                            <Button danger onClick={() => remove(field.name)}>ลบ</Button>
                          </Col>
                        </Row>
                      );
                    })}
                    <Button type="dashed" onClick={() => add({ time: '', title: '', desc: '' })} block>
                      + เพิ่มรายการกำหนดการ
                    </Button>
                  </>
                )}
              </Form.List>

              <Divider />
              <Space>
                <Button type="primary" htmlType="submit">บันทึก</Button>
                <Button onClick={() => form.resetFields()}>รีเซ็ต</Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="👀 ตัวอย่างการ์ดเชิญ (Preview)" variant="borderless" className="shadow-sm rounded-xl">
            {values.bannerImage && (
              <div style={{ marginBottom: 12 }}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={values.bannerImage} style={{ width: '100%', borderRadius: 12, objectFit: values.bannerObjectFit || 'cover', height: (values.bannerHeight || 220) }} />
              </div>
            )}
            <Title level={4} style={{ margin: 0 }}>{values.eventTitle || '—'}</Title>
            <Text type="secondary">{values.eventDate || '—'}</Text>
            <div style={{ marginTop: 8 }}>
              <Tag icon={<EnvironmentOutlined />} color="gold">
                {values.venueName || '-'} {values.address ? `• ${values.address}` : ''}
              </Tag>
            </div>

            {values.address && (
              <div style={{ marginTop: 12 }}>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                  <iframe title="map" src={embedUrl} width="100%" height="220" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button href={mapsUrl} target="_blank" rel="noopener noreferrer">เปิดใน Google Maps</Button>
                </div>
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text strong>กำหนดการ</Text>
              <List
                size="small"
                style={{ marginTop: 8 }}
                dataSource={(values.schedule as ScheduleItem[]) || []}
                locale={{ emptyText: 'ยังไม่มีกำหนดการ' }}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <Tag>{item.time || '-'}</Tag>
                      <Text strong>{item.title || '-'}</Text>
                      {item.desc && <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>}
                    </Space>
                  </List.Item>
                )}
              />
            </div>

            <Divider />
            <Text strong>ลิงค์สำหรับส่งให้แขก:</Text>
            <div className="flex mt-2 gap-2">
              <Input value={inviteLink} readOnly size="large" className="rounded-lg bg-gray-50 text-gray-600" />
              <Tooltip title="คัดลอก">
                <Button type="primary" icon={<CopyOutlined />} size="large" onClick={handleCopy} />
              </Tooltip>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button type="default" block size="large" icon={<EyeOutlined />} onClick={onPreview}>
                จำลองหน้าจอแขก (Preview RSVP App)
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="📊 สถานะการตอบรับ (RSVP Status)" variant="borderless" className="shadow-sm rounded-xl">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="ตอบรับแล้ว (Coming)" value={124} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="ไม่สะดวก (Not Coming)" value={12} valueStyle={{ color: '#cf1322' }} prefix={<CloseCircleOutlined />} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LinkManagerPage;
