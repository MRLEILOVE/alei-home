/** 家具、活动站位和行走图共用同一套米制坐标；前方为 +Z。 */
export const HOME_FIXTURES = {
  floor: { width: 13.6, depth: 9.4 },
  bedroom: { minX: -6.8, maxX: -0.8, minZ: -4.7, maxZ: -0.5 },
  living: { minX: -6.8, maxX: 2.7, minZ: -0.5, maxZ: 4.7 },
  kitchen: { minX: 2.7, maxX: 6.8, minZ: -0.5, maxZ: 4.7 },
  bathroom: { minX: 2.7, maxX: 6.8, minZ: -4.7, maxZ: -0.5 },
  bed: { x: -5.25, z: -2.8, width: 1.9, depth: 2.6, mattressTop: 0.64 },
  wardrobe: { x: -2.15, z: -4.22, width: 2.05, depth: 0.72 },
  desk: { x: -1.55, z: 0.04, width: 2.1, depth: 0.8 },
  sofa: { x: -4.85, z: 0.3, width: 2.55, depth: 1.05 },
  coffeeTable: { x: -4.85, z: 2.05, width: 1.5, depth: 0.75 },
  kitchenCounter: { x: 6.15, z: 1.85, width: 1.1, depth: 3.4, top: 0.92 },
  stove: { x: 6.15, z: 2.6 },
  kitchenSink: { x: 6.15, z: 0.9 },
  fridge: { x: 3.45, z: 0.16, width: 0.85, depth: 0.85 },
  diningTable: { x: 4.4, z: 4.03, width: 1.5, depth: 0.85 },
  diningChair: { x: 3.12, z: 4.03 },
  bathroomSink: { x: 4.08, z: -4.12, width: 1.35, depth: 0.75, top: 0.88 },
  toilet: { x: 6.04, z: -3.63 },
  shower: { x: 5.96, z: -1.57, width: 1.15, depth: 1.3, floorElevation: 0.127 },
  washingMachine: { x: 3.34, z: -1.48, width: 0.83, depth: 0.83 },
  catBed: { x: -6.0, z: 3.78 },
} as const;

export type HomeActivity =
  | 'idle'
  | 'brush'
  | 'wash-face'
  | 'cook'
  | 'eat'
  | 'wash-dishes'
  | 'clean'
  | 'laundry'
  | 'read'
  | 'shower'
  | 'toilet'
  | 'sleep';

export const HOME_ACTIVITY_SPOTS = {
  idle: { x: -2.95, z: 2.85, yaw: 0.3 },
  brush: { x: 4.08, z: -3.1, yaw: Math.PI },
  'wash-face': { x: 4.08, z: -3.1, yaw: Math.PI },
  cook: { x: 5.14, z: 2.6, yaw: Math.PI / 2 },
  eat: { x: 3.12, z: 4.03, yaw: Math.PI / 2 },
  'wash-dishes': { x: 5.14, z: 0.9, yaw: Math.PI / 2 },
  clean: { x: 5.14, z: 1.75, yaw: Math.PI / 2 },
  laundry: { x: 4.46, z: -1.48, yaw: -Math.PI / 2 },
  read: { x: -1.55, z: 1.18, yaw: Math.PI },
  shower: { x: 5.96, z: -1.57, yaw: Math.PI },
  toilet: { x: 6.04, z: -3.3, yaw: 0 },
  sleep: { x: -5.25, z: -1.82, yaw: 0 },
} as const;

/** 睡姿脚端、床边站位和导航图分开，进出床铺由日程控制器平滑衔接。 */
export const HOME_BED_ENTRY = { x: -3.75, z: -1.82 } as const;
export const HOME_TOILET_ENTRY = { x: 6.04, z: -2.8 } as const;

export const HOME_WAYPOINT_INDEX = {
  living: 0,
  hall: 1,
  idle: 2,
  read: 3,
  catGateway: 6,
  bedroomDoor: 9,
  sleep: 11,
  brush: 16,
  'wash-face': 16,
  toilet: 18,
  shower: 20,
  laundry: 21,
  cook: 24,
  clean: 25,
  'wash-dishes': 26,
  eat: 28,
} as const;

// 门洞两侧各设路点；跨房间只能从门洞穿过，绝不从矮墙上跨过去。
export const HOME_WALKING_LAYOUT = {
  radius: 0.3,
  bounds: { minX: -6.5, maxX: 6.5, minZ: -4.4, maxZ: 4.4 },
  footprints: [
    { name: 'bed', minX: -6.2, maxX: -4.3, minZ: -4.1, maxZ: -1.5 },
    { name: 'wardrobe', minX: -3.175, maxX: -1.125, minZ: -4.58, maxZ: -3.86 },
    { name: 'bedside-table', minX: -3.98, maxX: -3.42, minZ: -3.83, maxZ: -3.27 },
    { name: 'bedroom-front-wall', minX: -6.8, maxX: -0.8, minZ: -0.58, maxZ: -0.42 },
    { name: 'bedroom-side-wall-north', minX: -0.88, maxX: -0.72, minZ: -4.7, maxZ: -2.65 },
    { name: 'bedroom-side-wall-south', minX: -0.88, maxX: -0.72, minZ: -1.25, maxZ: -0.5 },
    { name: 'bathroom-side-wall-north', minX: 2.62, maxX: 2.78, minZ: -4.7, maxZ: -3 },
    { name: 'bathroom-side-wall-south', minX: 2.62, maxX: 2.78, minZ: -1.65, maxZ: -0.5 },
    { name: 'bathroom-kitchen-wall', minX: 2.7, maxX: 6.8, minZ: -0.58, maxZ: -0.42 },
    { name: 'kitchen-side-wall-north', minX: 2.62, maxX: 2.78, minZ: -0.5, maxZ: 1.3 },
    { name: 'kitchen-side-wall-south', minX: 2.62, maxX: 2.78, minZ: 3.35, maxZ: 4.7 },
    { name: 'desk', minX: -2.6, maxX: -0.5, minZ: -0.36, maxZ: 0.44 },
    { name: 'sofa', minX: -6.125, maxX: -3.575, minZ: -0.225, maxZ: 0.825 },
    { name: 'coffee-table', minX: -5.6, maxX: -4.1, minZ: 1.675, maxZ: 2.425 },
    { name: 'living-bookcase', minX: -6.425, maxX: -5.875, minZ: 0.65, maxZ: 1.95 },
    { name: 'record-cabinet', minX: -1.275, maxX: 0.075, minZ: 3.44, maxZ: 4.06 },
    { name: 'game-table', minX: -4.525, maxX: -3.875, minZ: 3.325, maxZ: 3.975 },
    { name: 'kitchen-counter', minX: 5.6, maxX: 6.7, minZ: 0.15, maxZ: 3.55 },
    { name: 'fridge', minX: 3.025, maxX: 3.875, minZ: -0.265, maxZ: 0.585 },
    { name: 'dining-table', minX: 3.65, maxX: 5.15, minZ: 3.605, maxZ: 4.455 },
    { name: 'bathroom-sink', minX: 3.405, maxX: 4.755, minZ: -4.495, maxZ: -3.745 },
    { name: 'toilet', minX: 5.7, maxX: 6.38, minZ: -4.15, maxZ: -3.15 },
    { name: 'shower-back-glass', minX: 5.36, maxX: 6.6, minZ: -2.29, maxZ: -2.13 },
    { name: 'shower-side-glass', minX: 6.518, maxX: 6.542, minZ: -2.215, maxZ: -0.925 },
    { name: 'washing-machine', minX: 2.925, maxX: 3.755, minZ: -1.895, maxZ: -1.065 },
  ],
  waypoints: [
    { x: 0.95, z: 1.18 },
    { x: 0.95, z: 2.2 },
    HOME_ACTIVITY_SPOTS.idle,
    HOME_ACTIVITY_SPOTS.read,
    { x: -2.95, z: 1.35 },
    { x: -5.75, z: 2.9 },
    { x: -5.75, z: 3.0 },
    { x: 1.15, z: 3.75 },
    { x: 0.95, z: -1.95 },
    { x: -0.8, z: -1.95 },
    { x: -1.45, z: -1.95 },
    HOME_BED_ENTRY,
    { x: -2.15, z: -3.4 },
    { x: 0.95, z: -3.35 },
    { x: 2.7, z: -2.3 },
    { x: 4.46, z: -2.3 },
    HOME_ACTIVITY_SPOTS.brush,
    { x: 4.98, z: -2.7 },
    HOME_TOILET_ENTRY,
    { x: 5.14, z: -0.98 },
    HOME_ACTIVITY_SPOTS.shower,
    HOME_ACTIVITY_SPOTS.laundry,
    { x: 2.7, z: 2.2 },
    { x: 4.4, z: 2.2 },
    HOME_ACTIVITY_SPOTS.cook,
    HOME_ACTIVITY_SPOTS.clean,
    HOME_ACTIVITY_SPOTS['wash-dishes'],
    { x: 3.12, z: 3.12 },
    HOME_ACTIVITY_SPOTS.eat,
    { x: -1.75, z: 2.2 },
  ],
  edges: [
    [0, 1],
    [0, 3],
    [0, 8],
    [1, 7],
    [1, 22],
    [1, 29],
    [2, 4],
    [2, 5],
    [2, 29],
    [3, 4],
    [3, 29],
    [5, 6],
    [8, 9],
    [8, 13],
    [8, 14],
    [9, 10],
    [10, 11],
    [10, 12],
    [14, 15],
    [15, 16],
    [15, 17],
    [15, 21],
    [17, 18],
    [21, 19],
    [19, 20],
    [22, 23],
    [22, 27],
    [23, 24],
    [23, 25],
    [25, 26],
    [27, 28],
  ],
} as const;

/** 猫主要待在客厅和开放厨房入口，不钻进洗澡间、灶台和卧室床铺。 */
export const HOME_CAT_WAYPOINTS = [0, 1, 2, 3, 4, 5, 6, 7, 22, 23, 29] as const;
