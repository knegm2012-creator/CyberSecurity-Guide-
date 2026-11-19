import { ADVENTURE_REALMS } from './adventure-quest.ts';
import { getFallbackQuizForStage, type QuizQuestionItem } from './local-mentor.ts';

export type BuddyCorner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
export type BuddyMovementMode = 'docked' | 'roam';

export interface BuddyPoint {
  x: number;
  y: number;
}

export const BUDDY_PILL_WIDTH = 196;
export const BUDDY_PILL_HEIGHT = 48;
export const BUDDY_EDGE_MARGIN = 18;
export const BUDDY_POSITION_STORAGE_KEY = 'cs_odyssey_buddy_pos_v1';

export function clampBuddyPosition(
  point: BuddyPoint,
  viewportWidth: number,
  viewportHeight: number
): BuddyPoint {
  const maxX = Math.max(BUDDY_EDGE_MARGIN, viewportWidth - BUDDY_PILL_WIDTH - BUDDY_EDGE_MARGIN);
  const maxY = Math.max(BUDDY_EDGE_MARGIN, viewportHeight - BUDDY_PILL_HEIGHT - BUDDY_EDGE_MARGIN);
  return {
    x: Math.round(Math.max(BUDDY_EDGE_MARGIN, Math.min(maxX, point.x))),
    y: Math.round(Math.max(72, Math.min(maxY, point.y))),
  };
}

export function getCornerPosition(
  corner: BuddyCorner,
  viewportWidth: number,
  viewportHeight: number
): BuddyPoint {
  const rightX = Math.max(BUDDY_EDGE_MARGIN, viewportWidth - BUDDY_PILL_WIDTH - BUDDY_EDGE_MARGIN);
  const bottomY = Math.max(76, viewportHeight - BUDDY_PILL_HEIGHT - 20);
  const topY = 78;

  switch (corner) {
    case 'bottom-right':
      return clampBuddyPosition({ x: rightX, y: bottomY }, viewportWidth, viewportHeight);
    case 'top-right':
      return clampBuddyPosition({ x: rightX, y: topY }, viewportWidth, viewportHeight);
    case 'top-left':
      return clampBuddyPosition({ x: BUDDY_EDGE_MARGIN, y: topY }, viewportWidth, viewportHeight);
    case 'bottom-left':
    default:
      return clampBuddyPosition({ x: BUDDY_EDGE_MARGIN, y: bottomY }, viewportWidth, viewportHeight);
  }
}

export function getNextRoamWaypoint(
  stepIndex: number,
  viewportWidth: number,
  viewportHeight: number
): BuddyPoint {
  const rightX = Math.max(BUDDY_EDGE_MARGIN, viewportWidth - BUDDY_PILL_WIDTH - BUDDY_EDGE_MARGIN);
  const midX = Math.round((BUDDY_EDGE_MARGIN + rightX) / 2);
  const bottomY = Math.max(88, viewportHeight - BUDDY_PILL_HEIGHT - 24);
  const lowerMidY = Math.max(88, Math.round(viewportHeight * 0.72));

  const waypoints: BuddyPoint[] = [
    { x: BUDDY_EDGE_MARGIN, y: bottomY },
    { x: Math.round(rightX * 0.35), y: bottomY },
    { x: rightX, y: bottomY },
    { x: rightX, y: lowerMidY },
    { x: midX, y: bottomY },
    { x: BUDDY_EDGE_MARGIN, y: lowerMidY },
  ];

  const chosen = waypoints[Math.abs(stepIndex) % waypoints.length];
  return clampBuddyPosition(chosen, viewportWidth, viewportHeight);
}

export function buildBuddyTrainingDeck(stageId: string): QuizQuestionItem[] {
  const realm = ADVENTURE_REALMS.find((r) => r.stageId === stageId);
  const stageQuiz = getFallbackQuizForStage(stageId);
  const items: QuizQuestionItem[] = [];
  if (realm?.bossIntroQuestion) {
    items.push(realm.bossIntroQuestion);
  }
  for (const q of stageQuiz) {
    items.push(q);
  }
  return items;
}
