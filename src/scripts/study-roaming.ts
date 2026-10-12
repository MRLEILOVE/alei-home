import { HOME_WALKING_LAYOUT } from './study-home-layout.ts';

export type FloorPoint = { x: number; z: number };
export type RoomRoamingPose = FloorPoint & { yaw: number; moving: boolean };

export const ROOM_ROAMING_LAYOUT = HOME_WALKING_LAYOUT;

/** 最短安全路线同时供漫游和每日作息使用。 */
export function roomRoute(from: number, to: number) {
  const { waypoints, edges } = ROOM_ROAMING_LAYOUT;
  const neighbors: number[][] = waypoints.map(() => []);
  for (const [a, b] of edges) {
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  const costs = waypoints.map(() => Infinity);
  const parents = waypoints.map(() => -1);
  const remaining = new Set(waypoints.map((_, index) => index));
  costs[from] = 0;
  while (remaining.size) {
    const current = [...remaining].reduce((best, index) =>
      costs[index] < costs[best] ? index : best,
    );
    remaining.delete(current);
    if (current === to) break;
    if (!Number.isFinite(costs[current])) throw new Error('房间导航图存在断开的区域');
    for (const next of neighbors[current]) {
      const candidate =
        costs[current] +
        Math.hypot(
          waypoints[next].x - waypoints[current].x,
          waypoints[next].z - waypoints[current].z,
        );
      if (candidate < costs[next]) {
        costs[next] = candidate;
        parents[next] = current;
      }
    }
  }
  if (!Number.isFinite(costs[to])) throw new Error('活动地点无法通过门洞到达');
  const path = [to];
  while (path[0] !== from) path.unshift(parents[path[0]]);
  return { path, cost: costs[to] };
}

export function isRoomPositionSafe(point: FloorPoint) {
  const { bounds, radius, footprints } = ROOM_ROAMING_LAYOUT;
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.z >= bounds.minZ &&
    point.z <= bounds.maxZ &&
    !footprints.some(
      (footprint) =>
        point.x > footprint.minX - radius &&
        point.x < footprint.maxX + radius &&
        point.z > footprint.minZ - radius &&
        point.z < footprint.maxZ + radius,
    )
  );
}

// 接近同伴时会短暂离开路点中心线，整段采样保证身体不穿入家具。
export function isRoomSegmentSafe(from: FloorPoint, to: FloorPoint) {
  const samples = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.02));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    if (!isRoomPositionSafe({ x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t }))
      return false;
  }
  return true;
}

type RoomRoamingOptions = {
  startIndex?: number;
  speed?: number;
  allowedWaypoints?: readonly number[];
};
type StepGuard = (from: FloorPoint, to: FloorPoint) => boolean;

export function createRoomRoaming(
  random: () => number = Math.random,
  options: RoomRoamingOptions = {},
) {
  const { waypoints, edges } = ROOM_ROAMING_LAYOUT;
  const neighbors: number[][] = waypoints.map(() => []);
  for (const [a, b] of edges) {
    if (
      options.allowedWaypoints &&
      (!options.allowedWaypoints.includes(a) || !options.allowedWaypoints.includes(b))
    )
      continue;
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  const startIndex = options.startIndex ?? 0;
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= waypoints.length)
    throw new RangeError('书房走动的起点必须是有效路点');
  const position: FloorPoint = { ...waypoints[startIndex] };
  let current = startIndex;
  let previous = -1;
  let target: number | null = null;
  let destination: number | null = null;
  let yaw = -Math.PI / 3;
  const pauseDuration = () => 1.5 + random() * 2.5;
  let wait = pauseDuration();
  const speed = options.speed ?? 0.4;
  const snapshot = (moving: boolean): RoomRoamingPose => ({ ...position, yaw, moving });

  function route(from: number, to: number) {
    return roomRoute(from, to);
  }

  return {
    position,
    snapshot() {
      return snapshot(false);
    },
    // 去猫窝等固定目标时仍沿原有连接行走；半途接到指令先走到较近的安全端点。
    routeTo(index: number) {
      if (!Number.isInteger(index) || index < 0 || index >= waypoints.length)
        throw new RangeError('书房走动的目标必须是有效路点');
      if (destination === index) return;
      destination = index;
      wait = 0;
      if (target !== null) {
        const total = (endpoint: number) =>
          Math.hypot(position.x - waypoints[endpoint].x, position.z - waypoints[endpoint].z) +
          route(endpoint, index).cost;
        if (total(current) < total(target)) {
          const oldCurrent = current;
          current = target;
          target = oldCurrent;
        }
      }
    },
    isAtWaypoint(index: number) {
      return (
        current === index &&
        target === null &&
        Math.hypot(position.x - waypoints[index].x, position.z - waypoints[index].z) < 1e-8
      );
    },
    resumeRoaming() {
      destination = null;
      wait = pauseDuration();
    },
    // 在同一条安全连接上回头；到达路点后选背离同伴的一条连接。
    // 不重新安置位置，避免相遇或关闭对话时出现瞬移。
    turnAway(other: FloorPoint) {
      const distanceSquared = (point: FloorPoint) =>
        (point.x - other.x) ** 2 + (point.z - other.z) ** 2;
      if (target !== null) {
        if (distanceSquared(waypoints[current]) > distanceSquared(waypoints[target])) {
          const oldCurrent = current;
          current = target;
          target = oldCurrent;
          previous = -1;
          wait = 0;
        }
        const next = waypoints[target];
        return (
          (next.x - position.x) * (position.x - other.x) +
            (next.z - position.z) * (position.z - other.z) >
            0 || distanceSquared(position) < 1e-12
        );
      }
      const choices = neighbors[current].filter((index) => {
        const next = waypoints[index];
        return (
          (next.x - position.x) * (position.x - other.x) +
            (next.z - position.z) * (position.z - other.z) >
            0 || distanceSquared(position) < 1e-12
        );
      });
      choices.sort((a, b) => distanceSquared(waypoints[b]) - distanceSquared(waypoints[a]));
      if (!choices.length) return false;
      target = choices[0];
      wait = 0;
      previous = -1;
      return true;
    },
    update(delta: number, paused: boolean, canMove?: StepGuard) {
      if (paused || !Number.isFinite(delta) || delta <= 0) return snapshot(false);
      if (destination === current && target === null) return snapshot(false);
      if (wait > 0) {
        const waited = Math.min(delta, wait);
        wait -= waited;
        delta -= waited;
        if (delta <= 0) return snapshot(false);
      }
      if (target === null) {
        if (destination !== null) {
          target = route(current, destination).path[1];
        } else {
          const options = neighbors[current].filter((next) => next !== previous);
          const choices = options.length ? options : neighbors[current];
          target = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
        }
      }
      const next = waypoints[target];
      const dx = next.x - position.x;
      const dz = next.z - position.z;
      const distance = Math.hypot(dx, dz);
      const step = Math.min(distance, delta * speed);
      const proposed =
        distance > 0
          ? { x: position.x + (dx / distance) * step, z: position.z + (dz / distance) * step }
          : { ...next };
      if (canMove && !canMove(position, proposed)) return snapshot(false);
      yaw = Math.atan2(dx, dz);
      if (step >= distance) {
        position.x = next.x;
        position.z = next.z;
        previous = current;
        current = target;
        target = null;
        wait = destination === null ? pauseDuration() : 0;
        return snapshot(false);
      }
      position.x += (dx / distance) * step;
      position.z += (dz / distance) * step;
      return snapshot(true);
    },
  };
}
