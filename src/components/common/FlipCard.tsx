/**
 * FlipCard Component
 * Component สำหรับแสดงตัวเลขพร้อม flip animation เมื่อค่าตัวเลขเปลี่ยน
 */

import React, { useEffect, useRef, useState } from 'react';

interface FlipCardProps {
  value: number;
  label: string;
  className?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({ value, label, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsFlipping(true);
      setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
      }, 300); // Half of animation duration (600ms / 2)
      prevValueRef.current = value;
    }
  }, [value]);

  return (
    <div className={`text-center ${className}`}>
      <div className="countdown-number-wrapper">
        <div className={`flip-card ${isFlipping ? 'flip' : ''}`}>
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <div className="countdown-number">{displayValue}</div>
            </div>
            <div className="flip-card-back">
              <div className="countdown-number">{value}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="countdown-label">{label}</div>
    </div>
  );
};

