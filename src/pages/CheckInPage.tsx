import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Typography, Input, Select, Table, Tag, Button, Space, Statistic, Divider, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Guest, Zone, TableData, Side } from '@/types';

const { Title, Text } = Typography;

interface CheckInPageProps {
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  zones: Zone[];
  tables: TableData[];
}

type GroupRow = {
  key: string;
  groupId: string | null;
  groupName: string;
  sideSummary: string;
  total: number;
  checkedIn: number;
  members: Guest[];
};

const CheckInPage: React.FC<CheckInPageProps> = ({ guests, setGuests, zones, tables }) => {
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<Side | 'all'>('all');
  const [filterZone, setFilterZone] = useState<string | 'all'>('all');
  const [filterTable, setFilterTable] = useState<string | 'all'>('all');

  const filteredGuests = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return guests.filter(g => {
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      if (filterZone !== 'all' && g.zoneId !== filterZone) return false;
      if (filterTable !== 'all' && g.tableId !== filterTable) return false;
      if (!lower) return true;
      return (
        g.firstName.toLowerCase().includes(lower) ||
        g.lastName.toLowerCase().includes(lower) ||
        g.nickname.toLowerCase().includes(lower) ||
        g.id.toLowerCase().includes(lower)
      );
    });
  }, [guests, search, filterSide, filterZone, filterTable]);

  const groups: GroupRow[] = useMemo(() => {
    const map = new Map<string, GroupRow>();
    for (const g of filteredGuests) {
      const gid = g.groupId || `SINGLE_${g.id}`;
      if (!map.has(gid)) {
        map.set(gid, {
          key: gid,
          groupId: g.groupId || null,
          groupName: g.groupName || `${g.firstName} (${g.nickname})`,
          sideSummary: g.side,
          total: 0,
          checkedIn: 0,
          members: [],
        });
      }
      const row = map.get(gid)!;
      row.members.push(g);
      row.total += 1;
      if (g.checkedInAt) row.checkedIn += 1;
    }
    return Array.from(map.values());
  }, [filteredGuests]);

  const totals = useMemo(() => {
    const total = filteredGuests.length;
    const checkedIn = filteredGuests.filter(g => !!g.checkedInAt).length;
    return { total, checkedIn, notChecked: total - checkedIn };
  }, [filteredGuests]);

  const toggleGuest = (guestId: string, value: boolean) => {
    const now = new Date().toISOString();
    setGuests(prev => prev.map(g => g.id === guestId ? ({
      ...g,
      checkedInAt: value ? now : null,
      checkInMethod: value ? 'manual' : null,
    }) : g));
  };

  const toggleGroup = (group: GroupRow, value: boolean) => {
    const now = new Date().toISOString();
    setGuests(prev => prev.map(g => {
      const belongs = (group.groupId ? g.groupId === group.groupId : g.id === group.members[0]?.id);
      if (!belongs) return g;
      return {
        ...g,
        checkedInAt: value ? now : null,
        checkInMethod: value ? 'manual' : null,
      };
    }));
    message.success(value ? `เช็คอินกลุ่ม "${group.groupName}" แล้ว` : `ยกเลิกเช็คอินกลุ่ม "${group.groupName}"`);
  };

  const columns: ColumnsType<GroupRow> = [
    {
      title: 'กลุ่ม',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'sideSummary',
      key: 'sideSummary',
      width: 120,
      render: (side: Side) => side === 'groom' ? <Tag color="blue">เจ้าบ่าว</Tag> : side === 'bride' ? <Tag color="magenta">เจ้าสาว</Tag> : <Tag color="purple">ทั้งคู่</Tag>
    },
    {
      title: 'สรุป',
      key: 'summary',
      width: 140,
      render: (_, row) => <Text>{row.checkedIn}/{row.total} คน</Text>,
    },
    {
      title: 'เช็คอินทั้งกลุ่ม',
      key: 'groupAction',
      width: 160,
      render: (_, row) => {
        const allIn = row.checkedIn === row.total && row.total > 0;
        return (
          <Space>
            <Button type={allIn ? 'default' : 'primary'} onClick={() => toggleGroup(row, !allIn)}>
              {allIn ? 'ยกเลิกเช็คอิน' : 'เช็คอินกลุ่ม'}
            </Button>
          </Space>
        );
      }
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <Title level={2} className="mb-6">เช็คอินหน้างาน</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} lg={6}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Statistic title="เช็คอินแล้ว" value={totals.checkedIn} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
              <Statistic title="ยังไม่เช็คอิน" value={totals.notChecked} prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />} />
              <Divider style={{ margin: '8px 0' }} />
              <Input allowClear prefix={<SearchOutlined />} placeholder="ค้นหา: ชื่อ/ชื่อเล่น/ID" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select
                value={filterSide}
                onChange={setFilterSide}
                options={[{ value: 'all', label: 'ทุกฝ่าย' }, { value: 'groom', label: 'เจ้าบ่าว' }, { value: 'bride', label: 'เจ้าสาว' }, { value: 'both', label: 'ทั้งคู่' }]}
              />
              <Select
                value={filterZone}
                onChange={setFilterZone}
                options={[{ value: 'all', label: 'ทุกโซน' }, ...zones.map(z => ({ value: z.zoneId, label: z.zoneName }))]}
              />
              <Select
                value={filterTable}
                onChange={setFilterTable}
                options={[{ value: 'all', label: 'ทุกโต๊ะ' }, ...tables.map(t => ({ value: t.tableId, label: t.tableName }))]}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={16} lg={18}>
          <Card>
            <Table
              columns={columns}
              dataSource={groups}
              rowKey="key"
              expandable={{
                expandedRowRender: (row) => (
                  <div>
                    {row.members.map(m => {
                      const zone = zones.find(z => z.zoneId === m.zoneId);
                      const table = tables.find(t => t.tableId === m.tableId);
                      const checked = !!m.checkedInAt;
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                          <Space>
                            <Text strong>#{m.id}</Text>
                            <Text>{m.firstName} {m.lastName} ({m.nickname})</Text>
                            {zone ? <Tag color="volcano">{zone.zoneName}</Tag> : <Tag>ยังไม่จัด</Tag>}
                            {table && <Tag color="cyan">{table.tableName}</Tag>}
                          </Space>
                          <Button type={checked ? 'default' : 'primary'} onClick={() => toggleGuest(m.id, !checked)}>
                            {checked ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )
              }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CheckInPage;
