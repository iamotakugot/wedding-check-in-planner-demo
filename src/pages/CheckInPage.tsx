import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Typography, Input, Select, Table, Tag, Button, Space, Statistic, Divider, message, Timeline, Progress, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, FileTextOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Guest, Zone, TableData, Side } from '@/types';
import { updateGuest } from '@/services/firebaseService';
import type { RSVPData } from '@/types';
import { groupRSVPsWithGuests, getGuestsFromRSVP } from '@/utils/rsvpHelpers';

const { Title, Text } = Typography;

interface CheckInPageProps {
  guests: Guest[];
  zones: Zone[];
  tables: TableData[];
  rsvps?: RSVPData[];
}

const CheckInPage: React.FC<CheckInPageProps> = ({ guests, zones, tables, rsvps = [] }) => {
  const [search, setSearch] = useState('');
  const [quickCheck, setQuickCheck] = useState('');
  const [filterSide, setFilterSide] = useState<Side | 'all'>('all');
  const [filterZone, setFilterZone] = useState<string | 'all'>('all');
  const [filterTable, setFilterTable] = useState<string | 'all'>('all');

  // 🔧 DevOps: จัดกลุ่มจาก RSVP และเชื่อมกับ Guests
  const groups = useMemo(() => {
    return groupRSVPsWithGuests(rsvps, guests, {
      side: filterSide,
      zoneId: filterZone,
      tableId: filterTable,
      search: search,
    });
  }, [rsvps, guests, filterSide, filterZone, filterTable, search]);

  // 🔧 DevOps: คำนวณ totals จาก groups
  const totals = useMemo(() => {
    const total = groups.reduce((acc, g) => acc + g.totalPeople, 0);
    const checkedIn = groups.reduce((acc, g) => acc + g.checkedIn, 0);
    return { total, checkedIn, notChecked: total - checkedIn };
  }, [groups]);

  // 🔧 DevOps: คำนวณ RSVP statistics
  const rsvpsNotImported = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    const guestsList = guests || [];
    
    return rsvps.filter(r => {
      if (!r || r.isComing !== 'yes') return false;
      const relatedGuests = getGuestsFromRSVP(r, guestsList);
      return relatedGuests.length === 0;
    }).length;
  }, [rsvps, guests]);

  const totalRSVPsComing = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.filter(r => r && r.isComing === 'yes').length;
  }, [rsvps]);

  // Check-in history (sorted by time) - จาก Guests ที่มาจาก RSVP
  const checkInHistory = useMemo(() => {
    if (!guests || guests.length === 0) return [];
    if (!rsvps || rsvps.length === 0) return [];
    
    const rsvpGuests = guests.filter(g => {
      return rsvps.some(r => {
        if (!r || r.isComing !== 'yes') return false;
        const relatedGuests = getGuestsFromRSVP(r, guests);
        return relatedGuests.some(rg => rg.id === g.id);
      });
    });
    return rsvpGuests
      .filter(g => g && g.checkedInAt)
      .sort((a, b) => (b.checkedInAt || '').localeCompare(a.checkedInAt || ''))
      .slice(0, 10) // Latest 10
      .map(g => {
        const rsvp = rsvps.find(r => {
          if (!r || r.isComing !== 'yes') return false;
          const relatedGuests = getGuestsFromRSVP(r, guests);
          return relatedGuests.some(rg => rg.id === g.id);
        });
        return {
          id: g.id,
          name: rsvp ? (rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`) : `${g.firstName} ${g.lastName} (${g.nickname || ''})`,
          time: g.checkedInAt,
          method: g.checkInMethod || 'manual',
        };
      });
  }, [guests, rsvps]);

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
      if (value) {
        message.success('เช็คอินสำเร็จ!');
      }
    } catch (error) {
      console.error('Error updating check-in:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอิน');
    }
  };

  const toggleGroup = async (group: typeof groups[0], value: boolean) => {
    try {
      const now = new Date().toISOString();
      // Update all guests in the group
      for (const guest of group.guests) {
        await updateGuest(guest.id, {
          checkedInAt: value ? now : null,
          checkInMethod: value ? 'manual' : null,
        });
      }
      message.success(value ? `เช็คอินกลุ่ม "${group.groupName}" แล้ว` : `ยกเลิกเช็คอินกลุ่ม "${group.groupName}"`);
    } catch (error) {
      console.error('Error updating group check-in:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอินกลุ่ม');
    }
  };

  // Quick check-in by name - ค้นหาจาก RSVP
  const handleQuickCheck = () => {
    const name = quickCheck.trim().toLowerCase();
    if (!name) return;

    // 🔧 DevOps: ค้นหาจาก RSVP ก่อน
    const foundGroup = groups.find(g => {
      const fullName = g.groupName.toLowerCase();
      return fullName.includes(name);
    });

    if (foundGroup) {
      // หา Guest ที่ยังไม่เช็คอิน
      const foundGuest = foundGroup.guests.find(g => !g.checkedInAt);

      if (foundGuest) {
        toggleGuest(foundGuest.id, true);
        setQuickCheck('');
        message.success(`เช็คอิน ${foundGroup.groupName} แล้ว`);
      } else {
        message.warning('ไม่พบแขกที่ยังไม่เช็คอิน หรือยังไม่ได้นำเข้า RSVP');
      }
    } else {
      message.warning('ไม่พบ RSVP ที่ตรงกับชื่อนี้');
    }
  };

  const columns: ColumnsType<typeof groups[0]> = [
    {
      title: 'กลุ่ม (จาก RSVP)',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text, row) => (
        <div>
          <Space>
            <Text strong>{text}</Text>
            <Tag color="blue" icon={<FileTextOutlined />}>
              RSVP
            </Tag>
          </Space>
          {/* 🔧 DevOps: แสดงรายการย่อยจาก RSVP */}
          <div style={{ marginTop: 8, paddingLeft: 16 }}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ตัวเอง {row.rsvp.firstName} {row.rsvp.lastName}
            </div>
            {row.rsvp.accompanyingGuests && row.rsvp.accompanyingGuests.length > 0 && (
              <>
                {row.rsvp.accompanyingGuests.map((acc, index) => {
                  const relatedGuest = row.guests.find(g => g.firstName === acc.name);
                  return (
                    <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                      คนที่ {index + 1} {acc.name} {relatedGuest?.checkedInAt ? '✓ เช็คอิน' : ''}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      key: 'side',
      width: 120,
      render: (side: Side) => side === 'groom' ? <Tag color="blue">เจ้าบ่าว</Tag> : side === 'bride' ? <Tag color="magenta">เจ้าสาว</Tag> : <Tag color="purple">ทั้งคู่</Tag>
    },
    {
      title: 'สรุป',
      key: 'summary',
      width: 140,
      render: (_, row) => (
        <Space>
          <Text>{row.checkedIn}/{row.totalPeople} คน</Text>
          {row.totalPeople > 0 && (
            <Progress
              percent={Math.round((row.checkedIn / row.totalPeople) * 100)}
              size="small"
              showInfo={false}
              status={row.checkedIn === row.totalPeople ? 'success' : 'active'}
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
        const allIn = row.checkedIn === row.totalPeople && row.totalPeople > 0;
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
      <div className="mb-6">
        <Title level={2} style={{ margin: 0 }}>
          เช็คอินหน้างาน
        </Title>
        <Text type="secondary">จัดการการเช็คอินแขกจากรายการตอบรับ (RSVP)</Text>
      </div>

      {/* 🔧 DevOps: แสดง Alert ถ้ามี RSVP ที่ยังไม่ได้ import */}
      {rsvpsNotImported > 0 && (
        <Alert
          message={`มี RSVP ที่ยังไม่ได้นำเข้า ${rsvpsNotImported} รายการ`}
          description="RSVP ที่ยังไม่ได้นำเข้าจะไม่สามารถเช็คอินได้ กรุณานำเข้าผ่านหน้า รายการตอบรับ ก่อน"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-4"
          closable
        />
      )}

      {/* 🔧 DevOps: RSVP Statistics Section */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>สรุปข้อมูล RSVP</span>
          </Space>
        }
        className="mb-4"
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="RSVP ตอบรับเข้างาน"
              value={totalRSVPsComing}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="ยังไม่ได้นำเข้า"
              value={rsvpsNotImported}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: rsvpsNotImported > 0 ? '#faad14' : '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

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
                description="พิมพ์ชื่อจาก RSVP แล้วกด Enter"
                type="info"
                showIcon
                icon={<ThunderboltOutlined />}
                style={{ marginBottom: 8 }}
              />

              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="พิมพ์ชื่อจาก RSVP → Enter"
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
                placeholder="ค้นหา: ชื่อจาก RSVP"
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
                    {/* 🔧 DevOps: แสดงข้อมูล RSVP */}
                    <Alert
                      message="ข้อมูล RSVP"
                      description={
                        <Space direction="vertical" size={4}>
                          <Text>ชื่อ: {row.rsvp.fullName || `${row.rsvp.firstName} ${row.rsvp.lastName}`}</Text>
                          {row.rsvp.accompanyingGuests && row.rsvp.accompanyingGuests.length > 0 && (
                            <Text>ผู้ติดตาม: {row.rsvp.accompanyingGuests.length} คน</Text>
                          )}
                          {row.rsvp.note && (
                            <Text type="secondary">หมายเหตุ: {row.rsvp.note}</Text>
                          )}
                        </Space>
                      }
                      type="info"
                      showIcon
                      icon={<FileTextOutlined />}
                      style={{ marginBottom: 16 }}
                    />
                    {/* 🔧 DevOps: แสดงรายละเอียด Guests ที่ link กับ RSVP */}
                    {row.guests.map(m => {
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
                    {/* 🔧 DevOps: แสดงข้อความถ้ายังไม่มี Guest ที่ link */}
                    {row.guests.length === 0 && (
                      <Alert
                        message="ยังไม่มี Guest ที่ link กับ RSVP นี้"
                        description="กรุณานำเข้า RSVP ผ่านหน้า รายการตอบรับ ก่อน"
                        type="warning"
                        showIcon
                      />
                    )}
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
