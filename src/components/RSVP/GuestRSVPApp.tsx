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
} from '@ant-design/icons';
import { 
  createRSVP, 
  onAuthStateChange,
  signInWithGoogle,
  signInWithFacebook,
  checkRedirectResult // Import new function
} from '@/services/firebaseService';
import type { RSVPData as FirebaseRSVPData } from '@/services/firebaseService';

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



const relationOptions = [

    { value: 'ญาติ' }, 

    { value: 'เพื่อนสมัยเรียน' }, 

    { value: 'เพื่อนร่วมงาน (สายโรงงาน/ก่อสร้าง)' },

    { value: 'เพื่อนร่วมงาน (พยาบาล/สาธารณสุข)' },

    { value: 'คู่ค้า/พาร์ทเนอร์ทางธุรกิจ' },

    { value: 'คนรู้จักทั่วไป' }

];



const guestRelationOptions = [

    { value: 'แฟน/คู่รัก', label: 'แฟน/คู่รัก' },

    { value: 'พ่อ/แม่', label: 'พ่อ/แม่' },

    { value: 'พี่/น้อง', label: 'พี่/น้อง' },

    { value: 'ลูก/หลาน', label: 'ลูก/หลาน' },

    { value: 'เพื่อน', label: 'เพื่อน' },

    { value: 'ผู้ติดตามอื่นๆ', label: 'อื่น ๆ' }

];



// Music Playlist Configuration

const PLAYLIST = [

    { 

        id: '7fKN5KWuAAQ', // Main requested song: Until I Found You

        title: 'Until I Found You', 

        artist: 'Stephen Sanchez',

        cover: 'https://img.youtube.com/vi/7fKN5KWuAAQ/0.jpg'

    },

    { 

        id: '6R2S6V731aM', 

        title: "Can't Help Falling in Love", 

        artist: 'Kina Grannis',

        cover: 'https://img.youtube.com/vi/6R2S6V731aM/0.jpg'

    },

    { 

        id: '2Vv-BfVoq4g', 

        title: 'Perfect', 

        artist: 'Ed Sheeran',

        cover: 'https://img.youtube.com/vi/2Vv-BfVoq4g/0.jpg'

    }

];



// Types

interface RSVPData {

    uid?: string;

    phoneNumber?: string;

    firstName: string; lastName: string; nickname: string;

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

                          <Button type="text" shape="circle" size="small" icon={<StepBackwardOutlined />} onClick={(e) => {e.stopPropagation(); onPrev();}} className="text-[#5c3a58] hover:bg-[#5c3a58]/10" />

                          <Button 

                             type="primary" 

                             shape="circle" 

                             size="small"

                             icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 

                             onClick={(e) => {e.stopPropagation(); onToggleMusic();}}

                             className="bg-[#5c3a58] shadow-md"

                          />

                          <Button type="text" shape="circle" size="small" icon={<StepForwardOutlined />} onClick={(e) => {e.stopPropagation(); onNext();}} className="text-[#5c3a58] hover:bg-[#5c3a58]/10" />

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

    // Check persistent login on mount
    useEffect(() => {
        // Check if returning from redirect login
        checkRedirectResult()
            .then((user) => {
                if (user) {
                    setIsLoggedIn(true);
                    setCurrentUser(user.uid);
                    message.success('เข้าสู่ระบบสำเร็จ');
                }
            })
            .catch((error) => {
                 // Handle specific error cases if needed
                 if (error.code !== 'auth/popup-closed-by-user') {
                    console.error("Redirect result error:", error);
                 }
            });

        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
            } else {
                setIsLoggedIn(false);
                setCurrentUser(null);
            }
        });

        return () => unsubscribe();
    }, []);



    const handleLogin = async (provider: string) => {
        // Prevent multiple clicks
        if (loading) return;

        if (provider === 'google') {
            try {
                setLoading(true);
                const user = await signInWithGoogle();
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
                message.success('เข้าสู่ระบบด้วย Google สำเร็จ');
            } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error('Error signing in with Google:', error);
                if (error.code === 'auth/popup-closed-by-user') {
                    message.warning('ยกเลิกการเข้าสู่ระบบ');
                } else {
                    message.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
                }
            } finally {
                setLoading(false);
            }
        } else if (provider === 'facebook') {
            try {
                setLoading(true);
                const user = await signInWithFacebook();
                setIsLoggedIn(true);
                setCurrentUser(user.uid);
                message.success('เข้าสู่ระบบด้วย Facebook สำเร็จ');
            } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error('Error signing in with Facebook:', error);
                if (error.code === 'auth/popup-closed-by-user') {
                    message.warning('ยกเลิกการเข้าสู่ระบบ');
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    message.error('อีเมลนี้ถูกใช้งานด้วยวิธีอื่นแล้ว');
                } else {
                    message.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Facebook');
                }
            } finally {
                setLoading(false);
            }
        }
    };




    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFinish = async (values: any) => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sanitizedGuests = (values.accompanyingGuests || []).map((g: any) => ({
                relationToMain: g?.relationToMain || '',
                name: g?.name || ''
            }));

            const rsvpData: Omit<FirebaseRSVPData, 'id' | 'createdAt' | 'updatedAt'> = {
                uid: currentUser || 'anonymous',
                phoneNumber: undefined,
                isComing: values.isComing,
                firstName: values.firstName || '',
                lastName: values.lastName || '',
                nickname: values.nickname || '',
                side: values.side || 'groom',
                relation: values.relation || '',
                note: values.note || '',
                accompanyingGuests: values.isComing === 'yes' ? sanitizedGuests : [],
                accompanyingGuestsCount: values.isComing === 'yes' ? sanitizedGuests.length : 0,
                guestId: null, // TODO: Map with existing guest by phone
            };

            // Create new RSVP
            const newId = await createRSVP(rsvpData);
            setSubmittedData({ ...rsvpData, id: newId } as FirebaseRSVPData);

            setIsEditing(false);
            setLoading(false);
            message.success('บันทึกข้อมูลเรียบร้อย');
        } catch (error) {
            console.error('Error saving RSVP:', error);
            setLoading(false);
            message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };



    const totalAttendees = isComing === 'yes' ? 1 + (accompanyingGuests?.length || 0) : 0;



    const renderContent = () => {

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

                         <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-white shadow-sm border-4 ${submittedData.isComing === 'yes' ? 'border-green-100' : 'border-gray-100'}`}>

                            {submittedData.isComing === 'yes' ? <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a' }} /> : <CloseCircleFilled style={{ fontSize: 48, color: '#8c8c8c' }} />}

                        </div>

                    </div>

                    <Title level={4} style={{margin: '0 0 4px', fontFamily: 'Cinzel', color: '#5c3a58'}}>{submittedData.isComing === 'yes' ? 'ขอบคุณที่มาร่วมงาน' : 'รับทราบการแจ้ง'}</Title>

                    <div className="bg-white/50 p-6 rounded-xl border border-[#e6e2dd] text-center mb-6 shadow-sm">

                         {submittedData.isComing === 'yes' ? (

                             <>

                                <Text className="block text-gray-800 text-lg mb-1">

                                    {submittedData.firstName && submittedData.firstName !== 'ไม่ระบุชื่อ' ? `คุณ ${submittedData.firstName}` : 'ผู้ลงทะเบียน'}

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

                                                        options={relationOptions} 

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

                                                                             <Select placeholder="เลือกความสัมพันธ์ *" className="clean-input w-full" options={guestRelationOptions} />

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

                                                <div className="grid grid-cols-2 gap-3 opacity-70 hover:opacity-100 transition-opacity">

                                                    <Form.Item name="firstName" className="mb-0">

                                                        <Input placeholder="ชื่อผู้แจ้ง (ถ้าต้องการระบุ)" className="clean-input text-sm" />

                                                    </Form.Item>

                                                    <Form.Item name="lastName" className="mb-0">

                                                        <Input placeholder="นามสกุล" className="clean-input text-sm" />

                                                    </Form.Item>

                                                </div>

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

                                return (

                                    <Button type="primary" htmlType="submit" block loading={loading} size="large" className="bg-[#5c3a58] hover:bg-[#4a2e46] border-none h-12 text-lg shadow-md rounded-lg font-medium" disabled={!status}>{text}</Button>

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

    const [isFlipped, setIsFlipped] = useState(false);

    const [musicPlaying, setMusicPlaying] = useState(false);

    const [showIntro, setShowIntro] = useState(true); // Start with intro

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const currentTrack = PLAYLIST[currentTrackIndex];

    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    
    // Helper to send commands to YouTube iframe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendCommand = (func: string, args: any[] = []) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func, args }), 
                '*'
            );
        }
    };

    const handleStart = () => {
        setShowIntro(false);
        setMusicPlaying(true);
        // Attempt to play immediately
        setTimeout(() => sendCommand('playVideo'), 100);
    };

    const onToggleMusic = () => {
        if (musicPlaying) {
            sendCommand('pauseVideo');
        } else {
            sendCommand('playVideo');
        }
        setMusicPlaying(!musicPlaying);
    };

    const handleNext = () => {
        const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
        setCurrentTrackIndex(nextIndex);
        sendCommand('loadVideoById', [PLAYLIST[nextIndex].id]);
        // Keep playing state true if we change track
        if (!musicPlaying) setMusicPlaying(true);
    };

    const handlePrev = () => {
        const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
        setCurrentTrackIndex(prevIndex);
        sendCommand('loadVideoById', [PLAYLIST[prevIndex].id]);
        if (!musicPlaying) setMusicPlaying(true);
    };
    
    // Sync Play/Pause state with iframe (backup for external changes or initial state)
    useEffect(() => {
        if (!showIntro) {
            if (musicPlaying) {
                sendCommand('playVideo');
            } else {
                sendCommand('pauseVideo');
            }
        }
    }, [musicPlaying, showIntro]);

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
                   src={`https://www.youtube.com/embed/${PLAYLIST[0].id}?enablejsapi=1&controls=0&playsinline=1&origin=${window.location.origin}`}
                   title="Wedding Music"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
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
