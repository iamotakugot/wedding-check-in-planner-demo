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
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">หน้าหลัก</h1>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="RSVP ทั้งหมด"
              value={rsvpStats.totalForms}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="ตอบรับเข้างาน"
              value={rsvpStats.totalComingForms}
              prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600', fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="จำนวนคนเข้างาน"
              value={totalAttendees}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="เช็คอินแล้ว"
              value={totalCheckedIn}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="แขกทั้งหมด"
              value={guests.length}
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="จัดโต๊ะแล้ว"
              value={totalSeated}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="โซน"
              value={zones.length}
              valueStyle={{ fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Statistic
              title="โต๊ะ"
              value={tables.length}
              valueStyle={{ fontSize: '20px', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

