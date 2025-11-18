import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Card, Slider, Button, Space, Typography } from 'antd';
import { SoundOutlined, MuteOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface MusicPlayerProps {
  youtubeUrl?: string;
  defaultVolume?: number;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ youtubeUrl, defaultVolume = 30 }) => {
  const [volume, setVolume] = useState(defaultVolume);
  const [playing, setPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-play when component mounts (if URL exists)
    if (youtubeUrl) {
      setPlaying(true);
    }
  }, [youtubeUrl]);

  if (!youtubeUrl || !isVisible) {
    // Show minimal button to open player if hidden
    if (!isVisible) {
      return (
        <Button
          type="primary"
          shape="circle"
          icon={<SoundOutlined />}
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 right-4 z-50 shadow-lg"
        />
      );
    }
    return null;
  }

  return (
    <Card
      className="fixed bottom-4 right-4 z-50 shadow-2xl rounded-xl"
      style={{ width: 320, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
      bodyStyle={{ padding: 16 }}
      extra={
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={() => setIsVisible(false)}
        />
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'none' }}>
          <ReactPlayer
            url={youtubeUrl}
            playing={playing}
            volume={volume / 100}
            loop
            width={0}
            height={0}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            🎵 เพลงบรรเลง
          </Text>
          <Button
            type="text"
            size="small"
            icon={playing ? <SoundOutlined /> : <MuteOutlined />}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? 'หยุด' : 'เล่น'}
          </Button>
        </div>

        <div style={{ padding: '0 8px' }}>
          <Slider
            min={0}
            max={100}
            value={volume}
            onChange={setVolume}
            tooltip={{ formatter: (v) => `${v}%` }}
            style={{ margin: 0 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>0%</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{volume}%</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>100%</Text>
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default MusicPlayer;

