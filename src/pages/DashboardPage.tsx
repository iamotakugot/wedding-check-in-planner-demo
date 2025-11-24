import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Progress, Tag, Button, Alert, Space, Divider } from 'antd';
import {
  TeamOutlined,
  AppstoreOutlined,
  UserOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  TableOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { Guest, Zone, TableData, Side } from '@/types';
import type { RSVPData } from '@/types';
import { getGuestsFromRSVP, getTotalPeopleFromRSVP } from '@/utils/rsvpHelpers';

const { Title, Text } = Typography;

interface DashboardPageProps {
  onChangePage: (key: string) => void;
  guests: Guest[];
  zones: Zone[];
  tables: TableData[];
  rsvps?: RSVPData[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  onChangePage,
  guests,
  zones,
  tables,
  rsvps = [],
}) => {
  // ============================================================================
  // 🔧 DevOps: คำนวณ Statistics จาก RSVPs เท่านั้น (Source of Truth)
  // ============================================================================
  const totalRSVPs = useMemo(() => {
    return rsvps && rsvps.length > 0 ? rsvps.length : 0;
  }, [rsvps]);
  
  const rsvpsComing = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.filter((r) => r && r.isComing === 'yes').length;
  }, [rsvps]);
  
  const rsvpsNotComing = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.filter((r) => r && r.isComing === 'no').length;
  }, [rsvps]);
  
  const rsvpsPending = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.filter((r) => r && !r.isComing).length;
  }, [rsvps]);

  // 🔧 DevOps: ตรวจสอบว่า RSVP ไหนถูกนำเข้าแล้ว
  const rsvpsImported = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    if (!guests || guests.length === 0) return 0;
    
    return rsvps.filter(r => {
      if (!r || r.isComing !== 'yes') return false;
      const relatedGuests = getGuestsFromRSVP(r, guests);
      return relatedGuests.length > 0;
    }).length;
  }, [rsvps, guests]);

  const rsvpsNotImported = useMemo(() => {
    return rsvpsComing - rsvpsImported;
  }, [rsvpsComing, rsvpsImported]);

  // 🔧 DevOps: คำนวณจำนวนคนทั้งหมดจาก RSVP
  const totalPeopleFromRSVP = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.reduce((acc, rsvp) => {
      if (rsvp && rsvp.isComing === 'yes') {
        return acc + getTotalPeopleFromRSVP(rsvp);
      }
      return acc;
    }, 0);
  }, [rsvps]);

  // 🔧 DevOps: คำนวณจำนวนกลุ่มจาก RSVP
  const totalGroupsFromRSVP = rsvpsComing;

  // 🔧 DevOps: คำนวณฝ่ายจาก RSVP
  const sideCountsFromRSVP = useMemo(() => {
    const counts: Record<Side, number> = { groom: 0, bride: 0, both: 0 };
    if (!rsvps || rsvps.length === 0) return counts;
    
    rsvps.forEach((rsvp) => {
      if (rsvp && rsvp.isComing === 'yes' && rsvp.side) {
        counts[rsvp.side] = (counts[rsvp.side] || 0) + 1;
      }
    });
    return counts;
  }, [rsvps]);

  // 🔧 DevOps: คำนวณ Guest statistics จาก Guests ที่ link กับ RSVP
  const guestsFromRSVP = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return [];
    if (!guests || guests.length === 0) return [];
    
    const guestSet = new Set<string>();
    rsvps.forEach(rsvp => {
      if (rsvp && rsvp.isComing === 'yes') {
        const relatedGuests = getGuestsFromRSVP(rsvp, guests);
        relatedGuests.forEach(g => guestSet.add(g.id));
      }
    });
    return guests.filter(g => guestSet.has(g.id));
  }, [rsvps, guests]);

  const totalGuestsFromRSVP = guestsFromRSVP.length;
  const totalSeatedFromRSVP = guestsFromRSVP.filter((g) => g.zoneId !== null && g.zoneId !== undefined).length;
  const totalCheckedInFromRSVP = guestsFromRSVP.filter((g) => g.checkedInAt !== null && g.checkedInAt !== undefined).length;

  // 🔧 DevOps Fix: คำนวณจำนวนกลุ่มจาก RSVP (Source of Truth) แทน Guests
  const totalGroupsFromGuests = useMemo(() => {
    // จำนวน RSVP ที่ตอบรับ = จำนวนกลุ่ม
    return rsvpsComing;
  }, [rsvpsComing]);

  // ============================================================================
  // 🔧 DevOps: Zone Summary จาก Guests ที่มาจาก RSVP
  // ============================================================================
  const zoneSummary = zones
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((zone) => {
      const seated = guestsFromRSVP.filter((g) => g.zoneId === zone.zoneId).length;
      const zoneTables = tables.filter((t) => t.zoneId === zone.zoneId);
      const zoneCapacity = zoneTables.reduce((acc, t) => acc + t.capacity, 0);
      const checkedIn = guestsFromRSVP.filter((g) => g.zoneId === zone.zoneId && g.checkedInAt !== null && g.checkedInAt !== undefined).length;

      return {
        key: zone.zoneId,
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        capacity: zoneCapacity,
        seated: seated,
        checkedIn: checkedIn,
        totalTables: zoneTables.length,
      };
    });

  const columns: TableProps<typeof zoneSummary[0]>['columns'] = [
    {
      title: 'ชื่อโซน',
      dataIndex: 'zoneName',
      key: 'zoneName',
      render: (text: string) => <Text strong>{text}</Text>,
      responsive: ['sm'],
    },
    {
      title: 'จำนวนโต๊ะ',
      dataIndex: 'totalTables',
      key: 'totalTables',
      align: 'center' as const,
      responsive: ['md'],
    },
    {
      title: 'ความจุ (คน)',
      dataIndex: 'capacity',
      key: 'capacity',
      align: 'center' as const,
      responsive: ['md'],
    },
    {
      title: 'นั่งแล้ว',
      dataIndex: 'seated',
      key: 'seated',
      align: 'center' as const,
    },
    {
      title: 'เช็คอินแล้ว',
      dataIndex: 'checkedIn',
      key: 'checkedIn',
      align: 'center' as const,
      render: (checkedIn: number, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{checkedIn}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            จาก {record.seated} คน
          </Text>
        </Space>
      ),
    },
    {
      title: 'สถานะที่นั่ง',
      key: 'status',
      width: 150,
      render: (_, record) => {
        if (record.capacity === 0) return <Tag>ยังไม่ระบุโต๊ะ</Tag>;
        const percent = Math.round((record.seated / record.capacity) * 100);
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent >= 100 ? 'exception' : 'active'}
          />
        );
      },
    },
    {
      title: 'ที่นั่งว่าง',
      key: 'vacancy',
      align: 'center' as const,
      width: 100,
      render: (_, record) => {
        const vacancy = record.capacity - record.seated;
        if (record.capacity === 0) return <Tag color="default">N/A</Tag>;
        if (vacancy <= 0)
          return <Tag color="red">{Math.abs(vacancy) > 0 ? `เกิน ${Math.abs(vacancy)}` : 'เต็ม'}</Tag>;
        return <Tag color="green">{vacancy}</Tag>;
      },
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Title level={2} style={{ margin: 0 }}>
          Dashboard ภาพรวม
        </Title>
        <Text type="secondary">สรุปข้อมูลจากรายการตอบรับ (RSVP) และสถานะการจัดโต๊ะล่าสุด</Text>
      </div>

      {/* 🔧 DevOps: แสดง Alert ถ้ามี RSVP ที่ยังไม่ได้ import */}
      {rsvpsNotImported > 0 && (
        <Alert
          message={`มี RSVP ที่ยังไม่ได้นำเข้า ${rsvpsNotImported} รายการ`}
          description={
            <>
              <Text>มี RSVP ที่ตอบรับเข้างาน (isComing = yes) แต่ยังไม่ได้ link กับ Guest</Text>
              <br />
              <Button type="link" size="small" onClick={() => onChangePage('6')} style={{ padding: 0, marginTop: 4 }}>
                ไปที่หน้า RSVP List เพื่อตรวจสอบ →
              </Button>
            </>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-4"
          closable
        />
      )}

      {/* ============================================================================ */}
      {/* 🔧 DevOps: RSVP Statistics Section (Source of Truth) */}
      {/* ============================================================================ */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>สรุปข้อมูลรายการตอบรับ (RSVP)</span>
          </Space>
        }
        className="mb-6"
        extra={
          <Button type="link" onClick={() => onChangePage('6')}>
            ดูรายละเอียด →
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="RSVP ทั้งหมด"
                value={totalRSVPs}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                รายการทั้งหมด
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="ตอบรับเข้างาน"
                value={rsvpsComing}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {totalPeopleFromRSVP} คน ({totalGroupsFromRSVP} กลุ่ม)
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="นำเข้าแล้ว"
                value={rsvpsImported}
                prefix={<UserAddOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                จาก {rsvpsComing} รายการ
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="ยังไม่ได้นำเข้า"
                value={rsvpsNotImported}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: rsvpsNotImported > 0 ? '#faad14' : '#52c41a' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ต้องดำเนินการ
              </Text>
            </Card>
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="ไม่เข้างาน"
                value={rsvpsNotComing}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="รอการตอบรับ"
                value={rsvpsPending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ============================================================================ */}
      {/* 🔧 DevOps: Guest Statistics Section (จาก RSVP เท่านั้น) */}
      {/* ============================================================================ */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>สรุปข้อมูลแขก (จาก RSVP เท่านั้น)</span>
          </Space>
        }
        className="mb-6"
        extra={
          <Button type="link" onClick={() => onChangePage('2')}>
            ดูรายละเอียด →
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="จำนวนคนเข้างานทั้งหมด"
                value={totalGuestsFromRSVP}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#ec4899' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                จาก RSVP ที่นำเข้าแล้ว
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="จำนวนกลุ่ม"
                value={totalGroupsFromGuests}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {totalGuestsFromRSVP} คนใน {totalGroupsFromGuests} กลุ่ม
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="จัดลงโต๊ะแล้ว"
                value={totalSeatedFromRSVP}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                จาก {totalGuestsFromRSVP} คน
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="เช็คอินแล้ว"
                value={totalCheckedInFromRSVP}
                suffix={`/ ${totalGuestsFromRSVP}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress
                percent={totalGuestsFromRSVP > 0 ? Math.round((totalCheckedInFromRSVP / totalGuestsFromRSVP) * 100) : 0}
                showInfo={false}
                size="small"
                strokeColor="#52c41a"
              />
            </Card>
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="ฝ่ายเจ้าบ่าว"
                value={sideCountsFromRSVP.groom || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {totalGroupsFromRSVP > 0 ? Math.round((sideCountsFromRSVP.groom / totalGroupsFromRSVP) * 100) : 0}% ของ RSVP
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
              <Statistic
                title="ฝ่ายเจ้าสาว"
                value={sideCountsFromRSVP.bride || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {totalGroupsFromRSVP > 0 ? Math.round((sideCountsFromRSVP.bride / totalGroupsFromRSVP) * 100) : 0}% ของ RSVP
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ============================================================================ */}
      {/* 🔧 DevOps: Zone Summary Table (จาก Guests ที่มาจาก RSVP) */}
      {/* ============================================================================ */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card
            title={
              <Space>
                <TableOutlined />
                <span>สถานะความจุที่นั่งรายโซน (จาก RSVP)</span>
              </Space>
            }
            variant="borderless"
            className="shadow-sm"
            extra={
              <Button type="link" onClick={() => onChangePage('3')}>
                ดูผังโต๊ะ & จัดการโซน →
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={zoneSummary}
              pagination={false}
              rowKey="key"
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
