import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Typography, Input, Select, Table, Tag, Button, Space, Statistic, Divider, message, Timeline, Progress, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Guest, Zone, TableData, Side } from '@/types';
import { updateGuest } from '@/services/firebaseService';

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
  const [quickCheck, setQuickCheck] = useState('');
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

  // Check-in history (sorted by time)
  const checkInHistory = useMemo(() => {
    return guests
      .filter(g => g.checkedInAt)
      .sort((a, b) => (b.checkedInAt || '').localeCompare(a.checkedInAt || ''))
      .slice(0, 10) // Latest 10
      .map(g => ({
        id: g.id,
        name: `${g.firstName} ${g.lastName} (${g.nickname})`,
        time: g.checkedInAt,
        method: g.checkInMethod || 'manual',
      }));
  }, [guests]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleGuest = async (guestId: string, value: boolean) => {
    try {
      const now = new Date().toISOString();
      await updateGuest(guestId, {
        checkedInAt: value ? now : null,
        checkInMethod: value ? 'manual' : null,
      });
      setGuests(prev => prev.map(g => g.id === guestId ? ({
        ...g,
        checkedInAt: value ? now : null,
        checkInMethod: value ? 'manual' : null,
      }) : g));
      if (value) {
        message.success('เช็คอินสำเร็จ!');
      }
    } catch (error) {
      console.error('Error updating check-in:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอิน');
    }
  };

  const toggleGroup = async (group: GroupRow, value: boolean) => {
    try {
      const now = new Date().toISOString();
      const guestsToUpdate = guests.filter(g => {
        const belongs = (group.groupId ? g.groupId === group.groupId : g.id === group.members[0]?.id);
        return belongs;
      });

      // Update all guests in the group
      for (const guest of guestsToUpdate) {
        await updateGuest(guest.id, {
          checkedInAt: value ? now : null,
          checkInMethod: value ? 'manual' : null,
        });
      }

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
    } catch (error) {
      console.error('Error updating group check-in:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอินกลุ่ม');
    }
  };

  // Quick check-in by name
  const handleQuickCheck = () => {
    const name = quickCheck.trim().toLowerCase();
    if (!name) return;

    const found = guests.find(g =>
      !g.checkedInAt && (
        g.firstName.toLowerCase().includes(name) ||
        g.lastName.toLowerCase().includes(name) ||
        g.nickname.toLowerCase().includes(name) ||
        g.id.toLowerCase().includes(name)
      )
    );

    if (found) {
      toggleGuest(found.id, true);
      setQuickCheck('');
      message.success(`เช็คอิน ${found.firstName} ${found.lastName} แล้ว`);
    } else {
      message.warning('ไม่พบแขกที่ยังไม่เช็คอิน');
    }
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
      render: (_, row) => (
        <Space>
          <Text>{row.checkedIn}/{row.total} คน</Text>
          {row.total > 0 && (
            <Progress
              percent={Math.round((row.checkedIn / row.total) * 100)}
              size="small"
              showInfo={false}
              status={row.checkedIn === row.total ? 'success' : 'active'}
            />
          )}
        </Space>
      ),
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
          <Card variant="borderless" className="shadow-sm">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Statistic
                title="เช็คอินแล้ว"
                value={totals.checkedIn}
                suffix={`/ ${totals.total}`}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Statistic
                title="ยังไม่เช็คอิน"
                value={totals.notChecked}
                prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
              {totals.total > 0 && (
                <Progress
                  percent={Math.round((totals.checkedIn / totals.total) * 100)}
                  status={totals.checkedIn === totals.total ? 'success' : 'active'}
                />
              )}

              <Divider style={{ margin: '8px 0' }} />

              <Alert
                message="Quick Check-in"
                description="พิมพ์ชื่อแล้วกด Enter"
                type="info"
                showIcon
                icon={<ThunderboltOutlined />}
                style={{ marginBottom: 8 }}
              />

              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="พิมพ์ชื่อ/ชื่อเล่น/ID → Enter"
                  value={quickCheck}
                  onChange={(e) => setQuickCheck(e.target.value)}
                  onPressEnter={handleQuickCheck}
                  allowClear
                />
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleQuickCheck} />
              </Space.Compact>

              <Divider style={{ margin: '8px 0' }} />

              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="ค้นหา: ชื่อ/ชื่อเล่น/ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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

          {/* Check-in History Timeline */}
          {checkInHistory.length > 0 && (
            <Card
              title={<><ClockCircleOutlined /> ประวัติการเช็คอิน</>}
              variant="borderless"
              className="shadow-sm mt-4"
              size="small"
            >
              <Timeline
                items={checkInHistory.map(item => ({
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>{item.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(item.time ?? null)}
                      </Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card variant="borderless" className="shadow-sm">
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
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <Space direction="vertical" size={4} style={{ flex: 1 }}>
                            <Space>
                              <Text strong>#{m.id}</Text>
                              <Text>{m.firstName} {m.lastName} ({m.nickname})</Text>
                              {checked && <Tag color="green" icon={<CheckCircleOutlined />}>เช็คอินแล้ว</Tag>}
                              {checked && m.checkedInAt && (
                                <Tag color="default" icon={<ClockCircleOutlined />}>
                                  {formatTime(m.checkedInAt)}
                                </Tag>
                              )}
                            </Space>
                            <Space size="small">
                              {zone ? <Tag color="volcano">{zone.zoneName}</Tag> : <Tag>ยังไม่จัด</Tag>}
                              {table && <Tag color="cyan">{table.tableName}</Tag>}
                            </Space>
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
