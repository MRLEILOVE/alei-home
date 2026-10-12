import {
  HOME_ACTIVITY_SPOTS,
  HOME_FIXTURES,
  HOME_BED_ENTRY,
  HOME_TOILET_ENTRY,
  HOME_WAYPOINT_INDEX,
  type HomeActivity,
} from './study-home-layout.ts';
import { createRoomRoaming, roomRoute, type FloorPoint } from './study-roaming.ts';

export type StudyDailyPhase =
  'walking' | 'acting' | 'sitting' | 'standing' | 'boarding' | 'sleeping' | 'alighting';
export type StudyDailyOptions = {
  paused?: boolean;
  canMove?: (from: FloorPoint, to: FloorPoint) => boolean;
};
type DailyStep = {
  activity: HomeActivity;
  label: string;
  minute: number;
  duration: number;
  waypoint?: number;
};

/** 一天约八分钟，日钟跟着实际完成的活动走，等猫让路或对话时不会赶进度。 */
export const STUDY_DAILY_SCHEDULE: readonly DailyStep[] = (
  [
    {
      activity: 'idle',
      label: '起床，伸个懒腰',
      minute: 400,
      duration: 3,
      waypoint: HOME_WAYPOINT_INDEX.sleep,
    },
    { activity: 'toilet', label: '早起如厕', minute: 410, duration: 6 },
    { activity: 'brush', label: '刷牙', minute: 420, duration: 9 },
    { activity: 'wash-face', label: '洗脸', minute: 430, duration: 7 },
    { activity: 'cook', label: '做早餐', minute: 440, duration: 17 },
    { activity: 'eat', label: '吃早餐', minute: 480, duration: 12 },
    { activity: 'wash-dishes', label: '洗早餐的碗', minute: 490, duration: 10 },
    { activity: 'clean', label: '擦台面，收拾厨房', minute: 510, duration: 8 },
    { activity: 'laundry', label: '洗衣服', minute: 540, duration: 11 },
    { activity: 'read', label: '在书桌前工作和阅读', minute: 600, duration: 32 },
    { activity: 'idle', label: '休息一会儿，陪陪狸花猫', minute: 660, duration: 14 },
    { activity: 'cook', label: '做午饭', minute: 710, duration: 17 },
    { activity: 'eat', label: '吃午饭', minute: 740, duration: 12 },
    { activity: 'wash-dishes', label: '洗午饭的碗', minute: 760, duration: 10 },
    { activity: 'clean', label: '收拾灶台和厨房', minute: 780, duration: 7 },
    { activity: 'read', label: '下午读书', minute: 840, duration: 27 },
    { activity: 'idle', label: '放松一下，等猫来撒娇', minute: 960, duration: 16 },
    { activity: 'laundry', label: '整理洗好的衣服', minute: 1000, duration: 9 },
    { activity: 'cook', label: '准备晚饭', minute: 1080, duration: 18 },
    { activity: 'eat', label: '吃晚饭', minute: 1140, duration: 13 },
    { activity: 'wash-dishes', label: '洗晚饭的碗', minute: 1170, duration: 10 },
    { activity: 'clean', label: '把厨房收拾干净', minute: 1200, duration: 9 },
    { activity: 'shower', label: '洗个热水澡', minute: 1240, duration: 14 },
    { activity: 'brush', label: '睡前刷牙', minute: 1260, duration: 8 },
    { activity: 'wash-face', label: '睡前洗脸', minute: 1270, duration: 6 },
    { activity: 'idle', label: '睡前休息，和猫道晚安', minute: 1290, duration: 12 },
    { activity: 'sleep', label: '关灯睡觉', minute: 1320, duration: 55 },
  ] satisfies DailyStep[]
).map((step) => ({ ...step, duration: step.duration * 0.8 }));

export const STUDY_DAILY_WALK_SPEED = 1.05;
const WALK_SPEED = STUDY_DAILY_WALK_SPEED;
const BED_LIFT_SECONDS = 3;
const BED_TRAVEL_SECONDS = 2.3;
const BED_POSE_SECONDS = 2.2;
const SEAT_SECONDS = 1;
const smooth = (value: number) => value * value * (3 - 2 * value);
const pointDistance = (a: FloorPoint, b: FloorPoint) => Math.hypot(a.x - b.x, a.z - b.z);
const isSeated = (activity: HomeActivity) => activity === 'eat' || activity === 'toilet';
const floorElevation = (point: FloorPoint) => {
  if (point.z < -1.9 || point.x < 4.45) return 0;
  const distance = pointDistance(point, HOME_ACTIVITY_SPOTS.shower);
  const blend = smooth(Math.max(0, Math.min(1, (1.5 - distance) / 0.46)));
  return blend * HOME_FIXTURES.shower.floorElevation;
};
const targetIndex = (step: DailyStep) => step.waypoint ?? HOME_WAYPOINT_INDEX[step.activity];

export function createStudyDailyLife(random: () => number = Math.random) {
  const walker = createRoomRoaming(random, {
    startIndex: HOME_WAYPOINT_INDEX.sleep,
    speed: WALK_SPEED,
  });
  let person = { ...walker.snapshot(), elevation: 0 };
  let index = 0;
  let cycle = 0;
  let phase: StudyDailyPhase = 'walking';
  let phaseElapsed = 0;
  let stepElapsed = 0;
  let waiting = false;
  const stepLengths = STUDY_DAILY_SCHEDULE.map((step, i) => {
    const from = i === 0 ? HOME_WAYPOINT_INDEX.sleep : targetIndex(STUDY_DAILY_SCHEDULE[i - 1]);
    return (
      roomRoute(from, targetIndex(step)).cost / WALK_SPEED +
      step.duration +
      (step.activity === 'sleep'
        ? 2 * (BED_LIFT_SECONDS + BED_TRAVEL_SECONDS + BED_POSE_SECONDS)
        : isSeated(step.activity)
          ? SEAT_SECONDS * 2
          : 0)
    );
  });
  walker.routeTo(targetIndex(STUDY_DAILY_SCHEDULE[0]));

  function currentPoseActivity(): HomeActivity {
    const activity = STUDY_DAILY_SCHEDULE[index].activity;
    if (phase === 'walking' || phase === 'standing' || phase === 'alighting') return 'idle';
    if (phase === 'boarding')
      return phaseElapsed >= BED_LIFT_SECONDS + BED_TRAVEL_SECONDS ? 'sleep' : 'idle';
    return activity;
  }

  function snapshot(paused = false) {
    const step = STUDY_DAILY_SCHEDULE[index];
    const progress = Math.min(1, stepElapsed / stepLengths[index]);
    const nextMinute =
      index + 1 < STUDY_DAILY_SCHEDULE.length ? STUDY_DAILY_SCHEDULE[index + 1].minute : 1840;
    const absoluteMinute = cycle * 1440 + step.minute + (nextMinute - step.minute) * progress;
    const minute = absoluteMinute % 1440;
    // 早晚逐渐变暗，睡眠中的夜色仍留有暖灯，不让人物和家具消失。
    const daylight = Math.max(0, Math.sin(((minute - 360) / 720) * Math.PI));
    return {
      person: { ...person, moving: paused ? false : person.moving },
      activity: step.activity,
      poseActivity: currentPoseActivity(),
      progress,
      minute,
      day: Math.floor(absoluteMinute / 1440) + 1,
      phase,
      label:
        phase === 'walking'
          ? `去${step.label}`
          : phase === 'boarding'
            ? '上床，躺下来'
            : phase === 'alighting'
              ? '醒来，起身下床'
              : step.label,
      daylight,
      atRest: step.activity === 'idle' && phase === 'acting',
      waiting,
    };
  }

  function advance() {
    index++;
    if (index === STUDY_DAILY_SCHEDULE.length) {
      index = 0;
      cycle++;
    }
    phase = 'walking';
    phaseElapsed = 0;
    stepElapsed = 0;
    waiting = false;
    walker.routeTo(targetIndex(STUDY_DAILY_SCHEDULE[index]));
  }

  function updateStep(delta: number, options: StudyDailyOptions) {
    const step = STUDY_DAILY_SCHEDULE[index];
    person.moving = false;
    waiting = false;
    if (phase === 'walking') {
      if (walker.isAtWaypoint(targetIndex(step))) {
        phase =
          step.activity === 'sleep' ? 'boarding' : isSeated(step.activity) ? 'sitting' : 'acting';
        phaseElapsed = 0;
        person.yaw =
          step.activity === 'sleep'
            ? 0
            : step.waypoint !== undefined
              ? 0
              : HOME_ACTIVITY_SPOTS[step.activity].yaw;
      } else {
        const before = { ...walker.position };
        const pose = walker.update(delta, false, options.canMove);
        person = { ...pose, elevation: floorElevation(pose) };
        const moved = pointDistance(before, pose);
        waiting = moved < 1e-10;
        // 等待让路时连日钟也暂停，避免进入下一项活动后仍留在走廊。
        stepElapsed += moved / WALK_SPEED;
        return;
      }
    }
    phaseElapsed += delta;
    stepElapsed += delta;
    if (phase === 'boarding') {
      const lift = smooth(Math.min(1, phaseElapsed / BED_LIFT_SECONDS));
      const t = smooth(
        Math.max(0, Math.min(1, (phaseElapsed - BED_LIFT_SECONDS) / BED_TRAVEL_SECONDS)),
      );
      walker.position.x = HOME_BED_ENTRY.x + (HOME_ACTIVITY_SPOTS.sleep.x - HOME_BED_ENTRY.x) * t;
      walker.position.z = HOME_BED_ENTRY.z;
      person = {
        ...walker.position,
        yaw: 0,
        moving: phaseElapsed < BED_LIFT_SECONDS + BED_TRAVEL_SECONDS,
        elevation: lift * 0.9,
      };
      if (phaseElapsed >= BED_LIFT_SECONDS + BED_TRAVEL_SECONDS + BED_POSE_SECONDS) {
        phase = 'sleeping';
        phaseElapsed = 0;
        person.moving = false;
      }
    } else if (phase === 'sleeping') {
      person = { ...HOME_ACTIVITY_SPOTS.sleep, moving: false, elevation: 0.9 };
      if (phaseElapsed >= step.duration) {
        phase = 'alighting';
        phaseElapsed = 0;
      }
    } else if (phase === 'alighting') {
      const t = smooth(
        Math.max(0, Math.min(1, (phaseElapsed - BED_POSE_SECONDS) / BED_TRAVEL_SECONDS)),
      );
      const lowered = smooth(
        Math.max(
          0,
          Math.min(1, (phaseElapsed - BED_POSE_SECONDS - BED_TRAVEL_SECONDS) / BED_LIFT_SECONDS),
        ),
      );
      walker.position.x =
        HOME_ACTIVITY_SPOTS.sleep.x + (HOME_BED_ENTRY.x - HOME_ACTIVITY_SPOTS.sleep.x) * t;
      walker.position.z = HOME_BED_ENTRY.z;
      person = {
        ...walker.position,
        yaw: 0,
        moving: phaseElapsed > BED_POSE_SECONDS && t < 1,
        elevation: (1 - lowered) * 0.9,
      };
      if (phaseElapsed >= BED_POSE_SECONDS + BED_TRAVEL_SECONDS + BED_LIFT_SECONDS) {
        person.elevation = 0;
        advance();
      }
    } else if (phase === 'sitting') {
      const blend = smooth(Math.min(1, phaseElapsed / SEAT_SECONDS));
      person.elevation = blend * 0.18;
      if (step.activity === 'toilet') {
        person.z =
          HOME_TOILET_ENTRY.z + (HOME_ACTIVITY_SPOTS.toilet.z - HOME_TOILET_ENTRY.z) * blend;
        walker.position.z = person.z;
      }
      if (phaseElapsed >= SEAT_SECONDS) {
        phase = 'acting';
        phaseElapsed = 0;
      }
    } else if (phase === 'standing') {
      const blend = smooth(Math.min(1, phaseElapsed / SEAT_SECONDS));
      person.elevation = (1 - blend) * 0.18;
      if (step.activity === 'toilet') {
        person.z =
          HOME_ACTIVITY_SPOTS.toilet.z +
          (HOME_TOILET_ENTRY.z - HOME_ACTIVITY_SPOTS.toilet.z) * blend;
        walker.position.z = person.z;
      }
      if (phaseElapsed >= SEAT_SECONDS) {
        person.elevation = 0;
        advance();
      }
    } else if (phase === 'acting' && phaseElapsed >= step.duration) {
      if (isSeated(step.activity)) {
        phase = 'standing';
        phaseElapsed = 0;
      } else advance();
    }
  }

  return {
    position: walker.position,
    cycleSeconds: stepLengths.reduce((total, value) => total + value, 0),
    update(delta: number, options: StudyDailyOptions = {}) {
      if (options.paused || !Number.isFinite(delta) || delta <= 0) return snapshot(true);
      while (delta > 1e-8) {
        const step = Math.min(delta, 1 / 30);
        delta -= step;
        updateStep(step, options);
      }
      return snapshot();
    },
  };
}
