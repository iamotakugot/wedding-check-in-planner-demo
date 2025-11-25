/**
 * In-App Browser Helper Banner
 * แบนเนอร์ช่วยเหลือสำหรับผู้ใช้ที่เปิดลิงก์จากแอปแชต (Messenger, LINE, Instagram, X)
 * เพื่อแนะนำให้เปิดในเบราว์เซอร์ภายนอกสำหรับการเข้าสู่ระบบ
 */

import React, { useState } from 'react';
import { Alert, Button, Space, message } from 'antd';
import { CopyOutlined, GlobalOutlined, CheckOutlined } from '@ant-design/icons';
import { isInAppBrowser, detectOS, getBrowserHelpText } from '@/utils/browserDetection';
import { copyToClipboard, openInExternalBrowser } from '@/utils/browserHelpers';

interface InAppBrowserBannerProps {
  onDismiss?: () => void;
}

export const InAppBrowserBanner: React.FC<InAppBrowserBannerProps> = ({ onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // ตรวจสอบว่าเป็น in-app browser หรือไม่
  if (!isInAppBrowser() || dismissed) {
    return null;
  }
  
  const os = detectOS();
  const helpText = getBrowserHelpText();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleCopyLink = async () => {
    const success = await copyToClipboard(currentUrl);
    
    if (success) {
      setCopied(true);
      message.success('คัดลอกลิงก์แล้ว • เปิดใน Safari หรือ Chrome ได้เลย');
      
      // Reset animation หลังจาก 1.5 วินาที
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } else {
      message.error('คัดลอกไม่สำเร็จ • ลองกดค้างที่ลิงก์แล้วเลือก Copy');
    }
  };
  
  const handleOpenExternal = () => {
    openInExternalBrowser(currentUrl);
    
    if (os === 'ios') {
      message.info('แตะปุ่ม … มุมล่างขวา แล้วเลือก "Open in Safari"');
    } else if (os === 'android') {
      message.info('กำลังเปิดใน Chrome...');
    }
  };
  
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2 md:px-4 pt-2 md:pt-4">
      <Alert
        message={
          <div className="space-y-2">
            <div className="font-semibold text-sm md:text-base text-[#5c3a58]">
              {helpText.title}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              {helpText.description}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {os === 'ios' ? helpText.iosHint : os === 'android' ? helpText.androidHint : ''}
            </div>
          </div>
        }
        type="warning"
        showIcon
        closable
        onClose={handleDismiss}
        className="shadow-lg border-2 border-orange-200"
        action={
          <Space direction="vertical" size="small" className="ml-2">
            <Button
              type="default"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyLink}
              className={copied ? 'bg-green-50 border-green-300 text-green-700' : ''}
            >
              {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<GlobalOutlined />}
              onClick={handleOpenExternal}
              className="bg-[#5c3a58] hover:bg-[#4a2e46] border-none"
            >
              เปิดในเบราว์เซอร์
            </Button>
          </Space>
        }
      />
    </div>
  );
};

