import React, { useEffect } from 'react';
import { Modal, Form, Input, AutoComplete, InputNumber, Row, Col } from 'antd';
import { TableData, Zone } from '@/types';
import { TABLE_NAME_OPTIONS } from '@/data/formOptions';
import { GRID_X_POSITIONS, GRID_Y_START } from '@/constants/layout';

interface TableModalProps {
  visible: boolean;
  onClose: () => void;
  tableToEdit: TableData | null;
  zone: Zone;
  onSubmit: (table: TableData) => void;
}

const TableModal: React.FC<TableModalProps> = ({
  visible,
  onClose,
  tableToEdit,
  zone,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEditMode = !!tableToEdit;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(
        tableToEdit || {
          tableId: `T${Math.floor(Math.random() * 1000)}`,
          tableName: '',
          capacity: 8,
          note: '',
          order: 1,
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tableToEdit]); // form is stable, no need in deps

  const handleFinish = (values: TableData) => {
    const nextOrder = isEditMode ? tableToEdit!.order : values.order;
    const newTable: TableData = {
      ...values,
      id: isEditMode ? tableToEdit!.id : values.tableId,
      tableId: values.tableId,
      zoneId: zone.zoneId,
      capacity: Number(values.capacity),
      order: nextOrder,
      x: isEditMode ? tableToEdit!.x : GRID_X_POSITIONS[0],
      y: isEditMode ? tableToEdit!.y : GRID_Y_START,
    };
    onSubmit(newTable);
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title={
        isEditMode
          ? `แก้ไขโต๊ะในโซน: ${zone.zoneName}`
          : `เพิ่มโต๊ะใหม่ในโซน: ${zone.zoneName}`
      }
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEditMode ? 'บันทึก' : 'สร้างโต๊ะ'}
      cancelText="ยกเลิก"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ capacity: 8, order: 1 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tableId"
              label="รหัสโต๊ะ (เช่น T01, A1)"
              rules={[{ required: true, message: 'กรุณากรอกรหัสโต๊ะ' }]}
            >
              <Input placeholder="เช่น T01" disabled={isEditMode} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tableName"
              label="ชื่อโต๊ะ"
              rules={[{ required: true, message: 'กรุณากรอกชื่อโต๊ะ' }]}
            >
              <AutoComplete
                options={TABLE_NAME_OPTIONS}
                placeholder="เช่น โต๊ะจีน 1"
                filterOption={(inputValue, option) =>
                  option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="capacity"
              label="ความจุ (ที่นั่งสูงสุด)"
              rules={[{ required: true, message: 'กรุณากรอกความจุ' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="เช่น 8" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="order" label="ลำดับการแสดง (List)">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="note" label="หมายเหตุโต๊ะ">
          <Input.TextArea
            rows={2}
            placeholder="เช่น โต๊ะนี้ติดพัดลม, โต๊ะนี้อยู่มุมห้อง"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TableModal;

