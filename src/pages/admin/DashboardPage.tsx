/**
 * Admin Dashboard Page
 * แสดงสถิติและสิ่งที่ต้องทำ
 */

import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, Progress, List, Button, Tag, Typography, Space, Avatar } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  ExclamationCircleOutlined,
  TableOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { calculateTotalAttendees, calculateCheckedInCount, calculateRsvpStats } from '@/utils/rsvpHelpers';
import { formatGuestName } from '@/utils/guestHelpers';

const { Text, Title } = Typography;

interface DashboardPageProps {
  onNavigate?: (view: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs();
  const { guests, isLoading: guestsLoading } = useGuests();
  const { zones, isLoading: zonesLoading } = useZones();
  const { tables, isLoading: tablesLoading } = useTables();
  const { guestGroups } = useGuestGroups();

  const isLoading = rsvpsLoading || guestsLoading || zonesLoading || tablesLoading;

  // Calculate visible guests (exclude duplicates)
  const visibleGuests = useMemo(() => {
    const processedGroupIds = new Set<string>();
    const processedGuestIds = new Set<string>();
    let count = 0;

    // 1. Count guests in groups
    guestGroups.forEach(group => {
      if (group.totalCount > 1 && !processedGroupIds.has(group.groupId)) {
        const groupGuests = group.members
          .map(member => guests.find(g => g.id === member.id))
          .filter(g => g !== undefined);

        if (groupGuests.length > 0) {
          count += groupGuests.length;
          groupGuests.forEach(g => processedGuestIds.add(g!.id));
          processedGroupIds.add(group.groupId);
        }
      }
    });

    // 2. Count individual guests
    guests.forEach(guest => {
      if (!processedGuestIds.has(guest.id)) {
        let group = null;
        if (guest.groupId) group = guestGroups.find(g => g.groupId === guest.groupId);
        if (!group && guest.rsvpUid) group = guestGroups.find(g => g.groupId === guest.rsvpUid);
        if (!group && guest.rsvpId) group = guestGroups.find(g => g.groupId === guest.rsvpId);
        if (!group) group = guestGroups.find(g => g.members.some(m => m.id === guest.id));

        if (group) {
          const isInGroupMembers = group.members.some(m => m.id === guest.id);
          if (!isInGroupMembers) {
            processedGuestIds.add(guest.id);
            return;
          }
        }

        const guestFullName = `${guest.firstName} ${guest.lastName}`.trim().toLowerCase();
        const isDuplicateMainGuest = guestGroups.some(g => {
          if (g.members.length === 0) return false;
          const mainGuest = g.members[0];
          const mainGuestFullName = `${mainGuest.firstName} ${mainGuest.lastName}`.trim().toLowerCase();
          if (guestFullName === mainGuestFullName && mainGuestFullName !== '') {
            const isInThisGroup = g.members.some(m => m.id === guest.id);
            return !isInThisGroup;
          }
          return false;
        });

        if (isDuplicateMainGuest) {
          processedGuestIds.add(guest.id);
          return;
        }

        if (!group || group.totalCount <= 1) {
          count++;
          processedGuestIds.add(guest.id);
        }
      }
    });

    return count;
  }, [guests, guestGroups]);

  // Calculate statistics
  const rsvpStats = useMemo(() => calculateRsvpStats(rsvps), [rsvps]);
  const totalAttendees = useMemo(() => calculateTotalAttendees(rsvps), [rsvps]);
  const totalCheckedIn = useMemo(() => calculateCheckedInCount(guests), [guests]);
  const totalSeated = useMemo(() => {
    return guests.filter(g => g.zoneId && g.tableId).length;
  }, [guests]);

  // Action Items Logic
  const guestsToCall = useMemo(() => {
    // Guests who have phone number AND (RSVP is 'no' OR no RSVP yet)
    // Note: This logic assumes we want to call people to confirm/change mind
    // Or maybe we want to call people who haven't RSVP'd at all?
    // For now, let's list guests with phone numbers who are NOT 'yes'
    return guests.filter(g =>
      g.phoneNumber &&
      !g.isComing // Covers false and undefined
    ).slice(0, 5); // Show top 5
  }, [guests]);

  const unseatedGuests = useMemo(() => {
    return guests.filter(g => g.isComing && (!g.tableId || !g.zoneId)).slice(0, 5);
  }, [guests]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spin spinning={true} tip="กำลังโหลดข้อมูล..." size="large">
          <div style={{ minHeight: '100px' }} />
        </Spin>
      </div>
    );
  }

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Title level={2} className="m-0 text-gray-800">ภาพรวมงานแต่ง</Title>
          <Text type="secondary">สรุปข้อมูลล่าสุดและสิ่งที่ต้องจัดการ</Text>
        </div>

        {/* Key Metrics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="shadow-sm h-full">
              <Statistic
                title="ผู้เข้าร่วมงานทั้งหมด"
                value={totalAttendees}
                prefix={<TeamOutlined className="text-purple-500" />}
                suffix="คน"
                valueStyle={{ fontWeight: 'bold', color: '#722ed1' }}
              />
              <Progress
                percent={Math.round((totalAttendees / (guests.length || 1)) * 100)}
                strokeColor="#722ed1"
                size="small"
                className="mt-2"
                showInfo={false}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>จากแขกทั้งหมด {visibleGuests} คน</span>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="shadow-sm h-full">
              <Statistic
                title="ตอบรับแล้ว (RSVP)"
                value={rsvpStats.totalComingForms}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                suffix="รายการ"
                valueStyle={{ fontWeight: 'bold', color: '#52c41a' }}
              />
              <div className="mt-2 text-sm text-gray-500">
                <Space>
                  <Tag color="green">{rsvpStats.totalComingForms} มา</Tag>
                  <Tag color="red">{rsvpStats.totalNotComingForms} ไม่มา</Tag>
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="shadow-sm h-full">
              <Statistic
                title="เช็คอินหน้างาน"
                value={totalCheckedIn}
                prefix={<UserOutlined className="text-blue-500" />}
                suffix="คน"
                valueStyle={{ fontWeight: 'bold', color: '#1890ff' }}
              />
              <Progress
                percent={Math.round((totalCheckedIn / (totalAttendees || 1)) * 100)}
                strokeColor="#1890ff"
                size="small"
                className="mt-2"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="shadow-sm h-full">
              <Statistic
                title="จัดโต๊ะแล้ว"
                value={totalSeated}
                prefix={<TableOutlined className="text-orange-500" />}
                suffix="คน"
                valueStyle={{ fontWeight: 'bold', color: '#fa8c16' }}
              />
              <Progress
                percent={Math.round((totalSeated / (totalAttendees || 1)) * 100)}
                strokeColor="#fa8c16"
                size="small"
                className="mt-2"
              />
            </Card>
          </Col>
        </Row>

        {/* Action Items & Details */}
        <Row gutter={[16, 16]}>
          {/* Left Column: Action Items */}
          <Col xs={24} lg={16}>
            <Card
              title={<Space><ExclamationCircleOutlined className="text-red-500" /> สิ่งที่ต้องจัดการ</Space>}
              bordered={false}
              className="shadow-sm mb-4"
            >
              <List
                header={<Text strong>แขกที่ยังไม่มีโต๊ะนั่ง ({guests.filter(g => g.isComing && !g.tableId).length})</Text>}
                dataSource={unseatedGuests}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => handleNavigate('seating')}>จัดโต๊ะ</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} className="bg-orange-100 text-orange-600" />}
                      title={formatGuestName(item)}
                      description={<Tag color={item.side === 'groom' ? 'blue' : 'magenta'}>{item.side === 'groom' ? 'เจ้าบ่าว' : 'เจ้าสาว'}</Tag>}
                    />
                  </List.Item>
                )}
                footer={
                  unseatedGuests.length > 0 && (
                    <div className="text-center">
                      <Button type="link" onClick={() => handleNavigate('seating')}>
                        ดูทั้งหมด <ArrowRightOutlined />
                      </Button>
                    </div>
                  )
                }
                locale={{ emptyText: 'จัดการครบแล้ว เยี่ยมมาก!' }}
              />
            </Card>

            <Card
              title={<Space><PhoneOutlined className="text-blue-500" /> แขกที่ควรโทรติดตาม</Space>}
              bordered={false}
              className="shadow-sm"
            >
              <List
                dataSource={guestsToCall}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<PhoneOutlined />}
                        href={`tel:${item.phoneNumber}`}
                      >
                        โทร
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={formatGuestName(item)}
                      description={
                        <Space>
                          <Text type="secondary">{item.phoneNumber}</Text>
                          <Tag>{item.isComing === false ? 'ไม่มา' : 'ยังไม่ตอบ'}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                footer={
                  guestsToCall.length > 0 && (
                    <div className="text-center">
                      <Button type="link" onClick={() => handleNavigate('guests')}>
                        ดูรายชื่อทั้งหมด <ArrowRightOutlined />
                      </Button>
                    </div>
                  )
                }
                locale={{ emptyText: 'ไม่มีรายการที่ต้องติดตาม' }}
              />
            </Card>
          </Col>

          {/* Right Column: Quick Stats */}
          <Col xs={24} lg={8}>
            <Card title="ข้อมูลโซนและโต๊ะ" bordered={false} className="shadow-sm mb-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="โซนทั้งหมด" value={zones.length} />
                </Col>
                <Col span={12}>
                  <Statistic title="โต๊ะทั้งหมด" value={tables.length} />
                </Col>
              </Row>
              <div className="mt-4">
                <Button block onClick={() => handleNavigate('seating')}>จัดการผังที่นั่ง</Button>
              </div>
            </Card>

            <Card title="การตอบรับล่าสุด" bordered={false} className="shadow-sm">
              <List
                size="small"
                dataSource={rsvps.slice(0, 5)}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.firstName} ${item.lastName}`}
                      description={<Text type="secondary" style={{ fontSize: '12px' }}>{new Date(item.createdAt).toLocaleDateString('th-TH')}</Text>}
                    />
                    <Tag color={item.isComing === 'yes' ? 'green' : 'red'}>
                      {item.isComing === 'yes' ? 'มา' : 'ไม่มา'}
                    </Tag>
                  </List.Item>
                )}
                footer={
                  <div className="text-center">
                    <Button type="link" onClick={() => handleNavigate('rsvps')}>
                      ดูทั้งหมด <ArrowRightOutlined />
                    </Button>
                  </div>
                }
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DashboardPage;
