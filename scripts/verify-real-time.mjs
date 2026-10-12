import assert from 'node:assert/strict';
import { createStudyDailyLife } from '../src/scripts/study-daily-life.ts';

let now = new Date(2026, 9, 12, 14, 5, 30);
const life = createStudyDailyLife(
  () => 0.5,
  () => new Date(now),
);
assert.equal(life.cycleSeconds, 86400);
assert.equal(life.update(0).minute, 845.5);
assert.equal(life.update(0).activity, 'read');
assert.equal(life.update(120).activity, 'read', '帧时间不应把现实作息加速');
now = new Date(now.getTime() + 60000);
assert.equal(life.update(0, { paused: true }).minute, 846.5, '暂停活动仍应走现实时间');
now = new Date(2026, 9, 12, 16, 0);
const resumed = life.update(60);
assert.equal(resumed.minute, 960, '后台返回应同步当前时间');
assert.equal(resumed.activity, 'idle');
assert.equal(resumed.phase, 'acting');
assert.equal(life.update(120).activity, 'idle', '休息应持续到下一真实作息时刻');

now = new Date(2026, 9, 12, 23, 59, 30);
const night = createStudyDailyLife(
  () => 0.5,
  () => new Date(now),
);
const before = night.update(0);
assert.equal(before.phase, 'sleeping');
assert.equal(before.person.elevation, 0.9, '晚上进入页面应直接在床上睡觉');
now = new Date(now.getTime() + 60000);
const after = night.update(1 / 30);
assert.equal(after.minute, 0.5);
assert.equal(after.day, before.day + 1);
assert.equal(after.phase, 'sleeping', '跨午夜不应提前起床');
now = new Date(2026, 9, 13, 6, 40);
assert.equal(night.update(1 / 30).phase, 'alighting', '现实起床时刻应平滑下床');
const awake = night.update(30);
assert.equal(awake.activity, 'idle');
assert.equal(awake.person.elevation, 0);
console.log('现实时间验证通过：本地时刻、1:1 流逝、暂停及后台同步、跨午夜睡眠和按时起床。');
