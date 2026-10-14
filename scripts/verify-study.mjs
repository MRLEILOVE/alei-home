import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createStudyCharacter } from '../src/scripts/study-character.ts';
import { createStudyCat } from '../src/scripts/study-cat.ts';
import { createStudyCatBed } from '../src/scripts/study-cat-bed.ts';
import { STUDY_CAT_HOME } from '../src/scripts/study-cat-home.ts';
import { createStudyHome } from '../src/scripts/study-home.ts';
import { createStudyVillaExterior } from '../src/scripts/study-villa-exterior.ts';
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
  'home-desk-chair',
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
const villa = createStudyVillaExterior();
villa.group.traverse((item) => {
  assert(!item.name.startsWith('villa-pool-lounger'), '一楼仍残留躺椅');
  if (item.name === 'porsche-a-pillar' || item.name === 'porsche-c-pillar') {
    const halfLength = item.geometry.parameters.height / 2;
    const low = new THREE.Vector3(0, -halfLength, 0)
      .applyQuaternion(item.quaternion)
      .add(item.position);
    const high = new THREE.Vector3(0, halfLength, 0)
      .applyQuaternion(item.quaternion)
      .add(item.position);
    assert(Math.abs(low.y - 0.92) < 1e-6 && Math.abs(high.y - 1.43) < 1e-6, '车窗支柱高度偏离玻璃');
    assert(Math.abs(high.x) < Math.abs(low.x), '车窗支柱向外突出');
    assert(
      item.name === 'porsche-a-pillar' ? high.z < low.z : high.z > low.z,
      '车窗支柱倾斜方向错误',
    );
  }
});
for (const index of [1, 2]) {
  const chair = villa.group.getObjectByName(`villa-rooftop-lounger-${index}`);
  assert(chair?.getObjectByName('villa-lounger-head-pillow'), '三楼躺椅缺少头枕');
  assert(
    chair.getObjectByName('villa-lounger-raised-backrest').rotation.x > 0,
    '三楼躺椅靠背未抬起',
  );
}
for (const structure of [
  'villa-transparent-shell',
  'villa-second-floor',
  'villa-ktv-room',
  'villa-private-cinema',
  'villa-billiards-room',
  'villa-rooftop-garden',
  'villa-china-flag',
  'villa-exterior-staircase',
  'villa-perimeter-fence',
  'villa-front-door',
  'villa-stone-terrace',
  'villa-facade-plinth',
  'villa-porch-gable',
  'villa-porch-lantern',
  'villa-lawn-details',
  'villa-perimeter-hedge',
  'villa-landscape-tree-back-left',
  'villa-landscape-tree-back-right',
  'villa-flower-garden',
  'villa-garden-bench',
  'villa-fish-pond',
  'villa-swimming-pool',
  'villa-stone-lion-left',
  'villa-stone-lion-right',
  'villa-pond-turtle',
  'villa-pond-floor',
  'villa-pond-pebbles',
  'villa-pond-ripples',
  'villa-pond-lilies',
  'villa-pond-reeds',
  'villa-pool-floor',
  'villa-pool-tile-grid',
  'villa-pool-ripples',
  'villa-pool-steps',
  'villa-pool-deck-detail',
  'villa-pool-float-ring',
  'villa-garage',
  'villa-garage-transparent-shell',
  'villa-garage-driveway',
  'villa-porsche-sports-car',
])
  assert(villa.group.getObjectByName(structure), `小别墅缺少完整构造：${structure}`);
const villaBounds = new THREE.Box3().setFromObject(villa.group);
const secondFloor = villa.group.getObjectByName('villa-second-floor');
const roofGarden = villa.group.getObjectByName('villa-rooftop-garden');
assert(secondFloor.position.y > 3 && roofGarden.position.y > 6, '楼层高度未形成三层小楼');
const flag = villa.group.getObjectByName('villa-china-flag');
flag.traverse((item) => {
  if (!item.name.startsWith('villa-flag-')) return;
  assert.equal(item.castShadow, false, '旗面不应投射阴影');
  assert.equal(item.receiveShadow, false, '旗面不应接收阴影');
  assert(item.material instanceof THREE.MeshBasicMaterial, '旗面不应产生光照明暗');
});
assert.equal(
  flag.children.filter((item) => item.name === 'villa-flag-star').length,
  5,
  '中国国旗应有五颗星',
);
const flagCloth = villa.group.getObjectByName('villa-flag-cloth');
const initialFlag = [...flagCloth.geometry.attributes.position.array];
villa.setFloorView('first');
assert(!secondFloor.visible && !roofGarden.visible, '查看一楼时上层没有移开');
villa.setFloorView('second');
assert(secondFloor.visible && !roofGarden.visible, '查看二楼时花园遮挡娱乐空间');
villa.setFloorView('all');
assert(secondFloor.visible && roofGarden.visible, '全景未恢复全部楼层');
const villaSize = villaBounds.getSize(new THREE.Vector3());
assert(
  villaSize.x >= 24 && villaSize.y >= 4.5 && villaSize.z >= 18,
  '小别墅没有完整展示建筑与前后庭院',
);
for (const detail of [
  'villa-stone-terrace',
  'villa-porch-gable',
  'villa-lawn-details',
  'villa-perimeter-hedge',
  'villa-landscape-tree-back-left',
  'villa-landscape-tree-back-right',
  'villa-garden-bench',
  'villa-pond-pebbles',
  'villa-pond-ripples',
  'villa-pond-lilies',
  'villa-pond-reeds',
  'villa-pool-tile-grid',
  'villa-pool-steps',
  'villa-pool-ripples',
  'villa-pool-deck-detail',
  'villa-pool-float-ring',
]) {
  let detailMeshes = 0;
  const detailObject = villa.group.getObjectByName(detail);
  detailObject.traverse((item) => {
    if (item instanceof THREE.Mesh) detailMeshes++;
  });
  assert(detailObject.visible && detailMeshes > 0, `小别墅精修构造为空或不可见：${detail}`);
}
for (let index = 1; index <= 5; index++)
  assert(villa.group.getObjectByName(`villa-pond-fish-${index}`), `鱼池缺少第 ${index} 条小鱼`);
const transparentPanels = [];
villa.group.traverse((item) => {
  assert(
    [...item.position, ...item.quaternion, ...item.scale].every(Number.isFinite),
    '小别墅构造产生无效坐标',
  );
  if (item.userData.seasonWall && item instanceof THREE.Mesh) transparentPanels.push(item);
});
assert(transparentPanels.length >= 8, '小别墅没有形成完整的半透明外壳');
assert(
  transparentPanels.every((item) => {
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    return materials.every(
      (panelMaterial) => panelMaterial.transparent && panelMaterial.opacity < 0.6,
    );
  }),
  '小别墅外墙或屋顶不是半透明材质',
);
const garage = villa.group.getObjectByName('villa-garage');
garage.traverse((item) => {
  if (!(item instanceof THREE.Mesh)) return;
  const materials = Array.isArray(item.material) ? item.material : [item.material];
  for (const material of materials)
    if (material instanceof THREE.MeshPhysicalMaterial)
      assert.equal(material.transmission, 0, '全景车库材质不应触发昂贵的整场景折射预渲染');
});
const garageShell = villa.group.getObjectByName('villa-garage-transparent-shell');
const garageDriveway = villa.group.getObjectByName('villa-garage-driveway');
const porsche = villa.group.getObjectByName('villa-porsche-sports-car');
const garageShellMeshes = [];
garageShell.traverse((item) => {
  if (item instanceof THREE.Mesh) garageShellMeshes.push(item);
});
assert(garage.visible && garageShell.visible, '半透明车库不可见');
assert(garageShellMeshes.length >= 3, '车库外壳没有形成完整的墙体与屋顶');
assert(
  garageShellMeshes.every((item) => {
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    return materials.every(
      (garageMaterial) =>
        garageMaterial.transparent &&
        garageMaterial.opacity > 0 &&
        garageMaterial.opacity < 0.65 &&
        !garageMaterial.depthWrite,
    );
  }),
  '车库外壳没有使用通透且不遮挡内部跑车的材质',
);
let drivewayMeshes = 0;
garageDriveway.traverse((item) => {
  if (item instanceof THREE.Mesh) drivewayMeshes++;
});
assert(garageDriveway.visible && drivewayMeshes > 0, '车库车道为空或不可见');
const garageShellBounds = new THREE.Box3().setFromObject(garageShell);
const porscheBounds = new THREE.Box3().setFromObject(porsche);
assert(!garageShellBounds.isEmpty() && !porscheBounds.isEmpty(), '车库或跑车没有可渲染体积');
const garageShellSize = garageShellBounds.getSize(new THREE.Vector3());
const porscheSize = porscheBounds.getSize(new THREE.Vector3());
const porscheCenter = porscheBounds.getCenter(new THREE.Vector3());
assert(
  porscheCenter.x >= garageShellBounds.min.x - 0.5 &&
    porscheCenter.x <= garageShellBounds.max.x + 0.5 &&
    porscheCenter.z >= garageShellBounds.min.z - 0.5 &&
    porscheCenter.z <= garageShellBounds.max.z + 0.5 &&
    porscheCenter.y >= garageShellBounds.min.y - 0.25 &&
    porscheCenter.y <= garageShellBounds.max.y + 0.25,
  '保时捷跑车没有停放在半透明车库内',
);
const porscheHorizontalSize = [porscheSize.x, porscheSize.z].sort((a, b) => a - b);
const garageHorizontalSize = [garageShellSize.x, garageShellSize.z].sort((a, b) => a - b);
assert(
  porscheHorizontalSize[0] >= 1.2 &&
    porscheHorizontalSize[1] >= 2.6 &&
    porscheSize.y >= 0.55 &&
    porscheHorizontalSize[0] < garageHorizontalSize[0] &&
    porscheHorizontalSize[1] < garageHorizontalSize[1],
  '保时捷跑车的比例不合理或无法容纳在车库内',
);
const porscheMeshes = [];
const porscheMaterials = [];
const namedWheelParts = [];
porsche.traverse((item) => {
  if (item.name.startsWith('villa-porsche-wheel-')) namedWheelParts.push(item);
  if (!(item instanceof THREE.Mesh)) return;
  porscheMeshes.push(item);
  const materials = Array.isArray(item.material) ? item.material : [item.material];
  porscheMaterials.push(...materials);
});
assert(porsche.visible && porscheMeshes.length >= 10, '保时捷跑车结构过于简略或不可见');
assert(
  porscheMaterials.some(
    (carMaterial) =>
      (carMaterial instanceof THREE.MeshPhysicalMaterial && carMaterial.clearcoat >= 0.2) ||
      (carMaterial instanceof THREE.MeshStandardMaterial &&
        carMaterial.roughness <= 0.5 &&
        carMaterial.metalness >= 0.1),
  ),
  '保时捷跑车缺少有光泽的车漆材质',
);
const porscheWheels = namedWheelParts.filter((item) => {
  let ancestor = item.parent;
  while (ancestor && ancestor !== porsche) {
    if (ancestor.name.startsWith('villa-porsche-wheel-')) return false;
    ancestor = ancestor.parent;
  }
  return true;
});
assert.equal(porscheWheels.length, 4, '保时捷跑车应有四个独立车轮');
for (const wheel of porscheWheels) {
  let wheelMeshes = 0;
  wheel.traverse((item) => {
    if (item instanceof THREE.Mesh) wheelMeshes++;
  });
  const wheelSize = new THREE.Box3().setFromObject(wheel).getSize(new THREE.Vector3());
  assert(wheel.visible && wheelMeshes > 0, `车轮为空或不可见：${wheel.name}`);
  assert(Math.max(wheelSize.x, wheelSize.y, wheelSize.z) >= 0.3, `车轮尺寸过小：${wheel.name}`);
}
const frontDoor = villa.group.getObjectByName('villa-front-door');
const leftLion = villa.group.getObjectByName('villa-stone-lion-left');
const rightLion = villa.group.getObjectByName('villa-stone-lion-right');
const doorPosition = frontDoor.getWorldPosition(new THREE.Vector3());
const leftLionPosition = leftLion.getWorldPosition(new THREE.Vector3());
const rightLionPosition = rightLion.getWorldPosition(new THREE.Vector3());
assert(
  leftLionPosition.x < doorPosition.x && rightLionPosition.x > doorPosition.x,
  '两座石狮没有分列在别墅入口两侧',
);
assert(
  Math.abs((leftLionPosition.x + rightLionPosition.x) / 2 - doorPosition.x) < 0.2,
  '两座石狮没有围绕入口对称摆放',
);
for (const [side, lion] of [
  ['左', leftLion],
  ['右', rightLion],
]) {
  const lionSize = new THREE.Box3().setFromObject(lion).getSize(new THREE.Vector3());
  assert(lionSize.y >= 1.4, `${side}侧石狮不够醒目`);
}
function assertTransparentWater(name) {
  const surface = villa.group.getObjectByName(name);
  assert(surface instanceof THREE.Mesh, `水面不是立体网格：${name}`);
  const materials = Array.isArray(surface.material) ? surface.material : [surface.material];
  assert(
    materials.every(
      (waterMaterial) =>
        waterMaterial.transparent && waterMaterial.opacity > 0.2 && !waterMaterial.depthWrite,
    ),
    `水面缺少通透层次：${name}`,
  );
  return { surface, materials };
}
const pondWater = assertTransparentWater('villa-pond-water');
const poolWater = assertTransparentWater('villa-pool-water');
const pondFish = villa.group.getObjectByName('villa-pond-fish-1');
const fishStart = pondFish.position.clone();
const pondTurtle = villa.group.getObjectByName('villa-pond-turtle');
const turtleStart = pondTurtle.position.clone();
const pondOpacity = pondWater.materials.map((waterMaterial) => waterMaterial.opacity);
const poolOpacity = poolWater.materials.map((waterMaterial) => waterMaterial.opacity);
const pondRipple = villa.group.getObjectByName('villa-pond-ripples').children[0];
const pondRippleScale = pondRipple.scale.clone();
const poolRipple = villa.group.getObjectByName('villa-pool-ripples').children[0];
const poolRipplePosition = poolRipple.position.clone();
const floatRing = villa.group.getObjectByName('villa-pool-float-ring');
const floatRingPosition = floatRing.position.clone();
for (let frame = 0; frame < 120; frame++) villa.animate(1 / 30);
assert(
  flagCloth.geometry.attributes.position.array.some((v, i) => v !== initialFlag[i]),
  '旗帜没有飘动',
);
assert(pondFish.position.distanceTo(fishStart) > 0.1, '鱼池里的小鱼没有游动');
assert(pondTurtle.position.distanceTo(turtleStart) > 0.1, '鱼池里的乌龟没有游动');
assert(
  pondWater.materials.some((waterMaterial, index) => waterMaterial.opacity !== pondOpacity[index]),
  '鱼池水面没有动态变化',
);
assert(
  poolWater.materials.some((waterMaterial, index) => waterMaterial.opacity !== poolOpacity[index]),
  '泳池水面没有动态变化',
);
assert(pondRipple.scale.distanceTo(pondRippleScale) > 0.01, '鱼池水波没有扩散动画');
assert(poolRipple.position.distanceTo(poolRipplePosition) > 0.01, '泳池水纹没有漂移动画');
assert(floatRing.position.distanceTo(floatRingPosition) > 0.005, '泳池浮圈没有随水面漂浮');
villa.group.traverse((item) =>
  assert(
    [...item.position, ...item.quaternion, ...item.scale].every(Number.isFinite),
    '小别墅精修动画产生无效坐标',
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
  `小别墅验证通过：半透明全景、花园、鱼池、泳池、双石狮、${meshes} 个人物部件、${catMeshes} 个狸花猫部件、软垫猫窝与蜷睡闭眼/醒来动作、${layout.edges.length} 条避障连接、36000 帧随机行走、交互暂停与恢复。`,
);
await import('./verify-study-labels.mjs');
await import('./verify-study-stairs.mjs');
await import('./verify-study-fish.mjs');
await import('./verify-real-time.mjs');
await import('./verify-cat-behavior.mjs');
await import('./verify-daily-life.mjs');
