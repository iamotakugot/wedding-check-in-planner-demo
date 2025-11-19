import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Input, Button, Space, Statistic, List, Tag, Tooltip, message, Form, Divider, Select, InputNumber, Tabs, Alert, Badge, Slider } from 'antd';
import {
  LinkOutlined,
  CopyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface LinkManagerPageProps {
  onPreview: () => void;
  guests?: any[];
  setGuests?: React.Dispatch<React.SetStateAction<any[]>>;
}

interface ScheduleItem { time: string; title: string; desc?: string }

const STORAGE_KEY = 'invitation_config_v1';
const RSVP_STORAGE_KEY = 'rsvp_database';

// Get RSVP data from localStorage (simulating backend)
const getRSVPData = () => {
  try {
    const saved = localStorage.getItem(RSVP_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const LinkManagerPage: React.FC<LinkManagerPageProps> = ({ onPreview, setGuests }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('card');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [rsvpStats, setRsvpStats] = useState({ coming: 0, notComing: 0 });
  const inviteLink = 'https://wedding-planner.app/rsvp/jane-joe-2025';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    message.success('คัดลอกลิงค์แล้ว!');
  };

  // Load initial data
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
        youtubeUrl: '',
        musicVolume: 30,
        schedule: [
          { time: '07:09', title: 'พิธีสงฆ์', desc: 'เจริญพระพุทธมนต์' },
          { time: '09:09', title: 'พิธีขันหมาก', desc: 'ตั้งขบวนขันหมาก' },
          { time: '18:30', title: 'งานฉลองมงคลสมรส', desc: 'เริ่มงานเลี้ยงภาคค่ำ' },
        ],
      });
    }
  }, [form]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const data = form.getFieldsValue();
      localStorage.setItem(`${STORAGE_KEY}_draft`, JSON.stringify(data));
      setLastSaved(new Date());
    }, 30000); // Every 30 seconds
    return () => clearInterval(timer);
  }, [form]);

  // Update RSVP stats
  useEffect(() => {
    const rsvps = getRSVPData();
    let coming = 0;
    let notComing = 0;
    Object.values(rsvps).forEach((rsvp: any) => {
      if (rsvp.isComing === 'yes') coming++;
      else if (rsvp.isComing === 'no') notComing++;
    });
    setRsvpStats({ coming, notComing });
  }, []);

  const persist = () => {
    const data = form.getFieldsValue();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setLastSaved(new Date());
    message.success('บันทึกข้อมูลการ์ดเชิญแล้ว');
  };

  const handleImportRSVP = () => {
    if (!setGuests) {
      message.warning('ไม่สามารถ Import ได้ (Guest List ไม่พร้อม)');
      return;
    }

    const rsvps = getRSVPData();
    const importedGuests: any[] = [];

    Object.values(rsvps).forEach((rsvp: any) => {
      if (rsvp.isComing !== 'yes') return;

      // Main guest
      importedGuests.push({
        id: `RSVP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        firstName: rsvp.firstName || '',
        lastName: rsvp.lastName || '',
        nickname: rsvp.nickname || '',
        age: null,
        gender: 'other' as const,
        relationToCouple: rsvp.relation || '',
        side: rsvp.side || 'both',
        zoneId: null,
        tableId: null,
        note: rsvp.note || '',
        seatNumber: null,
        isComing: true,
        accompanyingGuestsCount: rsvp.accompanyingGuestsCount || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        groupId: null,
        groupName: null,
        checkedInAt: null,
        checkInMethod: null,
      });

      // Accompanying guests
      if (rsvp.accompanyingGuests && Array.isArray(rsvp.accompanyingGuests)) {
        rsvp.accompanyingGuests.forEach((acc: any) => {
          importedGuests.push({
            id: `RSVP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            firstName: acc.name || '',
            lastName: '',
            nickname: '',
            age: null,
            gender: 'other' as const,
            relationToCouple: acc.relationToMain || '',
            side: rsvp.side || 'both',
            zoneId: null,
            tableId: null,
            note: '',
            seatNumber: null,
            isComing: true,
            accompanyingGuestsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            groupId: null,
            groupName: null,
            checkedInAt: null,
            checkInMethod: null,
          });
        });
      }
    });

    if (importedGuests.length === 0) {
      message.info('ไม่มีข้อมูล RSVP ที่ตอบรับแล้วให้ Import');
      return;
    }

    setGuests(prev => [...prev, ...importedGuests]);
    message.success(`Import ${importedGuests.length} แขกจาก RSVP เข้า Guest List แล้ว`);
  };

  const values = Form.useWatch([], form) || {};
  const mapsQuery = encodeURIComponent(`${values.venueName || ''} ${values.address || ''}`.trim());
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const embedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

  const tabItems = [
    {
      key: 'card',
      label: (
        <span>
          <FileTextOutlined /> การ์ดเชิญ
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card variant="borderless" className="shadow-sm rounded-xl">
              {lastSaved && (
                <Alert
                  message={`บันทึกอัตโนมัติล่าสุด: ${lastSaved.toLocaleTimeString('th-TH')}`}
                  type="info"
                  showIcon
                  closable
                  style={{ marginBottom: 16 }}
                />
              )}
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
                    <Form.Item label="การย่อ/ขยายรูป" name="bannerObjectFit">
                      <Select options={[{ value: 'cover', label: 'cover' }, { value: 'contain', label: 'contain' }]} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="ชื่องาน (Event Title)" name="eventTitle" rules={[{ required: true, message: 'กรอกชื่องาน' }]}>
                  <Input allowClear placeholder="เช่น Jane & Joe's Wedding" />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="วัน-เวลา" name="eventDate" rules={[{ required: true }]}>
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
                                <Input allowClear placeholder="รายละเอียด" />
                              </Form.Item>
                            </Col>
                            <Col span={2}>
                              <Button danger size="small" onClick={() => remove(field.name)}>ลบ</Button>
                            </Col>
                          </Row>
                        );
                      })}
                      <Button type="dashed" onClick={() => add({ time: '', title: '', desc: '' })} block>
                        + เพิ่มรายการ
                      </Button>
                    </>
                  )}
                </Form.List>

                <Divider />
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>บันทึก</Button>
                  <Button onClick={() => form.resetFields()}>รีเซ็ต</Button>
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="👀 ตัวอย่างการ์ดเชิญ" variant="borderless" className="shadow-sm rounded-xl">
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
                    <iframe title="map" src={embedUrl} width="100%" height="180" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                  <Button href={mapsUrl} target="_blank" rel="noopener noreferrer" size="small" style={{ marginTop: 8 }}>เปิดใน Google Maps</Button>
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
              <Text strong>ลิงค์เชิญ:</Text>
              <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                <Input value={inviteLink} readOnly />
                <Tooltip title="คัดลอก">
                  <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy} />
                </Tooltip>
              </Space.Compact>
              <Button type="default" block icon={<EyeOutlined />} onClick={onPreview} style={{ marginTop: 12 }}>
                จำลองหน้าจอแขก (Preview)
              </Button>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'music',
      label: (
        <span>
          <CustomerServiceOutlined /> เพลงบรรเลง
        </span>
      ),
      children: (
        <Card variant="borderless" className="shadow-sm rounded-xl">
          <Form form={form} layout="vertical" onFinish={persist}>
            <Alert
              message="ใส่ลิงค์ YouTube สำหรับเพลงบรรเลง"
              description="แขกจะได้ฟังเพลงเมื่อเปิดหน้า RSVP (ตัวอย่าง: https://www.youtube.com/watch?v=xxxx หรือ https://youtu.be/xxxx)"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Form.Item
              label="YouTube URL"
              name="youtubeUrl"
              extra="ตัวอย่าง: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            >
              <Input allowClear placeholder="https://www.youtube.com/watch?v=..." />
            </Form.Item>
            <Form.Item
              label="ระดับเสียงเริ่มต้น (%)"
              name="musicVolume"
              extra="เสียงจะเริ่มที่ระดับนี้ (แนะนำ 20-40%)"
            >
              <Slider
                min={0}
                max={100}
                tooltip={{ formatter: (v?: number) => `${v}%` }}
              />
            </Form.Item>
            {values.youtubeUrl && (
              <Alert
                message="ตัวอย่าง: เพลงจะเล่นอัตโนมัติเมื่อแขกเปิดหน้า RSVP"
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginTop: 16 }}>
              บันทึก
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'status',
      label: (
        <span>
          <BarChartOutlined /> RSVP Status
          <Badge count={rsvpStats.coming + rsvpStats.notComing} style={{ marginLeft: 8 }} />
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card variant="borderless" className="shadow-sm rounded-xl">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="ตอบรับแล้ว (Coming)"
                    value={rsvpStats.coming}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="ไม่สะดวก (Not Coming)"
                    value={rsvpStats.notComing}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
                {setGuests && (
                  <Col span={24}>
                    <Divider />
                    <Button type="primary" block icon={<CheckCircleOutlined />} onClick={handleImportRSVP}>
                      Import RSVP → Guest List
                    </Button>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                      * Import แขกที่ตอบรับแล้วเข้าสู่ Guest List เพื่อจัดโต๊ะและเช็คอิน
                    </Text>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} className="mb-6">
        <LinkOutlined /> จัดการลิงค์เชิญ & RSVP
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
};

export default LinkManagerPage;
