/* eslint-disable security/detect-object-injection */
// นำเข้า React hooks ที่จำเป็น
import React, { useState, useEffect, useCallback, useRef } from 'react';
// นำเข้า Ant Design components สำหรับ UI
import {
  Card,
  Typography,
  Button,
  Divider,
  Form,
  Input,
  AutoComplete,
  message,
  Radio,
  Tag,
  Select,
  Spin,
} from 'antd';
// นำเข้า icons จาก Ant Design
import {
  UsergroupAddOutlined,
  GoogleCircleFilled,
  HeartFilled,
  EnvironmentOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  EditOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloseCircleOutlined,
  CheckOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Avatar } from 'antd';
// นำเข้า Firebase service classes สำหรับจัดการ authentication, RSVP, Guest และ App State
import { RSVPService } from '@/services/firebase/RSVPService';
import { GuestService } from '@/services/firebase/GuestService';
import { AuthService } from '@/services/firebase/AuthService';
import { ConfigService } from '@/services/firebase/ConfigService';
import {
  registerSession,
  endSession,
  subscribeSessionChanges,
} from '@/services/firebase/sessions';
import {
  getUserAppState,
  updateUserAppState,
  subscribeUserAppState,
} from '@/services/firebase/appState';
// นำเข้า Firebase Realtime Database functions
import { get, ref, onValue, remove } from 'firebase/database';
import { database } from '@/firebase/config';
// นำเข้า TypeScript types
import type { RSVPData } from '@/types';
import type { User } from 'firebase/auth';
import { Guest, Side } from '@/types';
// นำเข้า form options และ wedding card config
import { RSVP_RELATION_OPTIONS, RSVP_GUEST_RELATION_OPTIONS } from '@/data/formOptions';
import { defaultWeddingCardConfig, getOrderedNames, type WeddingCardConfig } from '@/constants/weddingCard';
// นำเข้า utility functions
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';
// นำเข้า hooks และ components
import { useConfig } from '@/hooks/useConfig';
import { useCountdown } from '@/hooks/useCountdown';
import { FlipCard } from '@/components/common/FlipCard';
import { InAppBrowserBanner } from '@/components/common/InAppBrowserBanner';
import { isInAppBrowser, isMobileDevice } from '@/utils/browserDetection';

const { Title, Text } = Typography;
const { TextArea } = Input;



// ============================================================================
// === PART 1: STYLES & ASSETS ===
// Component สำหรับโหลด global styles และ CSS variables
// ============================================================================



const GlobalStyleLoader = () => (

  <style dangerouslySetInnerHTML={{

    __html: `

      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Playwrite+CZ:wght@100..400&family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100&display=swap');

      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap');

      *, *::before, *::after {
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
        -webkit-user-select: text;
        user-select: text;
      }

      

      :root {

        --font-en: 'Playwrite CZ', cursive;

        --font-dancing: 'Dancing Script', cursive;

        --font-th: 'Sarabun', sans-serif;

        --font-serif: 'Cinzel', serif;

        --color-primary: #5c3a58;

        --color-gold: #d4af37;

        --color-soft-pink: #d48c95;

        --color-dark-text: #5c3a58;

        --color-bg-cream: #fdfcf8;

      }



      body, .ant-typography, .ant-btn, .ant-input, .ant-form-item-label > label, .ant-table, .ant-menu {

        font-family: var(--font-th) !important;

        -webkit-font-smoothing: antialiased;

        -moz-osx-font-smoothing: grayscale;

      }



      .font-script { font-family: var(--font-en) !important; }

      .font-dancing { font-family: var(--font-dancing) !important; }

      .font-cinzel { font-family: var(--font-serif) !important; }



      /* 3D Flip - Mobile Optimized Full Frame */

      .perspective-container { 

          perspective: 2000px; 

          overflow: hidden;

      }

      .flip-inner {

        position: relative; width: 100%; height: 100%;

        transition: transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);

        transform-style: preserve-3d;

        -webkit-user-select: none;

        user-select: none;

      }

      .flip-inner.is-flipped { transform: rotateY(180deg); }

      

      .flip-front, .flip-back {

        position: absolute; top: 0; left: 0; width: 100%; height: 100%;

        -webkit-backface-visibility: hidden;

        backface-visibility: hidden;

        border-radius: 0px;

        overflow-y: auto;

        -webkit-overflow-scrolling: touch;

        background: white;

        box-shadow: 0 0 0 0 rgba(0,0,0,0);

        transition: opacity 0s linear 0.4s; 

      }



      @media (min-width: 768px) {

         .flip-front, .flip-back {

            border-radius: 16px;

            box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);

         }

         .perspective-container {

            overflow: visible; 

         }

      }

      

      .flip-back { transform: rotateY(180deg); background-color: #fff; }

      /* Countdown Flip Card Animation */
      .countdown-number-wrapper {
        position: relative;
        width: 3.2rem;
        height: 2.4rem;
        overflow: hidden;
        flex-shrink: 0;
      }

      @media (min-width: 600px) {
        .countdown-number-wrapper {
          width: 3.5rem;
          height: 2.6rem;
        }
      }

      @media (min-width: 768px) {
        .countdown-number-wrapper {
          width: 4rem;
          height: 3rem;
        }
      }

      .flip-card {
        perspective: 1000px;
        width: 100%;
        height: 100%;
      }

      .flip-card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.6s;
        transform-style: preserve-3d;
      }

      .flip-card.flip .flip-card-inner {
        transform: rotateY(180deg);
      }

      .flip-card-front,
      .flip-card-back {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      .flip-card-back {
        transform: rotateY(180deg);
      }

      .countdown-number {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        font-size: 1.6rem;
        text-align: center;
        line-height: 1;
      }

      @media (min-width: 600px) {
        .countdown-number {
          font-size: 1.8rem;
        }
      }

      @media (min-width: 768px) {
        .countdown-number {
          font-size: 2rem;
        }
      }

      .countdown-label {
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 0.25rem;
      }

      @media (min-width: 768px) {
        .countdown-label {
          font-size: 8px;
        }
      }

      .countdown {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: nowrap;
        width: 100%;
        max-width: 100%;
      }

      @media (min-width: 600px) {
        .countdown {
          gap: 0.6rem;
        }
      }

      @media (min-width: 768px) {
        .countdown {
          gap: 0.75rem;
        }
      }

      .countdown-separator {
        align-self: center;
        padding-bottom: 0.3rem;
        font-size: 0.875rem;
        font-weight: 600;
        flex-shrink: 0;
      }

      @media (min-width: 600px) {
        .countdown-separator {
          font-size: 1rem;
        }
      }

      @media (min-width: 768px) {
        .countdown-separator {
          font-size: 1.5rem;
        }
      }

      .side-inactive { pointer-events: none; opacity: 0; transition-delay: 0.4s; }

      .side-active { pointer-events: auto; opacity: 1; transition-delay: 0s; }



      /* No Scrollbar Utility */

      .no-scrollbar::-webkit-scrollbar {

        display: none;

      }

      .no-scrollbar {

        -ms-overflow-style: none;

        -webkit-overflow-scrolling: touch;

      }

      @supports (scrollbar-width: none) {
        .no-scrollbar {
          scrollbar-width: none;
        }
      }

      /* Text Overflow & Word Break Utilities */

      .overflow-wrap-anywhere {

        overflow-wrap: anywhere;

        word-break: break-word;

        hyphens: auto;

      }

      /* Responsive Text Sizing */

      .text-responsive {

        font-size: clamp(0.875rem, 2vw, 1rem);

      }



      /* Animations */

      @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }

      .animate-float { animation: float 6s ease-in-out infinite; }

      

      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

      .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }

      

      @keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); } 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); } }

      .animate-pulse-gold { animation: pulse-gold 2s infinite; }



      /* Spinning Animation for Vinyl Record effect */

      @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

      .animate-spin-slow { animation: spin-slow 8s linear infinite; }

      .paused-spin { animation-play-state: paused; }



      /* Ant Design Overrides */

      .ant-btn-primary { background-color: var(--color-primary); }

      .ant-btn-primary:hover { background-color: #4a2e46 !important; }

      

      /* Clean Input Style */

      .clean-input .ant-input, .clean-input .ant-select-selector {

        border: 1px solid #e0e0e0 !important;

        border-radius: 8px !important;

        padding: 8px 12px !important;

        background-color: #fff !important;

        font-family: var(--font-th);

        font-size: 1rem;

      }

      .clean-input .ant-input:focus, .clean-input .ant-select-selector:focus, .clean-input.ant-select-focused .ant-select-selector {

        border-color: var(--color-gold) !important;

        box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1) !important;

      }

      .clean-input .ant-input::placeholder {

        color: #999;

        font-size: 0.9rem;

      }

      

      .ant-form-item-label > label {

        font-size: 14px;

        color: #5c3a58;

        font-weight: 500;

      }



      /* Radio Button Custom Style */

      .custom-radio-group .ant-radio-button-wrapper {

        border-radius: 20px;

        margin-right: 8px;

        border: 1px solid #d9d9d9;

      }

      .custom-radio-group .ant-radio-button-wrapper-checked {

        border-color: var(--color-primary) !important;

        color: var(--color-primary) !important;

        background: #fdf2f8;

      }

      .custom-radio-group .ant-radio-button-wrapper:before {

        display: none !important;

      }

    `

  }} />

);



// ตารางเวลางานแต่งงาน - กำหนดเวลาของแต่ละพิธี
const weddingSchedule = [
    { time: '07.09 น.', title: 'พิธีสงฆ์', icon: '🙏' },
    { time: '08.09 น.', title: 'พิธีแห่ขันหมาก', icon: '🎁' },
    { time: '08.39 น.', title: 'พิธีสวมแหวน', icon: '💍' },
    { time: '09.39 น.', title: 'พิธีรดน้ำสังข์', icon: '🐚' },
    { time: '11.30 น.', title: 'รับประทานอาหารกลางวัน', icon: '🍽️' },
];



// ใช้ options จาก formOptions.ts แทน

// Music Playlist Configuration - รายการเพลงที่ใช้ในงานแต่งงาน
const PLAYLIST = [
    { 
        id: '7fKN5KWuAAQ', // รักนาน ๆ - พัด Vorapat x Dome Jaruwat
        title: 'รักนาน ๆ', 
        artist: 'พัด Vorapat x Dome Jaruwat',
        cover: 'https://img.youtube.com/vi/7fKN5KWuAAQ/0.jpg'
    }
];

// Types - RSVPData is imported from @/types

// ============================================================================
// === PART 3: GUEST COMPONENTS ===
// Components สำหรับแสดงผลในหน้า Guest RSVP
// ============================================================================



// Component สำหรับแสดง countdown timer ไปยังวันงานแต่งงาน
const CountdownTimer: React.FC = () => {
    const { config } = useConfig(true);
    
    // Fallback to hardcoded date if config not available
    const weddingDate = config?.weddingDate || '2026/01/31 08:09:00';
    const { days, hours, mins, secs } = useCountdown(weddingDate);

    return (
        <div className="countdown justify-center mt-0 md:mt-3 font-cinzel text-[#5c3a58] opacity-80">
            <FlipCard value={days} label="Days" />
            <div className="countdown-separator font-sans">:</div>
            <FlipCard value={hours} label="Hours" />
            <div className="countdown-separator font-sans">:</div>
            <FlipCard value={mins} label="Mins" />
            <div className="countdown-separator font-sans">:</div>
            <FlipCard value={secs} label="Secs" />
        </div>
    );
};



interface MusicControlsProps {
  config?: WeddingCardConfig;

    onFlip: () => void;

    isPlaying: boolean;

    onToggleMusic: () => void;

    onNext: () => void;

    onPrev: () => void;

    currentTrack: typeof PLAYLIST[0];

}



// Card Front Component - Component สำหรับแสดงด้านหน้าของการ์ดเชิญ
const CardFront: React.FC<MusicControlsProps> = ({ onFlip, isPlaying, onToggleMusic, onNext, onPrev, currentTrack, config = defaultWeddingCardConfig }) => {
    // ใช้ config สำหรับการ์ดแต่งงาน (รับจาก props หรือใช้ default)
    const orderedNames = getOrderedNames(config);

    return (

        // FIX: Use 'no-scrollbar' class to hide UI

        <div className="w-full h-full flex flex-col md:flex-row bg-white overflow-y-auto no-scrollbar">

            {/* Left: Names & Countdown */}

            <div className="w-full md:w-5/12 bg-[#fdfcf8] relative min-h-[30vh] md:min-h-full flex flex-col items-center justify-center md:justify-start pt-3 md:pt-12 overflow-y-auto no-scrollbar border-b md:border-b-0 md:border-r border-gray-100 shrink-0">

                 <div className="absolute inset-0 opacity-100 pointer-events-none" style={{

                     backgroundImage: `url('https://images.unsplash.com/photo-1596788062679-3d7707e2dc83?q=80&w=2070&auto=format&fit=crop')`,

                     backgroundSize: 'cover', backgroundPosition: 'center', filter: 'contrast(0.95) brightness(1.05)'

                 }}></div>

                 <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>

                 <div className="absolute top-8 md:top-40 left-4 md:left-8 text-lg md:text-2xl text-blue-400 opacity-80 transform -rotate-12 animate-float">🦋</div>

                 <div className="absolute top-1/3 right-4 md:right-6 text-base md:text-xl text-pink-400 opacity-70 transform rotate-12">🦋</div>



                 <div className="relative z-10 text-center px-3 md:px-6 w-full max-w-md mx-auto pb-2 md:pb-8">

                     <Text className="uppercase tracking-[0.15em] text-[#8d6e63] text-[7px] md:text-[10px] font-cinzel mb-1 md:mb-4 block">Together with their families</Text>

                     {/* UPDATED: แสดงชื่อตามลำดับที่กำหนด (เจ้าสาวก่อนเจ้าบ่าว) - ปรับให้ fit หน้าจอ */}
                     <div 
                         className="font-dancing text-[var(--color-soft-pink)] leading-tight mb-0.5 md:mb-2 drop-shadow-sm break-words overflow-wrap-anywhere"
                         style={{ 
                             fontSize: 'clamp(1.5rem, 6vw, 4.5rem)',
                             wordBreak: 'break-word',
                             overflowWrap: 'anywhere'
                         }}
                     >
                         {orderedNames.first.firstName}
                     </div>

                     <Text 
                         className="font-dancing text-[var(--color-soft-pink)] mb-0.5 md:mb-2 block"
                         style={{ fontSize: 'clamp(1rem, 3vw, 2.5rem)' }}
                     >
                         &amp;
                     </Text>

                     <div 
                         className="font-dancing text-[var(--color-soft-pink)] leading-tight mb-2 md:mb-6 drop-shadow-sm break-words overflow-wrap-anywhere"
                         style={{ 
                             fontSize: 'clamp(1.5rem, 6vw, 4.5rem)',
                             wordBreak: 'break-word',
                             overflowWrap: 'anywhere'
                         }}
                     >
                         {orderedNames.second.firstName}
                     </div>

                     <div className="flex items-center justify-center gap-2 md:gap-4 text-[var(--color-dark-text)] font-cinzel my-1 md:my-5 w-full max-w-[180px] md:max-w-[240px] mx-auto">

                        <div className="flex-1 text-right border-b border-[var(--color-dark-text)] pb-1"><span className="text-[7px] md:text-[10px] uppercase tracking-widest block">Saturday</span></div>

                        <div className="text-2xl md:text-4xl font-medium mx-1 leading-none">31</div>

                        <div className="flex-1 text-left border-b border-[var(--color-dark-text)] pb-1"><span className="text-[7px] md:text-[10px] uppercase tracking-widest block">January</span></div>

                     </div>

                     <div className="font-cinzel text-[var(--color-dark-text)] text-sm md:text-lg tracking-[0.2em] mb-1 md:mb-4">2569</div>

                     <div className="mb-2 md:mb-6">
                         <CountdownTimer />
                     </div>

                     {/* Dress Code แบบวงกลม */}
                     {config.dressCode && config.dressCode.colors && config.dressCode.colors.length > 0 && (
                         <div className="w-full mt-2 md:mt-6 px-0 md:px-2 relative z-10 flex flex-col items-center">
                             <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                                 {config.dressCode.label && (
                                     <Text className="text-[#5c3a58] text-[9px] md:text-xs font-cinzel">
                                         {config.dressCode.label}
                                     </Text>
                                 )}
                                 <div className="flex items-center gap-1.5 md:gap-2">
                                     {config.dressCode.colors.map((color, idx) => (
                                         <div
                                             key={idx}
                                             className="w-5 h-5 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm"
                                             style={{ backgroundColor: color }}
                                         />
                                     ))}
                                 </div>
                             </div>
                             
                             {/* ที่อยู่ */}
                             <a 
                                 href="https://maps.app.goo.gl/zi9XTyNu9tQfmHkv9" 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="mt-1 md:mt-3 flex items-center justify-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity cursor-pointer no-underline"
                             >
                                 <EnvironmentOutlined 
                                     className="text-[#d4af37]" 
                                     style={{ fontSize: 'clamp(0.75rem, 2vw, 1.125rem)' }}
                                 />
                                 <Text 
                                     className="text-[#5c3a58] font-semibold font-cinzel tracking-wide"
                                     style={{ 
                                         fontSize: 'clamp(0.625rem, 1.8vw, 1rem)'
                                     }}
                                 >
                                     ณ เรือนชมมณี นครราชสีมา
                                 </Text>
                             </a>
                         </div>
                     )}

                 </div>

            </div>



            {/* Right: Details */}

            <div className="w-full md:w-7/12 p-2 md:p-10 flex flex-col items-center justify-center md:justify-start text-center relative bg-[#fffdf9] grow overflow-y-auto no-scrollbar">

                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{

                     backgroundImage: `url('https://images.unsplash.com/photo-1596788062679-3d7707e2dc83?q=80&w=2070&auto=format&fit=crop')`,

                     backgroundSize: 'cover', backgroundPosition: 'center',

                 }}></div>

                <div className="absolute top-4 right-4 w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 border-[#d4af37] opacity-40"></div>

                <div className="absolute bottom-4 left-4 w-8 h-8 md:w-12 md:h-12 border-b-2 border-l-2 border-[#d4af37] opacity-40"></div>



                {/* UPDATED: Reduced vertical margins */}

                <div className="w-full max-w-2xl mb-2 md:mb-6 mt-2 md:mt-6 relative z-10">

                    <Text className="text-[#8d6e63] uppercase tracking-[0.15em] text-[7px] md:text-[10px] block mb-1 md:mb-4 font-cinzel">We Invite You To The Wedding Of</Text>

                    {/* แสดงชื่อบิดามารดาที่ด้านบนสุด (ก่อนข้อความเชิญ) - ปรับให้ fit หน้าจอ */}
                    <div className="w-full mb-2 md:mb-6 relative z-10 max-w-full overflow-hidden">
                        <div className="flex justify-center items-center gap-1.5 md:gap-4 text-[8px] md:text-xs text-gray-500 mb-0.5 px-1 md:px-2">
                            <div className="text-right flex-1 min-w-0 break-words">
                                <div className="font-bold text-[#5c3a58] mb-0.5 text-[9px] md:text-xs">ฝ่ายเจ้าสาว</div>
                                <div className="break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', fontSize: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>{config.parents.bride.father}</div>
                                <div className="break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', fontSize: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>{config.parents.bride.mother}</div>
                            </div>
                            <div className="flex items-center px-1 md:px-2 shrink-0">
                                <Text className="text-[#8d6e63] text-[9px] md:text-sm whitespace-nowrap">และ</Text>
                            </div>
                            <div className="text-left flex-1 min-w-0 break-words">
                                <div className="font-bold text-[#5c3a58] mb-0.5 text-[9px] md:text-xs">ฝ่ายเจ้าบ่าว</div>
                                <div className="break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', fontSize: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>{config.parents.groom.father}</div>
                                <div className="break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', fontSize: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>{config.parents.groom.mother}</div>
                            </div>
                        </div>
                    </div>

                    <h1 
                        className="text-[#5c3a58] m-0 leading-snug font-script my-1 md:my-3 drop-shadow-sm break-words overflow-wrap-anywhere" 
                        style={{ 
                            fontSize: 'clamp(1.25rem, 4vw, 3rem)', 
                            fontStyle: 'normal',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                        }}
                    >
                        {orderedNames.first.nickname} <span className="text-[#d4af37]" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.5rem)' }}>&amp;</span> {orderedNames.second.nickname}
                    </h1>

                    <Text 
                        className="text-[#8d6e63] mt-2 md:mt-6 block font-light break-words overflow-wrap-anywhere px-2" 
                        style={{ 
                            fontSize: 'clamp(0.5rem, 1.5vw, 1rem)',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                        }}
                    >
                        ({orderedNames.first.fullNameThai} &amp; {orderedNames.second.fullNameThai})
                    </Text>

                    <Text className="text-[#8d6e63] mt-2 md:mt-6 block text-[9px] md:text-sm px-2 md:px-4 leading-tight md:leading-relaxed font-light">

                        มีความยินดีขอเรียนเชิญท่านเพื่อเป็นเกียรติและร่วมรับประทานอาหาร<br className="hidden md:block"/>เนื่องในพิธีมงคลสมรส

                    </Text>

                </div>



                <Divider className="border-[#d4af37] opacity-30 my-1 md:my-5 w-1/2 min-w-[80px] mx-auto relative z-10"><span className="text-[#d4af37] text-xs md:text-lg">✤</span></Divider>



                <div className="w-full grid grid-cols-5 gap-1 md:gap-2 mb-1 md:mb-4 px-0 md:px-2 relative z-10">

                    {weddingSchedule.map((item, idx) => (

                        <div key={idx} className="flex flex-col items-center">

                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-white border border-[#d4af37] flex items-center justify-center text-[10px] md:text-lg mb-0.5 md:mb-2 shadow-sm text-[#5c3a58]">{item.icon}</div>

                            <div className="text-[#5c3a58] font-bold text-[8px] md:text-xs whitespace-nowrap">{item.time}</div>

                            <div className="text-gray-400 text-[7px] md:text-[10px] hidden sm:block text-center">{item.title}</div>

                        </div>

                    ))}

                </div>

                {/* Custom Music Player UI */}

                <div className="relative z-20 flex flex-col items-center justify-center mt-1 md:mt-4 animate-fade-in bg-[#5c3a58]/5 p-1.5 md:p-2 rounded-xl border border-[#5c3a58]/10 backdrop-blur-sm w-[90%] max-w-[300px] mx-auto">

                   <div className="flex items-center gap-2 md:gap-3 w-full">

                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[#d4af37] shadow-sm shrink-0 ${isPlaying ? 'animate-spin-slow' : 'paused-spin'}`}>

                         <img src={currentTrack.cover} className="w-full h-full object-cover" alt="Cover" />

                      </div>

                      <div className="flex-1 min-w-0 text-left">

                          <div className="text-[9px] md:text-[10px] font-bold text-[#5c3a58] truncate">{currentTrack.title}</div>

                          <div className="text-[8px] md:text-[9px] text-gray-500 truncate">{currentTrack.artist}</div>

                      </div>

                      <div className="flex items-center gap-0.5 md:gap-1">

                          {PLAYLIST.length > 1 && (
                              <Button type="text" shape="circle" size="small" icon={<StepBackwardOutlined />} onClick={(e) => {e.stopPropagation(); onPrev();}} className="text-[#5c3a58] hover:bg-[#5c3a58]/10" />
                          )}

                          <Button 

                             type="primary" 

                             shape="circle" 

                             size="small"

                             icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 

                             onClick={(e) => {e.stopPropagation(); onToggleMusic();}}

                             className="bg-[#5c3a58] shadow-md"

                          />

                          {PLAYLIST.length > 1 && (
                              <Button type="text" shape="circle" size="small" icon={<StepForwardOutlined />} onClick={(e) => {e.stopPropagation(); onNext();}} className="text-[#5c3a58] hover:bg-[#5c3a58]/10" />
                          )}

                      </div>

                   </div>

                </div>



                {/* UPDATED: Added pb-4 for bottom spacing on mobile */}

                <div className="mt-auto pb-2 md:pb-8 relative z-10 pt-2 md:pt-6">

                    <Button type="primary" size="large" onClick={onFlip} className="h-9 md:h-12 px-6 md:px-10 text-xs md:text-base font-medium shadow-lg bg-[#5c3a58] hover:bg-[#4a2e46] border-none rounded-sm tracking-wide hover:scale-105 transition-transform">ลงทะเบียนร่วมงาน</Button>

                </div>

            </div>

        </div>

    );

};



// Card Back Component - Component สำหรับแสดงด้านหลังของการ์ดเชิญ (ฟอร์ม RSVP)
const CardBack: React.FC<{ 
    onFlip: () => void;
    onLoginSuccess?: () => void;
}> = ({ onFlip, onLoginSuccess }) => {
    // State สำหรับสถานะการ login
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    // State สำหรับข้อมูล RSVP ที่ส่งแล้ว
    const [submittedData, setSubmittedData] = useState<RSVPData | null>(null);
    // State สำหรับสถานะการโหลด
    const [loading, setLoading] = useState(false);
    // State สำหรับสถานะการแก้ไข
    const [isEditing, setIsEditing] = useState(false);
    // Form instance จาก Ant Design
    const [form] = Form.useForm();
    // Watch form values - ดูค่า isComing และ accompanyingGuests จาก form
    const isComing = Form.useWatch('isComing', form);
    const accompanyingGuests = Form.useWatch('accompanyingGuests', form);
    // State สำหรับเก็บ UID ของ user ปัจจุบัน
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    // State สำหรับเก็บข้อมูล user จาก Firebase Auth
    const [userInfo, setUserInfo] = useState<User | null>(null);
    // เพิ่ม state สำหรับเช็คสถานะเริ่มต้น
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    // State สำหรับสถานะการโหลด RSVP
    const [isLoadingRSVP, setIsLoadingRSVP] = useState(false);
    // เพิ่ม ref เพื่อป้องกันการ logout ซ้ำ
    const isLoggingOutRef = useRef(false);
    const sessionLogoutTriggeredRef = useRef(false);
    // State สำหรับควบคุมการแสดงแบนเนอร์ช่วยเหลือ in-app browser
    const [showBrowserBanner, setShowBrowserBanner] = useState(true);
    

    // Check persistent login on mount
    // สำคัญ: ต้องเรียก checkRedirectResult() ก่อน onAuthStateChanged
    // เพื่อให้ได้รับผลลัพธ์จาก redirect login ก่อนที่ auth state จะเปลี่ยน
    // ตามมาตรฐาน Firebase Auth: https://firebase.google.com/docs/auth/web/facebook-login
    useEffect(() => {
        let isMounted = true;
        let redirectResultHandled = false; // Flag เพื่อป้องกัน race condition
        
        setIsCheckingAuth(true);

        // 🔧 เพิ่ม timeout เพื่อป้องกัน loading ค้าง (10 วินาที)
        const authTimeout = setTimeout(() => {
            if (isMounted) {
                logger.warn('Auth check timeout - clearing loading state');
                setIsCheckingAuth(false);
            }
        }, 10000); // 10 seconds timeout

        // 1. เช็ค redirect result ก่อน (ถ้ามี redirect result จะได้ผลลัพธ์ทันที)
        AuthService.getInstance().checkRedirectResult()
            .then((user) => {
                if (!isMounted) return;
                
                // Clear timeout เมื่อได้ผลลัพธ์แล้ว
                clearTimeout(authTimeout);
                
                if (user) {
                    // User successfully signed in via redirect
                    redirectResultHandled = true;
                    logger.log('✅ Redirect login successful, user:', user.uid);
                    setIsLoggedIn(true);
                    setCurrentUser(user.uid);
                    setUserInfo(user);
                    
                    // Debug: ตรวจสอบ providerData และ photoURL
                    logger.log('🔍 Google Auth Data:', {
                        providerData: user.providerData,
                        photoURL: user.photoURL,
                        googleProvider: user.providerData?.find(p => p.providerId === 'google.com'),
                        googlePhotoURL: user.providerData?.find(p => p.providerId === 'google.com')?.photoURL
                    });
                    
                    setIsCheckingAuth(false);
                    message.success('เข้าสู่ระบบสำเร็จ');
                    
                    // 🔧 Fix: หลังจาก redirect login สำเร็จ ให้ flip ไปหน้า login form
                    if (onLoginSuccess) {
                        onLoginSuccess();
                    }
                    
                    // Update Firebase state เพื่อบันทึกว่า flip แล้ว
                    const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
                    const isAdminPath = currentPathname.startsWith('/admin');
                    
                    if (!isAdminPath) {
                        // สร้าง session ใหม่หลังจาก redirect login
                        registerSession(user, false).catch((sessionError) => {
                            logger.error('Error registering session:', sessionError);
                        });
                        
                        // Update app state เพื่อบันทึกว่า flip แล้ว
                        updateUserAppState(user.uid, { 
                            isFlipped: true,
                            hasStarted: true 
                        }).catch((stateError) => {
                            logger.error('Error updating app state:', stateError);
                        });
                    }
                } else {
                    // No redirect result, continue with auth state check
                    logger.log('No redirect result, checking auth state...');
                    
                    // ไม่ต้องแสดง modal แล้ว - ใช้ inline banner แทน
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                
                // 🔧 IMPORTANT: Clear timeout และ loading state เสมอแม้จะ error
                clearTimeout(authTimeout);
                setIsCheckingAuth(false);
                
                // Handle specific errors
                if (err.code === 'auth/account-exists-with-different-credential') {
                    message.error('อีเมลนี้ถูกใช้งานด้วยวิธีอื่นแล้ว กรุณาใช้วิธีเข้าสู่ระบบอื่น');
                } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                    // 🔧 สำหรับ Messenger WebView: sessionStorage error ไม่ควรแสดง error message
                    if (err.message?.includes('sessionStorage') || 
                        err.message?.includes('initial state') ||
                        err.message?.includes('missing initial state')) {
                        logger.warn('SessionStorage error in webview - continuing with auth state check');
                        // ไม่แสดง error message เพื่อไม่ให้ผู้ใช้สับสน
                    } else {
                        logger.error('Redirect login error:', err);
                        // แสดง error เฉพาะเมื่อไม่ใช่ sessionStorage error
                        message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่');
                    }
                }
                // Continue with auth state check even if redirect check fails
                // onAuthStateChanged จะจัดการต่อ
            });

        // 2. Subscribe to auth state changes (สำหรับ persistent login และ logout)
        // ไม่ใช้ setTimeout เพื่อให้ state อัปเดตทันที
        let isInitialAuthCheck = true; // เพิ่ม flag เพื่อเช็คว่าเป็น initial check หรือไม่
        
        // Subscribe เพื่อรับการเปลี่ยนแปลง authentication state
        const unsubscribe = AuthService.getInstance().onAuthStateChange((user) => {
            if (!isMounted) return;
            
            // 🔧 DevOps Fix: ตรวจสอบว่าไม่ใช่หน้า admin ก่อนทำงาน session management
            const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
            const isAdminPath = currentPathname.startsWith('/admin');
            
            if (isAdminPath) {
                // ถ้าอยู่ในหน้า admin ไม่ต้องทำงาน session management
                logger.log('⏭️ [Auth State Change] ข้าม session management - อยู่ในหน้า admin');
                setIsCheckingAuth(false);
                setLoading(false);
                return;
            }
            
            // ถ้าเป็น initial check และไม่มี user ให้ข้าม (ไม่ log "User logged out")
            if (isInitialAuthCheck && !user) {
                isInitialAuthCheck = false;
                setIsLoggedIn(false); // 🔧 Fix: ตั้ง isLoggedIn = false เมื่อยังไม่ login
                setCurrentUser(null); // 🔧 Fix: ตั้ง currentUser = null เมื่อยังไม่ login
                setIsCheckingAuth(false);
                return;
            }
            
            // หลังจาก initial check แล้ว ให้ตั้ง flag เป็น false
            if (isInitialAuthCheck) {
                isInitialAuthCheck = false;
            }
            
            // ถ้า redirect result จัดการแล้ว ให้เช็คว่า user เปลี่ยนหรือไม่ (เช่น logout แล้ว login ใหม่)
            if (redirectResultHandled && user) {
                // แต่ถ้า user เปลี่ยน (เช่น logout แล้ว login ใหม่) ให้อัปเดต
                const currentUid = user.uid;
                const existingUid = currentUser;
                
                // ถ้า UID เปลี่ยน หรือยังไม่มี currentUser ให้อัปเดต
                if (currentUid !== existingUid || !existingUid) {
                    logger.log('✅ Auth state changed, updating user:', currentUid);
                    redirectResultHandled = false; // Reset flag เพื่อให้สามารถอัปเดตได้
                    setIsLoggedIn(true);
                    setCurrentUser(currentUid);
                    setUserInfo(user);
                    
                    // Debug: ตรวจสอบ providerData และ photoURL
                    logger.log('🔍 Facebook Auth Data:', {
                        providerData: user.providerData,
                        photoURL: user.photoURL,
                        facebookProvider: user.providerData?.find(p => p.providerId === 'facebook.com'),
                        facebookPhotoURL: user.providerData?.find(p => p.providerId === 'facebook.com')?.photoURL
                    });
                    
                    setIsCheckingAuth(false);
                    setLoading(false); // ปลดล็อกปุ่มในกรณี popup สำเร็จ
                }
                return;
            }
            
            // ถ้าไม่มี redirect result และ auth state เปลี่ยน
            if (user) {
                logger.log('✅ Auth state detected, user:', user.uid);
                
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
                setUserInfo(user);
                
                // Debug: ตรวจสอบ providerData และ photoURL
                logger.log('🔍 Facebook Auth Data:', {
                    providerData: user.providerData,
                    photoURL: user.photoURL,
                    facebookProvider: user.providerData?.find(p => p.providerId === 'facebook.com'),
                    facebookPhotoURL: user.providerData?.find(p => p.providerId === 'facebook.com')?.photoURL
                });
                
                // สร้าง session ใหม่ (กรณี persistent login)
                const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
                const isAdminPath = currentPathname.startsWith('/admin');
                
                if (!isAdminPath) {
                    registerSession(user, false).catch((sessionError) => {
                        logger.error('Error registering session:', sessionError);
                    });
                }
            } else {
                // Log เฉพาะเมื่อ logout จริงๆ (ไม่ใช่ initial check)
                logger.log('User logged out');
                setIsLoggedIn(false);
                setCurrentUser(null);
                setUserInfo(null);
                redirectResultHandled = false;
            }
            
            setIsCheckingAuth(false);
            setLoading(false); // เผื่อกรณี state loading ค้าง
        });

        return () => {
            isMounted = false;
            clearTimeout(authTimeout); // Clear timeout เมื่อ component unmount
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps array is intentional - only run once on mount

    // 🔧 DevOps Fix: ดึงข้อมูล RSVP แบบ realtime เมื่อ login หรือเมื่อ currentUser เปลี่ยน
    useEffect(() => {
        // 🔧 DevOps Fix: ตรวจสอบว่าไม่ใช่หน้า admin ก่อนโหลด RSVP
        const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminPath = currentPathname.startsWith('/admin');
        
        if (isAdminPath) {
            // ถ้าอยู่ในหน้า admin ไม่ต้องโหลด RSVP
            logger.log('⏭️ [RSVP] ข้ามการโหลด RSVP - อยู่ในหน้า admin');
            setIsLoadingRSVP(false);
            return;
        }
        
        if (currentUser && isLoggedIn) {
            setIsLoadingRSVP(true);
            
            // 🔧 DevOps Fix: ใช้ realtime subscription แทน one-time fetch
            const rsvpRef = ref(database, `rsvps`);
            // Subscribe เพื่อรับการเปลี่ยนแปลง RSVP แบบ real-time
            const unsubscribe = onValue(rsvpRef, (snapshot) => {
                if (!snapshot.exists()) {
                    // ถ้ายังไม่มี RSVP ให้ auto-fill จาก Google
                    if (userInfo) {
                        form.setFieldsValue({
                            fullName: userInfo.displayName || '',
                        });
                    }
                    setIsLoadingRSVP(false);
                    return;
                }
                
                const data = snapshot.val();
                // แปลงข้อมูลจาก object เป็น array
                const rsvps = Object.keys(data).map(key => {
                    const rsvp = { id: key, ...data[key] };
                    // ลบ phoneNumber ออกถ้ามี (สำหรับข้อมูลเก่า)
                    if ('phoneNumber' in rsvp) {
                        delete (rsvp as Record<string, unknown>).phoneNumber;
                    }
                    return rsvp;
                });
                
                // หา RSVP ของ user นี้
                const userRSVP = rsvps.find(r => r.uid === currentUser);
                
                if (userRSVP) {
                    logger.log('✅ [RSVP] Realtime update - พบ RSVP:', userRSVP.id);
                    setSubmittedData(userRSVP);
                    
                    // เติมข้อมูลลง form เพื่อให้แก้ไขได้
                    // ใช้ fullName ถ้ามี หรือสร้างจาก firstName + lastName
                    const fullName = userRSVP.fullName || 
                        (userRSVP.firstName && userRSVP.lastName 
                            ? `${userRSVP.firstName} ${userRSVP.lastName}` 
                            : userRSVP.firstName || '');
                    
                    // เติมข้อมูลลง form
                    form.setFieldsValue({
                        isComing: userRSVP.isComing,
                        side: userRSVP.side,
                        relation: userRSVP.relation,
                        fullName: fullName,
                        note: userRSVP.note,
                        accompanyingGuests: userRSVP.accompanyingGuests || [],
                    });
                } else if (userInfo) {
                    // ถ้ายังไม่มี RSVP ให้ auto-fill จาก Google
                    form.setFieldsValue({
                        fullName: userInfo.displayName || '',
                    });
                }
                
                setIsLoadingRSVP(false);
            }, (error) => {
                logger.error('❌ [RSVP] เกิดข้อผิดพลาดในการ subscribe RSVP:', error);
                setIsLoadingRSVP(false);
            });
            
            // Cleanup เมื่อ component unmount หรือ dependencies เปลี่ยน
            return () => {
                unsubscribe();
            };
        } else {
            // ถ้า logout ให้ clear ข้อมูล
            setSubmittedData(null);
            form.resetFields();
            setIsLoadingRSVP(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, isLoggedIn, userInfo]); // form is stable, no need in deps

    // Subscribe เพื่อเช็คว่า session ถูกปิดหรือไม่
    // ใช้ Firebase Auth state persistence มาตรฐาน - ไม่ต้องเช็ค concurrent login
    useEffect(() => {
        if (!currentUser) return;

        const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminPath = currentPathname.startsWith('/admin');
        
        // ถ้าอยู่ในหน้า admin ไม่ต้อง subscribe session changes
        if (isAdminPath) {
            return;
        }

        sessionLogoutTriggeredRef.current = false;
        
        // Subscribe เพื่อรับการเปลี่ยนแปลง session state
        const unsubscribeSession = subscribeSessionChanges(currentUser, (isOnline) => {
            if (sessionLogoutTriggeredRef.current || isLoggingOutRef.current) return;
            
            // ถ้า isOnline === false แสดงว่า session ถูกปิด
            if (!isOnline) {
                sessionLogoutTriggeredRef.current = true;
                isLoggingOutRef.current = true;
                handleLogout();
            }
        }, false);

        // Cleanup เมื่อ component unmount หรือ currentUser เปลี่ยน
        return () => {
            unsubscribeSession();
            sessionLogoutTriggeredRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    // ตรวจสอบ mobile device หรือ in-app browser และแสดงแบนเนอร์เฉพาะเมื่อยังไม่ล็อกอิน
    useEffect(() => {
        const isMobile = isMobileDevice();
        const isInApp = isInAppBrowser();
        const shouldShow = !isLoggedIn && (isMobile || isInApp);
        
        // Debug logging
        if (typeof window !== 'undefined' && (window as any).__DEBUG_BROWSER_DETECTION__) {
            console.log('[CardBack Banner Debug]', {
                isLoggedIn,
                isMobile,
                isInAppBrowser: isInApp,
                showBrowserBanner: shouldShow,
                userAgent: window.navigator.userAgent,
                referrer: document.referrer
            });
        }
        
        if (isLoggedIn) {
            setShowBrowserBanner(false);
            return;
        }
        
        // แสดงแบนเนอร์เมื่อยังไม่ล็อกอินและเป็น mobile device หรือ in-app browser
        if (isMobile || isInApp) {
            setShowBrowserBanner(true);
        } else {
            setShowBrowserBanner(false);
        }
    }, [isLoggedIn]);

    // ฟังก์ชันสำหรับเข้าสู่ระบบด้วย Google
    const handleLogin = async (provider: 'google') => {
        // Prevent multiple clicks - ป้องกันการคลิกซ้ำ
        if (loading) return;

        // ไม่ block login แต่ให้ banner เตือนแทน

        // 🔧 DevOps Fix: ตรวจสอบว่าไม่ใช่หน้า admin ก่อนทำงาน session management
        const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminPath = currentPathname.startsWith('/admin');
        
        if (isAdminPath) {
            // ถ้าอยู่ในหน้า admin ไม่ต้องทำงาน session management
            logger.log('⏭️ [Login] ข้าม session management - อยู่ในหน้า admin');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // ถ้า popup สำเร็จ ฟังก์ชันจะ resolve และไม่ redirect
            // ถ้า fallback เป็น redirect หน้าเพจจะเปลี่ยนทันที
            await AuthService.getInstance().signInWithGoogle();

            // หลังจาก login สำเร็จ ให้ดึง user จาก Firebase Auth โดยตรง
            // เพื่อให้แน่ใจว่า currentUser ถูก set ทันที (ไม่ต้องรอ onAuthStateChange)
            const firebaseUser = AuthService.getInstance().getCurrentUser();
            if (firebaseUser) {
                logger.log('✅ Login successful, setting user state:', firebaseUser.uid);
                setCurrentUser(firebaseUser.uid);
                setUserInfo(firebaseUser);
                setIsLoggedIn(true);
                
                // สร้าง session ใหม่
                const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
                const isAdminPath = currentPathname.startsWith('/admin');
                
                if (!isAdminPath) {
                    registerSession(firebaseUser, false).catch((sessionError) => {
                        logger.error('Error registering session:', sessionError);
                    });
                }
            }

            // กรณี popup สำเร็จ → ปลดล็อกปุ่ม submit ได้เลย
            // กรณี redirect → จะถูกเพิกเฉยเพราะหน้าเพจจะย้ายออก
            setLoading(false);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            logger.error(`Error initiating ${provider} login:`, error);
            
            // Handle specific errors - จัดการ error เฉพาะ
            if (error.code === 'auth/popup-blocked') {
                message.error({
                    content: 'ป๊อปอัปถูกบล็อก กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ หรือเปิดในเบราว์เซอร์ภายนอก',
                    duration: 5,
                });
                setLoading(false);
            } else if (error.code === 'auth/popup-closed-by-user') {
                message.warning('ยกเลิกการเข้าสู่ระบบ');
                setLoading(false);
            } else if (error.code === 'auth/network-request-failed') {
                message.error('เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาลองใหม่');
                setLoading(false);
            } else if (error.code === 'auth/unauthorized-domain') {
                message.error('โดเมนนี้ไม่ได้รับอนุญาตใน Firebase Auth. กรุณาเพิ่มโดเมนใน Authorized domains');
                setLoading(false);
            } else if (error.code === 'auth/operation-not-allowed') {
                message.error('ยังไม่ได้เปิดใช้งานผู้ให้บริการเข้าสู่ระบบ โปรดเปิด Google ใน Firebase Console');
                setLoading(false);
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                message.error('อีเมลนี้ถูกเชื่อมกับผู้ให้บริการอื่นอยู่แล้ว กรุณาเข้าสู่ระบบด้วยผู้ให้บริการเดิม');
                setLoading(false);
            } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
                // สำหรับ WebView ที่ไม่รองรับ popup → แสดง message แนะนำ
                message.warning('เบราว์เซอร์นี้อาจไม่รองรับการเข้าสู่ระบบ กรุณาเปิดในเบราว์เซอร์ภายนอก (Chrome/Safari)');
                setLoading(false);
            } else if (error.message?.startsWith('POPUP_BLOCKED|')) {
                // ถ้า popup ถูกบล็อก → แสดง message แนะนำ
                message.warning('ป๊อปอัปถูกบล็อก กรุณาเปิดในเบราว์เซอร์ภายนอก (Chrome/Safari)');
                setLoading(false);
            } else if (error.message?.includes('เปิดในเบราว์เซอร์') || 
                       error.message?.includes('sessionStorage') ||
                       error.message?.includes('initial state') ||
                       error.message?.includes('missing initial state')) {
                // สำหรับ WebView ที่ sessionStorage ไม่ทำงาน → แสดง message แนะนำ
                message.warning('เบราว์เซอร์นี้อาจไม่รองรับการเข้าสู่ระบบ กรุณาเปิดในเบราว์เซอร์ภายนอก (Chrome/Safari)');
                setLoading(false);
            } else {
                // ไม่ทราบสาเหตุ → แสดงข้อความผิดพลาดและเคลียร์ loading
                const msg = typeof error?.message === 'string' ? error.message : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่';
                message.error(msg);
                setLoading(false);
            }
        }
    };




    // ฟังก์ชันสำหรับออกจากระบบ
    const handleLogout = async () => {
        // ป้องกันการเรียกซ้ำ
        if (isLoggingOutRef.current) {
            return;
        }
        
        let logoutSuccess = false;
        
        try {
            isLoggingOutRef.current = true;
            setLoading(false); // Reset loading before logout
            
            // ปิด session ก่อน logout
            if (currentUser) {
                try {
                    // Guest Flow - ใช้ isAdmin = false
                    await endSession(currentUser, false);
                } catch (sessionError) {
                    logger.error('Error ending session:', sessionError);
                    // ไม่ต้องบล็อกการทำงาน ถ้า session end ล้มเหลว
                }
            }
            
            await AuthService.getInstance().logout();
            logoutSuccess = true;
        } catch (error) {
            logger.error('Error logging out:', error);
            message.error('เกิดข้อผิดพลาดในการออกจากระบบ');
        } finally {
            // รีเซ็ต state เสมอ แม้ว่า logout() จะ throw exception
            // เพื่อป้องกัน app อยู่ในสถานะที่ไม่สอดคล้องกัน
            setIsLoggedIn(false);
            setCurrentUser(null);
            setUserInfo(null);
            setSubmittedData(null);
            form.resetFields();
            setLoading(false);
            
            if (logoutSuccess && !sessionLogoutTriggeredRef.current) {
                message.success('ออกจากระบบสำเร็จ');
            }
            
            // Reset flag หลังจาก logout เสร็จ
            setTimeout(() => {
                isLoggingOutRef.current = false;
                sessionLogoutTriggeredRef.current = false;
            }, 1000);
        }
    };

    // ฟังก์ชันสำหรับดึง URL ของ avatar จาก user
    const getAvatarUrl = (user: User | null | undefined) => {
        if (!user) return undefined;
        
        // ตรวจสอบ photoURL หลักก่อน
        if (user.photoURL) {
            return user.photoURL;
        }
        
        // ถ้าไม่มี ให้ตรวจสอบ providerData สำหรับ Google provider
        const googleProvider = user.providerData?.find(
            p => p.providerId === 'google.com'
        );
        if (googleProvider?.photoURL) {
            return googleProvider.photoURL;
        }
        
        // Fallback: undefined (จะแสดง icon แทน)
        return undefined;
    };

    // ฟังก์ชันสำหรับจัดการเมื่อ submit form (บันทึกหรืออัปเดต RSVP)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFinish = async (values: any) => {
        // ตรวจสอบว่ามี currentUser หรือไม่ - ใช้ getCurrentUser() จาก Firebase ถ้า state ยังไม่อัปเดต
        let effectiveUserId = currentUser;
        
        // ถ้า currentUser ยังไม่มี ให้ลองดึงจาก Firebase Auth โดยตรง (กรณีที่ state ยังไม่อัปเดต)
        if (!effectiveUserId) {
            const firebaseUser = AuthService.getInstance().getCurrentUser();
            if (firebaseUser) {
                effectiveUserId = firebaseUser.uid;
                // อัปเดต state ทันที
                setCurrentUser(effectiveUserId);
                setUserInfo(firebaseUser);
                setIsLoggedIn(true);
                logger.log('✅ Got user from Firebase Auth directly:', effectiveUserId);
            }
        }
        
        if (!effectiveUserId) {
            message.error('กรุณาเข้าสู่ระบบก่อนยืนยันการลงทะเบียน');
            setLoading(false); // Ensure loading is reset
            return;
        }

        // Prevent double submission - ป้องกันการ submit ซ้ำ
        if (loading) {
            return;
        }

        setLoading(true);
        try {
            // ตรวจสอบข้อมูลที่จำเป็น
            if (!values.isComing) {
                message.error('กรุณาเลือกสถานะการร่วมงาน');
                setLoading(false);
                return;
            }

            if (values.isComing === 'yes' && !values.side) {
                message.error('กรุณาเลือกฝั่ง (เจ้าบ่าว/เจ้าสาว)');
                setLoading(false);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sanitizedGuests = (values.accompanyingGuests || []).map((g: any) => ({
                relationToMain: g?.relationToMain || '',
                name: g?.name || ''
            }));

            // จัดการ fullName: ใช้จาก form หรือจาก userInfo.displayName
            const fullName = values.fullName || userInfo?.displayName || '';
            
            // แยกชื่อและนามสกุลจาก fullName สำหรับ backward compatibility
            let firstName = '';
            let lastName = '';
            if (fullName) {
                const nameParts = fullName.trim().split(/\s+/);
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
            }

            const rsvpData: Omit<RSVPData, 'id' | 'createdAt' | 'updatedAt'> = {
                uid: effectiveUserId, // ใช้ effectiveUserId แทน currentUser
                isComing: values.isComing,
                firstName: firstName,
                lastName: lastName,
                fullName: fullName, // เก็บ fullName เพิ่มด้วย
                photoURL: getAvatarUrl(userInfo) || null, // เก็บภาพ profile จาก Google (ตรวจสอบ providerData ถ้า photoURL หลักไม่มี)
                nickname: values.nickname || '',
                side: values.side || 'groom',
                relation: values.relation || '',
                note: values.note || '',
                accompanyingGuests: values.isComing === 'yes' ? sanitizedGuests : [],
                accompanyingGuestsCount: values.isComing === 'yes' ? sanitizedGuests.length : 0,
                guestId: null,
            };

            // Remove undefined fields to prevent Firebase error
            Object.keys(rsvpData).forEach(key => {
              const value = (rsvpData as Record<string, unknown>)[key];
              if (value === undefined) {
                delete (rsvpData as Record<string, unknown>)[key];
              }
            });

            // ตรวจสอบว่ามี RSVP อยู่แล้วหรือไม่ - ใช้ effectiveUserId
            let existingRSVP: RSVPData | null = null;
            try {
                existingRSVP = await RSVPService.getInstance().getByUid(effectiveUserId);
            } catch (error) {
                logger.error('Error fetching existing RSVP:', error);
                // ยังคงดำเนินการต่อแม้ว่าจะดึงข้อมูลไม่ได้
            }
            
            let rsvpId: string;
            if (existingRSVP && existingRSVP.id) {
                // Update RSVP ที่มีอยู่แล้ว
                try {
                    logger.log('🔄 [RSVP] กำลังอัปเดต RSVP ID:', existingRSVP.id);
                    logger.log('📝 [RSVP] ข้อมูลที่อัปเดต:', JSON.stringify(rsvpData, null, 2));
                    await RSVPService.getInstance().update(existingRSVP.id, rsvpData);
                    logger.log('✅ [RSVP] อัปเดต RSVP สำเร็จ');
                    rsvpId = existingRSVP.id;
                    setSubmittedData({ 
                        ...rsvpData, 
                        id: existingRSVP.id, 
                        createdAt: existingRSVP.createdAt, 
                        updatedAt: new Date().toISOString() 
                    } as RSVPData);
                    message.success('อัพเดทข้อมูลเรียบร้อย');
                } catch (error: unknown) {
                    logger.error('Error updating RSVP:', error);
                    const errorMessage = (error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลตอบรับร่วมงาน');
                    message.error(errorMessage);
                    setLoading(false);
                    return;
                }
            } else {
                // Create RSVP ใหม่
                try {
                    logger.log('🆕 [RSVP] กำลังสร้าง RSVP ใหม่...');
                    logger.log('📝 [RSVP] ข้อมูล RSVP:', JSON.stringify(rsvpData, null, 2));
                    rsvpId = await RSVPService.getInstance().create(rsvpData);
                    logger.log('✅ [RSVP] สร้าง RSVP สำเร็จ ID:', rsvpId);
                    setSubmittedData({ 
                        ...rsvpData, 
                        id: rsvpId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } as RSVPData);
                    message.success('บันทึกข้อมูลเรียบร้อย');
                } catch (error: unknown) {
                    logger.error('Error creating RSVP:', error);
                    const errorMessage = (error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูลตอบรับร่วมงาน');
                    message.error(errorMessage);
                    setLoading(false);
                    return;
                }
            }

            // 🔧 DevOps: ถ้า isComing === 'yes' ให้สร้างหรืออัพเดท Guest อัตโนมัติ (พร้อม Idempotency Check)
            if (values.isComing === 'yes') {
                let allGuestsCreated = true;
                try {
                    logger.log('🔄 [RSVP Flow] กำลังจัดการ Guest สำหรับ RSVP...');
                    
                    // 1. เช็ค Guest ที่ link กับ RSVP อยู่แล้ว (ถ้ามี)
                    let existingGuest = existingRSVP?.guestId ? await GuestService.getInstance().getById(existingRSVP.guestId) : null;
                    
                    // 2. 🔧 Idempotency Check: เช็คว่ามี Guest ที่มี rsvpUid นี้อยู่แล้วหรือไม่
                    if (!existingGuest) {
                        logger.log('🔍 [RSVP Flow] กำลังตรวจสอบ Guest ที่มี rsvpUid:', effectiveUserId);
                        existingGuest = await GuestService.getInstance().getByRsvpUid(effectiveUserId);
                        
                        if (existingGuest) {
                            logger.log('✅ [RSVP Flow] พบ Guest ที่มีอยู่แล้ว (rsvpUid):', existingGuest.id);
                            // Link RSVP กับ Guest ที่มีอยู่ (ถ้ายังไม่ได้ link)
                            if (!existingRSVP?.guestId || existingRSVP.guestId !== existingGuest.id) {
                                logger.log('🔗 [RSVP Flow] กำลัง link RSVP กับ Guest ที่มีอยู่...');
                                await RSVPService.getInstance().update(rsvpId, { guestId: existingGuest.id });
                                logger.log('✅ [RSVP Flow] Link RSVP กับ Guest สำเร็จ');
                            }
                        }
                    }
                    
                    if (existingGuest) {
                        // Update Guest ที่มีอยู่แล้ว - ใช้ฟังก์ชันสำหรับ RSVP
                        logger.log('🔄 [RSVP Flow] กำลังอัปเดต Guest ที่มีอยู่:', existingGuest.id);
                        const updatedGuest: Partial<Guest> = {
                            firstName: rsvpData.firstName || existingGuest.firstName,
                            lastName: rsvpData.lastName || existingGuest.lastName,
                            nickname: rsvpData.nickname || existingGuest.nickname,
                            relationToCouple: rsvpData.relation || existingGuest.relationToCouple,
                            side: rsvpData.side as Side,
                            note: rsvpData.note || existingGuest.note,
                            isComing: true,
                            accompanyingGuestsCount: rsvpData.accompanyingGuestsCount || 0,
                            updatedAt: new Date().toISOString(),
                        };
                        
                        // Remove undefined fields ก่อนบันทึก (Firebase ไม่ยอมรับ undefined)
                        Object.keys(updatedGuest).forEach(key => {
                            const value = (updatedGuest as Record<string, unknown>)[key];
                            if (value === undefined) {
                                delete (updatedGuest as Record<string, unknown>)[key];
                            }
                        });
                        
                        // ใช้ฟังก์ชันสำหรับ RSVP (ไม่ต้อง requireAdmin)
                        await GuestService.getInstance().updateFromRSVP(existingGuest.id, updatedGuest, effectiveUserId);
                        logger.log('✅ [RSVP Flow] อัปเดต Guest สำเร็จ:', existingGuest.id);
                        
                        // Update RSVP ให้ link กับ Guest (ถ้ายังไม่ได้ link)
                        if (!existingRSVP?.guestId || existingRSVP.guestId !== existingGuest.id) {
                            await RSVPService.getInstance().update(rsvpId, { guestId: existingGuest.id });
                            logger.log('✅ [RSVP Flow] Link RSVP กับ Guest สำเร็จ');
                        }
                        
                        // 🔧 DevOps Fix: จัดการ accompanying guests เมื่อ update RSVP
                        if (rsvpData.accompanyingGuests && rsvpData.accompanyingGuests.length > 0) {
                            logger.log(`🔄 [RSVP Flow] กำลังจัดการ Guest ผู้ติดตาม ${rsvpData.accompanyingGuests.length} คน...`);
                            
                            // หา groupId จาก existingGuest
                            const groupId = existingGuest.groupId || `GROUP_${existingGuest.id}`;
                            const groupName = existingGuest.groupName || `${rsvpData.firstName} ${rsvpData.lastName}`;
                            
                            // ดึง Guests ที่มีอยู่แล้วทั้งหมด (main + accompanying)
                            const allExistingGuests = await get(ref(database, 'guests'));
                            const existingGuestsList: Guest[] = allExistingGuests.exists() 
                                ? Object.keys(allExistingGuests.val()).map(key => ({ id: key, ...allExistingGuests.val()[key] }))
                                : [];
                            
                            // หา accompanying guests ที่มีอยู่แล้ว (ผ่าน groupId และ rsvpUid)
                            const existingAccGuests = existingGuestsList.filter(g => 
                                g.rsvpUid === effectiveUserId && 
                                g.id !== existingGuest.id &&
                                (g.groupId === groupId || g.groupId === existingGuest.groupId)
                            );
                            
                            // สร้าง/อัพเดต accompanying guests
                            for (let i = 0; i < rsvpData.accompanyingGuests.length; i++) {
                                try {
                                    const accGuest = rsvpData.accompanyingGuests[i];
                                    
                                    // หา Guest ที่มีอยู่แล้ว (match ตามชื่อและ rsvpUid)
                                    const existingAccGuest = existingAccGuests.find(g => 
                                        g.rsvpUid === effectiveUserId &&
                                        g.firstName === accGuest.name &&
                                        g.id !== existingGuest.id
                                    );
                                    
                                    if (existingAccGuest) {
                                        // อัพเดต Guest ที่มีอยู่แล้ว
                                        const updatedAccGuest: Partial<Guest> = {
                                            firstName: accGuest.name || existingAccGuest.firstName,
                                            relationToCouple: accGuest.relationToMain || existingAccGuest.relationToCouple,
                                            side: rsvpData.side as Side,
                                            groupId: groupId,
                                            groupName: groupName,
                                            isComing: true,
                                            updatedAt: new Date().toISOString(),
                                        };
                                        
                                        Object.keys(updatedAccGuest).forEach(key => {
                                            const value = (updatedAccGuest as Record<string, unknown>)[key];
                                            if (value === undefined) {
                                                delete (updatedAccGuest as Record<string, unknown>)[key];
                                            }
                                        });
                                        
                                        await GuestService.getInstance().updateFromRSVP(existingAccGuest.id, updatedAccGuest, effectiveUserId);
                                        logger.log(`✅ [RSVP Flow] อัปเดต Guest ผู้ติดตาม ${i + 1}/${rsvpData.accompanyingGuests.length} สำเร็จ:`, existingAccGuest.id, accGuest.name);
                                    } else {
                                        // สร้าง Guest ใหม่สำหรับผู้ติดตาม
                                        const accGuestId = generateId();
                                        const accGuestData: Guest = {
                                            id: accGuestId,
                                            firstName: accGuest.name || `คนที่ ${i + 1}`,
                                            lastName: '',
                                            nickname: '',
                                            age: null,
                                            gender: 'other',
                                            relationToCouple: accGuest.relationToMain || '',
                                            side: rsvpData.side as Side,
                                            zoneId: null,
                                            tableId: null,
                                            note: '',
                                            isComing: true,
                                            accompanyingGuestsCount: 0,
                                            groupId: groupId,
                                            groupName: groupName,
                                            checkedInAt: null,
                                            checkInMethod: null,
                                            rsvpUid: effectiveUserId,
                                            createdAt: new Date().toISOString(),
                                            updatedAt: new Date().toISOString(),
                                        };
                                        
                                        Object.keys(accGuestData).forEach(key => {
                                            const value = (accGuestData as unknown as Record<string, unknown>)[key];
                                            if (value === undefined) {
                                                delete (accGuestData as unknown as Record<string, unknown>)[key];
                                            }
                                        });
                                        
                                                                        await GuestService.getInstance().createFromRSVP(accGuestData, effectiveUserId);
                                        logger.log(`✅ [RSVP Flow] สร้าง Guest ผู้ติดตาม ${i + 1}/${rsvpData.accompanyingGuests.length} สำเร็จ:`, accGuestId, accGuest.name || `คนที่ ${i + 1}`);
                                    }
                                } catch (accError: unknown) {
                                    allGuestsCreated = false;
                                    logger.error(`❌ [RSVP Flow] เกิดข้อผิดพลาดในการจัดการ Guest ผู้ติดตาม ${i + 1}:`, accError);
                                    if (accError && typeof accError === 'object' && 'code' in accError && accError.code === 'PERMISSION_DENIED') {
                                        logger.error(`🚫 [RSVP Flow] Permission denied สำหรับ Guest ผู้ติดตาม ${i + 1} - ตรวจสอบ Firebase Rules`);
                                    }
                                }
                            }
                            
                            // 🔧 DevOps Fix: ลบ Guests ที่ไม่ตรงกับ RSVP อีกต่อไป (ถ้ามี)
                            const expectedNames = rsvpData.accompanyingGuests.map((g: { name: string; relationToMain: string }) => g.name);
                            const guestsToRemove = existingAccGuests.filter((g: Guest) => !expectedNames.includes(g.firstName));
                            
                            for (const guestToRemove of guestsToRemove) {
                                try {
                                    await remove(ref(database, `guests/${guestToRemove.id}`));
                                    logger.log(`🗑️ [RSVP Flow] ลบ Guest ที่ไม่ตรงกับ RSVP:`, guestToRemove.id);
                                } catch (error) {
                                    logger.error(`❌ [RSVP Flow] เกิดข้อผิดพลาดในการลบ Guest:`, error);
                                }
                            }
                            
                            logger.log(`✅ [RSVP Flow] จัดการ Guest ผู้ติดตามเสร็จสิ้น (${rsvpData.accompanyingGuests.length} คน)`);
                        }
                    } else {
                        // 🔧 DevOps: สร้างกลุ่ม (Group) จาก RSVP
                        logger.log('🆕 [RSVP Flow] กำลังสร้าง Guest ใหม่ (พร้อมกลุ่ม)...');
                        const groupId = `GROUP_${generateId()}`;
                        const groupName = `${rsvpData.firstName || 'ไม่ระบุชื่อ'} ${rsvpData.lastName || ''}`.trim();
                        const mainGuestId = generateId();
                        
                        // 1. สร้าง Guest หลัก (ตัวเอง)
                        const newGuest: Guest = {
                            id: mainGuestId,
                            firstName: rsvpData.firstName || 'ไม่ระบุชื่อ',
                            lastName: rsvpData.lastName || '',
                            nickname: rsvpData.nickname || '',
                            age: null,
                            gender: 'other',
                            relationToCouple: rsvpData.relation || '',
                            side: rsvpData.side as Side,
                            zoneId: null,
                            tableId: null,
                            note: rsvpData.note || '',
                            isComing: true,
                            accompanyingGuestsCount: rsvpData.accompanyingGuestsCount || 0,
                            groupId: groupId,
                            groupName: groupName,
                            checkedInAt: null,
                            checkInMethod: null,
                            rsvpUid: effectiveUserId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        
                        // Remove undefined fields ก่อนบันทึก (Firebase ไม่ยอมรับ undefined)
                        Object.keys(newGuest).forEach(key => {
                            const value = (newGuest as unknown as Record<string, unknown>)[key];
                            if (value === undefined) {
                                delete (newGuest as unknown as Record<string, unknown>)[key];
                            }
                        });
                        
                        // ใช้ฟังก์ชันสำหรับ RSVP (ไม่ต้อง requireAdmin)
                        // createGuestFromRSVP จะเช็ค idempotency เอง
                        try {
                            await GuestService.getInstance().createFromRSVP(newGuest, effectiveUserId);
                        } catch (createMainError) {
                            allGuestsCreated = false;
                            throw createMainError;
                        }
                        
                        // 2. สร้าง Guest สำหรับผู้ติดตาม (accompanyingGuests)
                        if (rsvpData.accompanyingGuests && rsvpData.accompanyingGuests.length > 0) {
                            logger.log(`🔄 [RSVP Flow] กำลังสร้าง Guest ผู้ติดตาม ${rsvpData.accompanyingGuests.length} คน...`);
                            
                            for (let i = 0; i < rsvpData.accompanyingGuests.length; i++) {
                                try {
                                    const accGuest = rsvpData.accompanyingGuests[i];
                                    const accGuestId = generateId();
                                    const accGuestData: Guest = {
                                        id: accGuestId,
                                        firstName: accGuest.name || `คนที่ ${i + 1}`,
                                        lastName: '',
                                        nickname: '',
                                        age: null,
                                        gender: 'other',
                                        relationToCouple: accGuest.relationToMain || '',
                                        side: rsvpData.side as Side,
                                        zoneId: null,
                                        tableId: null,
                                        note: '',
                                        isComing: true,
                                        accompanyingGuestsCount: 0,
                                        groupId: groupId,
                                        groupName: groupName,
                                        checkedInAt: null,
                                        checkInMethod: null,
                                        rsvpUid: effectiveUserId,
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                    };
                                    
                                    // Remove undefined fields
                                    Object.keys(accGuestData).forEach(key => {
                                        const value = (accGuestData as unknown as Record<string, unknown>)[key];
                                        if (value === undefined) {
                                            delete (accGuestData as unknown as Record<string, unknown>)[key];
                                        }
                                    });
                                    
                                    // 🔧 DevOps: ใช้ createGuestFromRSVP เพื่อให้ผ่าน Firebase Rules และ idempotency check
                                    // แต่ต้อง bypass idempotency check สำหรับผู้ติดตาม (เพราะมี rsvpUid เดียวกัน)
                                    // ดังนั้นใช้ set โดยตรง แต่เพิ่ม error handling
                                    await GuestService.getInstance().createFromRSVP(accGuestData, effectiveUserId);
                                    logger.log(`✅ [RSVP Flow] สร้าง Guest ผู้ติดตาม ${i + 1}/${rsvpData.accompanyingGuests.length} สำเร็จ:`, accGuestId, accGuest.name || `คนที่ ${i + 1}`);
                                } catch (accError: unknown) {
                                    logger.error(`❌ [RSVP Flow] เกิดข้อผิดพลาดในการสร้าง Guest ผู้ติดตาม ${i + 1}:`, accError);
                                    // ยังคงดำเนินการต่อแม้ว่าจะเกิด error (ไม่ throw เพื่อให้สร้าง Guest คนอื่นต่อได้)
                                    if (accError && typeof accError === 'object' && 'code' in accError && accError.code === 'PERMISSION_DENIED') {
                                        logger.error(`🚫 [RSVP Flow] Permission denied สำหรับ Guest ผู้ติดตาม ${i + 1} - ตรวจสอบ Firebase Rules`);
                                    }
                                }
                            }
                            logger.log(`✅ [RSVP Flow] สร้าง Guest ผู้ติดตามเสร็จสิ้น (${rsvpData.accompanyingGuests.length} คน)`);
                        }
                        
                        // 🔧 Double-check: เช็คว่า Guest ถูกสร้างจริงหรือไม่ (อาจจะถูก skip เพราะ idempotency)
                                                if (!allGuestsCreated) {
                            throw new Error('??????????????????????????????????????? ??????????????????????????????');
                        }

                                                const createdGuest = await GuestService.getInstance().getByRsvpUid(effectiveUserId);
                        const finalGuestId = createdGuest?.id || mainGuestId;
                        
                        // Update RSVP ให้ link กับ Guest
                        await RSVPService.getInstance().update(rsvpId, { guestId: finalGuestId });
                        logger.log('✅ [RSVP Flow] สร้าง Guest และ link RSVP สำเร็จ:', finalGuestId);
                    }
                } catch (guestError: unknown) {
                    logger.error('❌ [RSVP Flow] เกิดข้อผิดพลาดในการจัดการ Guest:', guestError);
                    const errorMessage = guestError instanceof Error ? guestError.message : String(guestError || 'Unknown error');
                    // แสดง error message ที่ชัดเจนขึ้น
                    message.warning(`บันทึก RSVP สำเร็จ แต่เกิดปัญหาในการสร้างข้อมูล Guest: ${errorMessage}`);
                }
            } else if (existingRSVP?.guestId) {
                // ถ้าเปลี่ยนจาก yes เป็น no ให้ update Guest.isComing = false
                try {
                    const existingGuest = await GuestService.getInstance().getById(existingRSVP.guestId);
                    if (existingGuest && existingGuest.rsvpUid === effectiveUserId) {
                        // ใช้ฟังก์ชันสำหรับ RSVP ถ้า Guest ถูกสร้างโดย RSVP
                        await GuestService.getInstance().updateFromRSVP(existingGuest.id, { 
                            isComing: false,
                            updatedAt: new Date().toISOString(),
                        }, effectiveUserId);
                    } else if (existingGuest && !existingGuest.rsvpUid) {
                        // ถ้า Guest ถูกสร้างโดย admin ให้ข้าม (ไม่สามารถแก้ไขได้)
                    }
                } catch (guestError) {
                    logger.error('Error updating guest isComing:', guestError);
                    // ไม่ throw error เพื่อไม่ให้กระทบการบันทึก RSVP
                }
            }

            setIsEditing(false);
            setLoading(false);
        } catch (error: unknown) {
            logger.error('Error saving RSVP:', error);
            setLoading(false);
            const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
            message.error(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${errorMessage}`);
        }
    };



    const totalAttendees = isComing === 'yes' ? 1 + (accompanyingGuests?.length || 0) : 0;



    const renderContent = () => {
        // แสดง loading ขณะเช็ค auth state - ต้องรอให้ auth state resolve ก่อนแสดง form
        if (isCheckingAuth) {
            return (
                <div className="w-full max-w-xs mx-auto text-center animate-fade-in pt-10">
                    <Spin size="large" />
                    <div style={{ marginTop: 16, color: '#666' }}>กำลังตรวจสอบข้อมูล...</div>
                </div>
            );
        }

        // แสดง loading ขณะ load RSVP (เฉพาะเมื่อ login แล้ว)
        if (isLoggedIn && isLoadingRSVP) {
            return (
                <div className="w-full max-w-xs mx-auto text-center animate-fade-in pt-10">
                    <Spin size="large" />
                    <div style={{ marginTop: 16, color: '#666' }}>กำลังโหลดข้อมูล...</div>
                </div>
            );
        }

        // ตรวจสอบว่า login แล้วหรือไม่ - ต้องมีทั้ง isLoggedIn และ currentUser
        // และต้องผ่านการเช็ค auth state แล้ว (isCheckingAuth === false)
        if (!isLoggedIn || !currentUser) {
            // ตรวจสอบว่าเป็น mobile device หรือ in-app browser
            const isMobile = isMobileDevice();
            const isInApp = isInAppBrowser();
            const shouldShowBanner = isMobile || isInApp;
            
            return (

                <div className={`w-full max-w-xs mx-auto text-center animate-fade-in relative ${shouldShowBanner && showBrowserBanner ? 'pt-32 md:pt-40' : 'pt-10'}`}>
                    
                    {/* แบนเนอร์ช่วยเหลือสำหรับ mobile/in-app browser - แสดงในหน้า login */}
                    {shouldShowBanner && showBrowserBanner && (
                        <InAppBrowserBanner onDismiss={() => setShowBrowserBanner(false)} />
                    )}

                    <Title level={3} className="font-cinzel text-[#5c3a58] mb-2">Welcome</Title>

                    <Text type="secondary" className="block mb-6 text-xs">กรุณายืนยันตัวตนเพื่อลงทะเบียน</Text>

                    <div className="space-y-3">
                        <Button block size="large" icon={<GoogleCircleFilled />} className="h-12 bg-white text-gray-600 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 font-medium" onClick={() => handleLogin('google')} loading={loading} disabled={loading}>เข้าสู่ระบบด้วย Google</Button>

                    </div>

                </div>

            );

        }



        if (submittedData && !isEditing) {

            return (

                <div className="text-center w-full max-w-sm mx-auto animate-fade-in pt-10">

                    <div className="mb-6 relative">
                        {userInfo ? (
                            <div className="flex flex-col items-center gap-3">
                                <Avatar 
                                    size={80} 
                                    src={getAvatarUrl(userInfo)}
                                    icon={!userInfo.photoURL && <UserOutlined />}
                                    className={`border-4 ${submittedData.isComing === 'yes' ? 'border-green-100' : 'border-gray-100'}`}
                                />
                                <div className="text-center">
                                    <div className="font-medium text-[#5c3a58]">{userInfo.displayName || 'ผู้ใช้'}</div>
                                    <div className="text-xs text-gray-500">{userInfo.email}</div>
                                    <Button type="link" size="small" danger icon={<LogoutOutlined />} onClick={handleLogout}>ออกจากระบบ</Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-white shadow-sm border-4 ${submittedData.isComing === 'yes' ? 'border-green-100' : 'border-gray-100'}`}>
                                {submittedData.isComing === 'yes' ? <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a' }} /> : <CloseCircleFilled style={{ fontSize: 48, color: '#8c8c8c' }} />}
                            </div>
                        )}
                    </div>

                    <Title level={4} style={{margin: '0 0 4px', fontFamily: 'Cinzel', color: '#5c3a58'}}>{submittedData.isComing === 'yes' ? 'ขอบคุณที่มาร่วมงาน' : 'รับทราบการแจ้ง'}</Title>

                    <div className="bg-white/50 p-6 rounded-xl border border-[#e6e2dd] text-center mb-6 shadow-sm">

                         {submittedData.isComing === 'yes' ? (

                             <>

                                <Text className="block text-gray-800 text-lg mb-1">

                                    {submittedData.fullName || 
                                     (submittedData.firstName && submittedData.lastName 
                                         ? `${submittedData.firstName} ${submittedData.lastName}` 
                                         : submittedData.firstName) || 
                                     'ผู้ลงทะเบียน'}

                                </Text>

                                <div className="flex justify-center gap-2 my-2">

                                    <Tag color="gold">{submittedData.side === 'groom' ? 'แขกฝั่งเจ้าบ่าว' : 'แขกฝั่งเจ้าสาว'}</Tag>

                                </div>

                                <div className="bg-[#fdf2f8] rounded-lg p-3 mt-2 inline-block min-w-[200px]">

                                    <div className="text-lg font-bold text-[#5c3a58] mb-1">

                                        รวม {1 + (submittedData.accompanyingGuestsCount || 0)} ท่าน

                                    </div>

                                    {submittedData.accompanyingGuestsCount > 0 && (

                                        <ul className="text-left text-xs text-gray-600 pl-4 mb-0 list-disc">

                                            <li className="text-gray-500">ตัวท่านเอง</li>

                                            {submittedData.accompanyingGuests.map((g: { name: string; relationToMain: string }, i: number) => (

                                                <li key={i}>{g.relationToMain} {g.name ? `(${g.name})` : ''}</li>

                                            ))}

                                        </ul>

                                    )}

                                </div>

                             </>

                         ) : (

                             <Text className="text-gray-500">ขอบคุณที่แจ้งให้เราทราบ<br/>ไว้โอกาสหน้าเจอกันนะครับ</Text>

                         )}

                    </div>

                    <Button type="primary" icon={<EditOutlined />} onClick={() => { setIsEditing(true); form.setFieldsValue(submittedData); }} className="bg-[#5c3a58] hover:bg-[#4a2e46] shadow-md">แก้ไขข้อมูล</Button>

                </div>

            );

        }



        return (

            <div className="w-full max-w-md mx-auto h-full flex flex-col pt-4">

                {/* แบนเนอร์ช่วยเหลือ in-app browser - แสดงเฉพาะเมื่อยังไม่ล็อกอิน */}
                {(() => {
                    const shouldRender = !isLoggedIn && showBrowserBanner;
                    if (typeof window !== 'undefined' && (window as any).__DEBUG_BROWSER_DETECTION__) {
                        console.log('[CardBack Banner Render]', {
                            shouldRender,
                            isLoggedIn,
                            showBrowserBanner,
                            isInAppBrowser: isInAppBrowser()
                        });
                    }
                    return shouldRender ? (
                        <InAppBrowserBanner onDismiss={() => setShowBrowserBanner(false)} />
                    ) : null;
                })()}

                <div className="absolute inset-0 opacity-10 pointer-events-none z-0" style={{

                    backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")`,

                }}></div>



                <div className="text-center mb-6 relative z-10">
                    {userInfo && (
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Avatar 
                                size={48} 
                                src={getAvatarUrl(userInfo)}
                                icon={!userInfo.photoURL && <UserOutlined />}
                                className="border-2 border-[#5c3a58]"
                            />
                            <div className="text-left">
                                <div className="font-medium text-[#5c3a58]">{userInfo.displayName || 'ผู้ใช้'}</div>
                                <div className="text-xs text-gray-500">{userInfo.email}</div>
                                <Button type="link" size="small" danger icon={<LogoutOutlined />} onClick={handleLogout} className="p-0 h-auto">ออกจากระบบ</Button>
                            </div>
                        </div>
                    )}
                    <Title level={3} className="font-cinzel text-[#5c3a58] m-0">ลงทะเบียนร่วมงาน</Title>
                    <Text type="secondary" className="text-xs">งานแต่งงาน ก๊อต & แนน</Text>
                </div>

                

                {/* FIX: Use 'no-scrollbar' class to hide UI but allow scrolling */}

                <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={submittedData || { isComing: null }} className="flex-1 overflow-y-auto no-scrollbar px-1 pb-8 relative z-10">

                    

                    <Card className="shadow-sm border-0 mb-4 bg-white/80 rounded-xl">

                        <Form.Item name="isComing" label="ท่านสะดวกมาร่วมงานหรือไม่" rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]} className="mb-0 font-bold">

                            <div className="grid grid-cols-2 gap-4 mt-2">

                                <div onClick={() => form.setFieldsValue({ isComing: 'yes' })} className={`cursor-pointer relative h-24 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-sm ${isComing === 'yes' ? 'border-[#52c41a] bg-[#f6ffed] ring-2 ring-[#52c41a]/20' : 'border-gray-100 bg-white hover:border-gray-300'}`}>

                                    {isComing === 'yes' && <div className="absolute top-2 right-2 text-[#52c41a]"><CheckCircleFilled /></div>}

                                    <CheckOutlined className={`text-xl ${isComing === 'yes' ? 'text-[#52c41a]' : 'text-gray-400'}`} />

                                    <span className={`font-medium ${isComing === 'yes' ? 'text-[#52c41a]' : 'text-gray-600'}`}>ยินดีร่วมงาน</span>

                                </div>

                                <div onClick={() => form.setFieldsValue({ isComing: 'no' })} className={`cursor-pointer relative h-24 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-sm ${isComing === 'no' ? 'border-[#ff4d4f] bg-[#fff1f0] ring-2 ring-[#ff4d4f]/20' : 'border-gray-100 bg-white hover:border-gray-300'}`}>

                                    {isComing === 'no' && <div className="absolute top-2 right-2 text-[#ff4d4f]"><CheckCircleFilled /></div>}

                                    <CloseCircleOutlined className={`text-xl ${isComing === 'no' ? 'text-[#ff4d4f]' : 'text-gray-400'}`} />

                                    <span className={`font-medium ${isComing === 'no' ? 'text-[#ff4d4f]' : 'text-gray-600'}`}>ไม่สะดวก</span>

                                </div>

                            </div>

                            <Radio.Group className="hidden"><Radio value="yes">Yes</Radio><Radio value="no">No</Radio></Radio.Group>

                        </Form.Item>

                    </Card>

                    

                    <Form.Item noStyle dependencies={['isComing', 'accompanyingGuests']}>

                        {({ getFieldValue }) => {

                            const status = getFieldValue('isComing');

                            if (!status) return null;



                            return (

                                <div className="animate-fade-in space-y-4 px-1">

                                    

                                    {status === 'yes' && (

                                        <>

                                            <Card title="ข้อมูลการร่วมงาน (สำคัญ)" className="shadow-sm border-0 bg-white/80 rounded-xl" headStyle={{borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#5c3a58'}}>

                                                <Form.Item name="side" label="ท่านเป็นแขกของใคร" className="mb-4" rules={[{ required: true, message: 'ระบุฝั่ง' }]}>

                                                    <Radio.Group className="w-full flex gap-2 custom-radio-group">

                                                        <Radio.Button value="groom" className="flex-1 text-center h-10 leading-10">เจ้าบ่าว</Radio.Button>

                                                        <Radio.Button value="bride" className="flex-1 text-center h-10 leading-10">เจ้าสาว</Radio.Button>

                                                    </Radio.Group>

                                                </Form.Item>

                                                

                                                <Form.Item name="relation" label="ความสัมพันธ์กับบ่าวสาว" className="mb-0">

                                                    <AutoComplete 

                                                        options={RSVP_RELATION_OPTIONS} 

                                                        placeholder="เลือกหรือพิมพ์ (เช่น ญาติ, เพื่อน)" 

                                                        className="clean-input"

                                                        popupClassName="font-th"

                                                    />

                                                </Form.Item>

                                            </Card>



                                            <Card title="ผู้ติดตาม (ถ้ามี)" className="shadow-sm border-0 bg-white/80 rounded-xl" headStyle={{borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#5c3a58'}}>

                                                <Text type="secondary" className="text-xs mb-3 block">เพิ่มผู้ติดตามโดยเลือกความสัมพันธ์ (ไม่ต้องกรอกชื่อก็ได้)</Text>

                                                <Form.List name="accompanyingGuests">

                                                    {(fields, { add, remove }) => (

                                                        <div className="space-y-3">

                                                            {fields.map((field, idx) => (

                                                                // The wrapper div has the unique key from field.key

                                                                <div key={field.key} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 animate-fade-in relative">

                                                                    <div className="absolute top-2 right-2">

                                                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />

                                                                    </div>

                                                                    <div className="text-xs text-[#5c3a58] font-bold">ผู้ติดตามคนที่ {idx+1}</div>

                                                                    <div className="flex gap-2">

                                                                        <Form.Item name={[field.name, 'relationToMain']} className="mb-0 flex-1" rules={[{ required: true, message: 'เลือกความสัมพันธ์' }]}>

                                                                             <Select placeholder="เลือกความสัมพันธ์ *" className="clean-input w-full" options={RSVP_GUEST_RELATION_OPTIONS} />

                                                                        </Form.Item>

                                                                        <Form.Item name={[field.name, 'name']} className="mb-0 flex-1">

                                                                            <Input className="clean-input" placeholder="ชื่อ (ไม่ระบุก็ได้)" />

                                                                        </Form.Item>

                                                                    </div>

                                                                </div>

                                                            ))}

                                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-1 border-dashed border-gray-300 text-gray-500 hover:text-[#5c3a58] hover:border-[#5c3a58]">เพิ่มผู้ติดตาม</Button>

                                                        </div>

                                                    )}

                                                </Form.List>

                                            </Card>

                                            

                                            <div className="bg-[#5c3a58] text-white p-4 rounded-xl shadow-md flex items-center justify-between animate-fade-in">

                                                <div className="flex items-center gap-3">

                                                    <UsergroupAddOutlined className="text-2xl" />

                                                    <div className="flex flex-col">

                                                        <span className="text-xs opacity-80">สรุปจำนวนคน</span>

                                                        <span className="text-lg font-bold">รวมทั้งหมด {totalAttendees} ท่าน</span>

                                                    </div>

                                                </div>

                                                <div className="text-right text-xs opacity-80">

                                                    (ตัวท่าน + ผู้ติดตาม)

                                                </div>

                                            </div>



                                            <div className="px-2">

                                                <div className="flex items-center gap-2 mb-2 opacity-70">

                                                    <div className="h-px bg-gray-300 flex-1"></div>

                                                    <span className="text-[10px] text-gray-500">ข้อมูลผู้แจ้ง (ไม่บังคับกรอก)</span>

                                                    <div className="h-px bg-gray-300 flex-1"></div>

                                                </div>

                                                {/* แสดงภาพและชื่อจาก Google */}
                                                {userInfo && (
                                                    <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <Avatar 
                                                            size={48} 
                                                            src={getAvatarUrl(userInfo)}
                                                            icon={!userInfo.photoURL && <UserOutlined />}
                                                            className="border-2 border-[#5c3a58]/20"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                ข้อมูลจาก {userInfo.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'บัญชี'}
                                                            </div>
                                                            <Form.Item name="fullName" className="mb-0">
                                                                <Input 
                                                                    placeholder={userInfo.displayName || "ชื่อ-นามสกุล"} 
                                                                    className="clean-input text-sm" 
                                                                />
                                                            </Form.Item>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ถ้ายังไม่ล็อกอิน หรือไม่มีข้อมูล ให้แสดงช่องกรอก */}
                                                {!userInfo && (
                                                    <Form.Item name="fullName" className="mb-0">
                                                        <Input placeholder="ชื่อ-นามสกุล (ไม่บังคับกรอก)" className="clean-input text-sm" />
                                                    </Form.Item>
                                                )}

                                            </div>

                                        </>

                                    )}

                                    

                                    {status === 'no' && (

                                        <Card className="shadow-sm border-0 bg-white/80 rounded-xl">

                                             <Form.Item name="note" label="ฝากข้อความแสดงความยินดี" className="mb-0">

                                                <TextArea 

                                                    placeholder="เขียนข้อความอวยพรให้บ่าวสาว..." 

                                                    rows={3} 

                                                    className="clean-input"

                                                 />

                                             </Form.Item>

                                        </Card>

                                    )}

                                </div>

                            );

                        }}

                    </Form.Item>



                    {/* FIX: Remove Sticky Bottom and make it static footer */}

                    <div className="mt-6 pt-4 border-t border-[#d4af37]/20 pb-4">

                         <Form.Item noStyle dependencies={['isComing']}>

                            {({ getFieldValue }) => {

                                const status = getFieldValue('isComing');

                                const text = status === 'yes' ? 'ยืนยันการลงทะเบียน' : status === 'no' ? 'ส่งคำตอบ' : 'กรุณาเลือกสถานะ';
                                
                                // Disable button if no status or loading
                                // ใช้ getCurrentUser() เป็น fallback ถ้า currentUser state ยังไม่อัปเดต
                                const effectiveUser = currentUser || AuthService.getInstance().getCurrentUser()?.uid || null;
                                const isDisabled = !status || loading || !effectiveUser;

                                return (

                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        block 
                                        loading={loading} 
                                        size="large" 
                                        className="bg-[#5c3a58] hover:bg-[#4a2e46] border-none h-12 text-lg shadow-md rounded-lg font-medium" 
                                        disabled={isDisabled}
                                    >
                                        {text}
                                    </Button>

                                );

                            }}

                        </Form.Item>

                        {isEditing && <Button type="text" block onClick={() => setIsEditing(false)} className="mt-2 text-gray-400">ยกเลิก</Button>}

                    </div>

                </Form>

            </div>

        );

    };

    return (
        <>

            <div className="w-full h-full flex flex-col bg-[#fdfbf7] relative overflow-hidden">

                <div className="absolute top-4 right-4 z-30">

                    <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={onFlip} className="text-gray-500 border-gray-200 hover:text-[#5c3a58] hover:border-[#5c3a58] bg-white shadow-sm" />

                </div>

                <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col">

                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f7f3eb] to-transparent pointer-events-none z-10"></div>

                    <div className="relative z-10 flex-1 flex flex-col h-full">{renderContent()}</div>

                </div>

            </div>
        </>
    );

};



// Intro Component - Interaction required for autoplay
// Component สำหรับแสดง intro overlay ก่อนเปิดการ์ดเชิญ (ต้องมี user interaction เพื่อ autoplay)
const IntroOverlay: React.FC<{ onStart: () => void; config?: WeddingCardConfig }> = ({ onStart, config = defaultWeddingCardConfig }) => {
    // ใช้ config สำหรับการ์ดแต่งงาน (รับจาก props หรือใช้ default)
    const orderedNames = getOrderedNames(config);

    return (

        <div className="fixed inset-0 z-[100] bg-[#fdfcf8] flex flex-col items-center justify-center p-4 animate-fade-in">

             <div className="absolute inset-0 opacity-30 pointer-events-none" style={{

                 backgroundImage: `url('https://images.unsplash.com/photo-1596788062679-3d7707e2dc83?q=80&w=2070&auto=format&fit=crop')`,

                 backgroundSize: 'cover', backgroundPosition: 'center',

             }}></div>

             

             <div className="relative z-10 text-center max-w-md w-full">

                <Text className="uppercase tracking-[0.2em] text-[#8d6e63] text-xs md:text-sm font-cinzel mb-2 block">The Wedding Of</Text>

                <div 
                    className="font-dancing text-[var(--color-soft-pink)] leading-tight mb-4 drop-shadow-sm break-words overflow-wrap-anywhere px-4"
                    style={{ 
                        fontSize: 'clamp(2.5rem, 10vw, 4.5rem)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                    }}
                >
                    {orderedNames.first.nickname} &amp; {orderedNames.second.nickname}
                </div>

                <Text className="block text-[#5c3a58] font-cinzel mb-8 opacity-70 tracking-widest">JAN 31 2026</Text>



                <div 

                    onClick={onStart}

                    className="mx-auto w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg border border-[#d4af37]/30 hover:scale-105 transition-transform active:scale-95 animate-pulse-gold"

                >

                    <HeartFilled className="text-3xl md:text-4xl text-[#d4af37]" />

                </div>

                <Text className="block mt-4 text-[#8d6e63] text-xs opacity-60 animate-bounce">แตะเพื่อเปิดการ์ดเชิญ</Text>

             </div>

        </div>

    );

};



// Main Component - Guest RSVP App
// Component หลักสำหรับหน้า Guest RSVP (หน้าการ์ดเชิญ)
const GuestRSVPApp: React.FC<{ onExitGuestMode: () => void }> = ({ onExitGuestMode: _onExitGuestMode }) => {
    // Keep onExitGuestMode in props to avoid changing interface, but ignore usage for now
    // or remove it from props if the parent component is also updated.
    // Given instruction is just to remove button, we keep the prop but acknowledge it's unused.
    // Parameter renamed to _onExitGuestMode to indicate it's intentionally unused
    void _onExitGuestMode; 

    // State - จะ sync จาก Firebase เมื่อ login
    const [isFlipped, setIsFlipped] = useState(false); // สถานะการ flip การ์ด (false = หน้าแรก, true = หน้า form)
    const [musicPlaying, setMusicPlaying] = useState(false); // สถานะการเล่นเพลง
    const [showIntro, setShowIntro] = useState(true); // สถานะการแสดง intro overlay

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0); // Index ของเพลงปัจจุบัน
    
    // 🔧 State สำหรับ wedding card config - ดึงจาก Firebase
    // เริ่มต้นเป็น null เพื่อไม่ให้แสดงข้อมูล default ก่อนโหลดข้อมูลจาก Firebase
    const [weddingCardConfig, setWeddingCardConfig] = useState<WeddingCardConfig | null>(null);
    const [isConfigLoading, setIsConfigLoading] = useState(true); // สถานะการโหลด config

    const currentTrack = PLAYLIST[currentTrackIndex];

    // Ref สำหรับ YouTube iframe
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false); // สถานะว่า iframe พร้อมใช้งานหรือไม่
    
    // Refs เพื่อป้องกัน infinite loop
    const isManualControlRef = React.useRef(false); // Flag สำหรับ manual control (ผู้ใช้ควบคุมเอง)
    const lastMusicStateRef = React.useRef(musicPlaying); // เก็บ state ล่าสุด
    const autoPlayAttemptedRef = React.useRef(false); // Flag เพื่อป้องกัน auto-play ซ้ำ
    
    // Helper function สำหรับส่งคำสั่งไปยัง YouTube iframe
    const sendCommand = useCallback((func: string, args: unknown[] = [], requireReady = false) => {
        // For auto-play after refresh, require iframe to be ready
        // For manual controls, try to send even if not ready yet
        if (iframeRef.current && iframeRef.current.contentWindow) {
            if (!requireReady || iframeReady) {
                // ส่งคำสั่งผ่าน postMessage API
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func, args }), 
                    '*'
                );
            }
        }
    }, [iframeReady]);

    // Handle iframe load event - เมื่อ iframe โหลดเสร็จ
    const handleIframeLoad = () => {
        // Wait for YouTube API to be ready (YouTube iframe needs time to initialize)
        setTimeout(() => {
            setIframeReady(true);
        }, 1500); // Increased delay to ensure YouTube API is ready
    };

    // Load และ sync app state จาก Firebase Realtime Database เมื่อ login
    useEffect(() => {
        let isMounted = true;
        // ประกาศ unsubscribeState นอก callback เพื่อให้ track subscriptions ได้ถูกต้อง
        // และป้องกัน memory leak เมื่อ auth state callback ถูกเรียกหลายครั้ง
        let unsubscribeState: (() => void) | null = null;

        // Subscribe to auth state changes - รับการเปลี่ยนแปลง authentication state
        const unsubscribeAuth = AuthService.getInstance().onAuthStateChange((user) => {
            if (!isMounted) return;
            
            // Unsubscribe จาก state subscription เก่าก่อน (ถ้ามี)
            // เพื่อป้องกัน memory leak เมื่อ auth state callback ถูกเรียกหลายครั้ง
            // ต้อง unsubscribe ก่อนสร้าง subscription ใหม่ทุกครั้ง
            if (unsubscribeState) {
                unsubscribeState();
                unsubscribeState = null;
            }
            
            if (user) {
                // Guest Flow - ใช้ userAppState ตามปกติ
                // Load initial state จาก Firebase
                getUserAppState(user.uid)
                    .then((state) => {
                        if (!isMounted) return;
                        if (state) {
                            // 🔧 Fix: เมื่อล็อคอินแล้ว → ถ้า hasStarted = true → flip ไปหน้า form ทันที
                            if (state.hasStarted && state.isFlipped !== false) {
                                // ถ้าเคยกด heart แล้ว → flip ไปหน้า form
                                setIsFlipped(true);
                            } else if (state.isFlipped !== undefined) {
                                setIsFlipped(state.isFlipped);
                            }
                            if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
                            if (state.hasStarted !== undefined) setShowIntro(!state.hasStarted);
                            if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
                        }
                    })
                    .catch((error) => {
                        logger.error('Error loading app state:', error);
                    });

                // Subscribe to state changes จาก Firebase (sync ระหว่างแท็บ/อุปกรณ์)
                // ต้อง unsubscribe เก่าก่อน (ทำแล้วข้างบน) แล้วค่อยสร้างใหม่
                unsubscribeState = subscribeUserAppState(user.uid, (state) => {
                    if (!isMounted) return;
                    if (state) {
                        // 🔧 Fix: เมื่อล็อคอินแล้ว → ถ้า hasStarted = true → flip ไปหน้า form ทันที
                        if (state.hasStarted && state.isFlipped !== false) {
                            // ถ้าเคยกด heart แล้ว → flip ไปหน้า form
                            setIsFlipped(true);
                        } else if (state.isFlipped !== undefined) {
                            setIsFlipped(state.isFlipped);
                        }
                        if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
                        if (state.hasStarted !== undefined) setShowIntro(!state.hasStarted);
                        if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
                    }
                });
            } else {
                // ถ้า logout ให้ reset state เป็นค่าเริ่มต้น
                setIsFlipped(false);
                setMusicPlaying(false);
                setShowIntro(true);
                setCurrentTrackIndex(0);
            }
        });

        return () => {
            isMounted = false;
            unsubscribeAuth();
            // Cleanup subscription เมื่อ component unmount
            if (unsubscribeState) {
                unsubscribeState();
                unsubscribeState = null;
            }
        };
    }, []);

    // 🔧 Subscribe to wedding card config จาก Firebase (real-time updates)
    // รับการเปลี่ยนแปลง wedding card config แบบ real-time
    useEffect(() => {
        let isMounted = true;
        
        const unsubscribeConfig = ConfigService.getInstance().subscribeWeddingCardConfig((config) => {
            if (!isMounted) return;
            
            setIsConfigLoading(false);
            
            if (config) {
                // Merge กับ default config เพื่อให้มีค่าครบถ้วน
                const mergedConfig: WeddingCardConfig = {
                    ...defaultWeddingCardConfig,
                    ...config,
                    groom: { ...defaultWeddingCardConfig.groom, ...config.groom },
                    bride: { ...defaultWeddingCardConfig.bride, ...config.bride },
                    parents: {
                        groom: { ...defaultWeddingCardConfig.parents.groom, ...config.parents?.groom },
                        bride: { ...defaultWeddingCardConfig.parents.bride, ...config.parents?.bride },
                    },
                    dressCode: config.dressCode || defaultWeddingCardConfig.dressCode,
                };
                setWeddingCardConfig(mergedConfig);
            } else {
                // ถ้าไม่มี config ใน Firebase ให้ใช้ default
                setWeddingCardConfig(defaultWeddingCardConfig);
            }
        });

        // Cleanup เมื่อ component unmount
        return () => {
            isMounted = false;
            unsubscribeConfig();
        };
    }, []);

    // Save state changes ไปยัง Firebase Realtime Database
    // บันทึกสถานะ isFlipped ไปยัง Firebase
    useEffect(() => {
        const user = AuthService.getInstance().getCurrentUser();
        if (!user) return;
        
        // 🔧 DevOps Fix: เมื่อล็อคอินอยู่ → กด X หรือ Heart → แสดงการ์ด (isFlipped = true) เสมอ
        // ไม่ต้องกลับไปหน้า intro อีก
        // Debounce เพื่อป้องกันการ update บ่อยเกินไป
        const timeoutId = setTimeout(() => {
            updateUserAppState(user.uid, { isFlipped })
                .catch((error) => {
                    logger.error('Error saving isFlipped state:', error);
                });
        }, 300);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [isFlipped]);

    // Save music playing state ไปยัง Firebase Realtime Database
    // บันทึกสถานะการเล่นเพลงไปยัง Firebase
    useEffect(() => {
        const user = AuthService.getInstance().getCurrentUser();
        if (!user) return;
        
        // Guest Flow - ใช้ userAppState ตามปกติ
        // Debounce เพื่อป้องกันการ update บ่อยเกินไป
        const timeoutId = setTimeout(() => {
            updateUserAppState(user.uid, { musicPlaying })
                .catch((error) => {
                    logger.error('Error saving musicPlaying state:', error);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [musicPlaying]);

    // Save currentTrackIndex ไปยัง Firebase Realtime Database
    // บันทึก index ของเพลงปัจจุบันไปยัง Firebase
    useEffect(() => {
        const user = AuthService.getInstance().getCurrentUser();
        if (!user) return;
        
        // Guest Flow - ใช้ userAppState ตามปกติ
        // Debounce เพื่อป้องกันการ update บ่อยเกินไป
        const timeoutId = setTimeout(() => {
            updateUserAppState(user.uid, { currentTrackIndex })
                .catch((error) => {
                    logger.error('Error saving currentTrackIndex state:', error);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [currentTrackIndex]);

    // ฟังก์ชันสำหรับเริ่มต้น (เมื่อกด Heart button ใน intro)
    const handleStart = () => {
        // 🔧 Fix: เมื่อกด Heart button → ปิด intro และแสดงการ์ด
        setShowIntro(false);
        
        // 🔧 Fix: เช็คว่าล็อคอินแล้วหรือไม่
        // - ถ้าไม่ล็อคอิน → แสดงหน้าแรกของการ์ด (isFlipped = false)
        // - ถ้าล็อคอิน → แสดงหน้า form (isFlipped = true)
        const user = AuthService.getInstance().getCurrentUser();
        const shouldFlip = !!user; // Flip เฉพาะเมื่อล็อคอินแล้ว
        
        setIsFlipped(shouldFlip);
        
        // Update Firebase ทันที (ไม่ต้องรอ debounce) เพื่อป้องกัน subscribeUserAppState ทับ state
        if (user) {
            // Guest Flow - ใช้ userAppState ตามปกติ
            updateUserAppState(user.uid, { hasStarted: true, isFlipped: shouldFlip })
                .catch((error) => {
                    logger.error('Error saving hasStarted state:', error);
                });
        }
        // Set flag เพื่อบอกว่าเป็น manual control (initial start)
        isManualControlRef.current = true;
        setMusicPlaying(true);
        lastMusicStateRef.current = true;
        autoPlayAttemptedRef.current = false; // Reset flag เมื่อ start ใหม่
        // Attempt to play immediately (don't require ready for initial start)
        setTimeout(() => {
            sendCommand('playVideo', [], false);
            // Reset flag หลังจากการ start เสร็จ
            setTimeout(() => {
                isManualControlRef.current = false;
            }, 500);
        }, 100);
    };

    // Callback สำหรับเมื่อ login สำเร็จ (redirect flow)
    const handleLoginSuccess = useCallback(() => {
        setIsFlipped(true);
        setShowIntro(false);
        
        // Update Firebase state
        const user = AuthService.getInstance().getCurrentUser();
        if (user) {
            updateUserAppState(user.uid, { 
                isFlipped: true,
                hasStarted: true 
            }).catch((stateError) => {
                logger.error('Error updating app state after login:', stateError);
            });
        }
    }, []);

    // 🔧 Fix: ฟังก์ชันสำหรับกลับไปหน้าแรกของการ์ดเมื่อกดกากบาท
    const handleFlipBack = () => {
        setIsFlipped(false);
        
        // Update Firebase state (ถ้าล็อคอินแล้ว)
        const user = AuthService.getInstance().getCurrentUser();
        if (user) {
            updateUserAppState(user.uid, { isFlipped: false })
                .catch((error) => {
                    logger.error('Error saving isFlipped state:', error);
                });
        }
    };

    // ฟังก์ชันสำหรับเปิด/ปิดเพลง
    const onToggleMusic = () => {
        // Set flag เพื่อบอกว่าเป็น manual control (ให้ priority สูงกว่า auto-play)
        isManualControlRef.current = true;
        
        const newState = !musicPlaying;
        
        // ส่งคำสั่งไปยัง YouTube iframe
        if (newState) {
            sendCommand('playVideo', [], false); // Don't require ready for manual control
        } else {
            sendCommand('pauseVideo', [], false); // Don't require ready for manual control
        }
        
        setMusicPlaying(newState);
        lastMusicStateRef.current = newState;
        
        // Reset flag หลังจากการ toggle เสร็จ
        setTimeout(() => {
            isManualControlRef.current = false;
        }, 500);
    };

    // ฟังก์ชันสำหรับเล่นเพลงถัดไป
    const handleNext = () => {
        const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
        setCurrentTrackIndex(nextIndex);
        sendCommand('loadVideoById', [PLAYLIST[nextIndex].id], false); // Don't require ready for manual control
        // Keep playing state true if we change track
        if (!musicPlaying) setMusicPlaying(true);
    };

    // ฟังก์ชันสำหรับเล่นเพลงก่อนหน้า
    const handlePrev = () => {
        const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
        setCurrentTrackIndex(prevIndex);
        sendCommand('loadVideoById', [PLAYLIST[prevIndex].id], false); // Don't require ready for manual control
        if (!musicPlaying) setMusicPlaying(true);
    };
    
    // รวม logic การเล่นเพลงทั้งหมดใน useEffect เดียวเพื่อป้องกัน infinite loop
    useEffect(() => {
        // Skip ถ้าเป็น manual control (ให้ priority สูงกว่า auto-play)
        if (isManualControlRef.current) {
            return;
        }
        
        // Skip ถ้า state ไม่เปลี่ยน (ป้องกัน unnecessary re-run)
        if (lastMusicStateRef.current === musicPlaying) {
            return;
        }
        
        // Update last state
        lastMusicStateRef.current = musicPlaying;
        
        // Skip ถ้ายังอยู่ใน intro หรือ iframe ยังไม่ ready
        if (showIntro || !iframeRef.current) {
            return;
        }
        
        // ถ้า musicPlaying = true ให้ auto-play หรือ sync state ตาม readiness
        if (musicPlaying && iframeReady) {
            if (!autoPlayAttemptedRef.current) {
                // 🔧 DevOps: Auto-play music when restored from Firebase after refresh
                let attempts = 0;
                const maxAttempts = 5; // ลดจำนวน attempts เพื่อป้องกัน loop
                let timeoutId: ReturnType<typeof setTimeout> | null = null;
                
                // ฟังก์ชันสำหรับลองเล่นเพลง (retry mechanism)
                const tryPlay = () => {
                    // Check flag อีกครั้งก่อนเล่น
                    if (isManualControlRef.current || !iframeRef.current || !iframeReady) {
                        return;
                    }
                    
                    attempts++;
                    if (attempts <= maxAttempts) {
                        sendCommand('playVideo', [], true); // Require ready for auto-play
                        if (attempts < maxAttempts) {
                            // Retry with increasing delay
                            timeoutId = setTimeout(tryPlay, 500 + (attempts * 200));
                        } else {
                            // Mark ว่าได้พยายาม auto-play แล้ว
                            autoPlayAttemptedRef.current = true;
                        }
                    } else {
                        autoPlayAttemptedRef.current = true;
                    }
                };
                
                // Start trying after iframe is ready (delay เพื่อให้ iframe พร้อม)
                timeoutId = setTimeout(() => {
                    tryPlay();
                }, 800);
                
                return () => {
                    if (timeoutId) clearTimeout(timeoutId);
                };
            }

            // Sync play state (backup)
            sendCommand('playVideo', [], false);
        } else if (!musicPlaying && iframeReady) {
            // Pause music
            sendCommand('pauseVideo', [], false);
            autoPlayAttemptedRef.current = false; // Reset flag เมื่อ pause
        }
        
        // Reset autoPlayAttemptedRef เมื่อ state เปลี่ยนจาก true เป็น false
        if (!musicPlaying) {
            autoPlayAttemptedRef.current = false;
        }
    }, [musicPlaying, showIntro, iframeReady, sendCommand]);

    return (

        <div className="fixed inset-0 bg-[#e6e2dd] flex flex-col items-center justify-center font-serif overflow-hidden">

            <GlobalStyleLoader />

            
            {/* Intro Overlay for Autoplay Policy Compliance */}
            {/* 🔧 ไม่แสดง UI จนกว่าจะโหลด config จาก Firebase เสร็จ */}
            {!isConfigLoading && showIntro && weddingCardConfig && (
                <IntroOverlay onStart={handleStart} config={weddingCardConfig} />
            )}



            {/* Hidden YouTube Player for Audio */}
            {/* Optimized for Mobile Autoplay: Persistent iframe, technically visible but hidden visually */}
            <div style={{ position: 'fixed', width: '1px', height: '1px', opacity: 0.01, zIndex: 50, bottom: 0, right: 0, pointerEvents: 'none' }}>
                 <iframe
                   ref={iframeRef}
                   width="100%"
                   height="100%"
                   // Initial load with first track
                   src={`https://www.youtube.com/embed/${PLAYLIST[0].id}?enablejsapi=1&controls=0&playsinline=1&autoplay=0&origin=${window.location.origin}`}
                   title="Wedding Music"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                   onLoad={handleIframeLoad}
                 />
            </div>



            <div className="absolute top-4 left-4 z-50">
                {/* Admin Button Removed as requested */}
            </div>

            

            {/* Full Frame mobile; Desktop scales up to fit viewport without shrinking text */}

            <div
                className="relative w-full h-[100dvh] flex items-center justify-center perspective-container transition-all duration-300 ease-in-out"
                style={{
                    // เดสก์ท็อป: ขยายการ์ดให้พอดีพื้นที่ แต่ไม่เกินค่าที่กำหนด
                    // ใช้หน่วย viewport เพื่อให้เต็มและเว้นขอบสวยงาม
                    // min() ต้องใส่ผ่าน style แทนคลาส Tailwind
                    maxWidth: 'min(96vw, 1200px)',
                    maxHeight: 'min(92vh, 760px)',
                    width: '100%',
                    height: '100dvh'
                }}
            >

                <div
                    className={`flip-inner ${isFlipped ? 'is-flipped' : ''}`}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: 'min(96vw, 1200px)',
                        maxHeight: 'min(92vh, 760px)'
                    }}
                >

                    <div className={`flip-front ${isFlipped ? 'side-inactive' : 'side-active'}`}>

                        {/* 🔧 ไม่แสดง CardFront จนกว่าจะโหลด config จาก Firebase เสร็จ */}
                        {!isConfigLoading && weddingCardConfig && (
                            <CardFront 

                                onFlip={() => setIsFlipped(true)} 

                                isPlaying={musicPlaying} 

                                onToggleMusic={onToggleMusic}

                                onNext={handleNext}

                                onPrev={handlePrev}

                                currentTrack={currentTrack}
                                
                                config={weddingCardConfig}

                            />
                        )}

                    </div>

                    <div className={`flip-back ${!isFlipped ? 'side-inactive' : 'side-active'}`}><CardBack onFlip={handleFlipBack} onLoginSuccess={handleLoginSuccess} /></div>

                </div>

            </div>

            <div className="absolute bottom-2 text-[#8d6e63] text-xs opacity-50 hidden md:block">The Wedding of Got & Nan</div>

        </div>

    );

};







export default GuestRSVPApp;
