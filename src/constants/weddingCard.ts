// ============================================================================
// WEDDING CARD CONFIGURATION
// การตั้งค่าสำหรับการ์ดเชิญแต่งงาน
// ============================================================================

// Type สำหรับลำดับการแสดงชื่อ
export type NameOrder = 'bride-first' | 'groom-first';

// Interface สำหรับการตั้งค่าการ์ดเชิญแต่งงาน
export interface WeddingCardConfig {
  // ชื่อบ่าวสาว
  groom: {
    firstName: string; // ชื่อจริง (ภาษาอังกฤษ)
    lastName: string; // นามสกุล (ภาษาอังกฤษ)
    nickname: string; // ชื่อเล่น
    fullNameThai: string; // ชื่อเต็มภาษาไทย
  };
  bride: {
    firstName: string; // ชื่อจริง (ภาษาอังกฤษ)
    lastName: string; // นามสกุล (ภาษาอังกฤษ)
    nickname: string; // ชื่อเล่น
    fullNameThai: string; // ชื่อเต็มภาษาไทย
  };
  
  // ชื่อบิดามารดา
  parents: {
    groom: {
      father: string; // ชื่อบิดาเจ้าบ่าว
      mother: string; // ชื่อมารดาเจ้าบ่าว
    };
    bride: {
      father: string; // ชื่อบิดาเจ้าสาว
      mother: string; // ชื่อมารดาเจ้าสาว
    };
  };
  
  // ลำดับการแสดงชื่อ (bride-first = เจ้าสาวก่อน, groom-first = เจ้าบ่าวก่อน)
  nameOrder: NameOrder;
  
  // แสดงชื่อบิดามารดาที่ด้านบนสุดหรือไม่
  showParentsAtTop: boolean;
  
  // Dress Code colors (แบบวงกลม)
  dressCode?: {
    colors: string[]; // Array of hex colors - รายการสี (hex codes)
    label?: string; // เช่น "Dress Code:" - ข้อความ label
  };
}

// ค่าปริยาย (Default Configuration) - ค่าเริ่มต้นสำหรับการ์ดเชิญ
export const defaultWeddingCardConfig: WeddingCardConfig = {
  groom: {
    firstName: 'Pattarapong',
    lastName: 'Phitpheng',
    nickname: 'Got',
    fullNameThai: 'นายภัทรพงษ์ พิศเพ็ง',
  },
  bride: {
    firstName: 'Supannee',
    lastName: 'Tonsungnoen',
    nickname: 'Nan',
    fullNameThai: 'นางสาวสุพรรณี ทอนสูงเนิน',
  },
  parents: {
    groom: {
      father: 'นาย บัณฑิต พิศเพ็ง',
      mother: 'นาง อุบลวรรณ พิศเพ็ง',
    },
    bride: {
      father: 'ร.ต.ท. อุดม ทอนสูงเนิน',
      mother: 'นาง ชื่นชม ทอนสูงเนิน',
    },
  },
  // ตามธรรมเนียมไทย: แสดงชื่อเจ้าสาวก่อนเพื่อให้เกียรติฝ่ายหญิง
  nameOrder: 'bride-first',
  // แสดงชื่อบิดามารดาที่ด้านบนสุด
  showParentsAtTop: true,
  // Dress Code colors (สีเหลือง สีชมพู สีฟ้า สีเขียว พาสเทล)
  dressCode: {
    colors: ['#FFE082', '#F8BBD0', '#B3E5FC', '#C8E6C9'], // สีเหลืองพาสเทล, สีชมพูพาสเทล, สีฟ้าพาสเทล, สีเขียวพาสเทล
    label: 'Dress Code:',
  },
};

// Helper function: จัดลำดับชื่อตามการตั้งค่า
// คืนค่า object ที่มี first และ second ตามลำดับที่กำหนด
export const getOrderedNames = (config: WeddingCardConfig) => {
  if (config.nameOrder === 'bride-first') {
    // ถ้าเป็น bride-first → เจ้าสาวก่อน, เจ้าบ่าวหลัง
    return {
      first: config.bride,
      second: config.groom,
    };
  } else {
    // ถ้าเป็น groom-first → เจ้าบ่าวก่อน, เจ้าสาวหลัง
    return {
      first: config.groom,
      second: config.bride,
    };
  }
};

