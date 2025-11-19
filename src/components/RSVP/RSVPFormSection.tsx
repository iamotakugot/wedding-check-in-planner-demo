import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Radio,
  Card,
  Typography,
  Space,
  AutoComplete,
  InputNumber,
  Alert,
  Divider,
} from 'antd';
import {
  UserOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  FrownOutlined,
  SmileOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  NOTE_OPTIONS,
  ACCOMPANYING_RELATION_OPTIONS,
  RELATION_OPTIONS,
} from '@/data/mockData';
import { RSVPData } from '@/types';

const { Title, Text } = Typography;

interface RSVPFormSectionProps {
  initialValues: Partial<RSVPData>;
  onFinish: (values: any) => void;
  loading: boolean;
  isEditing: boolean;
  loggedInName: string;
  activeSection: 'all' | 'personal' | 'guests';
  onCancel: () => void;
}

const RSVPFormSection: React.FC<RSVPFormSectionProps> = ({
  initialValues,
  onFinish,
  loading,
  isEditing,
  loggedInName,
  activeSection,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const isComing = Form.useWatch('isComing', form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  let sectionTitle = 'แบบฟอร์มลงทะเบียน';
  if (activeSection === 'personal') sectionTitle = 'แก้ไขข้อมูลส่วนตัว';
  if (activeSection === 'guests') sectionTitle = 'จัดการผู้ติดตาม';

  return (
    <div className="w-full max-w-md mx-auto pt-6 pb-10 px-4">
      <div className="text-center mb-8 relative">
        {isEditing && (
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="absolute left-0 top-1 text-gray-500"
            onClick={onCancel}
          >
            กลับ
          </Button>
        )}
        <Title level={3} style={{ margin: 0, color: '#5c3a58' }}>
          {sectionTitle}
        </Title>
        <Text type="secondary">บัญชี: {loggedInName}</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
        initialValues={initialValues}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Confirmation - Show only in 'all' or 'personal' mode */}
          <div className={activeSection === 'guests' ? 'hidden' : ''}>
            <Card className="shadow-sm border-red-100 bg-red-50/50 rounded-2xl transition-all duration-300">
              <Form.Item
                label="คุณยืนยันการเข้าร่วมงานหรือไม่?"
                name="isComing"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <Radio.Group className="w-full grid grid-cols-2 gap-3">
                  <Radio.Button
                    value="yes"
                    className={`h-16 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                      isComing === 'yes'
                        ? 'bg-green-50 border-green-500 text-green-600 scale-105 shadow-md'
                        : 'bg-white border-gray-200 text-gray-400 grayscale'
                    }`}
                  >
                    <span className="text-lg font-bold flex items-center gap-2">
                      {isComing === 'yes' && <CheckCircleOutlined className="animate-bounce" />} 🎉
                      ยืนยัน
                    </span>
                  </Radio.Button>
                  <Radio.Button
                    value="no"
                    className={`h-16 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                      isComing === 'no'
                        ? 'bg-red-50 border-red-500 text-red-600 scale-105 shadow-md'
                        : 'bg-white border-gray-200 text-gray-400 grayscale'
                    }`}
                  >
                    <span className="text-lg font-bold flex items-center gap-2">
                      {isComing === 'no' && <FrownOutlined className="animate-bounce" />} ❌ ไม่สะดวก
                    </span>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Card>
          </div>

          {/* Form Fields Container */}
          <div
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              isComing === 'yes'
                ? 'max-h-[2000px] opacity-100 translate-y-0'
                : 'max-h-0 opacity-0 -translate-y-4'
            }`}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Personal Info Section */}
              <div className={activeSection === 'guests' ? 'hidden' : ''}>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                  <Divider
                    orientation="left"
                    style={{ margin: '0 0 16px 0', color: '#888' }}
                  >
                    <UserOutlined /> ข้อมูลส่วนตัว
                  </Divider>
                  <Form.Item label="ชื่อจริง" name="firstName" style={{ marginBottom: 12 }}>
                    <Input className="rounded-lg" />
                  </Form.Item>
                  <Form.Item label="นามสกุล" name="lastName" style={{ marginBottom: 12 }}>
                    <Input className="rounded-lg" />
                  </Form.Item>
                  <Form.Item label="ชื่อเล่น" name="nickname" style={{ marginBottom: 0 }}>
                    <Input
                      prefix={<SmileOutlined className="text-gray-400" />}
                      className="rounded-lg"
                    />
                  </Form.Item>
                </div>

                <div className="mt-6">
                  <Form.Item
                    label={<span className="text-lg font-semibold text-gray-700">คุณเป็นแขกของใคร?</span>}
                    name="side"
                    rules={[{ required: true }]}
                  >
                    <Radio.Group className="w-full grid grid-cols-2 gap-4">
                      <Radio.Button
                        value="groom"
                        className="h-24 flex flex-col items-center justify-center rounded-2xl border-2 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                      >
                        <span className="text-3xl mb-1">🤵🏻</span>
                        <span className="text-blue-600 font-medium">ฝ่ายเจ้าบ่าว</span>
                      </Radio.Button>
                      <Radio.Button
                        value="bride"
                        className="h-24 flex flex-col items-center justify-center rounded-2xl border-2 hover:border-pink-500 hover:bg-pink-50 transition-all active:scale-95"
                      >
                        <span className="text-3xl mb-1">👰🏻‍♀️</span>
                        <span className="text-pink-600 font-medium">ฝ่ายเจ้าสาว</span>
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div className="space-y-4 mt-6">
                  <Form.Item label="กลุ่ม / ความสัมพันธ์ (ของคุณ)" name="relation">
                    <AutoComplete
                      options={RELATION_OPTIONS}
                      placeholder="เช่น เพื่อนมหาลัย"
                      className="rounded-lg"
                    />
                  </Form.Item>
                  <Form.Item label="ข้อจำกัดอาหาร / หมายเหตุ" name="note">
                    <AutoComplete
                      options={NOTE_OPTIONS}
                      placeholder="เช่น แพ้กุ้ง"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Guests Section */}
              <div className={activeSection === 'personal' ? 'hidden' : ''}>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                  <Divider
                    orientation="left"
                    style={{ margin: '0 0 16px 0', color: '#888' }}
                  >
                    <UsergroupAddOutlined /> ผู้ติดตาม
                  </Divider>

                  <Form.List name="accompanyingGuests">
                    {(fields, { add, remove }) => (
                      <>
                        <Form.Item
                          label="จำนวนผู้ติดตาม (ไม่รวมตัวคุณ)"
                          style={{ marginBottom: 20 }}
                        >
                          <InputNumber
                            min={0}
                            max={10}
                            style={{ width: '100%' }}
                            className="rounded-lg"
                            size="large"
                            value={fields.length}
                            onChange={(val) => {
                              const targetCount = val || 0;
                              const currentCount = fields.length;
                              if (targetCount > currentCount) {
                                for (let i = 0; i < targetCount - currentCount; i++) {
                                  add({ name: '', relationToMain: '' });
                                }
                              } else if (targetCount < currentCount) {
                                for (let i = 0; i < currentCount - targetCount; i++) {
                                  remove(fields.length - 1 - i);
                                }
                              }
                              form.setFieldValue('accompanyingGuestsCount', targetCount);
                            }}
                          />
                          <Form.Item name="accompanyingGuestsCount" hidden>
                            <Input />
                          </Form.Item>
                        </Form.Item>

                        <div className="space-y-4 animate-fade-in">
                          {fields.map((field, idx) => (
                            <div
                              key={field.key}
                              className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200 animate-slide-up"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <Text strong className="text-gray-500 text-xs uppercase">
                                  คนที่ {idx + 1}
                                </Text>
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  onClick={() => remove(field.name)}
                                >
                                  ลบ
                                </Button>
                              </div>
                              <Form.Item
                                {...field}
                                name={[field.name, 'name']}
                                rules={[{ required: true, message: 'ระบุชื่อ' }]}
                                style={{ marginBottom: 8 }}
                              >
                                <Input placeholder="ชื่อผู้ติดตาม" />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'relationToMain']}
                                rules={[{ required: true, message: 'ระบุความสัมพันธ์' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <AutoComplete
                                  options={ACCOMPANYING_RELATION_OPTIONS}
                                  placeholder="ความสัมพันธ์ (เช่น แฟน)"
                                />
                              </Form.Item>
                            </div>
                          ))}
                          {fields.length === 0 && (
                            <div className="text-center text-gray-400 py-4 border border-dashed rounded-lg">
                              ไม่มีผู้ติดตาม
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </Form.List>
                </div>
              </div>
            </Space>
          </div>

          {/* Not Coming Message */}
          <div className={activeSection === 'guests' ? 'hidden' : ''}>
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isComing === 'no' ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}
            >
              <Alert
                message="เสียดายจัง!"
                description="ไว้โอกาสหน้าเจอกันนะครับ ขอบคุณที่แจ้งให้เราทราบครับ 🙏"
                type="warning"
                showIcon
                icon={<FrownOutlined />}
                className="rounded-xl border-orange-200 bg-orange-50 text-orange-800 shadow-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div
            className={`transition-all duration-500 ${
              isComing ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'
            }`}
          >
            {isComing && (
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  height: 60,
                  borderRadius: 30,
                  fontSize: 20,
                  fontWeight: 600,
                }}
                className={`border-none shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all ${
                  isComing === 'yes'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                    : 'bg-gray-500'
                }`}
              >
                {isComing === 'yes' ? 'บันทึกข้อมูล' : 'ส่งคำตอบ'}
              </Button>
            )}
          </div>
        </Space>
      </Form>
    </div>
  );
};

export default RSVPFormSection;
