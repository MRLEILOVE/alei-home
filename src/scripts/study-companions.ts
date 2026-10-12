import {
  createRoomRoaming,
  isRoomSegmentSafe,
  ROOM_ROAMING_LAYOUT,
  type FloorPoint,
  type RoomRoamingPose,
} from './study-roaming.ts';
import { STUDY_CAT_HOME } from './study-cat-home.ts';
import { HOME_CAT_WAYPOINTS, HOME_WAYPOINT_INDEX } from './study-home-layout.ts';

export type StudyCompanionOptions = {
  paused?: boolean;
  characterPaused?: boolean;
  characterVisible?: boolean;
  /** 每日作息拥有人的位置；伙伴系统只能让猫避让，不能擅自改人的路线。 */
  personPose?: RoomRoamingPose & { elevation?: number };
  allowSocial?: boolean;
  personWaiting?: boolean;
};

type SocialState = 'wandering' | 'approaching' | 'rubbing' | 'departing';
type CatMode = 'idle' | 'rub' | 'sit' | 'sleep';
type CatRoutine = 'roaming' | 'going-home' | 'settling' | 'sleeping' | 'waking' | 'leaving-home';

const CAT_SPEED = 0.45;
const MIN_SEPARATION = 0.47;
const PET_DISTANCE = 0.6;
const distance = (a: FloorPoint, b: FloorPoint) => Math.hypot(a.x - b.x, a.z - b.z);
const facing = (from: FloorPoint, to: FloorPoint) => Math.atan2(to.x - from.x, to.z - from.z);

// 检查整步和同伴的距离，避免低帧率时从另一侧穿过去。
function separatedStep(from: FloorPoint, to: FloorPoint, other: FloorPoint) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((other.x - from.x) * dx + (other.z - from.z) * dz) / lengthSquared))
    : 0;
  const nearest = distance({ x: from.x + dx * t, z: from.z + dz * t }, other);
  const startDistance = distance(from, other);
  if (startDistance < MIN_SEPARATION) {
    // 收起期间不与隐形人物碰撞；唤醒恰好重叠时允许连续退开，不能锁死或瞬移。
    return nearest >= startDistance - 1e-8 && distance(to, other) > startDistance + 1e-10;
  }
  return nearest >= MIN_SEPARATION;
}

export function createStudyCompanions(random: () => number = Math.random) {
  const person = createRoomRoaming(random, { allowedWaypoints: HOME_CAT_WAYPOINTS });
  const cat = createRoomRoaming(random, {
    startIndex: HOME_WAYPOINT_INDEX.idle,
    speed: CAT_SPEED,
    allowedWaypoints: HOME_CAT_WAYPOINTS,
  });
  let personPose = person.snapshot();
  let catPose = cat.snapshot();
  let social: SocialState = 'wandering';
  let catMode: CatMode = 'idle';
  let cooldown = 6 + random() * 4;
  let rubTime = 0;
  let phaseTime = 0;
  let returnPoint: FloorPoint | null = null;
  let petPoint: FloorPoint | null = null;
  let returning = false;
  let encounters = 0;
  let catRoutine: CatRoutine = 'roaming';
  let sleepyIn = 20 + random() * 10;
  let routineTime = 0;
  let sleepRemaining = 0;
  let homeLeg = false;
  let homeYielding = false;
  let graphYielding = false;
  let graphYieldTime = 0;
  let bedBlend = 0;
  let externalPerson = false;
  let allowSocial = true;
  let personWaiting = false;
  let seekingPerson = false;
  let yieldPoint: FloorPoint | null = null;
  let yieldOrigin: FloorPoint | null = null;
  let yieldHistory: FloorPoint[] = [];
  let yieldPhase: 'aside' | 'waiting' | 'returning' = 'aside';
  const gateway = ROOM_ROAMING_LAYOUT.waypoints[STUDY_CAT_HOME.gatewayIndex];
  if (!isRoomSegmentSafe(gateway, STUDY_CAT_HOME.position))
    throw new Error('猫窝入口必须与现有散步路径安全相连');

  const snapshot = (paused = false) => ({
    person: { ...personPose, moving: paused ? false : personPose.moving },
    cat: { ...catPose, moving: paused ? false : catPose.moving, mode: catMode, bedBlend },
    petting: social === 'rubbing',
    social,
    encounters,
    catRoutine,
    yielding: yieldPoint ? yieldPhase : null,
  });

  function beginDeparture() {
    social = 'departing';
    catMode = 'idle';
    returning = true;
    phaseTime = 0;
  }

  function finishEncounter() {
    social = 'wandering';
    cooldown = 18 + random() * 17;
    returnPoint = null;
    petPoint = null;
    catMode = 'idle';
    if (seekingPerson) {
      seekingPerson = false;
      cat.resumeRoaming();
    }
  }

  function moveCatTo(target: FloorPoint, delta: number, collisionEnabled: boolean) {
    const remaining = distance(cat.position, target);
    const step = Math.min(remaining, CAT_SPEED * delta);
    const next =
      remaining > 0
        ? {
            x: cat.position.x + ((target.x - cat.position.x) / remaining) * step,
            z: cat.position.z + ((target.z - cat.position.z) / remaining) * step,
          }
        : { ...target };
    if (collisionEnabled && !separatedStep(cat.position, next, person.position)) {
      catPose = { ...catPose, moving: false };
      return false;
    }
    const yaw = remaining > 0 ? facing(cat.position, target) : catPose.yaw;
    cat.position.x = next.x;
    cat.position.z = next.z;
    catPose = { ...next, yaw, moving: remaining > step };
    return remaining <= step;
  }

  function beginEncounter() {
    if (!allowSocial) return;
    const apart = distance(cat.position, person.position);
    if (apart > 0.95 || apart < MIN_SEPARATION) return;
    const target = {
      x: person.position.x + ((cat.position.x - person.position.x) / apart) * PET_DISTANCE,
      z: person.position.z + ((cat.position.z - person.position.z) / apart) * PET_DISTANCE,
    };
    if (!isRoomSegmentSafe(cat.position, target)) {
      // 家具旁没有足够空间时，等下次走到开阔地再问候。
      cooldown = 8;
      return;
    }
    returnPoint = { ...cat.position };
    petPoint = target;
    social = 'approaching';
    phaseTime = 0;
    if (!externalPerson)
      personPose = { ...personPose, moving: false, yaw: facing(person.position, cat.position) };
  }

  function stepPerson(
    delta: number,
    paused: boolean,
    guard: (from: FloorPoint, to: FloorPoint) => boolean,
  ) {
    if (!externalPerson) personPose = person.update(delta, paused, guard);
  }

  function beginSideYield() {
    if (!externalPerson || yieldPoint || distance(cat.position, person.position) > 1.05)
      return false;
    const dx = cat.position.x - person.position.x;
    const dz = cat.position.z - person.position.z;
    const length = Math.hypot(dx, dz) || 1;
    const candidates = [
      {
        x: cat.position.x + Math.cos(personPose.yaw) * 0.75,
        z: cat.position.z - Math.sin(personPose.yaw) * 0.75,
      },
      {
        x: cat.position.x - Math.cos(personPose.yaw) * 0.75,
        z: cat.position.z + Math.sin(personPose.yaw) * 0.75,
      },
      { x: cat.position.x - (dz / length) * 0.75, z: cat.position.z + (dx / length) * 0.75 },
      { x: cat.position.x + (dz / length) * 0.75, z: cat.position.z - (dx / length) * 0.75 },
      { x: cat.position.x + (dx / length) * 0.7, z: cat.position.z + (dz / length) * 0.7 },
      { x: cat.position.x + 0.7, z: cat.position.z },
      { x: cat.position.x - 0.7, z: cat.position.z },
      { x: cat.position.x, z: cat.position.z + 0.7 },
      { x: cat.position.x, z: cat.position.z - 0.7 },
      { x: cat.position.x + 0.2, z: cat.position.z },
      { x: cat.position.x - 0.2, z: cat.position.z },
      { x: cat.position.x, z: cat.position.z + 0.2 },
      { x: cat.position.x, z: cat.position.z - 0.2 },
    ];
    const target = candidates.find(
      (point) =>
        isRoomSegmentSafe(cat.position, point) &&
        separatedStep(cat.position, point, person.position),
    );
    if (!target) return false;
    yieldPoint = target;
    yieldOrigin = { ...cat.position };
    yieldHistory = [{ ...cat.position }];
    yieldPhase = 'aside';
    return true;
  }

  function updateSideYield(delta: number, collisionEnabled: boolean) {
    if (!yieldPoint || !yieldOrigin) return false;
    if (yieldPhase === 'aside') {
      if (moveCatTo(yieldPoint, delta, collisionEnabled)) yieldPhase = 'waiting';
      else if (!catPose.moving && personWaiting) yieldPhase = 'waiting';
    } else if (yieldPhase === 'waiting') {
      catPose = { ...catPose, moving: false };
      if (personWaiting && distance(person.position, cat.position) < 0.65) {
        // 遇到折线拐角，第一次侧让仍挡在下一条路线上时再横向让开。
        const candidates = [-1, 1]
          .map((side) => ({
            x: cat.position.x + Math.cos(personPose.yaw) * 0.7 * side,
            z: cat.position.z - Math.sin(personPose.yaw) * 0.7 * side,
          }))
          .concat([
            { x: cat.position.x + 0.7, z: cat.position.z },
            { x: cat.position.x - 0.7, z: cat.position.z },
            { x: cat.position.x, z: cat.position.z + 0.7 },
            { x: cat.position.x, z: cat.position.z - 0.7 },
            { x: cat.position.x + 0.2, z: cat.position.z },
            { x: cat.position.x - 0.2, z: cat.position.z },
            { x: cat.position.x, z: cat.position.z + 0.2 },
            { x: cat.position.x, z: cat.position.z - 0.2 },
          ]);
        const next = candidates.find(
          (point) =>
            isRoomSegmentSafe(cat.position, point) &&
            separatedStep(cat.position, point, person.position),
        );
        if (next) {
          yieldHistory.push({ ...cat.position });
          yieldPoint = next;
          yieldPhase = 'aside';
        }
      }
      if (!collisionEnabled || distance(person.position, yieldOrigin) > 1.15)
        yieldPhase = 'returning';
    } else if (moveCatTo(yieldHistory[yieldHistory.length - 1], delta, collisionEnabled)) {
      yieldHistory.pop();
      if (!yieldHistory.length) {
        yieldPoint = null;
        yieldOrigin = null;
      }
    } else if (!catPose.moving && personWaiting) {
      yieldPhase = 'waiting';
    }
    return true;
  }

  function roam(delta: number, characterPaused: boolean, collisionEnabled: boolean) {
    let personBlocked = false;
    let catBlocked = false;
    const wakingOverCat =
      collisionEnabled && distance(person.position, cat.position) < MIN_SEPARATION;
    if (wakingOverCat) cat.turnAway(person.position);
    if (externalPerson && personWaiting && distance(cat.position, person.position) < 1.05)
      if (!cat.turnAway(person.position)) beginSideYield();
    stepPerson(delta, characterPaused || wakingOverCat, (_from, to) => {
      if (!collisionEnabled || separatedStep(_from, to, cat.position)) return true;
      personBlocked = true;
      return false;
    });
    catPose = cat.update(delta, false, (_from, to) => {
      if (
        isRoomSegmentSafe(_from, to) &&
        (!collisionEnabled || separatedStep(_from, to, person.position))
      )
        return true;
      catBlocked = true;
      return false;
    });
    if (
      cooldown <= 0 &&
      !characterPaused &&
      collisionEnabled &&
      !personPose.moving &&
      !catPose.moving
    ) {
      beginEncounter();
      if (social !== 'wandering') return;
    }
    if (collisionEnabled && (personBlocked || catBlocked)) {
      // 狭窄连接上由猫先让路；猫在尽头无法后退时由小阿雷回头。
      if (!cat.turnAway(person.position)) {
        if (externalPerson) beginSideYield();
        else if (!characterPaused) person.turnAway(cat.position);
      }
    }
  }

  function startGoingHome() {
    catRoutine = 'going-home';
    catMode = 'idle';
    homeLeg = false;
    homeYielding = false;
    graphYielding = false;
    graphYieldTime = 0;
    routineTime = 0;
    seekingPerson = false;
    cat.routeTo(STUDY_CAT_HOME.gatewayIndex);
  }

  function updateHomeRoutine(delta: number, characterPaused: boolean, collisionEnabled: boolean) {
    let personBlocked = false;
    const wakingOverCat =
      collisionEnabled && distance(person.position, cat.position) < MIN_SEPARATION;
    stepPerson(delta, characterPaused || wakingOverCat, (from, to) => {
      if (!collisionEnabled || separatedStep(from, to, cat.position)) return true;
      personBlocked = true;
      return false;
    });
    routineTime += delta;
    if (catRoutine === 'going-home' || catRoutine === 'leaving-home') {
      let catBlocked = false;
      if (catRoutine === 'going-home' && !homeLeg) {
        if (graphYielding) {
          graphYieldTime = Math.max(0, graphYieldTime - delta);
          if (
            graphYieldTime <= 0 &&
            (!collisionEnabled ||
              (distance(person.position, gateway) > 1.4 &&
                distance(person.position, cat.position) > 1.1))
          ) {
            graphYielding = false;
            cat.routeTo(STUDY_CAT_HOME.gatewayIndex);
          }
        }
        if (wakingOverCat) cat.turnAway(person.position);
        catPose = cat.update(delta, false, (from, to) => {
          if (!collisionEnabled || separatedStep(from, to, person.position)) return true;
          catBlocked = true;
          return false;
        });
        homeLeg = !graphYielding && cat.isAtWaypoint(STUDY_CAT_HOME.gatewayIndex);
      } else {
        if (homeYielding && (!collisionEnabled || distance(person.position, gateway) > 0.85))
          homeYielding = false;
        const destination =
          catRoutine === 'going-home' || homeYielding ? STUDY_CAT_HOME.position : gateway;
        const arrived = moveCatTo(destination, delta, collisionEnabled);
        catBlocked = !arrived && !catPose.moving;
        // 前爪先于身体中心到达窝边，提早抬脚；出窝时用同一曲线平滑落地。
        const lift = Math.max(
          0,
          Math.min(1, (0.75 - distance(cat.position, STUDY_CAT_HOME.position)) / 0.5),
        );
        bedBlend = lift * lift * (3 - 2 * lift);
        if (arrived && !homeYielding) {
          routineTime = 0;
          if (catRoutine === 'going-home') {
            catRoutine = 'settling';
            catMode = 'sleep';
            catPose = { ...cat.position, moving: false, yaw: STUDY_CAT_HOME.sleepingYaw };
          } else {
            catRoutine = 'roaming';
            catMode = 'idle';
            bedBlend = 0;
            sleepyIn = 60 + random() * 30;
            cat.resumeRoaming();
          }
        }
      }
      if (collisionEnabled && (personBlocked || catBlocked) && externalPerson) {
        if (!homeLeg) {
          cat.resumeRoaming();
          graphYielding = true;
          graphYieldTime = 2;
          if (!cat.turnAway(person.position)) beginSideYield();
        } else if (catRoutine === 'leaving-home') homeYielding = true;
      } else if (collisionEnabled && (personBlocked || catBlocked) && !characterPaused) {
        // 回窝时小阿雷先让路；他正在对话便等候，不压缩家具和人物的安全间距。
        if (graphYielding) {
          if (!cat.turnAway(person.position)) person.turnAway(cat.position);
        } else if (!person.turnAway(cat.position)) {
          if (!homeLeg) {
            cat.resumeRoaming();
            cat.turnAway(person.position);
            graphYielding = true;
            graphYieldTime = 10;
          } else if (catRoutine === 'leaving-home') {
            // 入口的尽头只有一条路时，猫先退回窝，让人物离开尽头再出门。
            homeYielding = true;
          }
        }
      }
      if (catBlocked) catMode = 'sit';
      else if (catRoutine === 'going-home' || catRoutine === 'leaving-home') catMode = 'idle';
      return;
    }
    catPose = { ...cat.position, yaw: STUDY_CAT_HOME.sleepingYaw, moving: false };
    if (catRoutine === 'settling' && routineTime >= 1.6) {
      catRoutine = 'sleeping';
      sleepRemaining = 18 + random() * 10;
      routineTime = 0;
    } else if (catRoutine === 'sleeping') {
      sleepRemaining -= delta;
      if (sleepRemaining <= 0) {
        catRoutine = 'waking';
        catMode = 'idle';
        routineTime = 0;
      }
    } else if (catRoutine === 'waking' && routineTime >= 1.8) {
      catRoutine = 'leaving-home';
      routineTime = 0;
    }
  }

  return {
    personPosition: person.position,
    catPosition: cat.position,
    update(delta: number, options: StudyCompanionOptions = {}) {
      externalPerson = Boolean(options.personPose);
      allowSocial = options.allowSocial !== false;
      personWaiting = Boolean(options.personWaiting);
      if (options.personPose) {
        person.position.x = options.personPose.x;
        person.position.z = options.personPose.z;
        personPose = { ...options.personPose };
      }
      if (options.paused || !Number.isFinite(delta) || delta <= 0) return snapshot(true);
      const collisionEnabled = options.characterVisible !== false;
      const characterPaused = Boolean(options.characterPaused) || !collisionEnabled;
      if (
        (characterPaused || !collisionEnabled || !allowSocial) &&
        (social === 'approaching' || social === 'rubbing')
      )
        beginDeparture();

      // 分成小步检查碰撞，确保偶发卡顿也不会跳过另一位角色。
      while (delta > 1e-8) {
        const step = Math.min(delta, 1 / 30);
        delta -= step;
        cooldown = Math.max(0, cooldown - step);
        phaseTime += step;
        if (
          externalPerson &&
          personWaiting &&
          social === 'wandering' &&
          (catRoutine === 'roaming' || (catRoutine === 'going-home' && !homeLeg))
        )
          beginSideYield();
        if (updateSideYield(step, collisionEnabled)) continue;
        if (catRoutine === 'roaming') {
          const restingInLiving =
            externalPerson &&
            allowSocial &&
            !characterPaused &&
            distance(person.position, ROOM_ROAMING_LAYOUT.waypoints[HOME_WAYPOINT_INDEX.idle]) <
              0.1;
          if (restingInLiving && cooldown <= 0 && social === 'wandering' && !seekingPerson) {
            // 人休息时猫偶尔主动来撒娇，毋须两条随机路线恰好同时停在同一点。
            seekingPerson = true;
            cat.routeTo(HOME_WAYPOINT_INDEX.idle);
          } else if (seekingPerson && !restingInLiving && social === 'wandering') {
            seekingPerson = false;
            cat.resumeRoaming();
          }
          sleepyIn -= step;
          // 已开始的问候完成后再回窝，避免抚摸动作被困意突然截断。
          if (sleepyIn <= 0 && social === 'wandering') startGoingHome();
        }
        if (catRoutine !== 'roaming') {
          updateHomeRoutine(step, characterPaused, collisionEnabled);
          continue;
        }
        if (social === 'wandering') {
          roam(step, characterPaused, collisionEnabled);
          continue;
        }
        if (!externalPerson)
          personPose = {
            ...person.position,
            yaw: characterPaused ? personPose.yaw : facing(person.position, cat.position),
            moving: false,
          };
        if (social === 'approaching') {
          if (moveCatTo(petPoint!, step, collisionEnabled)) {
            social = 'rubbing';
            catMode = 'rub';
            rubTime = 3 + random() * 2;
            encounters++;
            phaseTime = 0;
          } else if (phaseTime > 4) {
            beginDeparture();
          }
        } else if (social === 'rubbing') {
          catPose = { ...cat.position, yaw: facing(cat.position, person.position), moving: false };
          rubTime -= step;
          if (rubTime <= 0) beginDeparture();
        } else if (returning) {
          if (moveCatTo(returnPoint!, step, collisionEnabled)) {
            returning = false;
            phaseTime = 0;
            cat.turnAway(person.position);
          } else if (phaseTime > 4) {
            // 小阿雷暂停期间始终原地；通常只会因重新显示角色而等候。
            catPose = { ...catPose, moving: false };
          }
        } else {
          let blocked = false;
          catPose = cat.update(step, false, (from, to) => {
            if (!collisionEnabled || separatedStep(from, to, person.position)) return true;
            blocked = true;
            return false;
          });
          if (blocked) cat.turnAway(person.position);
          if (
            !collisionEnabled ||
            distance(cat.position, person.position) >= 1.1 ||
            phaseTime > 5
          ) {
            if (
              !externalPerson &&
              !characterPaused &&
              distance(cat.position, person.position) < 0.8
            )
              person.turnAway(cat.position);
            finishEncounter();
          }
        }
      }
      return snapshot();
    },
  };
}
