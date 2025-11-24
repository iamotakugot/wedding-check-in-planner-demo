// ============================================================================
// LAYOUT CONSTANTS & HELPER FUNCTIONS
// ============================================================================

// Grid positioning for draggable tables
export const GRID_X_POSITIONS = [1, 20, 40, 60, 80]; // 5 columns
export const GRID_Y_STEP = 15;
export const GRID_Y_START = 1;

// Find nearest value in array (for X-axis snapping)
export const findNearest = (value: number, array: number[]): number => {
  if (array.length === 0) return value;
  return array.reduce((prev, curr) => 
    (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
  );
};

// Find nearest Y position with step snapping
export const findNearestYSnap = (y: number): number => {
  // Clamp to valid range (0-100)
  const clampedY = Math.max(0, Math.min(100, y));
  if (clampedY < GRID_Y_START) return GRID_Y_START;
  const relativeY = clampedY - GRID_Y_START;
  const closestMultiple = Math.round(relativeY / GRID_Y_STEP) * GRID_Y_STEP;
  const snapped = GRID_Y_START + closestMultiple;
  // Ensure snapped value is within bounds
  return Math.max(GRID_Y_START, Math.min(100, snapped));
};
