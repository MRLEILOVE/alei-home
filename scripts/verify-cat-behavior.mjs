import assert from 'node:assert/strict';
import { createStudyCompanions } from '../src/scripts/study-companions.ts';
import { isRoomPositionSafe } from '../src/scripts/study-roaming.ts';
import { STUDY_CAT_HOME } from '../src/scripts/study-cat-home.ts';

function randomWithSeed(initial) {
  let seed = initial >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const delta = 1 / 30;
const apart = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function checkFrame(frame, previous, visible = true) {
  assert(isRoomPositionSafe(frame.person), '小阿雷走入家具或越出房间');
  assert(isRoomPositionSafe(frame.cat), '狸花猫走入家具或越出房间');
  for (const actor of ['person', 'cat']) {
    assert(
      Object.values(frame[actor])
        .filter((value) => typeof value === 'number')
        .every(Number.isFinite),
    );
    if (previous)
      assert(
        apart(frame[actor], previous[actor]) <= (actor === 'cat' ? 0.45 : 0.4) * delta + 1e-8,
        `${actor} 在状态切换时瞬移`,
      );
  }
  if (visible) assert(apart(frame.person, frame.cat) >= 0.45 - 1e-8, '人物和猫身体互相穿过');
  assert(frame.cat.bedBlend >= 0 && frame.cat.bedBlend <= 1, '猫窝抬脚比例越界');
  if (previous)
    assert(
      Math.abs(frame.cat.bedBlend - previous.cat.bedBlend) <= ((1.5 * 0.45) / 0.5) * delta + 1e-8,
      '进出猫窝时抬脚瞬移',
    );
  if (frame.cat.mode === 'sleep') {
    assert(['settling', 'sleeping'].includes(frame.catRoutine), '猫在散步途中进入睡姿');
    assert.deepEqual(
      { x: frame.cat.x, z: frame.cat.z },
      STUDY_CAT_HOME.position,
      '猫没有回到窝里便入睡',
    );
    assert.equal(frame.cat.bedBlend, 1, '睡觉时脚底不在垫面');
    assert.equal(frame.cat.moving, false, '睡觉时仍在走动');
  }
  if (frame.catRoutine !== 'roaming') {
    assert.equal(frame.petting, false, '回窝或睡眠阶段仍在抚摸');
    assert.equal(frame.social, 'wandering');
  }
  if (frame.petting) {
    assert.equal(frame.social, 'rubbing');
    assert.equal(frame.cat.mode, 'rub');
    assert.equal(frame.person.moving, false);
    assert(Math.abs(apart(frame.person, frame.cat) - 0.6) < 1e-6, '抚摸时猫没有停在腿旁');
  }
}

let totalEncounters = 0;
let totalNaps = 0;
for (const seed of [20261012, 1, 7, 92, 2026, 0xdeadbeef]) {
  const companions = createStudyCompanions(randomWithSeed(seed));
  let previous = companions.update(0);
  let sawApproach = false;
  let sawDeparture = false;
  let wanderedAfterPetting = false;
  let sleptAt = -1;
  let completedNaps = 0;
  let beganGoingHome = -1;
  let wokeAt = -1;
  for (let i = 0; i < 36000; i++) {
    const frame = companions.update(delta);
    checkFrame(frame, previous);
    sawApproach ||= frame.social === 'approaching';
    sawDeparture ||= frame.social === 'departing';
    wanderedAfterPetting ||=
      frame.encounters > 0 && frame.social === 'wandering' && frame.cat.moving;
    if (beganGoingHome < 0 && frame.catRoutine === 'going-home') beganGoingHome = i * delta;
    if (wokeAt >= 0 && frame.catRoutine === 'going-home' && previous.catRoutine === 'roaming') {
      const awakeDuration = i * delta - wokeAt;
      assert(
        awakeDuration >= 60 - delta && awakeDuration <= 104,
        '睡醒后没有保留60–90秒散步及已开始的互动',
      );
    }
    if (frame.catRoutine === 'sleeping' && previous.catRoutine !== 'sleeping') sleptAt = i * delta;
    if (frame.catRoutine === 'waking' && previous.catRoutine === 'sleeping') {
      const duration = i * delta - sleptAt;
      assert(duration >= 18 - delta && duration <= 28 + delta, '猫的睡眠时长不符合18–28秒');
    }
    if (frame.catRoutine === 'roaming' && previous.catRoutine === 'leaving-home') {
      completedNaps++;
      wokeAt = i * delta;
      assert.equal(frame.cat.bedBlend, 0, '出窝后脚底没有回到地板');
    }
    previous = frame;
  }
  assert(
    beganGoingHome >= 20 - delta && beganGoingHome <= 30 + delta,
    '首次回窝没有在约20–30秒开始',
  );
  assert(completedNaps >= 2, `种子 ${seed} 没有完成两个睡醒周期`);
  assert(previous.encounters > 0, `种子 ${seed} 没有发生同伴互动`);
  assert(
    sawApproach && sawDeparture && wanderedAfterPetting,
    '互动没有完成接近、蹭腿、分开和恢复散步',
  );
  totalEncounters += previous.encounters;
  totalNaps += completedNaps;
}

// 困意不会截断已经开始的问候，睡醒后也仍有自然互动。
const beforeAndAfterSleep = createStudyCompanions(randomWithSeed(10));
let firstNapEncounters = -1;
let afterNapEncounters = -1;
for (let i = 0; i < 18000; i++) {
  const frame = beforeAndAfterSleep.update(delta);
  if (firstNapEncounters < 0 && frame.catRoutine === 'sleeping')
    firstNapEncounters = frame.encounters;
  if (firstNapEncounters >= 0 && frame.encounters > firstNapEncounters) {
    afterNapEncounters = frame.encounters;
    break;
  }
}
assert(firstNapEncounters >= 0, '没有观察到猫回窝睡觉');
assert(afterNapEncounters > firstNapEncounters, '睡醒后不再与小阿雷互动');

// 全局暂停应冻结回窝、睡觉、起身和出窝的时间与位置。
for (const routine of ['going-home', 'sleeping', 'waking', 'leaving-home']) {
  const pausedRoutine = createStudyCompanions(randomWithSeed(1));
  const referenceRoutine = createStudyCompanions(randomWithSeed(1));
  let pose;
  for (let i = 0; i < 18000; i++) {
    pose = pausedRoutine.update(delta);
    assert.deepEqual(pose, referenceRoutine.update(delta));
    if (pose.catRoutine === routine) break;
  }
  assert.equal(pose.catRoutine, routine);
  const frozen = {
    ...pose,
    person: { ...pose.person, moving: false },
    cat: { ...pose.cat, moving: false },
  };
  for (let i = 0; i < 1800; i++)
    assert.deepEqual(pausedRoutine.update(delta, { paused: true }), frozen);
  for (let i = 0; i < 300; i++)
    assert.deepEqual(pausedRoutine.update(delta), referenceRoutine.update(delta));
}

// 暂停连随机状态和互动倒计时都应保持，恢复后与没有经过暂停的实例一致。
const paused = createStudyCompanions(randomWithSeed(20261012));
const reference = createStudyCompanions(randomWithSeed(20261012));
let pausedPose;
for (let i = 0; i < 12000; i++) {
  pausedPose = paused.update(delta);
  assert.deepEqual(pausedPose, reference.update(delta));
  if (pausedPose.petting) break;
}
assert(pausedPose.petting, '未找到可验证的抚摸状态');
const stationary = {
  ...pausedPose,
  person: { ...pausedPose.person, moving: false },
  cat: { ...pausedPose.cat, moving: false },
};
for (let i = 0; i < 1800; i++) assert.deepEqual(paused.update(delta, { paused: true }), stationary);
for (let i = 0; i < 300; i++) assert.deepEqual(paused.update(delta), reference.update(delta));

// 小阿雷正在对话时，猫窝中的猫仍按自己的计时醒来并走出猫窝。
const sleepingDialogue = createStudyCompanions(randomWithSeed(7));
let sleepingDialoguePose = sleepingDialogue.update(0);
for (let i = 0; i < 6000 && sleepingDialoguePose.catRoutine !== 'sleeping'; i++)
  sleepingDialoguePose = sleepingDialogue.update(delta);
assert.equal(sleepingDialoguePose.catRoutine, 'sleeping');
const sleepingDialoguePerson = { ...sleepingDialogue.personPosition };
let wokeDuringDialogue = false;
for (let i = 0; i < 1200; i++) {
  const frame = sleepingDialogue.update(delta, { characterPaused: true });
  checkFrame(frame, sleepingDialoguePose);
  assert.deepEqual(sleepingDialogue.personPosition, sleepingDialoguePerson);
  wokeDuringDialogue ||= ['waking', 'leaving-home', 'roaming'].includes(frame.catRoutine);
  sleepingDialoguePose = frame;
}
assert(wokeDuringDialogue, '人物对话阻止了猫窝中的猫醒来');

// 点击小阿雷时中止蹭腿，猫沿原路离开；关闭对话以后两者继续散步。
const dialogue = createStudyCompanions(randomWithSeed(20261012));
let previous = dialogue.update(0);
for (let i = 0; i < 12000 && !previous.petting; i++) previous = dialogue.update(delta);
assert(previous.petting);
const personBeforeDialogue = { ...dialogue.personPosition };
for (let i = 0; i < 600; i++) {
  const frame = dialogue.update(delta, { characterPaused: true });
  checkFrame(frame, previous);
  assert.equal(frame.petting, false, '打开对话以后仍在抚摸');
  assert.deepEqual(dialogue.personPosition, personBeforeDialogue, '对话期间小阿雷继续走动');
  previous = frame;
}
let resumed = false;
for (let i = 0; i < 900; i++) {
  const frame = dialogue.update(delta);
  checkFrame(frame, previous);
  resumed ||= frame.person.moving;
  previous = frame;
}
assert(resumed, '关闭对话后小阿雷没有恢复走动');

// 收起小阿雷后，猫继续独立散步，且不触发对着隐形人物的社交动作。
const hidden = createStudyCompanions(randomWithSeed(1));
previous = hidden.update(0);
const catStart = { ...hidden.catPosition };
let catMoved = false;
for (let i = 0; i < 1800; i++) {
  const frame = hidden.update(delta, { characterVisible: false });
  checkFrame(frame, previous, false);
  assert.equal(frame.petting, false);
  assert.equal(frame.encounters, 0);
  catMoved ||= apart(catStart, frame.cat) > 1;
  previous = frame;
}
assert(catMoved, '收起人物后猫没有独立散步');
let hiddenNaps = 0;
for (let i = 0; i < 12000; i++) {
  const frame = hidden.update(delta, { characterVisible: false });
  checkFrame(frame, previous, false);
  assert.equal(frame.encounters, 0);
  if (frame.catRoutine === 'roaming' && previous.catRoutine === 'leaving-home') hiddenNaps++;
  previous = frame;
}
assert(hiddenNaps >= 2, '收起人物后猫没有继续自己的睡醒循环');

// 外部日程的人物挡在猫窝入口时收起，猫也应解除等待并回窝。
const hiddenDuringYield = createStudyCompanions(randomWithSeed(8));
const gatewayPerson = { ...STUDY_CAT_HOME.position, x: -5.75, z: 3, yaw: 0, moving: false };
let yieldPose = hiddenDuringYield.update(0);
for (let i = 0; i < 2400; i++) {
  const frame = hiddenDuringYield.update(delta, { personPose: gatewayPerson, allowSocial: false });
  assert(isRoomPositionSafe(frame.cat));
  assert(apart(frame.person, frame.cat) >= 0.45 - 1e-8);
  yieldPose = frame;
}
assert.equal(yieldPose.catRoutine, 'going-home');
assert.deepEqual(hiddenDuringYield.personPosition, { x: gatewayPerson.x, z: gatewayPerson.z });
let napsAfterHidingDuringYield = 0;
for (let i = 0; i < 9000; i++) {
  const frame = hiddenDuringYield.update(delta, {
    characterVisible: false,
    personPose: gatewayPerson,
    allowSocial: false,
  });
  checkFrame(frame, yieldPose, false);
  if (frame.catRoutine === 'roaming' && yieldPose.catRoutine === 'leaving-home')
    napsAfterHidingDuringYield++;
  yieldPose = frame;
}
assert(napsAfterHidingDuringYield >= 1, '收起挡路人物后猫仍困在回窝让路状态');

// 隐形人物没有碰撞体；猫恰好经过其位置时唤醒，应连续退开而不是卡住。
const waking = createStudyCompanions(randomWithSeed(1));
previous = waking.update(0);
for (let i = 0; i < 36000 && apart(previous.person, previous.cat) >= 0.4; i++)
  previous = waking.update(delta, { characterVisible: false });
assert(apart(previous.person, previous.cat) < 0.4, '没有覆盖唤醒重叠的边界情况');
let recovered = false;
for (let i = 0; i < 180; i++) {
  const frame = waking.update(delta);
  checkFrame(frame, previous, recovered);
  if (!recovered) {
    assert(apart(frame.person, frame.cat) >= apart(previous.person, previous.cat) - 1e-8);
    recovered = apart(frame.person, frame.cat) >= 0.47;
  }
  previous = frame;
}
assert(recovered, '唤醒后人物与猫重叠锁死');
console.log(
  `狸花猫行为验证通过：216000 帧安全行走、${totalNaps} 个睡醒周期、${totalEncounters} 次自然互动、猫窝抬脚与睡眠位置、无瞬移、暂停恢复、对话中断与人物收起。`,
);
