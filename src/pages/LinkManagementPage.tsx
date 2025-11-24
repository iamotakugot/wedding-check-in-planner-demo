import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Input, Button, Divider, Tooltip, message, Statistic, QRCode } from 'antd';
import { LinkOutlined, CopyOutlined, EyeOutlined, QrcodeOutlined } from '@ant-design/icons';
import { getConfig, getRSVPs, onAuthStateChange, logout } from '@/services/firebaseService';
import type { WeddingConfig } from '@/services/firebaseService';
import type { RSVPData } from '@/types';

const { Title, Text } = Typography;

const LinkManagementPage: React.FC<{ onPreview: () => void }> = ({ onPreview }) => {
    const [config, setConfig] = useState<WeddingConfig | null>(null);
    const [rsvps, setRsvps] = useState<RSVPData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check authentication
        const unsubscribe = onAuthStateChange((user) => {
            setIsAuthenticated(!!user);
        });

        const loadData = async () => {
            try {
                const [configData, rsvpsData] = await Promise.all([
                    getConfig(),
                    getRSVPs(),
                ]);
                setConfig(configData);
                setRsvps(rsvpsData);
            } catch (error) {
                console.error('Error loading data:', error);
                message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            } finally {
                setLoading(false);
            }
        };
        loadData();

        return () => unsubscribe();
    }, []);

    // Generate real invitation link using Firebase Hosting URL
    const getBaseUrl = () => {
        const productionUrl = 'https://got-nan-wedding.web.app';
        if (window.location.hostname === 'got-nan-wedding.web.app' || window.location.hostname === 'got-nan-wedding.firebaseapp.com') {
            return productionUrl;
        }
        return productionUrl; // Always use production URL for real links
    };

    const baseUrl = getBaseUrl();
    // Root path (/) = Guest RSVP App (หน้าการ์ดเชิญ)
    const inviteLink = `${baseUrl}/`;

    const handleCopy = () => { 
        navigator.clipboard.writeText(inviteLink); 
        message.success('คัดลอกลิงค์แล้ว!'); 
    };

    const handleLogout = async () => {
        try {
            await logout();
            message.success('ออกจากระบบเรียบร้อย');
        } catch (error) {
            console.error('Error logging out:', error);
            message.error('เกิดข้อผิดพลาดในการออกจากระบบ');
        }
    };

    const stats = {
        total: rsvps.length,
        coming: rsvps.filter(r => r.isComing === 'yes').length,
        notComing: rsvps.filter(r => r.isComing === 'no').length,
        totalAttendees: rsvps
            .filter(r => r.isComing === 'yes')
            .reduce((acc, r) => acc + 1 + (r.accompanyingGuestsCount || 0), 0),
    };

    return (
        <div style={{ padding: 24 }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={2} style={{fontFamily: 'Sarabun', margin: 0}}>
                    <LinkOutlined /> จัดการลิงค์เชิญ
                </Title>
                {isAuthenticated && (
                    <Button onClick={handleLogout} danger>
                        ออกจากระบบ
                    </Button>
                )}
            </div>
            <Row gutter={16} className="mb-6">
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="ตอบรับทั้งหมด" value={stats.total} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="ยินดีร่วมงาน" value={stats.coming} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="รวมจำนวนคน" value={stats.totalAttendees} prefix="👥" />
                    </Card>
                </Col>
            </Row>
            <Row justify="center">
                <Col xs={24} md={16} lg={12}>
                    <Card title="🔗 ลิงค์เชิญแขก (Invitation Link)" bordered={false} className="shadow-sm rounded-xl" loading={loading}>
                        <div className="bg-gray-50 p-6 rounded-lg text-center mb-6 border border-gray-200">
                            <QrcodeOutlined style={{ fontSize: 64, color: '#5c3a58', marginBottom: 16 }} />
                        <Title level={4} style={{ margin: 0, color: '#5c3a58', fontFamily: "'Playwrite CZ', cursive" }}>
                            {config?.groomName || 'Got'} & {config?.brideName || 'Nan'}&apos;s Wedding
                        </Title>
                            <Text type="secondary">{config?.weddingDate || '31 มกราคม 2569'}</Text>
                        </div>
                        <div className="mb-4">
                            <Text type="secondary" className="block mb-2">
                                💡 แขกจะเข้าสู่ระบบด้วย Facebook หรือ Google
                            </Text>
                            <Text type="secondary" className="block text-xs">
                                ไม่ต้องใช้เบอร์โทรในการเข้าสู่ระบบ
                            </Text>
                        </div>
                        <Text strong>ลิงค์สำหรับส่งให้แขก:</Text>
                        <div className="flex mt-2 gap-2">
                            <Input value={inviteLink} readOnly size="large" className="rounded-md bg-gray-50" />
                            <Tooltip title="คัดลอก">
                                <Button type="primary" icon={<CopyOutlined />} size="large" onClick={handleCopy} className="bg-[#5c3a58] border-none rounded-md" />
                            </Tooltip>
                        </div>
                        <div className="mt-4 text-center">
                            <Text type="secondary" className="block mb-2">QR Code สำหรับลิงค์เชิญ:</Text>
                            <div className="flex justify-center">
                                <QRCode value={inviteLink} size={200} />
                            </div>
                        </div>
                        <Divider />
                        <Button type="default" block size="large" icon={<EyeOutlined />} onClick={onPreview} className="border-[#5c3a58] text-[#5c3a58] rounded-md hover:bg-gray-50">
                            จำลองหน้าจอแขก
                        </Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LinkManagementPage;

