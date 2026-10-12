import { HOME_FIXTURES, HOME_WAYPOINT_INDEX } from './study-home-layout.ts';

/** 猫窝位于客厅左前侧安静角落，入口避开茶几和游戏桌。 */
export const STUDY_CAT_HOME = {
  position: HOME_FIXTURES.catBed,
  gatewayIndex: HOME_WAYPOINT_INDEX.catGateway,
  surfaceHeight: 0.12,
  sleepingYaw: 0.65,
} as const;
