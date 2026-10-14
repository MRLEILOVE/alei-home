import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createStudyVillaUpper } from '../src/scripts/study-villa-upper.ts';

const upper = createStudyVillaUpper();
upper.group.updateMatrixWorld(true);
const landings = upper.stairs.children.filter((item) => item.name === 'villa-stair-landing');
assert.equal(landings.length, 2, '二、三楼均应有入口平台');
for (const [index, level] of [upper.second, upper.rooftop].entries()) {
  const landing = new THREE.Box3().setFromObject(landings[index]);
  const floor = level.getObjectByName(
    index === 0 ? 'villa-second-floor-corridor' : 'villa-transparent-floor-slab',
  );
  const floorBounds = new THREE.Box3().setFromObject(floor);
  // 用真实网格检测入口净宽，不只检查中心一条线；双向射线覆盖单面材质。
  for (const x of [3.35, 3.55, 3.75, 3.95, 4.15]) {
    for (const height of [0.02, 0.3, 0.6, 0.94, 1.5, 1.8]) {
      for (const forward of [true, false]) {
        const ray = new THREE.Raycaster(
          new THREE.Vector3(x, floorBounds.max.y + height, forward ? -5.4 : -4.1),
          new THREE.Vector3(0, 0, forward ? 1 : -1),
          0,
          1.3,
        );
        const hits = ray.intersectObject(upper.group, true);
        assert.equal(
          hits.length,
          0,
          `${index + 2}楼入口受阻：x=${x}，高度=${height}，${hits[0]?.object.name || hits[0]?.object.geometry.type}`,
        );
      }
    }
  }
  assert(Math.abs(landing.max.y - floorBounds.max.y) < 1e-5, `${index + 2}楼平台与地面不平齐`);
  assert(landing.max.z >= floorBounds.min.z, `${index + 2}楼平台与地面断开`);
}
console.log('楼梯入口验证通过：二、三楼入口净宽、净高、平台衔接及地面高度。');
