// ============================================================================
// LAYOUT CONSTANTS & HELPER FUNCTIONS
// ============================================================================

// Grid positioning for draggable tables
export const GRID_X_POSITIONS = [1, 20, 40, 60, 80]; // 5 columns
export const GRID_Y_STEP = 15;
export const GRID_Y_START = 1;

// Find nearest value in array (for X-axis snapping)
export const findNearest = (value: number, array: number[]): number => {
  return array.reduce((prev, curr) => 
    (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
  );
};

// Find nearest Y position with step snapping
export const findNearestYSnap = (y: number): number => {
  if (y < GRID_Y_START) return GRID_Y_START;
  const relativeY = y - GRID_Y_START;
  const closestMultiple = Math.round(relativeY / GRID_Y_STEP) * GRID_Y_STEP;
  return GRID_Y_START + closestMultiple;
};
