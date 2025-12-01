/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate required string field
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate RSVP data
 */
export function validateRSVP(data: {
  firstName?: string;
  lastName?: string;
  isComing?: string;
  side?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRequired(data.firstName)) {
    errors.push('กรุณากรอกชื่อ');
  }

  // Validation lastName: ถ้า isComing='no' ไม่ต้องบังคับ lastName
  // ถ้า isComing='yes' ก็ไม่ต้องบังคับนามสกุลแล้ว (ตาม requirement ใหม่)
  // if (data.isComing === 'yes' && !isRequired(data.lastName)) {
  //   errors.push('กรุณากรอกนามสกุล');
  // }
  // สำหรับ isComing='no' หรือ undefined ไม่ต้องตรวจสอบ lastName

  if (data.isComing !== 'yes' && data.isComing !== 'no') {
    errors.push('กรุณาเลือกสถานะการร่วมงาน');
  }

  if (data.isComing === 'yes' && !data.side) {
    errors.push('กรุณาเลือกฝ่าย (เจ้าบ่าว/เจ้าสาว)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

