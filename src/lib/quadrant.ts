// src/lib/quadrant.ts

/**
 * Calculates which quadrant a point (x, y) falls into.
 * Quadrants are numbered 1-4, starting from top-right and going counter-clockwise.
 * 1: Top-Right (+x, +y)
 * 2: Top-Left (-x, +y)
 * 3: Bottom-Left (-x, -y)
 * 4: Bottom-Right (+x, -y)
 * Assumes (0,0) is the center. Returns 0 if on an axis.
 */
export function calculateQuadrant(x: number, y: number): 1 | 2 | 3 | 4 | 0 {
  if (x > 0 && y > 0) return 1;
  if (x < 0 && y > 0) return 2;
  if (x < 0 && y < 0) return 3;
  if (x > 0 && y < 0) return 4;
  return 0; // On an axis
}

/**
 * Converts a vote from the chart's coordinate system (-1 to 1) 
 * to slider values (0 to 100).
 * (0,0) on the chart maps to (50, 50) on the sliders.
 */
export function voteToSliders(x: number, y: number): { ticket: number; share: number } {
  const ticket = (y || 0) * 50 + 50;
  const share = (x || 0) * 50 + 50;
  return { ticket, share };
}

/**
 * Converts slider values (0 to 100) back to the chart's 
 * coordinate system (-1 to 1).
 */
export function slidersToVote(ticket: number, share: number): { x: number; y: number } {
  const y = (ticket - 50) / 50;
  const x = (share - 50) / 50;
  return { x, y };
}