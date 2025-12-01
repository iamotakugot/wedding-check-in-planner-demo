import React, { useEffect } from 'react';
import { Modal, Form, Input, AutoComplete } from 'antd';
import { Zone } from '@/types';
import { ZONE_NAME_OPTIONS } from '@/data/formOptions';

interface ZoneModalProps {
  visible: boolean;
  onClose: () => void;
  zoneToEdit: Zone | null;
  onSubmit: (zone: Zone) => void;
}

const ZoneModal: React.FC<ZoneModalProps> = ({ visible, onClose, zoneToEdit, onSubmit }) => {
  const [form] = Form.useForm();
  const isEditMode = !!zoneToEdit;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(
        zoneToEdit || {
          zoneId: `Z${Math.floor(Math.random() * 100)}`,
          zoneName: '',
          description: '',
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, zoneToEdit]); // form is stable, no need in deps

  const handleFinish = (values: Zone) => {
    const newZone: Zone = {
      ...values,
      id: isEditMode ? zoneToEdit!.id : values.zoneId,
      zoneId: values.zoneId,
      capacity: 0, // Capacity is computed
    };
    onSubmit(newZone);
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title={isEditMode ? 'แก้ไขข้อมูลโซน' : 'เพิ่มโซนที่นั่งใหม่'}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEditMode ? 'บันทึก' : 'สร้างโซน'}
      cancelText="ยกเลิก"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="zoneId"
          label="รหัสโซน (เช่น Z1, VIP)"
          rules={[{ required: true, message: 'กรุณากรอกรหัสโซน' }]}
        >
          <Input placeholder="เช่น Z1" disabled={isEditMode} />
        </Form.Item>
        <Form.Item
          name="zoneName"
          label="ชื่อโซน"
          rules={[{ required: true, message: 'กรุณากรอกชื่อโซน' }]}
        >
          <AutoComplete
            options={ZONE_NAME_OPTIONS}
            placeholder="เช่น โซนเพื่อนมัธยม, VIP"
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
          />
        </Form.Item>
        <Form.Item name="description" label="คำอธิบาย">
          <Input.TextArea
            rows={2}
            placeholder="เช่น สำหรับแขกผู้ใหญ่ หรือ เพื่อนที่ต้องการความสนุกสนาน"
          />
        </Form.Item>
        <Form.Item name="color" label="สีประจำโซน (สำหรับ Layout)" rules={[{ required: true }]}>
          <Input type="color" style={{ width: 100 }} />
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default ZoneModal;

