// ============================================================================
// LAYOUT CONSTANTS & HELPER FUNCTIONS
// Constants และ helper functions สำหรับจัดการ layout ของโต๊ะ
// ============================================================================

// Grid positioning for draggable tables - ตำแหน่ง X ที่ใช้สำหรับ snap (5 คอลัมน์)
export const GRID_X_POSITIONS = [1, 20, 40, 60, 80]; // 5 columns
// ระยะห่างขั้นต่ำสำหรับ Y-axis (เปอร์เซ็นต์)
export const GRID_Y_STEP = 15;
// ตำแหน่ง Y เริ่มต้น (เปอร์เซ็นต์)
export const GRID_Y_START = 1;

// Find nearest value in array (for X-axis snapping)
// หาค่าที่ใกล้ที่สุดใน array (ใช้สำหรับ snap ตำแหน่ง X)
export const findNearest = (value: number, array: number[]): number => {
  if (array.length === 0) return value;
  // หาค่าที่มีระยะห่างน้อยที่สุดจาก value
  return array.reduce((prev, curr) => 
    (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
  );
};

// Find nearest Y position with step snapping
// หาตำแหน่ง Y ที่ใกล้ที่สุดพร้อม snap ตาม step
export const findNearestYSnap = (y: number): number => {
  // Clamp to valid range (0-100) - จำกัดค่าให้อยู่ในช่วง 0-100
  const clampedY = Math.max(0, Math.min(100, y));
  if (clampedY < GRID_Y_START) return GRID_Y_START;
  // คำนวณตำแหน่งสัมพัทธ์จากจุดเริ่มต้น
  const relativeY = clampedY - GRID_Y_START;
  // หา multiple ที่ใกล้ที่สุดของ GRID_Y_STEP
  const closestMultiple = Math.round(relativeY / GRID_Y_STEP) * GRID_Y_STEP;
  const snapped = GRID_Y_START + closestMultiple;
  // Ensure snapped value is within bounds - ตรวจสอบว่า snapped value อยู่ในช่วงที่ถูกต้อง
  return Math.max(GRID_Y_START, Math.min(100, snapped));
};
