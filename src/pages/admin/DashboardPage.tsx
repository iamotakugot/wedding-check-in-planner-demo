/**
 * Admin Dashboard Page
 * แสดงสถิติพื้นฐาน (เรียบง่าย)
 */

import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { calculateTotalAttendees, calculateCheckedInCount, calculateRsvpStats } from '@/utils/rsvpHelpers';

const DashboardPage: React.FC = () => {
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs();
  const { guests, isLoading: guestsLoading } = useGuests();
  const { zones, isLoading: zonesLoading } = useZones();
  const { tables, isLoading: tablesLoading } = useTables();

  const isLoading = rsvpsLoading || guestsLoading || zonesLoading || tablesLoading;

  // Calculate statistics
  const rsvpStats = useMemo(() => calculateRsvpStats(rsvps), [rsvps]);
  const totalAttendees = useMemo(() => calculateTotalAttendees(rsvps), [rsvps]);
  const totalCheckedIn = useMemo(() => calculateCheckedInCount(guests), [guests]);
  const totalSeated = useMemo(() => {
    return guests.filter(g => g.zoneId && g.tableId).length;
  }, [guests]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-gray-800">
        หน้าหลัก
      </h1>
      
      <Row gutter={[12, 12]} className="sm:gutter-[16px]">
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">RSVP ทั้งหมด</span>}
              value={rsvpStats.totalForms}
              prefix={<FileTextOutlined style={{ color: '#1890ff', fontSize: '18px' }} />}
              valueStyle={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">ตอบรับเข้างาน</span>}
              value={rsvpStats.totalComingForms}
              prefix={<CheckCircleOutlined style={{ color: '#3f8600', fontSize: '18px' }} />}
              valueStyle={{ 
                color: '#3f8600', 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">จำนวนคนเข้างาน</span>}
              value={totalAttendees}
              prefix={<TeamOutlined style={{ color: '#722ed1', fontSize: '18px' }} />}
              valueStyle={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">เช็คอินแล้ว</span>}
              value={totalCheckedIn}
              prefix={<UserOutlined style={{ color: '#1890ff', fontSize: '18px' }} />}
              valueStyle={{ 
                color: '#1890ff', 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">แขกทั้งหมด</span>}
              value={guests.length}
              prefix={<TeamOutlined style={{ color: '#fa8c16', fontSize: '18px' }} />}
              valueStyle={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">จัดโต๊ะแล้ว</span>}
              value={totalSeated}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1', fontSize: '18px' }} />}
              valueStyle={{ 
                color: '#722ed1', 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">โซน</span>}
              value={zones.length}
              valueStyle={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow h-full"
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title={<span className="text-xs sm:text-sm">โต๊ะ</span>}
              value={tables.length}
              valueStyle={{ 
                fontSize: 'clamp(18px, 4vw, 24px)', 
                fontWeight: 600,
                lineHeight: '1.2'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

