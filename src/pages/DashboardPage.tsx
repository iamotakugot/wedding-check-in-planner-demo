import React from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Progress, Tag, Button } from 'antd';
import {
  TeamOutlined,
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { Guest, Zone, TableData, Side } from '@/types';

const { Title, Text } = Typography;

interface DashboardPageProps {
  onChangePage: (key: string) => void;
  guests: Guest[];
  zones: Zone[];
  tables: TableData[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  onChangePage,
  guests,
  zones,
  tables,
}) => {
  const totalGuests = guests.length;
  const totalCapacity = tables.reduce((acc, t) => acc + t.capacity, 0);
  const totalSeated = guests.filter((g) => g.zoneId !== null).length;

  const sideCounts = guests.reduce(
    (acc, guest) => {
      acc[guest.side] = (acc[guest.side] || 0) + 1;
      return acc;
    },
    {} as Record<Side, number>,
  );

  const zoneSummary = zones
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((zone) => {
      const seated = guests.filter((g) => g.zoneId === zone.zoneId).length;
      const zoneTables = tables.filter((t) => t.zoneId === zone.zoneId);
      const zoneCapacity = zoneTables.reduce((acc, t) => acc + t.capacity, 0);

      return {
        key: zone.zoneId,
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        capacity: zoneCapacity,
        seated: seated,
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
        <Text type="secondary">สรุปข้อมูลแขกและสถานะการจัดโต๊ะล่าสุด</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
            <Statistic
              title="จำนวนคนเข้างานทั้งหมด"
              value={totalGuests}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#ec4899' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ข้อมูลแขกที่ลงทะเบียน
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
            <Statistic
              title="จัดลงโต๊ะแล้ว"
              value={totalSeated}
              suffix={`/ ${totalCapacity}`}
              prefix={<AppstoreOutlined />}
              valueStyle={{
                color: totalSeated > totalCapacity ? '#f5222d' : '#3f8600',
              }}
            />
            <Progress
              percent={totalCapacity > 0 ? Math.round((totalSeated / totalCapacity) * 100) : 0}
              showInfo={false}
              size="small"
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
            <Statistic
              title="ฝ่ายเจ้าบ่าว"
              value={sideCounts.groom || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {totalGuests > 0 ? Math.round((sideCounts.groom / totalGuests) * 100) : 0}% ของแขกทั้งหมด
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm hover:shadow-md transition-all h-full">
            <Statistic
              title="ฝ่ายเจ้าสาว"
              value={sideCounts.bride || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {totalGuests > 0 ? Math.round((sideCounts.bride / totalGuests) * 100) : 0}% ของแขกทั้งหมด
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card
            title="สถานะความจุที่นั่งรายโซน"
            variant="borderless"
            className="shadow-sm"
            extra={
              <Button type="link" onClick={() => onChangePage('3')}>
                ดูผังโต๊ะ & จัดการโซน
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
