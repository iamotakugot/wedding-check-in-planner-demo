/**
 * Intro Page Component
 * หน้า Intro/การ์ดเชิญแต่งงานแบบ Basic UI, Mobile-First
 */

import React, { useState, useEffect } from 'react';
import { Button, Typography, Card, Skeleton } from 'antd';
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useConfig } from '@/hooks/useConfig';
import { defaultWeddingCardConfig, getOrderedNames } from '@/constants/weddingCard';
import { WeddingCardConfigFirebase } from '@/services/firebase/ConfigService';
import { logger } from '@/utils/logger';

const { Title, Text, Paragraph } = Typography;

interface IntroPageProps {
  onContinue: () => void; // Callback เมื่อกดปุ่ม "เข้าสู่ระบบด้วยเบอร์โทร"
}

const IntroPage: React.FC<IntroPageProps> = ({ onContinue }) => {
  const { weddingCardConfig, config, isLoading } = useConfig(true);
  const [configError, setConfigError] = useState(false);

  // Handle config loading timeout
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        logger.warn('[IntroPage] Config loading timeout, using default config');
        setConfigError(true);
      }, 5000); // 5 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // ใช้ default config ถ้าไม่มีข้อมูลจาก Firebase หรือมี error
  const cardConfig: WeddingCardConfigFirebase = weddingCardConfig || {
    ...defaultWeddingCardConfig,
  };

  const { first, second } = getOrderedNames(cardConfig);
  const configData = config || {};

  // Show skeleton loading while loading config
  if (isLoading && !configError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdfcf8] to-white">
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden mb-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
          <Skeleton.Button active block size="large" className="h-12 mb-3" />
          <Skeleton.Button active block size="large" className="h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfcf8] to-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Wedding Card */}
        <Card
          className="shadow-lg border-0 rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #fdfcf8)',
          }}
        >
          {/* Header - Names */}
          <div className="text-center mb-6 px-4">
            {cardConfig.showParentsAtTop && (
              <div className="mb-4">
                <Text className="text-xs text-gray-600 block mb-1">
                  {cardConfig.parents.groom.father} & {cardConfig.parents.groom.mother}
                </Text>
                <Text className="text-xs text-gray-600 block">
                  {cardConfig.parents.bride.father} & {cardConfig.parents.bride.mother}
                </Text>
              </div>
            )}
            
            <Title
              level={2}
              className="!mb-2 !text-2xl sm:!text-3xl font-serif"
              style={{ color: '#5c3a58', fontFamily: 'var(--font-serif, Cinzel, serif)' }}
            >
              {first.fullNameThai}
            </Title>
            
            <Text className="text-base sm:text-lg text-gray-600 block mb-4">
              &
            </Text>
            
            <Title
              level={2}
              className="!mb-4 !text-2xl sm:!text-3xl font-serif"
              style={{ color: '#5c3a58', fontFamily: 'var(--font-serif, Cinzel, serif)' }}
            >
              {second.fullNameThai}
            </Title>

            {!cardConfig.showParentsAtTop && (
              <div className="mt-4 text-xs text-gray-500">
                <Text className="block mb-1">
                  {cardConfig.parents.groom.father} & {cardConfig.parents.groom.mother}
                </Text>
                <Text className="block">
                  {cardConfig.parents.bride.father} & {cardConfig.parents.bride.mother}
                </Text>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6" />

          {/* Wedding Details */}
          <div className="text-center px-4 mb-6">
            {configData.weddingDate && (
              <div className="mb-4">
                <Text className="text-sm sm:text-base text-gray-700 block font-medium">
                  {configData.weddingDate}
                </Text>
              </div>
            )}

            {configData.venue && (
              <div className="mb-4">
                <Text className="text-sm sm:text-base text-gray-700 block">
                  <EnvironmentOutlined className="mr-2" />
                  {configData.venue}
                </Text>
              </div>
            )}

            <Paragraph className="text-sm sm:text-base text-gray-600 !mb-0">
              ด้วยความยินดีขอเชิญท่านมาร่วมเป็นเกียรติ
              <br />
              ในงานพิธีมงคลสมรสของเรา
            </Paragraph>
          </div>

          {/* Dress Code (ถ้ามี) */}
          {cardConfig.dressCode && cardConfig.dressCode.colors && cardConfig.dressCode.colors.length > 0 && (
            <div className="px-4 mb-6 text-center">
              <Text className="text-xs sm:text-sm text-gray-600 block mb-2">
                {cardConfig.dressCode.label || 'Dress Code:'}
              </Text>
              <div className="flex justify-center gap-2 flex-wrap">
                {cardConfig.dressCode.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            type="primary"
            size="large"
            block
            icon={<PhoneOutlined />}
            onClick={onContinue}
            className="h-12 sm:h-14 text-base sm:text-lg font-medium bg-[#5c3a58] hover:bg-[#4a2e46] border-0"
            style={{
              minHeight: '48px',
              borderRadius: '12px',
            }}
          >
            เข้าสู่ระบบด้วยเบอร์โทร
          </Button>

          {configData.venueMapLink && (
            <Button
              size="large"
              block
              icon={<EnvironmentOutlined />}
              onClick={() => {
                if (configData.venueMapLink) {
                  window.open(configData.venueMapLink, '_blank');
                }
              }}
              className="h-12 sm:h-14 text-base sm:text-lg border-[#5c3a58] text-[#5c3a58] hover:bg-[#f5f0f4]"
              style={{
                minHeight: '48px',
                borderRadius: '12px',
              }}
            >
              ดูแผนที่ / สถานที่จัดงาน
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntroPage;

