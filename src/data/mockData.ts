// ============================================================================
// MOCK DATA
// ============================================================================

import { Guest, Zone, TableData } from '@/types';
import { GRID_X_POSITIONS, GRID_Y_START, GRID_Y_STEP } from '@/constants/layout';

export const initialZones: Zone[] = [
  { 
    id: 'Z1', 
    zoneId: 'Z1', 
    zoneName: 'VIP หน้าเวที', 
    description: 'สำหรับครอบครัวและแขกผู้ใหญ่สำคัญ', 
    capacity: 20, 
    color: '#f56a00', 
    order: 1 
  },
  { 
    id: 'Z2', 
    zoneId: 'Z2', 
    zoneName: 'ญาติผู้ใหญ่ (เจ้าบ่าว)', 
    description: 'ญาติทางฝั่งเจ้าบ่าว', 
    capacity: 50, 
    color: '#1890ff', 
    order: 2 
  },
  { 
    id: 'Z3', 
    zoneId: 'Z3', 
    zoneName: 'เพื่อนมหาลัย', 
    description: 'เพื่อนสมัยเรียน (เช่น กลุ่มวิศวะ, กลุ่มบัญชี)', 
    capacity: 100, 
    color: '#722ed1', 
    order: 3 
  },
  { 
    id: 'Z4', 
    zoneId: 'Z4', 
    zoneName: 'เพื่อนที่ทำงาน', 
    description: 'เพื่อนร่วมงานปัจจุบันและอดีต', 
    capacity: 80, 
    color: '#faad14', 
    order: 4 
  },
];

export const initialTables: TableData[] = [
  { 
    id: 'T01', 
    tableId: 'T01', 
    zoneId: 'Z1', 
    tableName: 'โต๊ะครอบครัว (บ่าว)', 
    capacity: 8, 
    note: 'โต๊ะติดเวที', 
    order: 1, 
    x: GRID_X_POSITIONS[1], 
    y: GRID_Y_START + (GRID_Y_STEP * 0) 
  },
  { 
    id: 'T02', 
    tableId: 'T02', 
    zoneId: 'Z1', 
    tableName: 'โต๊ะครอบครัว (สาว)', 
    capacity: 8, 
    note: 'โต๊ะติดทางเข้า', 
    order: 2, 
    x: GRID_X_POSITIONS[3], 
    y: GRID_Y_START + (GRID_Y_STEP * 0) 
  },
  { 
    id: 'T03', 
    tableId: 'T03', 
    zoneId: 'Z2', 
    tableName: 'ญาติบ่าว 1', 
    capacity: 10, 
    note: '', 
    order: 1, 
    x: GRID_X_POSITIONS[1], 
    y: GRID_Y_START + (GRID_Y_STEP * 1) 
  },
  { 
    id: 'T04', 
    tableId: 'T04', 
    zoneId: 'Z2', 
    tableName: 'ญาติบ่าว 2', 
    capacity: 10, 
    note: '', 
    order: 2, 
    x: GRID_X_POSITIONS[3], 
    y: GRID_Y_START + (GRID_Y_STEP * 1) 
  },
  { 
    id: 'T05', 
    tableId: 'T05', 
    zoneId: 'Z3', 
    tableName: 'มหาลัย 1', 
    capacity: 8, 
    note: 'แก๊งค์สนิท', 
    order: 1, 
    x: GRID_X_POSITIONS[0], 
    y: GRID_Y_START + (GRID_Y_STEP * 3) 
  },
  { 
    id: 'T06', 
    tableId: 'T06', 
    zoneId: 'Z3', 
    tableName: 'เพื่อนมัธยม', 
    capacity: 8, 
    note: '', 
    order: 2, 
    x: GRID_X_POSITIONS[2], 
    y: GRID_Y_START + (GRID_Y_STEP * 3) 
  },
  { 
    id: 'T07', 
    tableId: 'T07', 
    zoneId: 'Z4', 
    tableName: 'ออฟฟิศ 1', 
    capacity: 8, 
    note: 'ผู้บริหาร', 
    order: 1, 
    x: GRID_X_POSITIONS[4], 
    y: GRID_Y_START + (GRID_Y_STEP * 2) 
  },
];

export const initialGuests: Guest[] = [
  { 
    id: 'G001', 
    firstName: 'สมศักดิ์', 
    lastName: 'มีชัย', 
    nickname: 'ศักดิ์', 
    age: 60, 
    gender: 'male', 
    relationToCouple: 'พ่อเจ้าบ่าว', 
    side: 'groom', 
    zoneId: 'Z1', 
    tableId: 'T01', 
    note: 'ผู้ใหญ่, ต้องนั่งใกล้ทางเดิน', 
    groupId: 'GRP_FAMILY_GROOM',
    groupName: 'ครอบครัวเจ้าบ่าว',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-05' 
  },
  { 
    id: 'G002', 
    firstName: 'สมหญิง', 
    lastName: 'ใจดี', 
    nickname: 'หญิง', 
    age: 58, 
    gender: 'female', 
    relationToCouple: 'แม่เจ้าบ่าว', 
    side: 'groom', 
    zoneId: 'Z1', 
    tableId: 'T01', 
    note: '', 
    groupId: 'GRP_FAMILY_GROOM',
    groupName: 'ครอบครัวเจ้าบ่าว',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-05' 
  },
  { 
    id: 'G003', 
    firstName: 'อาทิตย์', 
    lastName: 'รุ่งเรือง', 
    nickname: 'อาท', 
    age: 29, 
    gender: 'male', 
    relationToCouple: 'เพื่อนสนิทเจ้าสาว', 
    side: 'bride', 
    zoneId: 'Z3', 
    tableId: 'T05', 
    note: 'ชอบเบียร์', 
    groupId: 'GRP_FRIENDS_U',
    groupName: 'เพื่อนมหาลัย',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-01-10', 
    updatedAt: '2024-01-15' 
  },
  { 
    id: 'G004', 
    firstName: 'ดารณี', 
    lastName: 'แสงทอง', 
    nickname: 'ดาร์ลิ่ง', 
    age: 31, 
    gender: 'female', 
    relationToCouple: 'แฟนเพื่อนเจ้าบ่าว', 
    side: 'both', 
    zoneId: null, 
    tableId: null, 
    note: 'แพ้อาหารทะเล', 
    groupId: 'GRP_FRIENDS_U',
    groupName: 'เพื่อนมหาลัย',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-01-15', 
    updatedAt: '2024-01-15' 
  },
  { 
    id: 'G005', 
    firstName: 'ชัยชนะ', 
    lastName: 'เก่งมาก', 
    nickname: 'ชัย', 
    age: 45, 
    gender: 'male', 
    relationToCouple: 'หัวหน้างานเจ้าบ่าว', 
    side: 'groom', 
    zoneId: 'Z4', 
    tableId: 'T07', 
    note: '', 
    groupId: 'GRP_OFFICE_A',
    groupName: 'บริษัท A',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-01-20', 
    updatedAt: '2024-01-20' 
  },
  { 
    id: 'G006', 
    firstName: 'มาริสา', 
    lastName: 'สุขสบาย', 
    nickname: 'ริสา', 
    age: 28, 
    gender: 'female', 
    relationToCouple: 'น้องสาวเจ้าสาว', 
    side: 'bride', 
    zoneId: 'Z1', 
    tableId: 'T02', 
    note: 'นั่งโต๊ะเดียวกับเพื่อนสนิท', 
    groupId: 'GRP_FAMILY_BRIDE',
    groupName: 'ครอบครัวเจ้าสาว',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-02-01', 
    updatedAt: '2024-02-05' 
  },
  { 
    id: 'G007', 
    firstName: 'ธีรเดช', 
    lastName: 'รักไทย', 
    nickname: 'เดช', 
    age: 28, 
    gender: 'male', 
    relationToCouple: 'เพื่อนสมัยมัธยม', 
    side: 'groom', 
    zoneId: null, 
    tableId: null, 
    note: '', 
    groupId: 'GRP_SCHOOL',
    groupName: 'เพื่อนมัธยม',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-02-05', 
    updatedAt: '2024-02-05' 
  },
  { 
    id: 'G008', 
    firstName: 'อนงค์', 
    lastName: 'พยุง', 
    nickname: 'นงค์', 
    age: 28, 
    gender: 'female', 
    relationToCouple: 'เพื่อนที่ทำงาน', 
    side: 'bride', 
    zoneId: 'Z4', 
    tableId: 'T07', 
    note: '', 
    groupId: 'GRP_OFFICE_A',
    groupName: 'บริษัท A',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-02-05', 
    updatedAt: '2024-02-05' 
  },
  { 
    id: 'G009', 
    firstName: 'มานะ', 
    lastName: 'สู้ตาย', 
    nickname: 'นะ', 
    age: 28, 
    gender: 'male', 
    relationToCouple: 'เพื่อนที่ทำงาน', 
    side: 'groom', 
    zoneId: 'Z4', 
    tableId: 'T07', 
    note: '', 
    groupId: 'GRP_OFFICE_A',
    groupName: 'บริษัท A',
    checkedInAt: null,
    checkInMethod: null,
    createdAt: '2024-02-05', 
    updatedAt: '2024-02-05' 
  },
];

// Mock options
export const MOCK_SIDE_OPTIONS = [
  { value: 'groom', label: 'ฝ่ายเจ้าบ่าว' },
  { value: 'bride', label: 'ฝ่ายเจ้าสาว' },
  { value: 'both', label: 'แขกทั้งสองฝ่าย' },
];

export const MOCK_GENDER_OPTIONS = [
  { value: 'male', label: 'ชาย' },
  { value: 'female', label: 'หญิง' },
  { value: 'other', label: 'อื่น ๆ' },
];

export const ZONE_NAME_OPTIONS = [
  { value: 'โซน VIP' },
  { value: 'โซนญาติผู้ใหญ่' },
  { value: 'โซนเพื่อนเจ้าบ่าว' },
  { value: 'โซนเพื่อนเจ้าสาว' },
  { value: 'โซนเพื่อนที่ทำงาน' },
  { value: 'โซนเด็ก' },
];

export const TABLE_NAME_OPTIONS = [
  { value: 'VIP 1' },
  { value: 'VIP 2' },
  { value: 'A1' },
  { value: 'A2' },
  { value: 'โต๊ะจีน 1' },
  { value: 'โต๊ะจีน 2' },
];

