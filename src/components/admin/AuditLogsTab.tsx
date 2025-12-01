import React, { useMemo } from 'react';
import { Collapse, Typography, Timeline, Space, Avatar, Empty, Spin } from 'antd';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useRSVPs } from '@/hooks/useRSVPs';
import { AuditLog } from '@/types';
import {
    UserOutlined,
    LoginOutlined,
    CheckCircleOutlined,
    EditOutlined,
    ClockCircleOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

const { Text } = Typography;
const { Panel } = Collapse;

const AuditLogsTab: React.FC = () => {
    // Fetch recent logs (increase limit to show meaningful history)
    const { logs, isLoading: logsLoading } = useAuditLogs(100);
    const { rsvps, isLoading: rsvpsLoading } = useRSVPs();

    const isLoading = logsLoading || rsvpsLoading;

    // Group logs by UID
    const groupedLogs = useMemo(() => {
        const groups: Record<string, AuditLog[]> = {};
        logs.forEach(log => {
            if (!groups[log.uid]) {
                groups[log.uid] = [];
            }
            groups[log.uid].push(log);
        });
        return groups;
    }, [logs]);

    // Sort UIDs by their latest log time
    const sortedUids = useMemo(() => {
        return Object.keys(groupedLogs).sort((a, b) => {
            const latestA = groupedLogs[a][0]; // logs are already sorted by time desc
            const latestB = groupedLogs[b][0];
            return new Date(latestB.createdAt).getTime() - new Date(latestA.createdAt).getTime();
        });
    }, [groupedLogs]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login_with_phone': return <LoginOutlined className="text-green-500" />;
            case 'rsvp_created': return <CheckCircleOutlined className="text-blue-500" />;
            case 'rsvp_updated': return <EditOutlined className="text-orange-500" />;
            case 'guest_check_in': return <CheckCircleOutlined className="text-purple-500" />;
            case 'admin_login': return <UserOutlined className="text-red-500" />;
            default: return <ClockCircleOutlined className="text-gray-400" />;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'login_with_phone': return 'เข้าสู่ระบบ (Guest)';
            case 'rsvp_created': return 'ยืนยันเข้าร่วมงาน';
            case 'rsvp_updated': return 'แก้ไขข้อมูลการตอบรับ';
            case 'guest_check_in': return 'เช็คอินเข้างาน';
            case 'admin_login': return 'เข้าสู่ระบบ (Admin)';
            default: return action;
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Spin /></div>;
    }

    if (logs.length === 0) {
        return <Empty description="ไม่พบประวัติการใช้งาน" />;
    }

    return (
        <div className="space-y-4">
            <Collapse ghost className="bg-white rounded-lg border border-gray-100">
                {sortedUids.map(uid => {
                    const userLogs = groupedLogs[uid];
                    const rsvp = rsvps.find(r => r.uid === uid);
                    const latestLog = userLogs[0];

                    // Display Name: Phone (if guest) > Name > UID
                    let displayName = uid;
                    let icon = <UserOutlined />;

                    if (latestLog.action === 'admin_login') {
                        displayName = 'Admin';
                    } else if (rsvp) {
                        const name = rsvp.fullName || (rsvp.firstName ? `${rsvp.firstName} ${rsvp.lastName || ''}`.trim() : '');
                        const phone = rsvp.phoneNumber;

                        if (name && phone) {
                            displayName = `${name} (${phone})`;
                            icon = <UserOutlined />;
                        } else if (name) {
                            displayName = name;
                            icon = <UserOutlined />;
                        } else if (phone) {
                            displayName = phone;
                            icon = <PhoneOutlined />;
                        }
                    }

                    const header = (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4">
                            <Space>
                                <Avatar icon={icon} className="bg-purple-50" style={{ color: '#5c3a58' }} />
                                <div className="flex flex-col">
                                    <Text strong className="text-base">{displayName}</Text>
                                    <Text type="secondary" className="text-xs">
                                        ล่าสุด: {getActionLabel(latestLog.action)} • {dayjs(latestLog.createdAt).format('D MMM HH:mm')}
                                    </Text>
                                </div>
                            </Space>
                        </div>
                    );

                    return (
                        <Panel header={header} key={uid}>
                            <Timeline className="mt-4 ml-2">
                                {userLogs.map(log => (
                                    <Timeline.Item
                                        key={log.logId}
                                        dot={getActionIcon(log.action)}
                                        color="gray"
                                    >
                                        <Space direction="vertical" size={0}>
                                            <Text strong>{getActionLabel(log.action)}</Text>
                                            <Text type="secondary" className="text-xs">
                                                {dayjs(log.createdAt).format('D MMM YYYY, HH:mm:ss')}
                                            </Text>
                                        </Space>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </Panel>
                    );
                })}
            </Collapse>
        </div>
    );
};

export default AuditLogsTab;
