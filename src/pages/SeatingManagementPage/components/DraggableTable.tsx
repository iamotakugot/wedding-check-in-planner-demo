import React, { useState, useCallback, useEffect } from 'react';
import { Card, Avatar, Button, Space, Typography } from 'antd';
import { ExpandAltOutlined } from '@ant-design/icons';
import { TableData, Guest } from '@/types';
import { GRID_X_POSITIONS, findNearest, findNearestYSnap } from '@/constants/layout';

const { Text } = Typography;

interface DraggableTableProps {
  table: TableData;
  seatedGuests: Guest[];
  zoneColor: string;
  onTablePositionUpdate: (id: string, newX: number, newY: number) => void;
  onOpenDetail: (table: TableData, guests: Guest[]) => void;
}

const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  seatedGuests,
  zoneColor,
  onTablePositionUpdate,
  onOpenDetail,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const seatedCount = seatedGuests.length;
  const capacity = table.capacity;
  const percent = Math.round((seatedCount / capacity) * 100);
  let opacity = 0.8;
  if (percent >= 100) opacity = 1;
  else if (percent > 0) opacity = 0.9;

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.ant-btn')) {
      return;
    }

    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const canvas = document.getElementById('layout-canvas');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const elementWidth = 120;
      const elementHeight = 100;

      // Calculate position relative to canvas
      let newLeftPx = e.clientX - canvasRect.left - offset.x;
      let newTopPx = e.clientY - canvasRect.top - offset.y;

      // Clamp to canvas bounds
      newLeftPx = Math.max(0, Math.min(newLeftPx, canvasRect.width - elementWidth));
      newTopPx = Math.max(0, Math.min(newTopPx, canvasRect.height - elementHeight));

      // Convert to normalized percentage (0-100) based on canvas dimensions
      const newX = (newLeftPx / canvasRect.width) * 100;
      const newY = (newTopPx / canvasRect.height) * 100;

      const target = document.getElementById(`table-${table.id}`);
      if (target) {
        target.style.left = `${newX}%`;
        target.style.top = `${newY}%`;
      }
    },
    [isDragging, offset, table.id],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setIsDragging(false);

      const canvas = document.getElementById('layout-canvas');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const elementWidth = 120;
      const elementHeight = 100;

      // Calculate final position
      let finalLeftPx = e.clientX - canvasRect.left - offset.x;
      let finalTopPx = e.clientY - canvasRect.top - offset.y;

      // Clamp to canvas bounds
      finalLeftPx = Math.max(0, Math.min(finalLeftPx, canvasRect.width - elementWidth));
      finalTopPx = Math.max(0, Math.min(finalTopPx, canvasRect.height - elementHeight));

      // Convert to normalized percentage (0-100)
      const finalX = Math.max(0, Math.min(100, (finalLeftPx / canvasRect.width) * 100));
      const finalY = Math.max(0, Math.min(100, (finalTopPx / canvasRect.height) * 100));

      // Snap to grid in normalized space
      const snappedX = Math.max(0, Math.min(100, findNearest(finalX, GRID_X_POSITIONS)));
      const snappedY = findNearestYSnap(finalY);

      // Update visual position immediately for smooth feedback
      const target = document.getElementById(`table-${table.id}`);
      if (target) {
        target.style.left = `${snappedX}%`;
        target.style.top = `${snappedY}%`;
      }

      // Update position in database
      onTablePositionUpdate(table.id, snappedX, snappedY);
    },
    [isDragging, offset, onTablePositionUpdate, table.id],
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Card
      id={`table-${table.id}`}
      size="small"
      title={
        <Space size={4}>
          <Avatar
            size="small"
            style={{ backgroundColor: '#f0f0f0', color: '#999', fontSize: 10 }}
          >
            {table.order}
          </Avatar>
          <Text style={{ fontSize: 12, lineHeight: '16px' }} ellipsis={{ tooltip: table.tableName }}>
            {table.tableName}
          </Text>
        </Space>
      }
      style={{
        width: 120,
        height: 100,
        position: 'absolute',
        left: `${table.x}%`,
        top: `${table.y}%`,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderColor: isDragging ? zoneColor : '#f0f0f0',
        borderWidth: isDragging ? 2 : 1,
        boxShadow: isDragging ? `0 0 15px 0 ${zoneColor}66` : '0 1px 2px rgba(0,0,0,0.07)',
        backgroundColor: `${zoneColor}${opacity > 0.9 ? '66' : '33'}`,
        transition: isDragging
          ? 'none'
          : 'left 0.3s, top 0.3s, box-shadow 0.3s, border-color 0.3s',
        zIndex: isDragging ? 10 : 1,
      }}
      styles={{ header: { padding: '0 8px', minHeight: 30 }, body: { padding: '4px 8px', textAlign: 'center' } }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ fontSize: 10, lineHeight: '14px' }}>
        <Text strong>
          {seatedCount} / {capacity}
        </Text>{' '}
        <Text type="secondary">ที่นั่ง</Text>
      </div>
      <Button
        size="small"
        type="link"
        icon={<ExpandAltOutlined />}
        onClick={() => onOpenDetail(table, seatedGuests)}
        style={{ padding: '0 4px', height: '24px', fontSize: 10 }}
      >
        ดูแขก
      </Button>
    </Card>
  );
};

export default DraggableTable;
