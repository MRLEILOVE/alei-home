import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createStudyCharacter } from '../src/scripts/study-character.ts';
import { createStudyCat } from '../src/scripts/study-cat.ts';
import { createStudyCatBed } from '../src/scripts/study-cat-bed.ts';
import { STUDY_CAT_HOME } from '../src/scripts/study-cat-home.ts';
import { createStudyHome } from '../src/scripts/study-home.ts';
import { HOME_ACTIVITY_SPOTS } from '../src/scripts/study-home-layout.ts';
import { createRoomRoaming, ROOM_ROAMING_LAYOUT as layout } from '../src/scripts/study-roaming.ts';

// 检查实际三维模型的体积、脚底和动画数值，不依赖 WebGL 环境。
const character = createStudyCharacter();
let meshes = 0;
character.group.traverse((item) => {
  assert(!(item instanceof THREE.Sprite), '角色应为立体模型，不得使用立牌');
  if (item instanceof THREE.Mesh) meshes++;
});
assert(meshes > 20, '三维人物结构缺失');
const dimensions = new THREE.Box3().setFromObject(character.group);
assert(dimensions.max.y > 1.2 && dimensions.max.y < 1.8, '角色与房间比例不匹配');
assert(dimensions.min.y >= -0.03 && dimensions.min.y <= 0.06, '角色脚底不在地面原点');
for (let i = 0; i < 600; i++) {
  character.animate(1 / 30, i < 300, i >= 300);
  character.faceTo(i < 300 ? Math.PI : -Math.PI + 0.01, 1 / 30);
  character.group.traverse((item) => {
    assert(
      [...item.position, ...item.quaternion, ...item.scale].every(Number.isFinite),
      '人物动画产生无效坐标',
    );
  });
}
const actorOrigin = character.group.position.clone();
character.setPetting(true);
for (let i = 0; i < 150; i++) character.animate(1 / 30, false, false);
assert(character.group.position.equals(actorOrigin), '抚摸动作移动了人物根节点');
character.setPetting(false);
for (let i = 0; i < 90; i++) character.animate(1 / 30, false, false);
// 每种家务都实测关节与道具，避免日钟换标签但人物动作没有接上。
const heldProps = {
  brush: 'alei-toothbrush',
  cook: 'alei-spatula',
  'wash-dishes': 'alei-washing-plate',
  clean: 'alei-cleaning-cloth',
  laundry: 'alei-laundry',
  eat: 'alei-rice-bowl',
  read: 'alei-open-book',
  'wash-face': 'alei-face-water',
  shower: 'alei-shampoo',
};
for (const activity of Object.keys(HOME_ACTIVITY_SPOTS)) {
  character.setActivity(activity, 1);
  for (let frame = 0; frame < 180; frame++) {
    character.animate(1 / 30, false, false);
    character.group.traverse((item) => {
      assert(
        [...item.position, ...item.quaternion, ...item.scale].every(Number.isFinite),
        `${activity} 动作产生无效坐标`,
      );
    });
  }
  assert(character.group.position.equals(actorOrigin), `${activity} 动作移动了人物的场景根节点`);
  if (heldProps[activity])
    assert(
      character.group.getObjectByName(heldProps[activity]).visible,
      `${activity} 对应的立体道具没有显示`,
    );
}
character.setActivity('idle');
for (let frame = 0; frame < 180; frame++) character.animate(1 / 30, false, false);
for (const activity of ['eat', 'toilet', 'sleep']) {
  character.setActivity(activity, 1);
  for (let frame = 0; frame < 180; frame++) character.animate(1 / 30, false, false);
  const head = character.group.getObjectByName('alei-head');
  const before = head.getWorldPosition(new THREE.Vector3());
  character.wave();
  for (let frame = 0; frame < 90; frame++) character.animate(1 / 30, false, false);
  const after = head.getWorldPosition(new THREE.Vector3());
  assert(Math.abs(before.y - after.y) < 0.02, '聊天挥手让坐着或睡着的人物站起来');
}
character.setActivity('idle');
const home = createStudyHome({ landscape: new THREE.Texture() });
for (const fixture of [
  'home-bed',
  'home-wardrobe',
  'home-living-sofa',
  'home-writing-desk',
  'home-fridge',
  'home-kitchen-sink',
  'home-stove',
  'home-dining-table',
  'home-bathroom-vanity',
  'home-bathroom-mirror',
  'home-toilet',
  'home-shower',
  'home-washing-machine',
])
  assert(home.group.getObjectByName(fixture), `住宅缺少常用物件：${fixture}`);
assert.deepEqual(
  new Set(home.destinations.map((item) => item.id)),
  new Set(['writing', 'projects', 'books', 'music', 'games', 'guestbook', 'friends', 'main']),
  '改为住宅后内容入口缺失',
);
home.animate(1 / 30, 'wash-face', 0.5, 1);
assert(home.group.getObjectByName('home-bathroom-water-stream').visible, '洗脸时洗手台没有流水');
home.animate(1 / 30, 'wash-dishes', 0.5, 1);
assert(home.group.getObjectByName('home-kitchen-water-stream').visible, '洗碗时厨房没有流水');
assert(!home.group.getObjectByName('home-bathroom-water-stream').visible, '洗漱结束没有关闭水龙头');
home.animate(1 / 30, 'cook', 0.5, 1);
assert(home.group.getObjectByName('home-cooking-steam').visible, '做饭时没有锅的蒸汽');
home.animate(1 / 30, 'shower', 0.5, 0);
assert(home.group.getObjectByName('home-shower-water').visible, '洗澡时淋浴没有出水');
const drum = home.group.getObjectByName('home-washer-drum');
const drumAngle = drum.rotation.z;
home.animate(0.1, 'laundry', 0.5, 1);
assert.notEqual(drum.rotation.z, drumAngle, '洗衣时滚筒没有旋转');
home.animate(0, 'idle', 1, 1);
assert(
  !home.group.getObjectByName('home-cooking-steam').visible &&
    !home.group.getObjectByName('home-shower-water').visible,
  '家务结束后设备仍在运行',
);
home.group.traverse((item) =>
  assert(
    [...item.position, ...item.quaternion, ...item.scale].every(Number.isFinite),
    '住宅物件动画产生无效坐标',
  ),
);
const cat = createStudyCat();
let catMeshes = 0;
cat.group.traverse((item) => {
  assert(!(item instanceof THREE.Sprite), '狸花猫应为立体模型');
  if (item instanceof THREE.Mesh) catMeshes++;
});
assert(catMeshes > 20, '猫的立体结构缺失');
const catDimensions = new THREE.Box3().setFromObject(cat.group);
assert(catDimensions.max.y > 0.35 && catDimensions.max.y < 0.85, '猫与房间比例不匹配');
assert(catDimensions.min.y >= -0.03 && catDimensions.min.y <= 0.06, '猫脚底不在地面原点');
for (let i = 0; i < 900; i++) {
  cat.animate(1 / 30, i < 300, i < 300 ? 'idle' : i < 600 ? 'rub' : 'sit');
  cat.faceTo(Math.sin(i * 0.01) * Math.PI, 1 / 30);
  cat.group.traverse((item) => {
    assert(
      [...item.position, ...item.quaternion, ...item.scale].every(Number.isFinite),
      '猫的动作产生无效坐标',
    );
  });
}
const sleepingCat = createStudyCat();
const catOrigin = sleepingCat.group.position.clone();
for (let i = 0; i < 240; i++) sleepingCat.animate(1 / 30, false, 'sleep');
assert(sleepingCat.group.position.equals(catOrigin), '睡姿移动了猫的场景根节点');
const sleepingDimensions = new THREE.Box3().setFromObject(sleepingCat.group);
assert(sleepingDimensions.max.y < catDimensions.max.y * 0.8, '猫没有卧下睡觉');
assert(sleepingDimensions.min.y >= -0.03, '睡姿穿过了垫面');
const sleepSize = sleepingDimensions.getSize(new THREE.Vector3());
assert(sleepSize.x < 0.92 && sleepSize.z < 0.77, '蜷睡姿势放不进猫窝');
for (const side of ['left', 'right']) {
  const eye = sleepingCat.group.getObjectByName(`cat-${side}-eye`);
  assert(eye && eye.scale.y < 0.12, '睡觉时没有闭眼');
}
for (let i = 0; i < 240; i++) sleepingCat.animate(1 / 30, false, 'idle');
const awakeDimensions = new THREE.Box3().setFromObject(sleepingCat.group);
assert(Math.abs(awakeDimensions.max.y - catDimensions.max.y) < 0.03, '醒来未恢复站姿');
const catBed = createStudyCatBed();
const bedDimensions = new THREE.Box3().setFromObject(catBed);
assert(bedDimensions.min.y >= -0.02 && bedDimensions.max.y < 0.3, '猫窝高度不合适');
const cushion = catBed.getObjectByName('cat-bed-linen-cushion');
assert(cushion, '猫窝缺少软垫');
const cushionDimensions = new THREE.Box3().setFromObject(cushion);
assert(
  Math.abs(cushionDimensions.max.y - STUDY_CAT_HOME.surfaceHeight) < 1e-6,
  '猫的脚底高度与垫面不一致',
);

function safe(point) {
  const { bounds, radius } = layout;
  assert(
    point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.z >= bounds.minZ &&
      point.z <= bounds.maxZ,
    '走动超出房间',
  );
  for (const footprint of layout.footprints) {
    const inside =
      point.x > footprint.minX - radius &&
      point.x < footprint.maxX + radius &&
      point.z > footprint.minZ - radius &&
      point.z < footprint.maxZ + radius;
    assert(!inside, `角色路线穿过家具：${footprint.name}`);
  }
}
// 每条连接都采样，防止路点安全但连接穿过家具。
for (const [a, b] of layout.edges) {
  for (let i = 0; i <= 100; i++) {
    const start = layout.waypoints[a],
      end = layout.waypoints[b],
      t = i / 100;
    safe({ x: start.x + (end.x - start.x) * t, z: start.z + (end.z - start.z) * t });
  }
}
let seed = 20261012;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const roaming = createRoomRoaming(random);
const visited = new Set();
let previous = { ...roaming.position };
for (let i = 0; i < 36000; i++) {
  const pose = roaming.update(1 / 30, false);
  safe(pose);
  assert(Number.isFinite(pose.yaw), '朝向无效');
  assert(
    Math.hypot(pose.x - previous.x, pose.z - previous.z) <= 0.4 / 30 + 1e-8,
    '行走超过设定速度',
  );
  layout.waypoints.forEach((point, index) => {
    if (Math.hypot(point.x - pose.x, point.z - pose.z) < 0.01) visited.add(index);
  });
  previous = pose;
}
assert.equal(visited.size, layout.waypoints.length, '随机走动无法覆盖可通行区域');
const uninterrupted = createRoomRoaming(() => 0);
const paused = createRoomRoaming(() => 0);
uninterrupted.update(1, false);
paused.update(1, false);
const before = { ...paused.position };
for (let i = 0; i < 200; i++)
  assert.deepEqual(paused.update(1 / 30, true), { ...before, yaw: -Math.PI / 3, moving: false });
assert.deepEqual(
  paused.update(1, false),
  uninterrupted.update(1, false),
  '暂停消耗了路线或停留时间',
);
console.log(
  `书房验证通过：${meshes} 个人物部件、${catMeshes} 个狸花猫部件、软垫猫窝与蜷睡闭眼/醒来动作、${layout.edges.length} 条避障连接、36000 帧随机行走、交互暂停与恢复。`,
);
await import('./verify-cat-behavior.mjs');
await import('./verify-daily-life.mjs');
