import assert from 'node:assert/strict';
import {
  createStudyDailyLife,
  STUDY_DAILY_SCHEDULE,
  STUDY_DAILY_WALK_SPEED,
} from '../src/scripts/study-daily-life.ts';
import {
  HOME_ACTIVITY_SPOTS,
  HOME_FIXTURES,
  HOME_BED_ENTRY,
  HOME_TOILET_ENTRY,
  HOME_WALKING_LAYOUT,
} from '../src/scripts/study-home-layout.ts';
import { isRoomPositionSafe, isRoomSegmentSafe } from '../src/scripts/study-roaming.ts';
import { createStudyCompanions } from '../src/scripts/study-companions.ts';

const delta = 1 / 30;
const apart = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function seeded(initial) {
  let seed = initial >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const onFixture = (frame) =>
  ['boarding', 'sleeping', 'alighting'].includes(frame.phase) ||
  (['toilet', 'work', 'read'].includes(frame.activity) &&
    ['sitting', 'acting', 'standing'].includes(frame.phase));

function checkLife(frame, previous) {
  assert(
    Object.values(frame.person)
      .filter((value) => typeof value === 'number')
      .every(Number.isFinite),
  );
  assert(frame.progress >= 0 && frame.progress <= 1);
  assert(frame.minute >= 0 && frame.minute < 1440);
  assert(frame.daylight >= 0 && frame.daylight <= 1);
  if (!onFixture(frame))
    assert(isRoomPositionSafe(frame.person), `生活路线进入家具：${frame.label}`);
  if (previous) {
    assert(
      apart(frame.person, previous.person) <= STUDY_DAILY_WALK_SPEED * delta + 1e-8,
      '切换活动时位置瞬移',
    );
    assert(
      Math.abs(frame.person.elevation - previous.person.elevation) <= 0.45 * delta + 1e-8,
      '上下床或坐下时高度瞬移',
    );
    assert(
      (frame.day - 1) * 1440 + frame.minute >= (previous.day - 1) * 1440 + previous.minute - 1e-8,
      '日钟倒退',
    );
  }
  if (frame.phase === 'acting' && frame.activity !== 'idle') {
    assert(
      apart(frame.person, HOME_ACTIVITY_SPOTS[frame.activity]) < 1e-8,
      `${frame.activity} 没有到对应物件前才开始`,
    );
    assert.equal(frame.person.moving, false);
  }
  if (frame.phase === 'sleeping') {
    assert(apart(frame.person, HOME_ACTIVITY_SPOTS.sleep) < 1e-8, '睡眠不在床上');
    assert.equal(frame.person.elevation, 0.9);
    assert.equal(frame.poseActivity, 'sleep');
  }
  if (['boarding', 'alighting'].includes(frame.phase) && frame.person.x - 0.22 < -4.3)
    assert(frame.person.elevation >= 0.62, '鞋或脚进入床沿之前高度尚未超过床垫');
  if (frame.activity === 'shower' && frame.phase === 'acting')
    assert.equal(frame.person.elevation, HOME_FIXTURES.shower.floorElevation, '淋浴脚底陷入底盘');
  const shower = HOME_FIXTURES.shower;
  if (
    frame.person.x > shower.x - shower.width / 2 - 0.2 &&
    frame.person.x < shower.x + shower.width / 2 &&
    frame.person.z > shower.z - shower.depth / 2 - 0.2 &&
    frame.person.z < shower.z + shower.depth / 2 &&
    !onFixture(frame)
  )
    assert(
      frame.person.elevation >= shower.floorElevation - 1e-8,
      '身体踏进淋浴盘边沿后才开始抬脚',
    );
  if (frame.phase === 'walking') assert.equal(frame.poseActivity, 'idle', '走路时仍举着活动道具');
}

for (const [a, b] of HOME_WALKING_LAYOUT.edges)
  assert(
    isRoomSegmentSafe(HOME_WALKING_LAYOUT.waypoints[a], HOME_WALKING_LAYOUT.waypoints[b]),
    `门洞导航连接 ${a}→${b} 穿墙或家具`,
  );

const life = createStudyDailyLife(seeded(1));
assert(life.cycleSeconds > 450 && life.cycleSeconds < 510, '完整一天不是约八分钟');
const performed = new Set();
const phases = new Set();
let previous = life.update(0);
let sleepStarted = -1;
let woke = false;
for (let i = 0; i < 32000; i++) {
  const frame = life.update(delta);
  checkLife(frame, previous);
  phases.add(frame.phase);
  if (frame.phase === 'acting' || frame.phase === 'sleeping') performed.add(frame.activity);
  if (frame.phase === 'sleeping' && previous.phase !== 'sleeping') sleepStarted = i * delta;
  if (frame.phase === 'alighting' && previous.phase === 'sleeping') {
    assert(
      Math.abs(i * delta - sleepStarted - STUDY_DAILY_SCHEDULE.at(-1).duration) <= delta * 2,
      '人物睡眠时长错误',
    );
    woke = true;
  }
  previous = frame;
}
for (const step of STUDY_DAILY_SCHEDULE)
  assert(performed.has(step.activity), `缺少活动 ${step.activity}`);
assert(woke && previous.day >= 3, '日程不能完成睡醒后的下一天');
for (const phase of [
  'walking',
  'acting',
  'sitting',
  'standing',
  'boarding',
  'sleeping',
  'alighting',
])
  assert(phases.has(phase));

// 每个关键阶段暂停都冻结位置、日钟和状态；恢复以后与未经过暂停的实例一致。
for (const phase of ['walking', 'acting', 'sitting', 'boarding', 'sleeping', 'alighting']) {
  const paused = createStudyDailyLife(seeded(4));
  const reference = createStudyDailyLife(seeded(4));
  let frame;
  for (let i = 0; i < 18000; i++) {
    frame = paused.update(delta);
    assert.deepEqual(frame, reference.update(delta));
    if (frame.phase === phase) break;
  }
  assert.equal(frame.phase, phase);
  const frozen = { ...frame, person: { ...frame.person, moving: false } };
  for (let i = 0; i < 90; i++) assert.deepEqual(paused.update(delta, { paused: true }), frozen);
  for (let i = 0; i < 90; i++) assert.deepEqual(paused.update(delta), reference.update(delta));
}

// 遇到猫或临时阻挡时不能隔空刷牙、跳到洗手台或让时钟先进入下一件事。
const blocked = createStudyDailyLife(seeded(2));
let blockedFrame = blocked.update(3);
assert.equal(blockedFrame.phase, 'walking');
blockedFrame = blocked.update(delta, { canMove: () => false });
const stopped = { ...blockedFrame, person: { ...blockedFrame.person, moving: false } };
for (let i = 0; i < 900; i++)
  assert.deepEqual(blocked.update(delta, { canMove: () => false }), stopped);
assert(blockedFrame.waiting);

let integratedDays = 0;
let integratedNaps = 0;
let integratedEncounters = 0;
for (const seed of [1, 7, 20261012, 92, 2026, 0xdeadbeef]) {
  const daily = createStudyDailyLife(seeded(seed));
  const companions = createStudyCompanions(seeded(seed + 1));
  let dailyFrame = daily.update(0);
  let companionFrame = companions.update(0, { personPose: dailyFrame.person, allowSocial: false });
  let lastChange = 0;
  let signature = '';
  for (let i = 0; i < 48000; i++) {
    const canMove = (from, to) => {
      const dx = to.x - from.x,
        dz = to.z - from.z;
      const squared = dx * dx + dz * dz;
      const t = squared
        ? Math.max(
            0,
            Math.min(
              1,
              ((companionFrame.cat.x - from.x) * dx + (companionFrame.cat.z - from.z) * dz) /
                squared,
            ),
          )
        : 0;
      return apart({ x: from.x + dx * t, z: from.z + dz * t }, companionFrame.cat) >= 0.47 - 1e-8;
    };
    const next = daily.update(delta, { paused: companionFrame.social !== 'wandering', canMove });
    checkLife(next, dailyFrame);
    const companion = companions.update(delta, {
      personPose: next.person,
      allowSocial: next.atRest,
      personWaiting: next.waiting,
    });
    assert.deepEqual(companion.person, next.person, '伙伴系统改写了生活日程的人物');
    assert(isRoomPositionSafe(companion.cat), '猫在给生活人物让路时穿墙');
    if (!onFixture(next))
      assert(apart(next.person, companion.cat) >= 0.45 - 1e-8, '每日活动中的人物和猫互相穿过');
    assert(apart(companion.cat, companionFrame.cat) <= 0.45 * delta + 1e-8, '猫让路时瞬移');
    if (companion.catRoutine === 'roaming' && companionFrame.catRoutine === 'leaving-home')
      integratedNaps++;
    const nextSignature = `${next.day}:${next.activity}:${next.phase}:${next.label}`;
    if (nextSignature !== signature) {
      lastChange = i;
      signature = nextSignature;
    }
    assert(
      i - lastChange < 6000,
      `生活和猫的避让互锁：seed=${seed} ${signature} ${JSON.stringify({ person: next.person, cat: companion.cat, routine: companion.catRoutine, yielding: companion.yielding })}`,
    );
    dailyFrame = next;
    companionFrame = companion;
  }
  assert(dailyFrame.day >= 3, `seed ${seed} 没有完成两天活动`);
  integratedDays += dailyFrame.day - 1;
  integratedEncounters += companionFrame.encounters;
}
assert(integratedNaps >= 6, '日程期间猫没有继续回窝睡觉');
assert(integratedEncounters > 0, '日程期间人物没有与猫互动');

// 外部日程的人物收起时猫没有隐形碰撞体；唤醒时重叠也必须连续退开。
const visibleCompanions = createStudyCompanions(seeded(3));
const externalPose = { ...HOME_ACTIVITY_SPOTS.idle, moving: false, elevation: 0 };
let hiddenPose = visibleCompanions.update(0, { personPose: externalPose, characterVisible: false });
assert.equal(apart(hiddenPose.cat, externalPose), 0);
let cleared = false;
for (let i = 0; i < 180; i++) {
  const frame = visibleCompanions.update(delta, {
    personPose: externalPose,
    characterVisible: true,
    allowSocial: false,
  });
  assert.deepEqual(frame.person, externalPose);
  assert(apart(frame.cat, hiddenPose.cat) <= 0.45 * delta + 1e-8);
  if (!cleared) {
    assert(apart(frame.cat, externalPose) >= apart(hiddenPose.cat, externalPose) - 1e-8);
    cleared = apart(frame.cat, externalPose) >= 0.47;
  }
  hiddenPose = frame;
}
assert(cleared, '外部人物唤醒时猫重叠锁死');
let hiddenNaps = 0;
for (let i = 0; i < 9000; i++) {
  const frame = visibleCompanions.update(delta, {
    personPose: externalPose,
    characterVisible: false,
    allowSocial: true,
  });
  assert.deepEqual(frame.person, externalPose);
  assert.equal(frame.petting, false);
  assert(isRoomPositionSafe(frame.cat));
  if (frame.catRoutine === 'roaming' && hiddenPose.catRoutine === 'leaving-home') hiddenNaps++;
  hiddenPose = frame;
}
assert(hiddenNaps >= 2, '外部人物收起后猫停止独立睡醒');
assert.deepEqual(HOME_BED_ENTRY, { x: -3.75, z: -1.82 });
assert.equal(HOME_TOILET_ENTRY.z, -2.8);
console.log(
  `生活验证通过：约 ${Math.round(life.cycleSeconds)} 秒一天、全部 ${performed.size} 类活动到位、上下床/坐下连续、暂停和阻挡保持日钟、${integratedDays} 天人与猫联动、${integratedNaps} 次猫睡醒、${integratedEncounters} 次互动。`,
);
