// ============================================================================
// WEDDING CARD CONFIGURATION
// ============================================================================

export type NameOrder = 'bride-first' | 'groom-first';

export interface WeddingCardConfig {
  // ชื่อบ่าวสาว
  groom: {
    firstName: string;
    lastName: string;
    nickname: string;
    fullNameThai: string;
  };
  bride: {
    firstName: string;
    lastName: string;
    nickname: string;
    fullNameThai: string;
  };
  
  // ชื่อบิดามารดา
  parents: {
    groom: {
      father: string;
      mother: string;
    };
    bride: {
      father: string;
      mother: string;
    };
  };
  
  // ลำดับการแสดงชื่อ (bride-first = เจ้าสาวก่อน, groom-first = เจ้าบ่าวก่อน)
  nameOrder: NameOrder;
  
  // แสดงชื่อบิดามารดาที่ด้านบนสุดหรือไม่
  showParentsAtTop: boolean;
  
  // Dress Code colors (แบบวงกลม)
  dressCode?: {
    colors: string[]; // Array of hex colors
    label?: string; // เช่น "Dress Code:"
  };
}

// ค่าปริยาย (Default Configuration)
export const defaultWeddingCardConfig: WeddingCardConfig = {
  groom: {
    firstName: 'Pattarapong',
    lastName: 'Pisapeng',
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
  // Dress Code colors (ตามตัวอย่าง: สีทอง, ส้ม, น้ำตาล, เขียว)
  dressCode: {
    colors: ['#d4af37', '#F5BC8D', '#8d6e63', '#D8E6C1'], // สีทอง, ส้ม, น้ำตาล, เขียว
    label: 'Dress Code:',
  },
};

// Helper function: จัดลำดับชื่อตามการตั้งค่า
export const getOrderedNames = (config: WeddingCardConfig) => {
  if (config.nameOrder === 'bride-first') {
    return {
      first: config.bride,
      second: config.groom,
    };
  } else {
    return {
      first: config.groom,
      second: config.bride,
    };
  }
};

