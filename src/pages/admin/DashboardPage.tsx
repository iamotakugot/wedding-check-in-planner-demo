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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="RSVP ทั้งหมด"
              value={rsvpStats.totalForms}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ตอบรับเข้างาน"
              value={rsvpStats.totalComingForms}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="จำนวนคนเข้างาน"
              value={totalAttendees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="เช็คอินแล้ว"
              value={totalCheckedIn}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="แขกทั้งหมด"
              value={guests.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="จัดโต๊ะแล้ว"
              value={totalSeated}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="โซน"
              value={zones.length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="โต๊ะ"
              value={tables.length}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

