import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';

// 执行实际投影循环，模拟 hidden 元素的布局尺寸归零，捕获连续帧显隐反馈。
const source = await readFile(new URL('../src/scripts/study.ts', import.meta.url), 'utf8');
const start = source.indexOf('    for (const { element, point } of spaceMarkers)');
const end = source.indexOf('    const anchor = headWorld', start);
assert(start >= 0 && end > start, '找不到房间标签的投影循环');
const positionLabels = new Function(
  'spaceMarkers',
  'camera',
  'width',
  'height',
  'character',
  'headX',
  'headY',
  'feetY',
  'bodyHalfWidth',
  'catX',
  'catY',
  'catPadding',
  source.slice(start, end),
);
const camera = new THREE.Camera();
for (const [name, labelWidth] of [
  ['卧室', 40],
  ['客厅', 40],
  ['厨房', 40],
  ['卫生间', 53],
]) {
  const element = {
    hidden: false,
    style: {},
    get offsetWidth() {
      return this.hidden ? 0 : labelWidth;
    },
    get offsetHeight() {
      return this.hidden ? 0 : 19;
    },
  };
  const markers = [{ element, point: new THREE.Vector3() }];
  const visible = () => !element.hidden && element.style.visibility !== 'hidden';
  const frame = (actorX, catX = 0, catY = 0) => {
    positionLabels(
      markers,
      camera,
      800,
      600,
      { visible: true },
      actorX,
      275,
      335,
      20,
      catX,
      catY,
      5,
    );
    return visible();
  };
  assert(frame(0), `${name} 无遮挡时未显示`);
  for (let i = 0; i < 120; i++)
    assert(!frame(400 - (20 + labelWidth / 4)), `${name} 被人物遮挡后在第 ${i + 1} 帧闪回`);
  assert(frame(0), `${name} 人物离开后未恢复`);
  for (let i = 0; i < 120; i++)
    assert(!frame(0, 400, 300), `${name} 被猫遮挡后在第 ${i + 1} 帧闪回`);
  assert(frame(0), `${name} 猫离开后未恢复`);
}
console.log('房间标签验证通过：4 个标签的连续帧人物遮挡、猫遮挡及离开恢复。');
