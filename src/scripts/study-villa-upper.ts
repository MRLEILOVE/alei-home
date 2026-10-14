import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** 二层娱乐空间、三层露天花园与楼后独立交通，不侵入首层生活布局。 */
export function createStudyVillaUpper() {
  const group = new THREE.Group();
  group.name = 'villa-upper-storeys';
  const second = new THREE.Group();
  second.name = 'villa-second-floor';
  second.position.y = 3.12;
  const rooftop = new THREE.Group();
  rooftop.name = 'villa-rooftop-garden';
  rooftop.position.y = 6.36;
  group.add(second, rooftop);
  const mat = (color: number, roughness = 0.75, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const cream = mat(0xe4d9c3);
  const bronze = mat(0x81705b, 0.4, { metalness: 0.45 });
  const wood = mat(0x9c7153);
  const dark = mat(0x252d33);
  const glass = mat(0xd9eae4, 0.18, {
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const floorGlass = mat(0xd9d4c5, 0.65, {
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const sage = mat(0x5b8064);
  const leaf = mat(0x719350);
  const soil = mat(0x685044);
  const purple = mat(0x806484);
  const leather = mat(0x995b4e);
  const gold = mat(0xf5c260, 0.3, { emissive: 0xf5b54b, emissiveIntensity: 0.45 });
  const neon = mat(0xbd81df, 0.25, { emissive: 0xab54df, emissiveIntensity: 0.8 });
  function mesh(
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    name = '',
  ) {
    const item = new THREE.Mesh(geo, material);
    item.position.set(x, y, z);
    item.name = name;
    item.castShadow = !material.transparent;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function box(
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    name = '',
  ) {
    const item = mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(0.045, w / 4, h / 4, d / 4)),
      material,
      parent,
      x,
      y,
      z,
      name,
    );
    item.castShadow = item.castShadow && Math.min(w, h, d) > 0.06;
    return item;
  }
  const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
  function sphere(
    rx: number,
    ry: number,
    rz: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
  ) {
    const item = mesh(sphereGeo, material, parent, x, y, z);
    item.scale.set(rx, ry, rz);
    return item;
  }
  function rod(
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D,
  ) {
    const delta = b.clone().sub(a);
    const item = mesh(
      new THREE.CylinderGeometry(radius, radius, delta.length(), 10),
      material,
      parent,
      0,
      0,
      0,
    );
    item.position.copy(a).add(b).multiplyScalar(0.5);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return item;
  }
  function room(name: string, x: number) {
    const item = new THREE.Group();
    item.name = name;
    item.position.x = x;
    second.add(item);
    return item;
  }

  // 透明楼板保留全景透视，楼层边梁明确三层建筑的轮廓。
  for (const level of [second, rooftop]) {
    box(13.8, 0.14, 9.5, floorGlass, level, 0, 0, 0, 'villa-transparent-floor-slab');
    for (const z of [-4.76, 4.76]) {
      // 入口处同步断开边梁，避免露台门洞下方留下绊脚的凸起。
      const sections =
        z < 0
          ? [
              [-2.03, 9.94],
              [5.8, 2.4],
            ]
          : [[0, 14.0]];
      for (const [x, width] of sections) {
        box(width, 0.2, 0.18, cream, level, x, 0, z);
        box(width, 0.035, 0.035, gold, level, x, -0.105, z);
      }
    }
    for (const x of [-6.88, 6.88]) box(0.18, 0.2, 9.5, cream, level, x, 0, 0);
  }
  for (const x of [-6.88, -2.3, 2.3, 6.88]) {
    for (const z of [-4.76, 4.76]) box(0.15, 3.24, 0.15, cream, second, x, 1.62, z);
  }
  for (const x of [-6.86, 6.86, -2.3, 2.3]) {
    const wall = box(
      0.055,
      2.95,
      Math.abs(x) < 3 ? 8.15 : 9.35,
      glass,
      second,
      x,
      1.6,
      Math.abs(x) < 3 ? 0.6 : 0,
      'villa-entertainment-glass-partition',
    );
    wall.userData.seasonWall = true;
    wall.renderOrder = 3;
  }
  box(13.65, 2.95, 0.055, glass, second, 0, 1.6, 4.75);
  // 后部通廊与楼梯入口，背墙留出真实门洞。
  box(9.78, 2.95, 0.055, glass, second, -1.95, 1.6, -4.75);
  box(2.26, 2.95, 0.055, glass, second, 5.73, 1.6, -4.75);
  box(13.4, 0.05, 0.8, cream, second, 0, 0.1, -4.15, 'villa-second-floor-corridor');
  for (const x of [-4.6, 0, 4.6]) {
    for (const jambX of [x - 0.6, x + 0.6])
      box(0.055, 2.2, 0.06, bronze, second, jambX, 1.17, -3.66);
    box(1.26, 0.055, 0.06, bronze, second, x, 2.25, -3.66);
  }

  const ktv = room('villa-ktv-room', -4.6);
  box(
    3.8,
    0.035,
    5.7,
    mat(0x9e869f, 1, { transparent: true, opacity: 0.45, depthWrite: false }),
    ktv,
    0,
    0.1,
    0.2,
  );
  box(3.7, 1.9, 0.14, dark, ktv, 0, 1.75, -2.95, 'villa-ktv-screen');
  box(
    3.38,
    1.58,
    0.035,
    mat(0x665083, 0.3, { emissive: 0x68518a, emissiveIntensity: 0.6 }),
    ktv,
    0,
    1.75,
    -2.85,
  );
  for (let i = 0; i < 18; i++)
    box(
      0.1,
      0.14 + Math.abs(Math.sin(i * 1.7)) * 0.62,
      0.02,
      i % 2 ? neon : gold,
      ktv,
      -1.36 + i * 0.16,
      1.66,
      -2.82,
    );
  for (const x of [-1.72, 1.72]) {
    box(0.38, 1.65, 0.4, dark, ktv, x, 0.96, -2.52, 'villa-ktv-speaker');
    for (const y of [0.48, 1.0, 1.5]) sphere(0.12, 0.12, 0.035, bronze, ktv, x, y, -2.3);
  }
  box(3.5, 0.4, 0.8, purple, ktv, 0, 0.38, 2.7);
  box(3.5, 0.85, 0.2, purple, ktv, 0, 0.72, 3.05);
  for (const x of [-1.7, 1.7]) box(0.25, 0.6, 1.7, purple, ktv, x, 0.55, 2.25);
  for (const x of [-1.1, 0, 1.1]) box(0.85, 0.16, 0.7, mat(0xbba0b8), ktv, x, 0.65, 2.65);
  box(1.85, 0.1, 0.85, dark, ktv, 0, 0.66, 1.05);
  for (const x of [-0.68, 0.68]) box(0.08, 0.5, 0.5, bronze, ktv, x, 0.35, 1.05);
  for (const x of [-0.62, 0.42]) {
    const mic = rod(
      new THREE.Vector3(x, 0.76, 0.96),
      new THREE.Vector3(x + 0.3, 0.77, 1.13),
      0.04,
      dark,
      ktv,
    );
    mic.name = 'villa-ktv-microphone';
    sphere(0.075, 0.075, 0.075, bronze, ktv, x + 0.32, 0.77, 1.15);
  }
  for (const x of [-1.9, 1.9]) box(0.035, 0.035, 6.6, neon, ktv, x, 2.78, 0.2);

  const cinema = room('villa-private-cinema', 0);
  box(
    3.8,
    0.035,
    6.6,
    mat(0x606f83, 1, { transparent: true, opacity: 0.38, depthWrite: false }),
    cinema,
    0,
    0.1,
    0.1,
  );
  box(3.95, 2.1, 0.16, dark, cinema, 0, 1.64, -2.96, 'villa-cinema-screen');
  box(
    3.64,
    1.78,
    0.035,
    mat(0xb6d9dc, 0.4, { emissive: 0x72a9ba, emissiveIntensity: 0.45 }),
    cinema,
    0,
    1.64,
    -2.86,
  );
  sphere(0.3, 0.3, 0.015, gold, cinema, 0.94, 2.1, -2.83);
  for (let i = 0; i < 6; i++) {
    const peak = mesh(
      new THREE.ConeGeometry(0.55 + i * 0.04, 0.8 + (i % 3) * 0.2, 3),
      mat(i % 2 ? 0x536c85 : 0x7996a0),
      cinema,
      -1.3 + i * 0.5,
      1.22,
      -2.8,
    );
    peak.scale.z = 0.035;
  }
  for (let row = 0; row < 2; row++) {
    box(3.6, 0.14, 1.55, bronze, cinema, 0, 0.18 + row * 0.16, 0.4 + row * 2.1);
    for (const x of [-1.1, 0, 1.1]) {
      const z = 0.4 + row * 2.1;
      const y = row * 0.16;
      box(0.85, 0.25, 0.88, leather, cinema, x, y + 0.58, z, 'villa-cinema-recliner');
      const back = box(0.86, 0.96, 0.25, leather, cinema, x, y + 1.05, z + 0.38);
      back.rotation.x = 0.12;
      for (const dx of [-0.45, 0.45]) box(0.12, 0.22, 0.9, dark, cinema, x + dx, y + 0.79, z);
    }
  }
  box(0.6, 0.22, 0.55, cream, cinema, 0, 2.7, 2.4, 'villa-cinema-projector');
  sphere(0.085, 0.085, 0.05, gold, cinema, 0.13, 2.7, 2.1);
  for (const x of [-1.95, 1.95]) box(0.08, 0.025, 6.5, gold, cinema, x, 0.14, 0.4);

  const billiards = room('villa-billiards-room', 4.6);
  box(2.5, 0.26, 4.4, wood, billiards, 0, 0.91, 0.35, 'villa-billiards-table');
  box(2.22, 0.04, 4.08, mat(0x256c61, 0.95), billiards, 0, 1.06, 0.35);
  for (const x of [-0.92, 0.92])
    for (const z of [-1.24, 1.94]) box(0.18, 0.8, 0.18, bronze, billiards, x, 0.48, z);
  for (const x of [-1.08, 1.08])
    for (const z of [-1.62, 0.35, 2.32]) {
      const pocket = mesh(
        new THREE.CircleGeometry(0.12, 18),
        dark,
        billiards,
        x,
        1.086,
        z,
        'villa-billiards-pocket',
      );
      pocket.rotation.x = -Math.PI / 2;
    }
  const balls = [0xf7f0df, 0xf3bd3c, 0x3669bd, 0xb8393b, 0x883d8b, 0xe68a33, 0x26815a, 0x222222];
  for (let i = 0; i < balls.length; i++)
    sphere(
      0.067,
      0.067,
      0.067,
      mat(balls[i], 0.22),
      billiards,
      Math.sin(i * 2.4) * 0.7,
      1.15,
      -0.95 + i * 0.34,
    );
  rod(
    new THREE.Vector3(-0.7, 1.15, -1.3),
    new THREE.Vector3(0.75, 1.15, 1.72),
    0.023,
    cream,
    billiards,
  ).name = 'villa-billiards-cue';
  for (const z of [-0.65, 1.3]) {
    rod(new THREE.Vector3(0, 3.06, z), new THREE.Vector3(0, 2.65, z), 0.02, bronze, billiards);
    mesh(new THREE.ConeGeometry(0.34, 0.23, 24, 1, true), gold, billiards, 0, 2.59, z);
  }
  box(0.2, 0.15, 1.5, wood, billiards, 1.76, 0.28, 2.3);
  for (let i = 0; i < 4; i++)
    rod(
      new THREE.Vector3(1.76, 0.3, 1.8 + i * 0.3),
      new THREE.Vector3(1.8, 2.0, 1.85 + i * 0.3),
      0.022,
      wood,
      billiards,
    );

  // 三层是无顶露台，玻璃护栏、花箱和休闲区保留对下层的通透视线。
  for (const z of [-4.7, 4.7]) {
    // 后侧预留楼梯出口。
    const sections =
      z < 0
        ? [
            [-1.95, 9.78],
            [5.73, 2.26],
          ]
        : [[0, 13.7]];
    for (const [x, w] of sections) {
      box(w, 0.95, 0.045, glass, rooftop, x, 0.59, z);
      box(w, 0.055, 0.07, bronze, rooftop, x, 1.1, z);
    }
  }
  for (const x of [-6.82, 6.82]) {
    box(0.045, 0.95, 9.4, glass, rooftop, x, 0.59, 0);
    box(0.07, 0.055, 9.4, bronze, rooftop, x, 1.1, 0);
  }
  for (let x = -6.8; x <= 6.81; x += 1.7)
    for (const z of [-4.7, 4.7]) box(0.06, 1.08, 0.06, bronze, rooftop, x, 0.58, z);
  for (const x of [-6.82, 6.82])
    for (const z of [-3.1, -1.5, 0.1, 1.7, 3.3]) box(0.06, 1.08, 0.06, bronze, rooftop, x, 0.58, z);
  const blossoms = [mat(0xe6a1aa), mat(0xf0d07c), mat(0xbd9bd0), mat(0xf6e9dd)];
  for (const [cx, cz, width] of [
    [-4.8, -3.8, 3],
    [0, -3.8, 3.5],
    [-5.8, 3.6, 1.3],
    [5.5, 3.6, 1.8],
  ] as const) {
    box(width, 0.42, 0.75, cream, rooftop, cx, 0.32, cz, 'villa-rooftop-flowerbed');
    box(width - 0.16, 0.03, 0.58, soil, rooftop, cx, 0.54, cz);
    for (let i = 0; i < Math.floor(width * 4); i++) {
      const x = cx - width / 2 + 0.18 + i * 0.24;
      const z = cz + Math.sin(i * 2.1) * 0.17;
      rod(
        new THREE.Vector3(x, 0.55, z),
        new THREE.Vector3(x, 0.94 + (i % 3) * 0.08, z),
        0.017,
        sage,
        rooftop,
      );
      sphere(0.13, 0.07, 0.08, leaf, rooftop, x, 0.7, z);
      for (let petal = 0; petal < 5; petal++) {
        const a = (petal * Math.PI * 2) / 5;
        sphere(
          0.065,
          0.032,
          0.065,
          blossoms[i % 4],
          rooftop,
          x + Math.cos(a) * 0.06,
          0.94 + (i % 3) * 0.08,
          z + Math.sin(a) * 0.06,
        );
      }
    }
  }
  for (const [x, z] of [
    [-5.8, -1.7],
    [5.7, -2.5],
  ]) {
    mesh(new THREE.CylinderGeometry(0.43, 0.32, 0.58, 20), cream, rooftop, x, 0.4, z);
    rod(new THREE.Vector3(x, 0.55, z), new THREE.Vector3(x, 1.8, z), 0.065, wood, rooftop);
    sphere(0.55, 0.68, 0.5, sage, rooftop, x, 1.8, z);
    sphere(0.37, 0.42, 0.4, leaf, rooftop, x + 0.28, 2.0, z);
  }
  box(
    4.8,
    0.04,
    4.2,
    mat(0x83a478, 1, { transparent: true, opacity: 0.42, depthWrite: false }),
    rooftop,
    -2.1,
    0.1,
    0.8,
    'villa-rooftop-lawn',
  );
  const cushion = mat(0xe9dbc3, 0.94);
  const seam = mat(0xc1b49f, 1);
  for (const [index, x] of [-3.8, -0.4].entries()) {
    const chair = new THREE.Group();
    chair.name = `villa-rooftop-lounger-${index + 1}`;
    chair.position.set(x, 0, 0.55);
    rooftop.add(chair);
    // 纤细木框架与四条倾斜椅腿，下方留空，避免呈现厚重床箱的轮廓。
    for (const side of [-0.51, 0.51]) {
      box(0.065, 0.09, 2.12, wood, chair, side, 0.43, 0.35);
      for (const z of [-0.32, 1.13])
        rod(
          new THREE.Vector3(side * 1.08, 0.13, z + 0.1),
          new THREE.Vector3(side, 0.44, z),
          0.037,
          bronze,
          chair,
        );
    }
    for (const z of [-0.36, 0.36, 1.28]) box(1.05, 0.07, 0.065, wood, chair, 0, 0.43, z);
    box(0.95, 0.12, 1.38, cushion, chair, 0, 0.54, 0.65, 'villa-lounger-seat');
    const backrest = new THREE.Group();
    backrest.name = 'villa-lounger-raised-backrest';
    backrest.position.set(0, 0.5, -0.07);
    backrest.rotation.x = 0.68;
    chair.add(backrest);
    box(1.04, 0.075, 1.05, wood, backrest, 0, 0, -0.51);
    box(0.95, 0.13, 0.97, cushion, backrest, 0, 0.09, -0.51);
    box(0.66, 0.18, 0.24, sage, backrest, 0, 0.2, -0.79, 'villa-lounger-head-pillow');
    for (const z of [-0.24, -0.48, -0.69]) box(0.87, 0.006, 0.012, seam, backrest, 0, 0.157, z);
    for (const side of [-0.51, 0.51]) {
      rod(
        new THREE.Vector3(side, 0.43, -0.48),
        new THREE.Vector3(side, 0.97, -0.69),
        0.025,
        bronze,
        chair,
      );
      rod(
        new THREE.Vector3(side, 0.45, 0.2),
        new THREE.Vector3(side, 0.71, 0.15),
        0.025,
        bronze,
        chair,
      );
      box(0.09, 0.065, 0.55, wood, chair, side, 0.72, 0.08);
    }
  }
  mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 32), wood, rooftop, -2.1, 0.55, 0.8);
  box(0.09, 0.5, 0.09, bronze, rooftop, -2.1, 0.3, 0.8);
  // 茶座使用完整不透明顶盖，四周挑檐遮住原来的镂空区域。
  for (const x of [2.4, 5.4])
    for (const z of [-1.4, 1.6]) box(0.09, 2.25, 0.09, wood, rooftop, x, 1.2, z);
  box(3.5, 0.16, 3.5, cream, rooftop, 3.9, 2.4, 0.1, 'villa-tea-pavilion-solid-roof');
  for (const z of [-1.65, 1.85]) box(3.5, 0.12, 0.08, wood, rooftop, 3.9, 2.34, z);
  for (const x of [2.15, 5.65]) box(0.08, 0.12, 3.5, wood, rooftop, x, 2.34, 0.1);
  box(2.2, 0.08, 1.0, wood, rooftop, 3.9, 0.85, 0.1);
  for (const z of [-0.95, 1.12]) box(2.25, 0.14, 0.5, sage, rooftop, 3.9, 0.48, z);
  for (const x of [3.1, 4.7])
    for (const z of [-0.95, 1.12]) box(0.07, 0.4, 0.35, bronze, rooftop, x, 0.24, z);

  // 每层采用 270° 梯段，朝向建筑的 90° 留给入口平台，避免下一梯段挡住出口。
  const stairs = new THREE.Group();
  stairs.name = 'villa-exterior-staircase';
  stairs.position.set(3.75, 0, -6.48);
  group.add(stairs);
  rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 7.48, 0), 0.09, bronze, stairs);
  for (let level = 0; level < 2; level++) {
    const bottom = level === 0 ? 0.04 : second.position.y + 0.125;
    const top = level === 0 ? second.position.y + 0.125 : rooftop.position.y + 0.07;
    const rise = top - bottom;
    const railPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI * 0.75 + (i / 20) * Math.PI * 1.5;
      const y = bottom + (i / 20) * rise;
      const step = box(
        1.16,
        0.08,
        0.38,
        cream,
        stairs,
        Math.cos(a) * 0.75,
        y - 0.04,
        Math.sin(a) * 0.75,
        'villa-stair-tread',
      );
      step.rotation.y = -a;
      const x = Math.cos(a) * 1.27,
        z = Math.sin(a) * 1.27;
      rod(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + 0.92, z), 0.025, bronze, stairs);
      railPoints.push(new THREE.Vector3(x, y + 0.94, z));
    }
    mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPoints), 100, 0.035, 8, false),
      bronze,
      stairs,
      0,
      0,
      0,
    );
    box(1.55, 0.11, 1.52, cream, stairs, 0, top - 0.055, 1.21, 'villa-stair-landing');
    // 平台两侧设置扶手及立柱，中央通路不再布置螺旋护栏。
    for (const x of [-0.73, 0.73]) {
      rod(
        new THREE.Vector3(x, top + 0.94, 1.12),
        new THREE.Vector3(x, top + 0.94, 1.96),
        0.03,
        bronze,
        stairs,
      );
      for (const z of [1.12, 1.96])
        rod(
          new THREE.Vector3(x, top, z),
          new THREE.Vector3(x, top + 0.94, z),
          0.025,
          bronze,
          stairs,
        );
    }
    const lastRail = railPoints[railPoints.length - 1];
    rod(lastRail, new THREE.Vector3(0.73, top + 0.94, 1.12), 0.03, bronze, stairs);
    if (level === 1)
      rod(railPoints[0], new THREE.Vector3(-0.73, bottom + 0.94, 1.12), 0.03, bronze, stairs);
  }

  // 五星红旗：3:2 旗面，大星位于左上，四颗小星各有一角朝向大星中心。
  const flagGroup = new THREE.Group();
  flagGroup.name = 'villa-china-flag';
  // 旗座底面贴合顶盖，旗杆位于顶棚平面的正中心。
  flagGroup.position.set(3.9, 2.39, 0.1);
  rooftop.add(flagGroup);
  box(0.6, 0.18, 0.6, cream, flagGroup, 0, 0.18, 0);
  rod(new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 3.5, 0), 0.04, bronze, flagGroup);
  sphere(0.075, 0.075, 0.075, gold, flagGroup, 0, 3.54, 0);
  const flagGeometry = new THREE.PlaneGeometry(1.8, 1.2, 30, 20);
  flagGeometry.translate(0.93, 2.86, 0);
  const cloth = mesh(
    flagGeometry,
    new THREE.MeshBasicMaterial({ color: 0xde2910, side: THREE.DoubleSide }),
    flagGroup,
    0,
    0,
    0,
    'villa-flag-cloth',
  );
  const flagParts: { mesh: THREE.Mesh; original: Float32Array }[] = [];
  flagParts.push({
    mesh: cloth,
    original: new Float32Array(flagGeometry.attributes.position.array),
  });
  for (const [cx, cy, r] of [
    [5, 5, 3],
    [10, 2, 1],
    [12, 4, 1],
    [12, 7, 1],
    [10, 9, 1],
  ]) {
    const x = 0.03 + cx * 0.06,
      y = 3.46 - cy * 0.06;
    const angle = r === 3 ? Math.PI / 2 : Math.atan2(cy - 5, 5 - cx);
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = angle + (i * Math.PI) / 5;
      const radius = r * 0.06 * (i % 2 ? 0.382 : 1);
      const px = x + Math.cos(a) * radius,
        py = y + Math.sin(a) * radius;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    const star = mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffde00, side: THREE.DoubleSide }),
      flagGroup,
      0,
      0,
      0,
      'villa-flag-star',
    );
    flagParts.push({ mesh: star, original: new Float32Array(geometry.attributes.position.array) });
    // 背面同样绘制星形，并跟随旗面变形。
    const reverse = mesh(
      geometry.clone(),
      star.material,
      flagGroup,
      0,
      0,
      0,
      'villa-flag-star-reverse',
    );
    flagParts.push({
      mesh: reverse,
      original: new Float32Array(geometry.attributes.position.array),
    });
  }
  // 旗面使用无光照材质，同时关闭投射与接收阴影，保留几何飘动。
  for (const part of flagParts) {
    part.mesh.castShadow = false;
    part.mesh.receiveShadow = false;
  }
  function animate(time: number) {
    for (const part of flagParts) {
      const position = part.mesh.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i++) {
        const x = part.original[i * 3],
          y = part.original[i * 3 + 1];
        const weight = Math.max(0, (x - 0.03) / 1.8);
        const offset =
          part.mesh === cloth ? 0 : part.mesh.name.endsWith('reverse') ? -0.008 : 0.008;
        position.setXYZ(
          i,
          x,
          y - weight * 0.07,
          Math.sin(x * 4 - time * 2.2 + y) * weight * 0.12 + offset,
        );
      }
      position.needsUpdate = true;
      part.mesh.geometry.computeVertexNormals();
    }
  }
  animate(0);
  return { group, second, rooftop, stairs, animate };
}
