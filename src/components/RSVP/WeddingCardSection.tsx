import React from 'react';
import { Button, Typography, Tag, Timeline } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { WEDDING_SCHEDULE } from '@/data/mockData';

const { Title, Text } = Typography;

type ScheduleItem = { time: string; title: string; desc?: string };

interface InviteConfig {
  eventTitle?: string;
  eventDate?: string;
  venueName?: string;
  address?: string;
  bannerImage?: string;
  bannerObjectFit?: 'cover' | 'contain';
  schedule?: ScheduleItem[];
}

interface WeddingCardSectionProps {
  onScrollToAction: () => void;
  config?: InviteConfig;
}

const WeddingCardSection: React.FC<WeddingCardSectionProps> = ({ onScrollToAction, config }) => {
  const bgImage = config?.bannerImage || 'https://images.unsplash.com/photo-1519225468359-69df3ef39f67?q=80&w=2070&auto=format&fit=crop';
  const bgFit = config?.bannerObjectFit || 'cover';
  const eventTitle = config?.eventTitle || 'Jane & Joe';
  const eventDate = config?.eventDate || '12 ธันวาคม 2025';
  const venue = config?.venueName || 'แกรนด์บอลรูม';
  const address = config?.address || '';
  const schedule = (config?.schedule && config?.schedule.length > 0 ? config?.schedule : (WEDDING_SCHEDULE as ScheduleItem[]));

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-center z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: bgFit,
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white/90"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-20 px-6 pb-10">
        {/* Title Area */}
        <div className="text-center text-white mb-8 animate-fade-in-up">
          <Text className="text-white/90 tracking-[4px] uppercase text-sm mb-2 block">The Wedding Of</Text>
          <Title
            level={1}
            className="font-serif italic text-white m-0"
            style={{
              fontSize: '3.5rem',
              textShadow: '0 4px 10px rgba(0,0,0,0.3)',
            }}
          >
            {eventTitle}
          </Title>
          <div className="w-16 h-1 bg-white/60 mx-auto my-4 rounded-full"></div>
          <Text className="text-white text-lg font-light block tracking-wide">{eventDate}</Text>
          <Tag icon={<EnvironmentOutlined />} color="gold" className="mt-3 border-none text-sm py-1 px-3 rounded-full">
            {venue}{address ? ` • ${address}` : ''}
          </Tag>
        </div>

        {/* Schedule Timeline Card */}
        <div className="bg-white/95 backdrop-blur-sm w-full max-w-md rounded-2xl shadow-2xl p-6 mt-auto mb-8 border border-white/50">
          <div className="text-center mb-6">
            <Title level={4} style={{ color: '#5c3a58', margin: 0 }}>
              <ClockCircleOutlined /> กำหนดการ
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ลำดับพิธีการมงคลสมรส
            </Text>
          </div>

          <Timeline
            mode="left"
            items={schedule.map((item, idx) => ({
              key: `${item.time}-${item.title}-${idx}`,
              label: <span className="font-bold text-gray-600">{item.time}</span>,
              color: idx % 2 === 0 ? 'blue' : 'pink',
              children: (
                <div className="pb-2">
                  <Text strong className="text-gray-800">
                    {item.title}
                  </Text>
                  {item.desc && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.desc}
                      </Text>
                    </>
                  )}
                </div>
              ),
            }))}
          />
        </div>

        {/* CTA Button */}
        <Button
          type="primary"
          shape="round"
          size="large"
          icon={<ArrowDownOutlined />}
          onClick={onScrollToAction}
          className="h-14 px-8 text-lg font-semibold shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none hover:scale-105 transition-transform animate-bounce"
        >
          ลงทะเบียนร่วมงาน (RSVP)
        </Button>
      </div>
    </div>
  );
};

export default WeddingCardSection;
