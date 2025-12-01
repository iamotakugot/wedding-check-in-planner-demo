import React, { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Select, Space, Button, Row, Col } from 'antd';
import { Guest } from '@/types';
import { GENDER_OPTIONS, SIDE_OPTIONS } from '@/data/formOptions';

const { TextArea } = Input;

interface GuestFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  guestToEdit: Guest | null;
  onSubmit: (guest: Guest) => void;
}

const GuestFormDrawer: React.FC<GuestFormDrawerProps> = ({
  visible,
  onClose,
  guestToEdit,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEditMode = !!guestToEdit;

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Wait for form to be mounted before setting values
    const timer = setTimeout(() => {
      if (!form) return;

      if (guestToEdit) {
        form.setFieldsValue(guestToEdit);
      } else {
        form.setFieldsValue({
          gender: 'other',
          side: 'both',
          zoneId: null,
          tableId: null,
          age: 30,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [visible, guestToEdit, form]);

  const handleFinish = (values: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newGuest: Guest = {
      ...values,
      id: isEditMode ? guestToEdit!.id : `G${Date.now().toString().slice(-4)}`,
      createdAt: isEditMode ? guestToEdit!.createdAt : now,
      updatedAt: now,
      zoneId: values.zoneId || null,
      tableId: values.tableId || null,
      age: Number(values.age),
    };
    onSubmit(newGuest);
  };

  return (
    <Drawer
      title={isEditMode ? 'แก้ไขข้อมูลแขก' : 'เพิ่มรายชื่อแขกใหม่'}
      width={window.innerWidth > 768 ? 500 : '100%'}
      onClose={onClose}
      open={visible}
      destroyOnClose
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>ยกเลิก</Button>
        </Space>
      }
    >
      <Form
        key={guestToEdit?.id || 'new'}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
        initialValues={{ age: 30, gender: 'other', side: 'both', zoneId: null, tableId: null }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="ชื่อจริง"
              rules={[{ required: true, message: 'กรุณากรอกชื่อจริง' }]}
            >
              <Input placeholder="เช่น สมชาย" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="นามสกุล"
              rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
            >
              <Input placeholder="เช่น ใจดี" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="nickname" label="ชื่อเล่น">
              <Input placeholder="เช่น ชาย" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="age"
              label="อายุ"
              rules={[{ required: true, message: 'กรุณากรอกอายุ' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="เช่น 30" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phoneNumber"
              label="เบอร์โทรศัพท์"
              rules={[
                { pattern: /^[0-9]{9,10}$/, message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }
              ]}
            >
              <Input placeholder="เช่น 0812345678" maxLength={10} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="เพศ"
              rules={[{ required: true, message: 'กรุณาเลือกเพศ' }]}
            >
              <Select placeholder="เลือกเพศ" options={GENDER_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="relationToCouple"
          label="ความสัมพันธ์กับคู่บ่าวสาว"
          rules={[{ required: true, message: 'ระบุความสัมพันธ์' }]}
        >
          <Input placeholder="เช่น พ่อเจ้าบ่าว, เพื่อนสนิทเจ้าสาว" />
        </Form.Item>
        <Form.Item
          name="side"
          label="ฝ่ายที่เกี่ยวข้อง"
          rules={[{ required: true, message: 'กรุณาเลือกฝ่าย' }]}
        >
          <Select placeholder="เลือกฝ่าย" options={SIDE_OPTIONS} />
        </Form.Item>
        {/* 🔧 ลบการเลือกที่นั่งออก - ใช้เฉพาะที่หน้า จัดการผังโต๊ะ & โซน เท่านั้น */}
        {/* <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="zoneId" label="โซนที่นั่ง">
              <Select
                allowClear
                placeholder="เลือกโซนที่นั่ง"
                options={zones.map((z) => ({ value: z.zoneId, label: z.zoneName }))}
                onChange={() => form.setFieldValue('tableId', null)}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="tableId" label="หมายเลขโต๊ะ">
              <Select
                allowClear
                placeholder="เลือกโต๊ะในโซน"
                disabled={!selectedZoneId}
                options={tablesInSelectedZone.map((t) => ({
                  value: t.tableId,
                  label: t.tableName,
                }))}
              />
              {!selectedZoneId && (
                <Text type="secondary" className="text-xs">
                  กรุณาเลือกโซนก่อน
                </Text>
              )}
            </Form.Item>
          </Col>
        </Row> */}
        <Form.Item name="note" label="หมายเหตุ (ข้อจำกัด/คำขอพิเศษ)">
          <TextArea
            rows={3}
            placeholder="เช่น แพ้อาหาร, ต้องการเก้าอี้พิเศษ, ต้องนั่งใกล้ทางออก"
          />
        </Form.Item>
        <Form.Item className="mt-6">
          <Button type="primary" htmlType="submit" block size="large">
            {isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มรายชื่อ'}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default GuestFormDrawer;

