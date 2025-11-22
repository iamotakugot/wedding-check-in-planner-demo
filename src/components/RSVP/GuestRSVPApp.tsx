/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
} from 'antd';
import {
  UsergroupAddOutlined,
  FacebookFilled,
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
import { 
  createRSVP, 
  onAuthStateChange,
  signInWithGoogle,
  signInWithFacebook,
  checkRedirectResult, // Import new function
  logout, // Import logout
  getRSVPByUid, // Import getRSVPByUid
  updateRSVP, // Import updateRSVP
  createGuestFromRSVP, // Import createGuestFromRSVP
  getGuest, // Import getGuest
  updateGuestFromRSVP, // Import updateGuestFromRSVP
  getCurrentUser, // Import getCurrentUser for fallback
  registerSession, // Import registerSession
  endSession, // Import endSession
  subscribeSessionChanges, // Import subscribeSessionChanges
  getUserAppState, // Import getUserAppState
  updateUserAppState, // Import updateUserAppState
  subscribeUserAppState // Import subscribeUserAppState
} from '@/services/firebaseService';
import type { RSVPData as FirebaseRSVPData } from '@/services/firebaseService';
import type { User } from 'firebase/auth';
import { Guest, Side } from '@/types';
import { RSVP_RELATION_OPTIONS, RSVP_GUEST_RELATION_OPTIONS } from '@/data/formOptions';
import { defaultWeddingCardConfig, getOrderedNames } from '@/constants/weddingCard';

const { Title, Text } = Typography;
const { TextArea } = Input;



// ============================================================================

// === PART 1: STYLES & ASSETS ===

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



const weddingSchedule = [

    { time: '08:09 น.', title: 'พิธีสงฆ์', icon: '🙏' },

    { time: '09:09 น.', title: 'แห่ขันหมาก', icon: '💍' },

    { time: '09:29 น.', title: 'รดน้ำสังข์', icon: '🐚' },

    { time: '10:30 น.', title: 'ทานอาหาร', icon: '🍽️' },

];



// ใช้ options จาก formOptions.ts แทน



// Music Playlist Configuration

const PLAYLIST = [

    { 

        id: '7fKN5KWuAAQ', // รักนาน ๆ - พัด Vorapat x Dome Jaruwat

        title: 'รักนาน ๆ', 

        artist: 'พัด Vorapat x Dome Jaruwat',

        cover: 'https://img.youtube.com/vi/7fKN5KWuAAQ/0.jpg'

    }

];



// Types

interface RSVPData {

    uid?: string;

    firstName: string; lastName: string; 
    fullName?: string; // เพิ่ม field สำหรับเก็บชื่อ-นามสกุลรวมกัน
    photoURL?: string | null; // เพิ่ม field สำหรับเก็บ URL ภาพจาก Facebook/Google
    nickname: string;

    isComing: 'yes' | 'no'; side: 'groom' | 'bride'; relation: string;

    note: string; accompanyingGuestsCount: number;

    accompanyingGuests: { name: string; relationToMain: string }[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt?: any;

}



// ============================================================================

// === PART 3: GUEST COMPONENTS ===

// ============================================================================



const CountdownTimer: React.FC = () => {

    const calculateTimeLeft = () => {

        // Use slash format for better cross-browser compatibility (especially iOS/Safari)
        const targetDate = new Date('2026/01/31 08:09:00').getTime();

        const now = new Date().getTime();

        const distance = targetDate - now;

        if (distance < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        return {

            days: Math.floor(distance / (1000 * 60 * 60 * 24)),

            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),

            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),

            seconds: Math.floor((distance % (1000 * 60)) / 1000)

        };

    };



    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());



    useEffect(() => {

        const interval = setInterval(() => {

            setTimeLeft(calculateTimeLeft());

        }, 1000);

        return () => clearInterval(interval);

    }, []);



    return (

        <div className="flex justify-center gap-2 md:gap-3 mt-0 md:mt-3 font-cinzel text-[#5c3a58] opacity-80">

            <div className="text-center"><div className="text-base md:text-2xl font-bold">{timeLeft.days}</div><div className="text-[7px] md:text-[8px] uppercase tracking-wider">Days</div></div>

            <div className="text-center"><div className="text-base md:text-2xl font-bold font-sans">:</div></div>

            <div className="text-center"><div className="text-base md:text-2xl font-bold">{timeLeft.hours}</div><div className="text-[7px] md:text-[8px] uppercase tracking-wider">Hours</div></div>

            <div className="text-center"><div className="text-base md:text-2xl font-bold font-sans">:</div></div>

            <div className="text-center"><div className="text-base md:text-2xl font-bold">{timeLeft.minutes}</div><div className="text-[7px] md:text-[8px] uppercase tracking-wider">Mins</div></div>

        </div>

    );

};



interface MusicControlsProps {

    onFlip: () => void;

    isPlaying: boolean;

    onToggleMusic: () => void;

    onNext: () => void;

    onPrev: () => void;

    currentTrack: typeof PLAYLIST[0];

}



// Card Front Component

const CardFront: React.FC<MusicControlsProps> = ({ onFlip, isPlaying, onToggleMusic, onNext, onPrev, currentTrack }) => {
    // ใช้ config สำหรับการ์ดแต่งงาน
    const config = defaultWeddingCardConfig;
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



                <div className="w-full grid grid-cols-4 gap-1 md:gap-2 mb-1 md:mb-4 px-0 md:px-2 relative z-10">

                    {weddingSchedule.map((item, idx) => (

                        <div key={idx} className="flex flex-col items-center">

                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-white border border-[#d4af37] flex items-center justify-center text-[10px] md:text-lg mb-0.5 md:mb-2 shadow-sm text-[#5c3a58]">{item.icon}</div>

                            <div className="text-[#5c3a58] font-bold text-[8px] md:text-xs whitespace-nowrap">{item.time}</div>

                            <div className="text-gray-400 text-[7px] md:text-[10px] hidden sm:block">{item.title}</div>

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



const CardBack: React.FC<{ onFlip: () => void }> = ({ onFlip }) => {

    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [submittedData, setSubmittedData] = useState<RSVPData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const isComing = Form.useWatch('isComing', form);
    const accompanyingGuests = Form.useWatch('accompanyingGuests', form);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<User | null>(null);
    // เพิ่ม state สำหรับเช็คสถานะเริ่มต้น
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoadingRSVP, setIsLoadingRSVP] = useState(false);
    // เพิ่ม state สำหรับ session management
    const [sessionWarning, setSessionWarning] = useState<{ hasOtherSession: boolean; otherSessionStartedAt?: string } | null>(null);
    // เพิ่ม ref เพื่อป้องกันการ logout ซ้ำ
    const isLoggingOutRef = useRef(false);
    const sessionLogoutTriggeredRef = useRef(false);
    // เพิ่ม flag เพื่อเช็คว่ายังอยู่ใน initial session setup หรือไม่
    const isInitialSessionSetupRef = useRef(true);
    // เพิ่ม ref เพื่อ track ว่า session registration กำลังดำเนินการอยู่หรือไม่
    const isRegisteringSessionRef = useRef(false);
    // เพิ่ม ref เพื่อเก็บ startedAt ของ session ปัจจุบัน (ใช้เช็คว่า session ถูกยึดหรือไม่)
    const currentSessionStartedAtRef = useRef<string | null>(null);

    // Check persistent login on mount
    // สำคัญ: ต้องเรียก checkRedirectResult() ก่อน onAuthStateChanged
    // เพื่อให้ได้รับผลลัพธ์จาก redirect login ก่อนที่ auth state จะเปลี่ยน
    useEffect(() => {
        let isMounted = true;
        let redirectResultHandled = false; // Flag เพื่อป้องกัน race condition
        
        setIsCheckingAuth(true);

        // 1. เช็ค redirect result ก่อน (ถ้ามี redirect result จะได้ผลลัพธ์ทันที)
        checkRedirectResult()
            .then((user) => {
                if (!isMounted) return;
                
                if (user) {
                    // User successfully signed in via redirect
                    redirectResultHandled = true; // Mark ว่าจัดการ redirect result แล้ว
                    console.log('✅ Redirect login successful, user:', user.uid);
                    setIsLoggedIn(true);
                    setCurrentUser(user.uid);
                    setUserInfo(user);
                    setIsCheckingAuth(false);
                    message.success('เข้าสู่ระบบสำเร็จ');
                    
                    // สร้าง session ใหม่หลังจาก redirect login
                    // ใช้ async IIFE เพื่อให้สามารถใช้ await ได้
                    (async () => {
                        try {
                            // ตั้ง flag เพื่อบอกว่า session registration กำลังดำเนินการอยู่
                            isRegisteringSessionRef.current = true;
                            
                            const sessionResult = await registerSession(user);
                            if (!isMounted) return;
                            
                            // ✅ Session สร้างเสร็จแล้ว → ปิด initial setup flag และเก็บ startedAt
                            isInitialSessionSetupRef.current = false;
                            isRegisteringSessionRef.current = false;
                            currentSessionStartedAtRef.current = sessionResult.startedAt;
                            
                            if (sessionResult.hasOtherActiveSession) {
                                // มี session อื่น active อยู่ → แสดง warning
                                setSessionWarning({
                                    hasOtherSession: true,
                                    otherSessionStartedAt: sessionResult.otherSessionStartedAt,
                                });
                            }
                        } catch (sessionError) {
                            console.error('Error registering session:', sessionError);
                            // ถ้า session สร้างไม่สำเร็จ ก็ปิด flag เพื่อให้ระบบทำงานปกติ
                            isInitialSessionSetupRef.current = false;
                            isRegisteringSessionRef.current = false;
                        }
                    })();
                } else {
                    // No redirect result, continue with auth state check
                    // onAuthStateChanged จะจัดการต่อ
                    console.log('No redirect result, checking auth state...');
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                
                // Handle specific errors
                if (err.code === 'auth/account-exists-with-different-credential') {
                    message.error('อีเมลนี้ถูกใช้งานด้วยวิธีอื่นแล้ว กรุณาใช้วิธีเข้าสู่ระบบอื่น');
                } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                    console.error('Redirect login error:', err);
                }
                // Continue with auth state check even if redirect check fails
            });

        // 2. Subscribe to auth state changes (สำหรับ persistent login และ logout)
        // ไม่ใช้ setTimeout เพื่อให้ state อัปเดตทันที
        let isInitialAuthCheck = true; // เพิ่ม flag เพื่อเช็คว่าเป็น initial check หรือไม่
        
        const unsubscribe = onAuthStateChange((user) => {
            if (!isMounted) return;
            
            // ถ้าเป็น initial check และไม่มี user ให้ข้าม (ไม่ log "User logged out")
            if (isInitialAuthCheck && !user) {
                isInitialAuthCheck = false;
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
                    console.log('✅ Auth state changed, updating user:', currentUid);
                    redirectResultHandled = false; // Reset flag เพื่อให้สามารถอัปเดตได้
                    setIsLoggedIn(true);
                    setCurrentUser(currentUid);
                    setUserInfo(user);
                    setIsCheckingAuth(false);
                    setLoading(false); // ปลดล็อกปุ่มในกรณี popup สำเร็จ
                }
                return;
            }
            
            // ถ้าไม่มี redirect result และ auth state เปลี่ยน
            if (user) {
                console.log('✅ Auth state detected, user:', user.uid);
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
                setUserInfo(user);
                
                // สร้าง session ใหม่ (กรณี persistent login)
                // แต่ถ้ามีการ register session อยู่แล้ว (เช่น จาก handleLogin) → ข้าม
                // เพื่อป้องกันการเรียก registerSession() ซ้ำซ้อน
                if (!isRegisteringSessionRef.current) {
                    // ใช้ async IIFE เพื่อให้สามารถใช้ await ได้
                    (async () => {
                            try {
                                // ตั้ง flag เพื่อบอกว่า session registration กำลังดำเนินการอยู่
                                isRegisteringSessionRef.current = true;
                                
                                const sessionResult = await registerSession(user);
                                if (!isMounted) return;
                                
                                // ✅ Session สร้างเสร็จแล้ว → ปิด initial setup flag และเก็บ startedAt
                                isInitialSessionSetupRef.current = false;
                                isRegisteringSessionRef.current = false;
                                currentSessionStartedAtRef.current = sessionResult.startedAt;
                                
                                if (sessionResult.hasOtherActiveSession) {
                                    // มี session อื่น active อยู่ → แสดง warning
                                    setSessionWarning({
                                        hasOtherSession: true,
                                        otherSessionStartedAt: sessionResult.otherSessionStartedAt,
                                    });
                                }
                            } catch (sessionError) {
                                console.error('Error registering session:', sessionError);
                                // ถ้า session สร้างไม่สำเร็จ ก็ปิด flag เพื่อให้ระบบทำงานปกติ
                                isInitialSessionSetupRef.current = false;
                                isRegisteringSessionRef.current = false;
                            }
                    })();
                } else {
                    // มีการ register session อยู่แล้ว → ข้าม (handleLogin กำลังจัดการอยู่)
                    console.log('⏭️ Skipping session registration - already in progress');
                }
            } else {
                // Log เฉพาะเมื่อ logout จริงๆ (ไม่ใช่ initial check)
                console.log('User logged out');
                setIsLoggedIn(false);
                setCurrentUser(null);
                setUserInfo(null);
                // Reset flag เมื่อ logout
                redirectResultHandled = false;
            }
            
            setIsCheckingAuth(false);
            setLoading(false); // เผื่อกรณี state loading ค้าง
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    // ดึงข้อมูล RSVP เมื่อ login หรือเมื่อ currentUser เปลี่ยน
    useEffect(() => {
        const loadUserRSVP = async () => {
            if (currentUser && isLoggedIn) {
                setIsLoadingRSVP(true);
                try {
                    const existingRSVP = await getRSVPByUid(currentUser);
                    if (existingRSVP) {
                        setSubmittedData(existingRSVP);
                        // เติมข้อมูลลง form เพื่อให้แก้ไขได้
                        // ใช้ fullName ถ้ามี หรือสร้างจาก firstName + lastName
                        const fullName = existingRSVP.fullName || 
                            (existingRSVP.firstName && existingRSVP.lastName 
                                ? `${existingRSVP.firstName} ${existingRSVP.lastName}` 
                                : existingRSVP.firstName || '');
                        
                        form.setFieldsValue({
                            isComing: existingRSVP.isComing,
                            side: existingRSVP.side,
                            relation: existingRSVP.relation,
                            fullName: fullName,
                            note: existingRSVP.note,
                            accompanyingGuests: existingRSVP.accompanyingGuests || [],
                        });
                    } else if (userInfo) {
                        // ถ้ายังไม่มี RSVP ให้ auto-fill จาก Facebook/Google
                        form.setFieldsValue({
                            fullName: userInfo.displayName || '',
                        });
                    }
                } catch (error) {
                    console.error('Error loading RSVP:', error);
                } finally {
                    setIsLoadingRSVP(false);
                }
            } else {
                // ถ้า logout ให้ clear ข้อมูล
                setSubmittedData(null);
                form.resetFields();
                setIsLoadingRSVP(false);
            }
        };
        loadUserRSVP();
    }, [currentUser, isLoggedIn, form, userInfo]);

    // Subscribe เพื่อเช็คว่า session ถูกเตะออกหรือไม่
    useEffect(() => {
        if (!currentUser) return;

        // Reset flag เมื่อ currentUser เปลี่ยน
        sessionLogoutTriggeredRef.current = false;
        // Reset initial setup flag เมื่อ currentUser เปลี่ยน (ต้องสร้าง session ใหม่)
        // แต่ถ้ามีการ register session อยู่แล้ว (isRegisteringSessionRef.current === true)
        // อย่า reset flag เพราะ handleLogin กำลังจัดการอยู่
        if (!isRegisteringSessionRef.current) {
            isInitialSessionSetupRef.current = true;
        }
        // Reset startedAt เมื่อ currentUser เปลี่ยน (session ใหม่)
        currentSessionStartedAtRef.current = null;
        
        // เพิ่ม flag เพื่อ log แค่ครั้งแรก (ป้องกัน log ซ้ำจาก Firebase onValue)
        let hasLoggedInitialSetup = false;

        const unsubscribe = subscribeSessionChanges(currentUser, (isOnline, startedAt) => {
            // ป้องกันการเรียกซ้ำ
            if (sessionLogoutTriggeredRef.current || isLoggingOutRef.current) return;
            
            // ✅ ถ้ายังอยู่ใน initial setup phase (ยังไม่สร้าง session เสร็จ) → ไม่ต้อง logout
            // รอให้ registerSession() เสร็จก่อน (isInitialSessionSetupRef จะถูก set เป็น false)
            if (isInitialSessionSetupRef.current) {
                // Log แค่ครั้งแรก (ป้องกัน log ซ้ำจาก Firebase onValue callback)
                if (!hasLoggedInitialSetup) {
                    console.log('⏳ Initial session setup in progress, skipping logout check');
                    hasLoggedInitialSetup = true;
                }
                // เก็บ startedAt ครั้งแรกเมื่อ session setup เสร็จ
                if (isOnline && startedAt) {
                    currentSessionStartedAtRef.current = startedAt;
                }
                return;
            }
            
            // ถ้า isOnline === false แสดงว่า session ถูกปิด (logout จากที่อื่นหรือถูกเตะออก)
            if (!isOnline) {
                // Session ถูกลบหรือถูกปิด → ถูกลงชื่อออก
                sessionLogoutTriggeredRef.current = true;
                isLoggingOutRef.current = true;
                
                message.warning('คุณถูกลงชื่อออกเพราะมีการเข้าสู่ระบบจากที่อื่น');
                
                // เรียก logout (ไม่ต้องรอ finally เพราะ handleLogout จะจัดการ flag เอง)
                handleLogout();
                return;
            }
            
            // ✅ เช็คว่า startedAt เปลี่ยนหรือไม่ (ตรวจจับการยึด session)
            // ถ้า startedAt เปลี่ยนและไม่ใช่ session ของตัวเอง → session ถูกยึด
            if (startedAt && currentSessionStartedAtRef.current && 
                startedAt !== currentSessionStartedAtRef.current) {
                // Session ถูกยึด → ถูกลงชื่อออก
                sessionLogoutTriggeredRef.current = true;
                isLoggingOutRef.current = true;
                
                message.warning('คุณถูกลงชื่อออกเพราะมีการเข้าสู่ระบบจากที่อื่น');
                
                // เรียก logout
                handleLogout();
                return;
            }
            
            // ถ้า isOnline === true และ startedAt ไม่เปลี่ยน → ยัง active อยู่
            // อัพเดท currentSessionStartedAtRef ถ้ายังไม่มีค่า
            if (isOnline && startedAt && !currentSessionStartedAtRef.current) {
                currentSessionStartedAtRef.current = startedAt;
            }
        });

        return () => {
            unsubscribe();
            sessionLogoutTriggeredRef.current = false;
        };
    }, [currentUser]);

    const handleLogin = async (provider: 'google' | 'facebook') => {
        // Prevent multiple clicks
        if (loading) return;

        try {
            setLoading(true);
            
            // ถ้า popup สำเร็จ ฟังก์ชันจะ resolve และไม่ redirect
            // ถ้า fallback เป็น redirect หน้าเพจจะเปลี่ยนทันที
            if (provider === 'google') {
                await signInWithGoogle();
            } else if (provider === 'facebook') {
                await signInWithFacebook();
            }

            // หลังจาก login สำเร็จ ให้ดึง user จาก Firebase Auth โดยตรง
            // เพื่อให้แน่ใจว่า currentUser ถูก set ทันที (ไม่ต้องรอ onAuthStateChange)
            const firebaseUser = getCurrentUser();
            if (firebaseUser) {
                console.log('✅ Login successful, setting user state:', firebaseUser.uid);
                setCurrentUser(firebaseUser.uid);
                setUserInfo(firebaseUser);
                setIsLoggedIn(true);
                
                // สร้าง session ใหม่และเช็คว่ามี session อื่น active อยู่หรือไม่
                try {
                    // ตั้ง flag เพื่อบอกว่า session registration กำลังดำเนินการอยู่
                    isRegisteringSessionRef.current = true;
                    
                    const sessionResult = await registerSession(firebaseUser);
                    
                    // ✅ Session สร้างเสร็จแล้ว → ปิด initial setup flag และเก็บ startedAt
                    isInitialSessionSetupRef.current = false;
                    isRegisteringSessionRef.current = false;
                    currentSessionStartedAtRef.current = sessionResult.startedAt;
                    
                    if (sessionResult.hasOtherActiveSession) {
                        // มี session อื่น active อยู่ → แสดง warning
                        setSessionWarning({
                            hasOtherSession: true,
                            otherSessionStartedAt: sessionResult.otherSessionStartedAt,
                        });
                        message.warning('มีการเข้าสู่ระบบจากอุปกรณ์อื่นอยู่');
                    }
                } catch (sessionError) {
                    console.error('Error registering session:', sessionError);
                    // ถ้า session สร้างไม่สำเร็จ ก็ปิด flag เพื่อให้ระบบทำงานปกติ
                    isInitialSessionSetupRef.current = false;
                    isRegisteringSessionRef.current = false;
                    // ไม่ต้องบล็อกการทำงาน ถ้า session registration ล้มเหลว
                }
            }

            // กรณี popup สำเร็จ → ปลดล็อกปุ่ม submit ได้เลย
            // กรณี redirect → จะถูกเพิกเฉยเพราะหน้าเพจจะย้ายออก
            setLoading(false);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(`Error initiating ${provider} login:`, error);
            
            // Handle specific errors
            if (error.code === 'auth/popup-blocked') {
                message.error('ป๊อปอัปถูกบล็อก กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้');
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
                message.error('ยังไม่ได้เปิดใช้งานผู้ให้บริการเข้าสู่ระบบ โปรดเปิด Facebook/Google ใน Firebase Console');
                setLoading(false);
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                message.error('อีเมลนี้ถูกเชื่อมกับผู้ให้บริการอื่นอยู่แล้ว กรุณาเข้าสู่ระบบด้วยผู้ให้บริการเดิม');
                setLoading(false);
            } else {
                // ไม่ทราบสาเหตุ → แสดงข้อความผิดพลาดและเคลียร์ loading
                const msg = typeof error?.message === 'string' ? error.message : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่';
                message.error(msg);
                setLoading(false);
            }
        }
    };




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
                    await endSession(currentUser);
                } catch (sessionError) {
                    console.error('Error ending session:', sessionError);
                    // ไม่ต้องบล็อกการทำงาน ถ้า session end ล้มเหลว
                }
            }
            
            await logout();
            logoutSuccess = true;
        } catch (error) {
            console.error('Error logging out:', error);
            message.error('เกิดข้อผิดพลาดในการออกจากระบบ');
        } finally {
            // รีเซ็ต state เสมอ แม้ว่า logout() จะ throw exception
            // เพื่อป้องกัน app อยู่ในสถานะที่ไม่สอดคล้องกัน
            setIsLoggedIn(false);
            setCurrentUser(null);
            setUserInfo(null);
            setSubmittedData(null);
            setSessionWarning(null);
            // Reset initial setup flag เมื่อ logout
            isInitialSessionSetupRef.current = true;
            form.resetFields();
            setLoading(false); // Ensure loading is reset after logout
            
            // แสดง message เฉพาะเมื่อ logout สำเร็จและไม่ได้ถูกเตะออกจาก session
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

    const getAvatarUrl = (user: User) => {
        if (!user.photoURL) return undefined;
        // ใช้ URL ตรงๆ จาก Firebase Auth (Firebase จะจัดการ Facebook photo URL ให้แล้ว)
        // ไม่ต้องเพิ่ม parameter เพราะอาจทำให้เกิด Permission denied
        // Facebook photo URL จาก Firebase Auth จะใช้งานได้โดยตรง
        return user.photoURL;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFinish = async (values: any) => {
        // ตรวจสอบว่ามี currentUser หรือไม่ - ใช้ getCurrentUser() จาก Firebase ถ้า state ยังไม่อัปเดต
        let effectiveUserId = currentUser;
        
        // ถ้า currentUser ยังไม่มี ให้ลองดึงจาก Firebase Auth โดยตรง (กรณีที่ state ยังไม่อัปเดต)
        if (!effectiveUserId) {
            const firebaseUser = getCurrentUser();
            if (firebaseUser) {
                effectiveUserId = firebaseUser.uid;
                // อัปเดต state ทันที
                setCurrentUser(effectiveUserId);
                setUserInfo(firebaseUser);
                setIsLoggedIn(true);
                console.log('✅ Got user from Firebase Auth directly:', effectiveUserId);
            }
        }
        
        if (!effectiveUserId) {
            message.error('กรุณาเข้าสู่ระบบก่อนยืนยันการลงทะเบียน');
            setLoading(false); // Ensure loading is reset
            return;
        }

        // Prevent double submission
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

            const rsvpData: Omit<FirebaseRSVPData, 'id' | 'createdAt' | 'updatedAt'> = {
                uid: effectiveUserId, // ใช้ effectiveUserId แทน currentUser
                isComing: values.isComing,
                firstName: firstName,
                lastName: lastName,
                fullName: fullName, // เก็บ fullName เพิ่มด้วย
                photoURL: userInfo?.photoURL || null, // เก็บภาพ profile จาก Facebook/Google
                nickname: values.nickname || '',
                side: values.side || 'groom',
                relation: values.relation || '',
                note: values.note || '',
                accompanyingGuests: values.isComing === 'yes' ? sanitizedGuests : [],
                accompanyingGuestsCount: values.isComing === 'yes' ? sanitizedGuests.length : 0,
                guestId: null,
            };

            // Remove undefined fields to prevent Firebase error
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.keys(rsvpData).forEach(key => (rsvpData as any)[key] === undefined && delete (rsvpData as any)[key]);

            // ตรวจสอบว่ามี RSVP อยู่แล้วหรือไม่ - ใช้ effectiveUserId
            let existingRSVP: FirebaseRSVPData | null = null;
            try {
                existingRSVP = await getRSVPByUid(effectiveUserId);
            } catch (error) {
                console.error('Error fetching existing RSVP:', error);
                // ยังคงดำเนินการต่อแม้ว่าจะดึงข้อมูลไม่ได้
            }
            
            let rsvpId: string;
            if (existingRSVP && existingRSVP.id) {
                // Update RSVP ที่มีอยู่แล้ว
                try {
                    console.log('Updating existing RSVP with ID:', existingRSVP.id, 'Data:', rsvpData);
                    await updateRSVP(existingRSVP.id, rsvpData);
                    console.log('RSVP updated successfully');
                    rsvpId = existingRSVP.id;
                    setSubmittedData({ 
                        ...rsvpData, 
                        id: existingRSVP.id, 
                        createdAt: existingRSVP.createdAt, 
                        updatedAt: new Date().toISOString() 
                    } as FirebaseRSVPData);
                    message.success('อัพเดทข้อมูลเรียบร้อย');
                } catch (error: any) {
                    console.error('Error updating RSVP:', error);
                    const errorMessage = error?.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล RSVP';
                    message.error(errorMessage);
                    setLoading(false);
                    return;
                }
            } else {
                // Create RSVP ใหม่
                try {
                    console.log('Creating new RSVP with data:', rsvpData);
                    rsvpId = await createRSVP(rsvpData);
                    console.log('RSVP created successfully with ID:', rsvpId);
                    setSubmittedData({ 
                        ...rsvpData, 
                        id: rsvpId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    } as FirebaseRSVPData);
                    message.success('บันทึกข้อมูลเรียบร้อย');
                } catch (error: any) {
                    console.error('Error creating RSVP:', error);
                    const errorMessage = error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล RSVP';
                    message.error(errorMessage);
                    setLoading(false);
                    return;
                }
            }

            // ถ้า isComing === 'yes' ให้สร้างหรืออัพเดท Guest อัตโนมัติ
            if (values.isComing === 'yes') {
                try {
                    const existingGuest = existingRSVP?.guestId ? await getGuest(existingRSVP.guestId) : null;
                    
                    if (existingGuest) {
                        // Update Guest ที่มีอยู่แล้ว - ใช้ฟังก์ชันสำหรับ RSVP
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
                        await updateGuestFromRSVP(existingGuest.id, updatedGuest, effectiveUserId);
                        
                        // Update RSVP ให้ link กับ Guest
                        await updateRSVP(rsvpId, { guestId: existingGuest.id });
                    } else {
                        // Create Guest ใหม่ - ใช้ timestamp + random เพื่อป้องกัน ID ซ้ำ
                        const timestamp = Date.now();
                        const random = Math.floor(Math.random() * 1000);
                        const newGuestId = `G${timestamp}${random}`;
                        
                        const newGuest: Guest = {
                            id: newGuestId,
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
                            groupId: null,
                            groupName: null,
                            checkedInAt: null,
                            checkInMethod: null,
                            rsvpUid: effectiveUserId, // เพิ่ม rsvpUid เพื่อติดตามว่า Guest ถูกสร้างจาก RSVP
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
                        // createGuestFromRSVP จะเติม rsvpUid ให้อีกครั้งเพื่อความปลอดภัย
                        await createGuestFromRSVP(newGuest, effectiveUserId);
                        
                        // Update RSVP ให้ link กับ Guest
                        await updateRSVP(rsvpId, { guestId: newGuestId });
                    }
                } catch (guestError: unknown) {
                    console.error('Error creating/updating guest:', guestError);
                    const errorMessage = guestError instanceof Error ? guestError.message : String(guestError || 'Unknown error');
                    // แสดง error message ที่ชัดเจนขึ้น
                    message.warning(`บันทึก RSVP สำเร็จ แต่เกิดปัญหาในการสร้างข้อมูล Guest: ${errorMessage}`);
                }
            } else if (existingRSVP?.guestId) {
                // ถ้าเปลี่ยนจาก yes เป็น no ให้ update Guest.isComing = false
                try {
                    const existingGuest = await getGuest(existingRSVP.guestId);
                    if (existingGuest && existingGuest.rsvpUid === effectiveUserId) {
                        // ใช้ฟังก์ชันสำหรับ RSVP ถ้า Guest ถูกสร้างโดย RSVP
                        await updateGuestFromRSVP(existingGuest.id, { 
                            isComing: false,
                            updatedAt: new Date().toISOString(),
                        }, effectiveUserId);
                    } else if (existingGuest && !existingGuest.rsvpUid) {
                        // ถ้า Guest ถูกสร้างโดย admin ให้ข้าม (ไม่สามารถแก้ไขได้)
                    }
                } catch (guestError) {
                    console.error('Error updating guest isComing:', guestError);
                    // ไม่ throw error เพื่อไม่ให้กระทบการบันทึก RSVP
                }
            }

            setIsEditing(false);
            setLoading(false);
        } catch (error: unknown) {
            console.error('Error saving RSVP:', error);
            setLoading(false);
            const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
            message.error(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${errorMessage}`);
        }
    };



    const totalAttendees = isComing === 'yes' ? 1 + (accompanyingGuests?.length || 0) : 0;



    const renderContent = () => {
        // แสดง loading ขณะเช็ค auth หรือ load RSVP
        if (isCheckingAuth || (isLoggedIn && isLoadingRSVP)) {
            return (
                <div className="w-full max-w-xs mx-auto text-center animate-fade-in pt-10">
                    <Spin size="large" tip="กำลังตรวจสอบข้อมูล..." />
                </div>
            );
        }

        if (!isLoggedIn) {

            return (

                <div className="w-full max-w-xs mx-auto text-center animate-fade-in pt-10">

                    <Title level={3} className="font-cinzel text-[#5c3a58] mb-2">Welcome</Title>

                    <Text type="secondary" className="block mb-6 text-xs">กรุณายืนยันตัวตนเพื่อลงทะเบียน</Text>

                    <div className="space-y-3">

                        <Button block size="large" icon={<FacebookFilled />} className="h-12 bg-[#1877f2] text-white border-none rounded-xl shadow-sm hover:opacity-90 font-medium" onClick={() => handleLogin('facebook')} loading={loading} disabled={loading}>เข้าสู่ระบบด้วย Facebook</Button>

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

                                            {submittedData.accompanyingGuests.map((g, i) => (

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

                                                {/* แสดงภาพและชื่อจาก Facebook/Google */}
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
                                                                ข้อมูลจาก {userInfo.providerData?.[0]?.providerId === 'facebook.com' ? 'Facebook' : userInfo.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'บัญชี'}
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
                                const effectiveUser = currentUser || getCurrentUser()?.uid || null;
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

    // Modal สำหรับแสดง warning เมื่อมีการ login จากที่อื่น
    const handleForceEndSession = async () => {
        if (!currentUser) return;
        
        const user = getCurrentUser();
        if (!user) {
            message.error('ไม่พบข้อมูลผู้ใช้');
            return;
        }
        
        try {
            // ตั้ง flag เพื่อป้องกัน session listener trigger logout ระหว่างการยึด session
            isInitialSessionSetupRef.current = true;
            isRegisteringSessionRef.current = true;
            
            // เรียก registerSession() เพื่อยึด session (ใช้ atomic update เพื่อ set isOnline และ startedAt พร้อมกัน)
            const sessionResult = await registerSession(user);
            
            // ปิด flag หลังจากยึด session เสร็จ และอัพเดท startedAt
            isInitialSessionSetupRef.current = false;
            isRegisteringSessionRef.current = false;
            currentSessionStartedAtRef.current = sessionResult.startedAt;
            
            setSessionWarning(null);
            message.success('ยึด session เรียบร้อย');
        } catch (error) {
            // ปิด flag ในกรณี error
            isInitialSessionSetupRef.current = false;
            isRegisteringSessionRef.current = false;
            console.error('Error forcing end session:', error);
            message.error('เกิดข้อผิดพลาดในการยึด session');
        }
    };

    return (
        <>
            {/* Session Warning Modal */}
            <Modal
                title="มีการเข้าสู่ระบบจากที่อื่น"
                open={sessionWarning?.hasOtherSession || false}
                onOk={handleForceEndSession}
                onCancel={() => setSessionWarning(null)}
                okText="ยึด session นี้"
                cancelText="ปิด"
                okButtonProps={{ danger: true }}
            >
                <div className="space-y-2">
                    <Text>มีการเข้าสู่ระบบจากอุปกรณ์อื่นอยู่</Text>
                    {sessionWarning?.otherSessionStartedAt && (
                        <div className="text-sm text-gray-600 mt-2">
                            <div>เวลาเข้าใช้งาน: {new Date(sessionWarning.otherSessionStartedAt).toLocaleString('th-TH')}</div>
                        </div>
                    )}
                    <Text className="text-xs text-gray-500 block mt-2">
                        หากต้องการเข้าสู่ระบบจากอุปกรณ์นี้ กรุณาคลิก "ยึด session นี้" 
                        เพื่อปิด session อื่นและเข้าสู่ระบบจากอุปกรณ์นี้แทน
                    </Text>
                </div>
            </Modal>

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

const IntroOverlay: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    // ใช้ config สำหรับการ์ดแต่งงาน
    const config = defaultWeddingCardConfig;
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



const GuestRSVPApp: React.FC<{ onExitGuestMode: () => void }> = ({ onExitGuestMode: _onExitGuestMode }) => {
    // Keep onExitGuestMode in props to avoid changing interface, but ignore usage for now
    // or remove it from props if the parent component is also updated.
    // Given instruction is just to remove button, we keep the prop but acknowledge it's unused.
    // Parameter renamed to _onExitGuestMode to indicate it's intentionally unused
    void _onExitGuestMode; 

    // State - จะ sync จาก Firebase เมื่อ login
    const [isFlipped, setIsFlipped] = useState(false);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const currentTrack = PLAYLIST[currentTrackIndex];

    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);
    
    // Refs เพื่อป้องกัน infinite loop
    const isManualControlRef = React.useRef(false); // Flag สำหรับ manual control
    const lastMusicStateRef = React.useRef(musicPlaying); // เก็บ state ล่าสุด
    const autoPlayAttemptedRef = React.useRef(false); // Flag เพื่อป้องกัน auto-play ซ้ำ
    
    // Helper to send commands to YouTube iframe
    const sendCommand = useCallback((func: string, args: unknown[] = [], requireReady = false) => {
        // For auto-play after refresh, require iframe to be ready
        // For manual controls, try to send even if not ready yet
        if (iframeRef.current && iframeRef.current.contentWindow) {
            if (!requireReady || iframeReady) {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func, args }), 
                    '*'
                );
            }
        }
    }, [iframeReady]);

    // Handle iframe load event
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

        // Subscribe to auth state changes
        const unsubscribeAuth = onAuthStateChange((user) => {
            if (!isMounted) return;
            
            // Unsubscribe จาก state subscription เก่าก่อน (ถ้ามี)
            // เพื่อป้องกัน memory leak เมื่อ auth state callback ถูกเรียกหลายครั้ง
            // ต้อง unsubscribe ก่อนสร้าง subscription ใหม่ทุกครั้ง
            if (unsubscribeState) {
                unsubscribeState();
                unsubscribeState = null;
            }
            
            if (user) {
                
                // Load initial state จาก Firebase
                getUserAppState(user.uid)
                    .then((state) => {
                        if (!isMounted) return;
                        if (state) {
                            if (state.isFlipped !== undefined) setIsFlipped(state.isFlipped);
                            if (state.musicPlaying !== undefined) setMusicPlaying(state.musicPlaying);
                            if (state.hasStarted !== undefined) setShowIntro(!state.hasStarted);
                            if (state.currentTrackIndex !== undefined) setCurrentTrackIndex(state.currentTrackIndex);
                        }
                    })
                    .catch((error) => {
                        console.error('Error loading app state:', error);
                    });

                // Subscribe to state changes จาก Firebase (sync ระหว่างแท็บ/อุปกรณ์)
                // ต้อง unsubscribe เก่าก่อน (ทำแล้วข้างบน) แล้วค่อยสร้างใหม่
                unsubscribeState = subscribeUserAppState(user.uid, (state) => {
                    if (!isMounted) return;
                    if (state) {
                        if (state.isFlipped !== undefined) setIsFlipped(state.isFlipped);
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

    // Save state changes ไปยัง Firebase Realtime Database
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) return;
        
        // Debounce เพื่อป้องกันการ update บ่อยเกินไป
        const timeoutId = setTimeout(() => {
            updateUserAppState(user.uid, { isFlipped })
                .catch((error) => {
                    console.error('Error saving isFlipped state:', error);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [isFlipped]);

    // Save music playing state ไปยัง Firebase Realtime Database
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) return;
        
        // Debounce เพื่อป้องกันการ update บ่อยเกินไป
        const timeoutId = setTimeout(() => {
            updateUserAppState(user.uid, { musicPlaying })
                .catch((error) => {
                    console.error('Error saving musicPlaying state:', error);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [musicPlaying]);

    // Save currentTrackIndex ไปยัง Firebase Realtime Database
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) return;
        
        // Debounce เพื่อป้องกันการ update บ่อยเกินไป
        const timeoutId = setTimeout(() => {
            updateUserAppState(user.uid, { currentTrackIndex })
                .catch((error) => {
                    console.error('Error saving currentTrackIndex state:', error);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [currentTrackIndex]);

    const handleStart = () => {
        setShowIntro(false);
        // Save hasStarted state ไปยัง Firebase
        const user = getCurrentUser();
        if (user) {
            updateUserAppState(user.uid, { hasStarted: true })
                .catch((error) => {
                    console.error('Error saving hasStarted state:', error);
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

    const onToggleMusic = () => {
        // Set flag เพื่อบอกว่าเป็น manual control (ให้ priority สูงกว่า auto-play)
        isManualControlRef.current = true;
        
        const newState = !musicPlaying;
        
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

    const handleNext = () => {
        const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
        setCurrentTrackIndex(nextIndex);
        sendCommand('loadVideoById', [PLAYLIST[nextIndex].id], false); // Don't require ready for manual control
        // Keep playing state true if we change track
        if (!musicPlaying) setMusicPlaying(true);
    };

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
        
        // ถ้า musicPlaying = true และยังไม่ได้ auto-play
        if (musicPlaying && !autoPlayAttemptedRef.current && iframeReady) {
            // Auto-play music when restored from sessionStorage after refresh
            let attempts = 0;
            const maxAttempts = 5; // ลดจำนวน attempts เพื่อป้องกัน loop
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            
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
        } else if (!musicPlaying && iframeReady) {
            // Pause music
            sendCommand('pauseVideo', [], false);
            autoPlayAttemptedRef.current = false; // Reset flag เมื่อ pause
        } else if (musicPlaying && iframeReady && !autoPlayAttemptedRef.current) {
            // Sync play state (backup)
            sendCommand('playVideo', [], false);
        }
        
        // Reset autoPlayAttemptedRef เมื่อ state เปลี่ยนจาก true เป็น false
        if (!musicPlaying) {
            autoPlayAttemptedRef.current = false;
        }
    }, [musicPlaying, showIntro, iframeReady, sendCommand]);

    // Listen for YouTube player state changes to sync UI
    useEffect(() => {
        if (!showIntro && iframeRef.current) {
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== 'https://www.youtube.com') return;
                
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data.event === 'onStateChange') {
                        // 0 = ended, 1 = playing, 2 = paused, 3 = buffering
                        if (data.info === 1) {
                            setMusicPlaying(true);
                        } else if (data.info === 2) {
                            setMusicPlaying(false);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            };
            
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, [showIntro]);

    return (

        <div className="fixed inset-0 bg-[#e6e2dd] flex flex-col items-center justify-center font-serif overflow-hidden">

            <GlobalStyleLoader />

            
            {/* Intro Overlay for Autoplay Policy Compliance */}

            {showIntro && <IntroOverlay onStart={handleStart} />}



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

                        {/* Pass music control props */}

                        <CardFront 

                            onFlip={() => setIsFlipped(true)} 

                            isPlaying={musicPlaying} 

                            onToggleMusic={onToggleMusic}

                            onNext={handleNext}

                            onPrev={handlePrev}

                            currentTrack={currentTrack}

                        />

                    </div>

                    <div className={`flip-back ${!isFlipped ? 'side-inactive' : 'side-active'}`}><CardBack onFlip={() => setIsFlipped(false)} /></div>

                </div>

            </div>

            <div className="absolute bottom-2 text-[#8d6e63] text-xs opacity-50 hidden md:block">The Wedding of Got & Nan</div>

        </div>

    );

};









export default GuestRSVPApp;
