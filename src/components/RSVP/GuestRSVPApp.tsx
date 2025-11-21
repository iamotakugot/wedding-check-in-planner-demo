/* eslint-disable security/detect-object-injection */
import React, { useState, useEffect } from 'react';
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
  updateGuestFromRSVP // Import updateGuestFromRSVP
} from '@/services/firebaseService';
import type { RSVPData as FirebaseRSVPData } from '@/services/firebaseService';
import type { User } from 'firebase/auth';
import { Guest, Side } from '@/types';
import { RSVP_RELATION_OPTIONS, RSVP_GUEST_RELATION_OPTIONS } from '@/data/formOptions';

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

      }

      .flip-inner.is-flipped { transform: rotateY(180deg); }

      

      .flip-front, .flip-back {

        position: absolute; top: 0; left: 0; width: 100%; height: 100%;

        backface-visibility: hidden; -webkit-backface-visibility: hidden;

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

        scrollbar-width: none;

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

        <div className="flex justify-center gap-3 mt-2 md:mt-3 font-cinzel text-[#5c3a58] opacity-80">

            <div className="text-center"><div className="text-lg md:text-2xl font-bold">{timeLeft.days}</div><div className="text-[8px] uppercase tracking-wider">Days</div></div>

            <div className="text-center"><div className="text-lg md:text-2xl font-bold font-sans">:</div></div>

            <div className="text-center"><div className="text-lg md:text-2xl font-bold">{timeLeft.hours}</div><div className="text-[8px] uppercase tracking-wider">Hours</div></div>

            <div className="text-center"><div className="text-lg md:text-2xl font-bold font-sans">:</div></div>

            <div className="text-center"><div className="text-lg md:text-2xl font-bold">{timeLeft.minutes}</div><div className="text-[8px] uppercase tracking-wider">Mins</div></div>

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

    return (

        // FIX: Use 'no-scrollbar' class to hide UI

        <div className="w-full h-full flex flex-col md:flex-row bg-white overflow-y-auto no-scrollbar">

            {/* Left: Names & Countdown */}

            <div className="w-full md:w-5/12 bg-[#fdfcf8] relative min-h-[30vh] md:min-h-full flex flex-col items-center justify-center md:justify-start pt-4 md:pt-20 overflow-hidden border-b md:border-b-0 md:border-r border-gray-100 shrink-0">

                 <div className="absolute inset-0 opacity-100 pointer-events-none" style={{

                     backgroundImage: `url('https://images.unsplash.com/photo-1596788062679-3d7707e2dc83?q=80&w=2070&auto=format&fit=crop')`,

                     backgroundSize: 'cover', backgroundPosition: 'center', filter: 'contrast(0.95) brightness(1.05)'

                 }}></div>

                 <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>

                 <div className="absolute top-8 md:top-40 left-4 md:left-8 text-lg md:text-2xl text-blue-400 opacity-80 transform -rotate-12 animate-float">🦋</div>

                 <div className="absolute top-1/3 right-4 md:right-6 text-base md:text-xl text-pink-400 opacity-70 transform rotate-12">🦋</div>



                 <div className="relative z-10 text-center px-4 w-full">

                     <Text className="uppercase tracking-[0.15em] text-[#8d6e63] text-[8px] md:text-[10px] font-cinzel mb-1 block">Together with their families</Text>

                     {/* UPDATED: Smaller fonts on mobile to prevent cut-off */}

                     <div className="font-dancing text-[var(--color-soft-pink)] text-4xl md:text-6xl lg:text-7xl leading-tight mb-0 drop-shadow-sm">Pattarapong</div>

                     <Text className="font-dancing text-[var(--color-soft-pink)] text-2xl md:text-4xl mb-0 md:mb-2 block">&</Text>

                     <div className="font-dancing text-[var(--color-soft-pink)] text-4xl md:text-6xl lg:text-7xl leading-tight mb-2 drop-shadow-sm">Supannee</div>

                     

                     <div className="flex items-center justify-center gap-3 md:gap-4 text-[var(--color-dark-text)] font-cinzel my-2 md:my-6 w-full max-w-[200px] md:max-w-[240px] mx-auto">

                        <div className="flex-1 text-right border-b border-[var(--color-dark-text)] pb-1"><span className="text-[8px] md:text-[10px] uppercase tracking-widest block">Saturday</span></div>

                        <div className="text-3xl md:text-4xl font-medium mx-1 leading-none">31</div>

                        <div className="flex-1 text-left border-b border-[var(--color-dark-text)] pb-1"><span className="text-[8px] md:text-[10px] uppercase tracking-widest block">January</span></div>

                     </div>

                     <div className="font-cinzel text-[var(--color-dark-text)] text-base md:text-lg tracking-[0.2em] mb-1">2569</div>

                     <CountdownTimer />

                 </div>

                 {/* UPDATED: Reduce image height on mobile to 25% to allow more space for text */}

                 <div className="absolute bottom-0 left-0 w-full h-[20%] md:h-[45%] z-0">

                     <img src="https://images.unsplash.com/photo-1528459801411-802c6034157a?q=80&w=1975&auto=format&fit=crop" alt="" className="w-full h-full object-cover opacity-90" style={{ maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 50%, transparent 100%)' }} />

                 </div>

            </div>



            {/* Right: Details */}

            <div className="w-full md:w-7/12 p-4 md:p-10 flex flex-col items-center justify-center text-center relative bg-[#fffdf9] grow">

                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{

                     backgroundImage: `url('https://images.unsplash.com/photo-1596788062679-3d7707e2dc83?q=80&w=2070&auto=format&fit=crop')`,

                     backgroundSize: 'cover', backgroundPosition: 'center',

                 }}></div>

                <div className="absolute top-4 right-4 w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 border-[#d4af37] opacity-40"></div>

                <div className="absolute bottom-4 left-4 w-8 h-8 md:w-12 md:h-12 border-b-2 border-l-2 border-[#d4af37] opacity-40"></div>



                {/* UPDATED: Reduced vertical margins */}

                <div className="mb-2 mt-1 md:mt-2 relative z-10">

                    <Text className="text-[#8d6e63] uppercase tracking-[0.15em] text-[8px] md:text-[10px] block mb-1 font-cinzel">We Invite You To The Wedding Of</Text>

                    <h1 className="text-[#5c3a58] m-0 leading-snug font-script my-1 drop-shadow-sm" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', fontStyle: 'normal' }}>

                        Got <span className="text-[#d4af37] text-2xl md:text-4xl">&</span> Nan

                    </h1>

                    <Text className="text-[#8d6e63] mt-1 md:mt-3 block font-light text-[10px] md:text-sm lg:text-base">(นายภัทรพงษ์ พิศเพ็ง & นางสาวสุพรรณี ทอนสูงเนิน)</Text>

                    <Text className="text-[#8d6e63] mt-2 md:mt-6 block text-[10px] md:text-sm px-2 md:px-4 leading-relaxed font-light">

                        มีความยินดีขอเรียนเชิญท่านเพื่อเป็นเกียรติและร่วมรับประทานอาหาร<br className="hidden md:block"/>เนื่องในพิธีมงคลสมรส

                    </Text>

                </div>



                <div className="w-full mb-2 md:mb-4 relative z-10">

                     <div className="flex justify-center gap-4 md:gap-6 text-[10px] md:text-xs text-gray-500 mb-1 px-2">

                        <div className="text-right"><div className="font-bold text-[#5c3a58] mb-1">ฝ่ายเจ้าบ่าว</div><div>นาย บัณฑิต พิศเพ็ง</div><div>นาง อุบลวรรณ พิศเพ็ง</div></div>

                        <div className="w-px bg-[#d4af37] h-full opacity-50"></div>

                        <div className="text-left"><div className="font-bold text-[#5c3a58] mb-1">ฝ่ายเจ้าสาว</div><div>ร.ต.ท. อุดม ทอนสูงเนิน</div><div>นาง ชื่นชม ทอนสูงเนิน</div></div>

                    </div>

                </div>



                <Divider className="border-[#d4af37] opacity-30 my-1 md:my-4 w-1/2 min-w-[80px] mx-auto relative z-10"><span className="text-[#d4af37] text-sm md:text-lg">✤</span></Divider>



                <div className="w-full grid grid-cols-4 gap-1 md:gap-2 mb-2 md:mb-4 px-0 md:px-2 relative z-10">

                    {weddingSchedule.map((item, idx) => (

                        <div key={idx} className="flex flex-col items-center">

                            <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white border border-[#d4af37] flex items-center justify-center text-xs md:text-lg mb-1 md:mb-2 shadow-sm text-[#5c3a58]">{item.icon}</div>

                            <div className="text-[#5c3a58] font-bold text-[9px] md:text-xs whitespace-nowrap">{item.time}</div>

                            <div className="text-gray-400 text-[8px] md:text-[10px] hidden sm:block">{item.title}</div>

                        </div>

                    ))}

                </div>

                

                {/* Custom Music Player UI */}

                <div className="relative z-20 flex flex-col items-center justify-center mt-2 md:mt-4 animate-fade-in bg-[#5c3a58]/5 p-2 rounded-xl border border-[#5c3a58]/10 backdrop-blur-sm w-[90%] max-w-[300px] mx-auto">

                   <div className="flex items-center gap-3 w-full">

                      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-[#d4af37] shadow-sm shrink-0 ${isPlaying ? 'animate-spin-slow' : 'paused-spin'}`}>

                         <img src={currentTrack.cover} className="w-full h-full object-cover" alt="Cover" />

                      </div>

                      <div className="flex-1 min-w-0 text-left">

                          <div className="text-[10px] font-bold text-[#5c3a58] truncate">{currentTrack.title}</div>

                          <div className="text-[9px] text-gray-500 truncate">{currentTrack.artist}</div>

                      </div>

                      <div className="flex items-center gap-1">

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



                {/* UPDATED: Added pb-8 for bottom spacing */}

                <div className="mt-auto pb-8 relative z-10 pt-3 md:pt-4">

                    <Button type="primary" size="large" onClick={onFlip} className="h-10 md:h-12 px-8 md:px-10 text-sm md:text-base font-medium shadow-lg bg-[#5c3a58] hover:bg-[#4a2e46] border-none rounded-sm tracking-wide hover:scale-105 transition-transform">ลงทะเบียนร่วมงาน</Button>

                     <a href="https://maps.app.goo.gl/VT1SNFGHSdY7kW9UA" target="_blank" rel="noopener noreferrer" className="mt-2 md:mt-4 flex items-center justify-center gap-2 text-gray-500 text-[10px] md:text-xs hover:text-[#5c3a58] transition-colors cursor-pointer no-underline">

                        <EnvironmentOutlined className="text-[#d4af37]" /> ณ เรือนชมมณี นครราชสีมา

                    </a>

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

    // Check persistent login on mount
    useEffect(() => {
        let isMounted = true;
        let redirectHandled = false;
        
        setIsCheckingAuth(true);
        
        // Check if returning from redirect login (priority check)
        checkRedirectResult()
            .then((user) => {
                if (user && isMounted) {
                    redirectHandled = true;
                    setIsLoggedIn(true);
                    setCurrentUser(user.uid);
                    setUserInfo(user);
                    message.success('เข้าสู่ระบบสำเร็จ');
                }
            })
            .catch((error) => {
                if (isMounted) {
                    // Handle specific error cases if needed
                    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                        console.error("Redirect result error:", error);
                    }
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsCheckingAuth(false);
                }
            });

        // Subscribe to auth state changes (for persistent login and faster redirect detection)
        const unsubscribe = onAuthStateChange((user) => {
            if (!isMounted) return;
            
            if (user) {
                // ถ้ายังไม่ได้ handle redirect result ให้ set state ทันที
                if (!redirectHandled) {
                    redirectHandled = true;
                    setIsLoggedIn(true);
                    setCurrentUser(user.uid);
                    setUserInfo(user);
                } else {
                    // Update state if already handled
                    setIsLoggedIn(true);
                    setCurrentUser(user.uid);
                    setUserInfo(user);
                }
            } else {
                setIsLoggedIn(false);
                setCurrentUser(null);
                setUserInfo(null);
            }
            
            // เมื่อ auth state เปลี่ยนแล้ว ให้หยุด checking
            if (isMounted) {
                setIsCheckingAuth(false);
            }
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

    const handleLogin = async (provider: string) => {
        // Prevent multiple clicks
        if (loading) return;

        if (provider === 'google') {
            try {
                setLoading(true);
                const user = await signInWithGoogle();
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
                setUserInfo(user);
                setLoading(false); // Reset loading after successful login
                message.success('เข้าสู่ระบบด้วย Google สำเร็จ');
            } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error('Error signing in with Google:', error);
                // ถ้าเป็น redirect error ไม่ต้องแสดง error (เพราะมันจะ redirect ไป)
                if (error.message?.includes('Redirecting')) {
                    message.loading('กำลังเปลี่ยนหน้า...', 0);
                    // Don't reset loading here, let redirect happen
                    return;
                }
                if (error.code === 'auth/popup-closed-by-user') {
                    message.warning('ยกเลิกการเข้าสู่ระบบ');
                    setLoading(false);
                } else {
                    message.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
                    setLoading(false);
                }
            }
        } else if (provider === 'facebook') {
            try {
                setLoading(true);
                const user = await signInWithFacebook();
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
                setUserInfo(user);
                setLoading(false); // Reset loading after successful login
                message.success('เข้าสู่ระบบด้วย Facebook สำเร็จ');
            } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error('Error signing in with Facebook:', error);
                // ถ้าเป็น redirect error ไม่ต้องแสดง error
                if (error.message?.includes('Redirecting')) {
                    message.loading('กำลังเปลี่ยนหน้า...', 0);
                    // Don't reset loading here, let redirect happen
                    return;
                }
                if (error.code === 'auth/popup-closed-by-user') {
                    message.warning('ยกเลิกการเข้าสู่ระบบ');
                    setLoading(false);
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    message.error('อีเมลนี้ถูกใช้งานด้วยวิธีอื่นแล้ว');
                    setLoading(false);
                } else {
                    message.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Facebook');
                    setLoading(false);
                }
            }
        }
    };




    const handleLogout = async () => {
        try {
            setLoading(false); // Reset loading before logout
            await logout();
            setIsLoggedIn(false);
            setCurrentUser(null);
            setUserInfo(null);
            setSubmittedData(null);
            form.resetFields();
            setLoading(false); // Ensure loading is reset after logout
            message.success('ออกจากระบบสำเร็จ');
        } catch (error) {
            console.error('Error logging out:', error);
            message.error('เกิดข้อผิดพลาดในการออกจากระบบ');
            setLoading(false); // Reset loading state ในกรณี error
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
        // ตรวจสอบว่ามี currentUser หรือไม่
        if (!currentUser) {
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
                uid: currentUser,
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

            // ตรวจสอบว่ามี RSVP อยู่แล้วหรือไม่
            let existingRSVP: FirebaseRSVPData | null = null;
            try {
                existingRSVP = await getRSVPByUid(currentUser);
            } catch (error) {
                console.error('Error fetching existing RSVP:', error);
                // ยังคงดำเนินการต่อแม้ว่าจะดึงข้อมูลไม่ได้
            }
            
            let rsvpId: string;
            if (existingRSVP && existingRSVP.id) {
                // Update RSVP ที่มีอยู่แล้ว
                await updateRSVP(existingRSVP.id, rsvpData);
                rsvpId = existingRSVP.id;
                setSubmittedData({ 
                    ...rsvpData, 
                    id: existingRSVP.id, 
                    createdAt: existingRSVP.createdAt, 
                    updatedAt: new Date().toISOString() 
                } as FirebaseRSVPData);
                message.success('อัพเดทข้อมูลเรียบร้อย');
            } else {
                // Create RSVP ใหม่
                rsvpId = await createRSVP(rsvpData);
                setSubmittedData({ ...rsvpData, id: rsvpId } as FirebaseRSVPData);
                message.success('บันทึกข้อมูลเรียบร้อย');
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
                            const value = (updatedGuest as any)[key];
                            if (value === undefined) {
                                delete (updatedGuest as any)[key];
                            }
                        });
                        
                        // ใช้ฟังก์ชันสำหรับ RSVP (ไม่ต้อง requireAdmin)
                        await updateGuestFromRSVP(existingGuest.id, updatedGuest, currentUser);
                        
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
                            rsvpUid: currentUser, // เพิ่ม rsvpUid เพื่อติดตามว่า Guest ถูกสร้างจาก RSVP
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        
                        // Remove undefined fields ก่อนบันทึก (Firebase ไม่ยอมรับ undefined)
                        Object.keys(newGuest).forEach(key => {
                            const value = (newGuest as any)[key];
                            if (value === undefined) {
                                delete (newGuest as any)[key];
                            }
                        });
                        
                        // ใช้ฟังก์ชันสำหรับ RSVP (ไม่ต้อง requireAdmin)
                        // createGuestFromRSVP จะเติม rsvpUid ให้อีกครั้งเพื่อความปลอดภัย
                        await createGuestFromRSVP(newGuest, currentUser);
                        
                        // Update RSVP ให้ link กับ Guest
                        await updateRSVP(rsvpId, { guestId: newGuestId });
                    }
                } catch (guestError: any) {
                    console.error('Error creating/updating guest:', guestError);
                    const errorMessage = guestError?.message || guestError?.toString() || 'Unknown error';
                    // แสดง error message ที่ชัดเจนขึ้น
                    message.warning(`บันทึก RSVP สำเร็จ แต่เกิดปัญหาในการสร้างข้อมูล Guest: ${errorMessage}`);
                }
            } else if (existingRSVP?.guestId) {
                // ถ้าเปลี่ยนจาก yes เป็น no ให้ update Guest.isComing = false
                try {
                    const existingGuest = await getGuest(existingRSVP.guestId);
                    if (existingGuest && existingGuest.rsvpUid === currentUser) {
                        // ใช้ฟังก์ชันสำหรับ RSVP ถ้า Guest ถูกสร้างโดย RSVP
                        await updateGuestFromRSVP(existingGuest.id, { 
                            isComing: false,
                            updatedAt: new Date().toISOString(),
                        }, currentUser);
                    } else if (existingGuest && !existingGuest.rsvpUid) {
                        // ถ้า Guest ถูกสร้างโดย admin ให้ข้าม (ไม่สามารถแก้ไขได้)
                        console.log('Guest ถูกสร้างโดย Admin ไม่สามารถแก้ไขได้');
                    }
                } catch (guestError) {
                    console.error('Error updating guest isComing:', guestError);
                    // ไม่ throw error เพื่อไม่ให้กระทบการบันทึก RSVP
                }
            }

            setIsEditing(false);
            setLoading(false);
        } catch (error: any) {
            console.error('Error saving RSVP:', error);
            setLoading(false);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
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
                                
                                // Disable button if no status, loading, or no current user
                                const isDisabled = !status || loading || !currentUser;

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

        <div className="w-full h-full flex flex-col bg-[#fdfbf7] relative overflow-hidden">

             <div className="absolute top-4 right-4 z-20">

                <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={onFlip} className="text-gray-500 border-gray-200 hover:text-[#5c3a58] hover:border-[#5c3a58] bg-white shadow-sm" />

             </div>

             <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col">

                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f7f3eb] to-transparent pointer-events-none z-10"></div>

                <div className="relative z-10 flex-1 flex flex-col h-full">{renderContent()}</div>

             </div>

        </div>

    );

};



// Intro Component - Interaction required for autoplay

const IntroOverlay: React.FC<{ onStart: () => void }> = ({ onStart }) => {

    return (

        <div className="fixed inset-0 z-[100] bg-[#fdfcf8] flex flex-col items-center justify-center p-4 animate-fade-in">

             <div className="absolute inset-0 opacity-30 pointer-events-none" style={{

                 backgroundImage: `url('https://images.unsplash.com/photo-1596788062679-3d7707e2dc83?q=80&w=2070&auto=format&fit=crop')`,

                 backgroundSize: 'cover', backgroundPosition: 'center',

             }}></div>

             

             <div className="relative z-10 text-center max-w-md w-full">

                <Text className="uppercase tracking-[0.2em] text-[#8d6e63] text-xs md:text-sm font-cinzel mb-2 block">The Wedding Of</Text>

                <div className="font-dancing text-[var(--color-soft-pink)] text-5xl md:text-7xl leading-tight mb-4 drop-shadow-sm">Got & Nan</div>

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



const GuestRSVPApp: React.FC<{ onExitGuestMode: () => void }> = ({ onExitGuestMode }) => {
    // Keep onExitGuestMode in props to avoid changing interface, but ignore usage for now
    // or remove it from props if the parent component is also updated.
    // Given instruction is just to remove button, we keep the prop but acknowledge it's unused.
    void onExitGuestMode; 

    // Restore state from sessionStorage if available
    const [isFlipped, setIsFlipped] = useState(() => {
        try {
            return sessionStorage.getItem('wedding_is_flipped') === 'true';
        } catch {
            return false;
        }
    });

    const [musicPlaying, setMusicPlaying] = useState(() => {
        try {
            // Restore music playing state from sessionStorage
            return sessionStorage.getItem('wedding_music_playing') === 'true';
        } catch {
            return false;
        }
    });

    const [showIntro, setShowIntro] = useState(() => {
        try {
            // If we have started before, skip intro
            return sessionStorage.getItem('wedding_has_started') !== 'true';
        } catch {
            return true;
        }
    });

    // Save state changes
    useEffect(() => {
        try {
            sessionStorage.setItem('wedding_is_flipped', String(isFlipped));
        } catch (e) {
            console.error('Error saving state', e);
        }
    }, [isFlipped]);

    // Save music playing state to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem('wedding_music_playing', String(musicPlaying));
        } catch (e) {
            console.error('Error saving music state', e);
        }
    }, [musicPlaying]);

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const currentTrack = PLAYLIST[currentTrackIndex];

    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);
    
    // Helper to send commands to YouTube iframe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendCommand = (func: string, args: any[] = [], requireReady = false) => {
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
    };

    // Handle iframe load event
    const handleIframeLoad = () => {
        // Wait for YouTube API to be ready (YouTube iframe needs time to initialize)
        setTimeout(() => {
            setIframeReady(true);
        }, 1500); // Increased delay to ensure YouTube API is ready
    };

    const handleStart = () => {
        setShowIntro(false);
        try {
            sessionStorage.setItem('wedding_has_started', 'true');
        } catch (e) {
            console.error('Error saving state', e);
        }
        setMusicPlaying(true);
        // Attempt to play immediately (don't require ready for initial start)
        setTimeout(() => sendCommand('playVideo', [], false), 100);
    };

    const onToggleMusic = () => {
        if (musicPlaying) {
            sendCommand('pauseVideo', [], false); // Don't require ready for manual control
        } else {
            sendCommand('playVideo', [], false); // Don't require ready for manual control
        }
        setMusicPlaying(!musicPlaying);
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
    
    // Sync Play/Pause state with iframe (backup for external changes or initial state)
    useEffect(() => {
        if (!showIntro && iframeReady) {
            if (musicPlaying) {
                sendCommand('playVideo', [], false); // Don't require ready for sync
            } else {
                sendCommand('pauseVideo', [], false); // Don't require ready for sync
            }
        }
    }, [musicPlaying, showIntro, iframeReady]);

    // Retry play after redirect (for in-app browsers like Facebook/Line)
    useEffect(() => {
        if (!showIntro && musicPlaying && iframeRef.current) {
            // Retry play after a delay (for in-app browsers that may have stopped playback)
            const retryPlay = () => {
                setTimeout(() => {
                    if (iframeRef.current) {
                        sendCommand('playVideo', [], false); // Don't require ready for retry
                    }
                }, 1000);
            };
            retryPlay();
        }
    }, [showIntro, musicPlaying]);

    // Auto-play music when restored from sessionStorage after refresh
    useEffect(() => {
        if (!showIntro && musicPlaying && iframeReady && iframeRef.current) {
            // Retry mechanism with multiple attempts to ensure playback starts
            let attempts = 0;
            const maxAttempts = 8; // More attempts for better reliability
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            
            const tryPlay = () => {
                attempts++;
                if (attempts <= maxAttempts && iframeRef.current && iframeReady) {
                    sendCommand('playVideo', [], true); // Require ready for auto-play
                    if (attempts < maxAttempts) {
                        // Retry with increasing delay
                        timeoutId = setTimeout(tryPlay, 300 + (attempts * 100));
                    }
                }
            };
            
            // Start trying after iframe is ready
            timeoutId = setTimeout(() => {
                tryPlay();
            }, 500);
            
            return () => {
                if (timeoutId) clearTimeout(timeoutId);
            };
        }
    }, [showIntro, musicPlaying, iframeReady]);

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

            

            {/* FIX: Full Frame Container for Mobile (w-full h-100dvh) and Boxed for Desktop */}

            <div className="relative w-full h-[100dvh] md:w-[900px] md:h-[600px] flex items-center justify-center perspective-container transition-all duration-300 ease-in-out">

                <div className={`flip-inner w-full h-full md:w-[900px] md:h-[600px] ${isFlipped ? 'is-flipped' : ''}`}>

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
