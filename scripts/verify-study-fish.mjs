import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createStudyVillaExterior } from '../src/scripts/study-villa-exterior.ts';

const villa = createStudyVillaExterior();
for (let i = 1; i <= 5; i++) {
  const fish = villa.group.getObjectByName(`villa-pond-fish-${i}`);
  const tail = fish.userData.tail;
  const body = fish.getObjectByName('villa-fish-body');
  assert(body.scale.y > body.scale.x, '鱼身应上下高、左右窄，不能侧躺');
  // 直接检查模型变换，旧版尾鳍会在鱼身坐标中一前一后。
  tail.rotation.y = 0;
  fish.updateWorldMatrix(true, true);
  const lobes = tail.children.filter((item) => item.geometry?.type === 'SphereGeometry');
  assert.equal(lobes.length, 2, '尾鳍应有两个对称分叶');
  const centers = lobes.map((item) =>
    fish.worldToLocal(item.getWorldPosition(new THREE.Vector3())),
  );
  assert(Math.abs(centers[0].z - centers[1].z) < 1e-6, '两片尾鳍前后错位');
  assert(Math.abs(centers[0].x + centers[1].x) < 1e-6, '尾鳍偏离鱼身中线');
  assert(Math.abs(centers[0].x) < 1e-6 && Math.abs(centers[1].x) < 1e-6, '尾鳍应在竖直中面');
  assert(
    centers[0].y * centers[1].y < 0 && Math.abs(centers[0].y + centers[1].y) < 1e-6,
    '尾鳍应上下对称展开',
  );
  assert(
    centers.every((point) => point.z < -0.28),
    '尾鳍中心插入鱼身',
  );
  assert(tail.position.z > -0.28 && tail.position.z < -0.2, '摆动轴没有位于鱼身尾根内部');
}
for (let frame = 0; frame < 240; frame++) {
  villa.animate(1 / 30);
  for (let i = 1; i <= 5; i++) {
    const tail = villa.group.getObjectByName(`villa-pond-fish-${i}`).userData.tail;
    assert.equal(tail.rotation.x, 0, '摆尾混入了俯仰旋转');
    assert.equal(tail.rotation.z, 0, '摆尾混入了滚转');
    assert(Math.abs(tail.rotation.y) <= 0.321, '摆尾角度超出范围');
    assert.equal(tail.position.x, 0, '尾根偏离中线');
  }
}
console.log('五条鱼尾验证通过：对称分叶、尾根连接及 240 帧摆动。');
