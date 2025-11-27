/**
 * OTP Login Page Component
 * หน้ากรอกเบอร์โทรและ OTP สำหรับเข้าสู่ระบบ
 */

import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Card, Alert, message } from 'antd';
import { PhoneOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { AuthService } from '@/services/firebase/AuthService';
import { GuestProfileService } from '@/services/firebase/GuestProfileService';
import { AuditLogService } from '@/services/firebase/AuditLogService';
import { logger } from '@/utils/logger';
import { User } from 'firebase/auth';

/**
 * Validate Thai phone number
 * Supports: 0812345678, +66812345678, 66812345678
 */
const validateThaiPhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Must be 9-10 digits
  if (cleaned.length < 9 || cleaned.length > 10) {
    return { valid: false, error: 'เบอร์โทรศัพท์ต้องมี 9-10 หลัก' };
  }
  
  // If 9 digits, must not start with 0
  if (cleaned.length === 9 && cleaned.startsWith('0')) {
    return { valid: false, error: 'เบอร์โทรศัพท์ 9 หลักไม่สามารถขึ้นต้นด้วย 0 ได้' };
  }
  
  // If 10 digits, must start with 0
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return { valid: false, error: 'เบอร์โทรศัพท์ 10 หลักต้องขึ้นต้นด้วย 0' };
  }
  
  return { valid: true };
};

/**
 * Format countdown seconds to MM:SS
 */
const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const { Title, Text } = Typography;

interface OTPLoginPageProps {
  onBack: () => void; // กลับไปหน้า Intro
  onLoginSuccess: (user: User) => void; // เมื่อ login สำเร็จ
}

type Step = 'phone' | 'otp';

const OTPLoginPage: React.FC<OTPLoginPageProps> = ({ onBack, onLoginSuccess }) => {
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phoneInputRef = useRef<any>(null);
  const otpInputRef = useRef<any>(null);

  // Setup reCAPTCHA on mount
  useEffect(() => {
    const authService = AuthService.getInstance();
    authService.setupRecaptchaVerifier();
    
    return () => {
      // Cleanup on unmount
      authService.resetOTPFlow();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // Countdown timer - Fixed memory leak
  useEffect(() => {
    // Clear existing interval before creating new one
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      // Cleanup function - always clear interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [countdown]);

  const handlePhoneSubmit = async (values: { phoneNumber: string }) => {
    try {
      setLoading(true);
      setError(null);

      const phone = values.phoneNumber.trim();
      if (!phone) {
        setError('กรุณากรอกเบอร์โทรศัพท์');
        setLoading(false);
        return;
      }

      // Validate phone number
      const validation = validateThaiPhoneNumber(phone);
      if (!validation.valid) {
        setError(validation.error || 'เบอร์โทรศัพท์ไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      const authService = AuthService.getInstance();
      
      // Request OTP
      await authService.signInWithPhoneNumber(phone);
      
      setPhoneNumber(phone);
      setStep('otp');
      setCountdown(60); // 60 seconds countdown
      message.success('ส่งรหัส OTP ไปยังเบอร์โทรศัพท์ของคุณแล้ว');
      
      // Auto-focus on OTP input after a short delay
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }, 100);
      
    } catch (err: unknown) {
      logger.error('[OTPLoginPage] Error requesting OTP:', err);
      
      let errorMessage = 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const msg = String(err.message);
        
        // Handle specific Firebase errors
        if (msg.includes('invalid-phone-number') || msg.includes('เบอร์โทรศัพท์ไม่ถูกต้อง')) {
          errorMessage = 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        } else if (msg.includes('too-many-requests') || msg.includes('มากเกินไป')) {
          errorMessage = 'มีการขอรหัส OTP มากเกินไป กรุณารอสักครู่แล้วลองใหม่';
        } else if (msg.includes('quota-exceeded') || msg.includes('โควต้า')) {
          errorMessage = 'เกินโควต้าสำหรับวันนี้ กรุณาลองใหม่ในวันถัดไป';
        } else if (msg.includes('captcha') || msg.includes('reCAPTCHA')) {
          errorMessage = 'ไม่สามารถตรวจสอบ reCAPTCHA ได้ กรุณารีเฟรชหน้าแล้วลองใหม่';
        } else if (msg.includes('network') || msg.includes('เครือข่าย')) {
          errorMessage = 'เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่';
        } else {
          errorMessage = msg || errorMessage;
        }
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (values: { otp: string }) => {
    try {
      setLoading(true);
      setError(null);

      const otpCode = values.otp.trim().replace(/\s/g, '');
      if (!otpCode || otpCode.length !== 6) {
        setError('กรุณากรอกรหัส OTP 6 หลัก');
        setLoading(false);
        return;
      }

      const authService = AuthService.getInstance();
      
      // Verify OTP
      const user = await authService.verifyOTP(otpCode);
      
      // Create or update Guest Profile
      const profileService = GuestProfileService.getInstance();
      await profileService.createOrUpdateProfile(user, phoneNumber);
      
      // Log audit event
      const auditService = AuditLogService.getInstance();
      await auditService.create('login_with_phone', {
        phoneNumber,
        uid: user.uid,
      });
      
      message.success('เข้าสู่ระบบสำเร็จ');
      logger.log('[OTPLoginPage] Login successful:', user.uid);
      
      // Call success callback
      onLoginSuccess(user);
      
    } catch (err: unknown) {
      logger.error('[OTPLoginPage] Error verifying OTP:', err);
      
      let errorMessage = 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const msg = String(err.message);
        
        // Handle specific Firebase errors
        if (msg.includes('invalid-verification-code') || msg.includes('ไม่ถูกต้อง')) {
          errorMessage = 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        } else if (msg.includes('code-expired') || msg.includes('หมดอายุ')) {
          errorMessage = 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่';
        } else if (msg.includes('session-expired') || msg.includes('เซสชัน')) {
          errorMessage = 'เซสชันหมดอายุ กรุณาขอรหัส OTP ใหม่';
        } else if (msg.includes('ไม่มีข้อมูลการยืนยัน')) {
          errorMessage = 'ไม่มีข้อมูลการยืนยัน OTP กรุณาขอรหัสใหม่';
        } else if (msg.includes('network') || msg.includes('เครือข่าย')) {
          errorMessage = 'เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่';
        } else {
          errorMessage = msg || errorMessage;
        }
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      
      // Clear OTP input on error
      otpForm.setFieldsValue({ otp: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    try {
      setLoading(true);
      setError(null);

      const authService = AuthService.getInstance();
      await authService.signInWithPhoneNumber(phoneNumber);
      
      setCountdown(60); // Reset countdown
      message.success('ส่งรหัส OTP ใหม่ไปยังเบอร์โทรศัพท์ของคุณแล้ว');
      
    } catch (err: unknown) {
      logger.error('[OTPLoginPage] Error resending OTP:', err);
      
      let errorMessage = 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const msg = String(err.message);
        
        // Handle specific Firebase errors
        if (msg.includes('invalid-phone-number') || msg.includes('เบอร์โทรศัพท์ไม่ถูกต้อง')) {
          errorMessage = 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        } else if (msg.includes('too-many-requests') || msg.includes('มากเกินไป')) {
          errorMessage = 'มีการขอรหัส OTP มากเกินไป กรุณารอสักครู่แล้วลองใหม่';
        } else if (msg.includes('quota-exceeded') || msg.includes('โควต้า')) {
          errorMessage = 'เกินโควต้าสำหรับวันนี้ กรุณาลองใหม่ในวันถัดไป';
        } else if (msg.includes('captcha') || msg.includes('reCAPTCHA')) {
          errorMessage = 'ไม่สามารถตรวจสอบ reCAPTCHA ได้ กรุณารีเฟรชหน้าแล้วลองใหม่';
        } else if (msg.includes('network') || msg.includes('เครือข่าย')) {
          errorMessage = 'เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่';
        } else {
          errorMessage = msg || errorMessage;
        }
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const authService = AuthService.getInstance();
    authService.resetOTPFlow();
    setStep('phone');
    setPhoneNumber('');
    setError(null);
    setCountdown(0);
    phoneForm.resetFields();
    otpForm.resetFields();
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf8] to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card
          className="shadow-lg border-0 rounded-2xl"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #fdfcf8)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="absolute top-4 left-4"
            >
              กลับ
            </Button>
            
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5c3a58] text-white rounded-full mb-4">
              <PhoneOutlined style={{ fontSize: '32px' }} />
            </div>
            
            <Title level={3} className="!mb-2" style={{ color: '#5c3a58' }}>
              {step === 'phone' ? 'เข้าสู่ระบบด้วยเบอร์โทร' : 'ยืนยันรหัส OTP'}
            </Title>
            
            {step === 'phone' ? (
              <Text className="text-gray-600">
                กรุณากรอกเบอร์โทรศัพท์เพื่อรับรหัส OTP
              </Text>
            ) : (
              <Text className="text-gray-600">
                กรุณากรอกรหัส OTP ที่ส่งไปยัง<br />
                <strong>{phoneNumber}</strong>
              </Text>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              className="mb-6"
            />
          )}

          {/* Phone Form */}
          {step === 'phone' && (
            <Form
              form={phoneForm}
              layout="vertical"
              onFinish={handlePhoneSubmit}
              size="large"
            >
              <Form.Item
                name="phoneNumber"
                label="เบอร์โทรศัพท์"
                rules={[
                  { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const validation = validateThaiPhoneNumber(value);
                      if (validation.valid) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(validation.error || 'เบอร์โทรศัพท์ไม่ถูกต้อง'));
                    },
                  },
                ]}
              >
                <Input
                  ref={phoneInputRef}
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  placeholder="0812345678"
                  maxLength={10}
                  autoComplete="tel"
                  inputMode="tel"
                  className="h-12"
                  autoFocus
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    phoneForm.setFieldsValue({ phoneNumber: value });
                  }}
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="h-12 text-base font-medium bg-[#5c3a58] hover:bg-[#4a2e46] border-0"
                  style={{
                    minHeight: '48px',
                    borderRadius: '12px',
                  }}
                >
                  ส่งรหัส OTP
                </Button>
              </Form.Item>
            </Form>
          )}

          {/* OTP Form */}
          {step === 'otp' && (
            <Form
              form={otpForm}
              layout="vertical"
              onFinish={handleOTPSubmit}
              size="large"
            >
              <Form.Item
                name="otp"
                label="รหัส OTP"
                rules={[
                  { required: true, message: 'กรุณากรอกรหัส OTP' },
                  {
                    pattern: /^[0-9]{6}$/,
                    message: 'กรุณากรอกรหัส OTP 6 หลัก',
                  },
                ]}
              >
                <Input
                  ref={otpInputRef}
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    otpForm.setFieldsValue({ otp: value });
                    
                    // Auto-submit when 6 digits entered
                    if (value.length === 6 && !loading) {
                      setTimeout(() => {
                        otpForm.submit();
                      }, 100);
                    }
                  }}
                />
              </Form.Item>

              <Form.Item className="mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                  className="h-12 text-base font-medium bg-[#5c3a58] hover:bg-[#4a2e46] border-0"
                  style={{
                    minHeight: '48px',
                    borderRadius: '12px',
                  }}
                >
                  ยืนยันรหัส OTP
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text className="text-sm text-gray-600">
                  ไม่ได้รับรหัส OTP?{' '}
                </Text>
                {countdown > 0 ? (
                  <Text className="text-sm text-gray-500">
                    ส่งใหม่ได้ใน {formatCountdown(countdown)}
                  </Text>
                ) : (
                  <Button
                    type="link"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="p-0 h-auto text-sm"
                    style={{ color: '#5c3a58' }}
                  >
                    ส่งรหัสใหม่
                  </Button>
                )}
              </div>
            </Form>
          )}

          {/* reCAPTCHA container (invisible) */}
          <div id="recaptcha-container" className="hidden" />
        </Card>
      </div>
    </div>
  );
};

export default OTPLoginPage;
