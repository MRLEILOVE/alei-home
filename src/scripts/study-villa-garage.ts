import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type StudyVillaGarage = {
  group: THREE.Group;
  animate: (elapsed: number) => void;
};

/**
 * 小别墅左侧的半透明独立车库。
 * 局部坐标的正 Z 方向为车库门，和庭院车道保持同一朝向。
 */
export function createStudyVillaGarage(): StudyVillaGarage {
  const garage = new THREE.Group();
  garage.name = 'villa-garage';
  garage.position.set(-9.6, 0, -1);

  const standard = (
    color: number,
    roughness = 0.8,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const concrete = standard(0xc8c3b8, 0.93);
  const concreteEdge = standard(0xe1dbcc, 0.88);
  const charcoal = standard(0x3b403f, 0.46, { metalness: 0.48 });
  const steel = standard(0x8d9694, 0.35, { metalness: 0.72 });
  const darkSteel = standard(0x252b2c, 0.34, { metalness: 0.68 });
  const rubber = standard(0x171919, 0.9);
  // 全景剖面使用透明度展示内部。避免 transmission 触发整座别墅的折射预渲染。
  const wallGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdcebea,
    roughness: 0.12,
    metalness: 0.03,
    transmission: 0,
    transparent: true,
    opacity: 0.19,
    depthWrite: false,
    side: THREE.DoubleSide,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  });
  const roofGlass = wallGlass.clone();
  roofGlass.color.setHex(0xd9d4c5);
  roofGlass.opacity = 0.2;
  const lightMaterial = standard(0xfff2cf, 0.22, {
    emissive: 0xffd590,
    emissiveIntensity: 1.35,
  });
  const paintedRed = new THREE.MeshPhysicalMaterial({
    color: 0xa9101e,
    roughness: 0.2,
    metalness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.055,
  });
  const paintedRedDark = new THREE.MeshPhysicalMaterial({
    color: 0x630b14,
    roughness: 0.25,
    metalness: 0.22,
    clearcoat: 0.88,
    clearcoatRoughness: 0.08,
  });
  const carGlass = new THREE.MeshPhysicalMaterial({
    color: 0x283c43,
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    side: THREE.DoubleSide,
    clearcoat: 0.8,
  });
  const leather = standard(0x1e1d1c, 0.68);
  const leatherAccent = standard(0x7e1018, 0.64);
  const lampLens = new THREE.MeshPhysicalMaterial({
    color: 0xf7f0d8,
    roughness: 0.1,
    transmission: 0,
    transparent: true,
    opacity: 0.88,
    emissive: 0xffe5ac,
    emissiveIntensity: 0.6,
    clearcoat: 1,
  });
  const tailLens = new THREE.MeshPhysicalMaterial({
    color: 0xb30916,
    roughness: 0.16,
    transparent: true,
    opacity: 0.94,
    emissive: 0x8f0610,
    emissiveIntensity: 0.65,
    clearcoat: 1,
  });
  const amberLens = standard(0xe6a52c, 0.25, {
    emissive: 0x8f4d08,
    emissiveIntensity: 0.42,
  });
  const gold = standard(0xc5a554, 0.3, { metalness: 0.72 });

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    name: string,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const item = new THREE.Mesh(geometry, material);
    item.name = name;
    item.position.set(x, y, z);
    item.castShadow = !material.transparent;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }

  function box(
    width: number,
    height: number,
    depth: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    name: string,
    x = 0,
    y = 0,
    z = 0,
    radius = 0.03,
  ) {
    const rounding = Math.min(radius, width / 4, height / 4, depth / 4);
    return mesh(
      new RoundedBoxGeometry(width, height, depth, 2, rounding),
      material,
      parent,
      name,
      x,
      y,
      z,
    );
  }

  function group(parent: THREE.Object3D, name: string, x = 0, y = 0, z = 0) {
    const item = new THREE.Group();
    item.name = name;
    item.position.set(x, y, z);
    parent.add(item);
    return item;
  }

  // 地台、停车位与排水沟让车库从庭院地面自然抬起。
  const foundation = group(garage, 'garage-foundation');
  box(4.12, 0.22, 6.15, concrete, foundation, 'garage-floor-slab', 0, 0.05, 0, 0.08);
  box(4.22, 0.12, 6.3, concreteEdge, foundation, 'garage-foundation-edge', 0, -0.055, 0, 0.08);
  for (const x of [-0.86, 0.86])
    box(0.07, 0.012, 4.65, concreteEdge, foundation, 'garage-parking-guide', x, 0.17, -0.2, 0.01);
  const drain = group(foundation, 'garage-threshold-drain', 0, 0.165, 2.88);
  box(3.76, 0.045, 0.21, darkSteel, drain, 'garage-drain-channel', 0, 0, 0, 0.012);
  for (let index = -8; index <= 8; index++)
    box(0.045, 0.018, 0.24, steel, drain, 'garage-drain-grate', index * 0.205, 0.032, 0, 0.005);

  // 延续主体楼的奶油色梁柱、大块透明墙面和平屋顶，不再使用密集深色格栅。
  const shell = group(garage, 'garage-building-structure');
  const transparentShell = group(shell, 'villa-garage-transparent-shell');
  const facade = standard(0xeee7d7, 0.92);
  const facadeShade = standard(0xd4c9b5, 0.95);
  const halfWidth = 2;
  const halfDepth = 3.02;
  for (const x of [-halfWidth, halfWidth]) {
    for (const z of [-halfDepth, halfDepth]) {
      box(0.22, 2.98, 0.22, facade, shell, 'garage-corner-column', x, 1.65, z);
      box(0.32, 0.12, 0.32, facadeShade, shell, 'garage-column-foot', x, 0.22, z);
    }
    box(0.16, 0.42, 6.04, facadeShade, shell, 'garage-side-plinth', x, 0.37, 0);
    const panel = box(
      0.055,
      2.53,
      5.84,
      wallGlass,
      transparentShell,
      'garage-side-glass-panel',
      x,
      1.845,
      0,
      0.008,
    );
    panel.renderOrder = 3;
  }
  box(4.0, 0.42, 0.16, facadeShade, shell, 'garage-back-plinth', 0, 0.37, -halfDepth);
  const backPanel = box(
    3.8,
    2.53,
    0.055,
    wallGlass,
    transparentShell,
    'garage-back-glass-panel',
    0,
    1.845,
    -halfDepth,
    0.008,
  );
  backPanel.renderOrder = 3;

  const door = group(shell, 'garage-roller-shutter-door', 0, 0, halfDepth + 0.012);
  for (const x of [-1.96, 1.96])
    box(0.09, 2.83, 0.1, facade, door, 'garage-door-vertical-frame', x, 1.655, 0);
  // 半开卷帘：横向金属帘片、两侧导轨和上方卷筒罩，保留观看跑车的开口。
  const shutterMetal = standard(0xd4c9b5, 0.48, { metalness: 0.35 });
  for (const x of [-1.9, 1.9])
    box(0.055, 2.83, 0.12, steel, door, 'garage-shutter-guide', x, 1.655, 0.04);
  box(4.05, 0.32, 0.35, facade, door, 'garage-shutter-roll-housing', 0, 2.98, 0.025);
  for (let i = 0; i < 10; i++)
    box(
      3.76,
      0.116,
      0.065,
      shutterMetal,
      door,
      'garage-shutter-slat',
      0,
      1.63 + i * 0.12,
      0.045,
      0.012,
    );
  box(3.8, 0.09, 0.1, steel, door, 'garage-shutter-bottom-rail', 0, 1.545, 0.045);
  box(0.4, 0.055, 0.07, darkSteel, door, 'garage-door-handle', 0, 1.55, 0.115, 0.015);

  const roof = group(shell, 'garage-flat-roof');
  const roofPanel = box(
    4.22,
    0.14,
    6.3,
    roofGlass,
    transparentShell,
    'garage-flat-roof-panel',
    0,
    3.14,
    0,
  );
  roofPanel.renderOrder = 4;
  for (const z of [-3.1, 3.1])
    box(4.36, 0.2, 0.18, facade, roof, 'garage-roof-edge-beam', 0, 3.14, z);
  for (const x of [-2.1, 2.1])
    box(0.18, 0.2, 6.3, facade, roof, 'garage-roof-side-beam', x, 3.14, 0);

  const lighting = group(garage, 'garage-interior-lighting');
  for (const z of [-1.65, 0, 1.65]) {
    box(1.55, 0.055, 0.14, charcoal, lighting, 'garage-ceiling-light-housing', 0, 2.96, z, 0.018);
    box(
      1.38,
      0.025,
      0.09,
      lightMaterial,
      lighting,
      'garage-ceiling-light-strip',
      0,
      2.92,
      z,
      0.012,
    );
  }
  for (const z of [-1.25, 1.25]) {
    const light = new THREE.PointLight(0xffdfad, 0.58, 5.2, 2);
    light.name = 'garage-warm-point-light';
    light.position.set(0, 2.76, z);
    lighting.add(light);
  }

  // 后墙的工具柜、置物架和灭火器补足真实车库的使用痕迹。
  const storage = group(garage, 'garage-workshop-storage', 1.55, 0, -2.62);
  box(0.86, 1.62, 0.42, charcoal, storage, 'garage-tool-cabinet', 0, 0.98, 0, 0.045);
  for (const y of [0.45, 0.82, 1.19, 1.56]) {
    box(0.72, 0.025, 0.035, steel, storage, 'garage-tool-drawer-line', 0, y, 0.225, 0.006);
    box(0.22, 0.035, 0.045, steel, storage, 'garage-tool-drawer-handle', 0, y + 0.08, 0.24, 0.008);
  }
  const extinguisher = group(garage, 'garage-fire-extinguisher', -1.73, 0.16, -2.66);
  const extinguisherBody = mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.62, 20),
    paintedRed,
    extinguisher,
    'garage-fire-extinguisher-body',
    0,
    0.36,
    0,
  );
  extinguisherBody.castShadow = true;
  mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16),
    darkSteel,
    extinguisher,
    'garage-fire-extinguisher-valve',
    0,
    0.73,
    0,
  );
  box(
    0.24,
    0.05,
    0.055,
    darkSteel,
    extinguisher,
    'garage-fire-extinguisher-handle',
    0.08,
    0.8,
    0,
    0.012,
  );

  // 红色低矮宽体跑车，以 911 的圆灯、拱形车顶和后置宽肩为主要轮廓特征。
  const car = group(garage, 'villa-porsche-sports-car', 0, 0.16, -0.25);
  const body = group(car, 'porsche-clearcoat-body');
  box(1.84, 0.39, 3.82, paintedRed, body, 'porsche-lower-body', 0, 0.47, 0, 0.16);
  box(1.71, 0.3, 3.98, paintedRedDark, body, 'porsche-lower-side-shadow', 0, 0.34, -0.03, 0.13);
  const frontNose = mesh(
    new THREE.SphereGeometry(1, 36, 18),
    paintedRed,
    body,
    'porsche-rounded-front-nose',
    0,
    0.68,
    1.73,
  );
  frontNose.scale.set(0.92, 0.35, 0.6);
  const hood = box(1.57, 0.2, 1.28, paintedRed, body, 'porsche-front-hood', 0, 0.83, 1.2, 0.13);
  hood.rotation.x = -0.035;
  const rearDeck = box(
    1.74,
    0.32,
    1.08,
    paintedRed,
    body,
    'porsche-rear-engine-deck',
    0,
    0.82,
    -1.55,
    0.13,
  );
  rearDeck.rotation.x = 0.045;
  for (const z of [-1.34, 1.34])
    for (const x of [-0.78, 0.78]) {
      const fender = mesh(
        new THREE.SphereGeometry(1, 28, 16),
        paintedRed,
        body,
        'porsche-sculpted-fender',
        x,
        0.62,
        z,
      );
      fender.scale.set(0.29, 0.39, 0.66);
    }
  for (const x of [-0.91, 0.91])
    box(0.13, 0.23, 2.82, paintedRed, body, 'porsche-side-skirt', x, 0.31, -0.02, 0.045);
  for (const x of [-0.66, 0.66])
    box(0.035, 0.32, 1.35, charcoal, body, 'porsche-door-seam', x, 0.66, -0.18, 0.008);

  const greenhouse = group(car, 'porsche-glass-cabin');
  const cabinVertices = new Float32Array([
    -0.72, 0.92, 0.72, 0.72, 0.92, 0.72, -0.56, 1.43, 0.34, 0.56, 1.43, 0.34, -0.61, 1.43, -0.58,
    0.61, 1.43, -0.58, -0.75, 0.92, -1.24, 0.75, 0.92, -1.24,
  ]);
  const cabinGeometry = new THREE.BufferGeometry();
  cabinGeometry.setAttribute('position', new THREE.BufferAttribute(cabinVertices, 3));
  cabinGeometry.setIndex([
    0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4, 4, 5, 7, 4, 7, 6, 0, 2, 4, 0, 4, 6, 1, 7, 5, 1, 5, 3,
  ]);
  cabinGeometry.computeVertexNormals();
  const cabinGlass = mesh(cabinGeometry, carGlass, greenhouse, 'porsche-wraparound-glazing');
  cabinGlass.renderOrder = 5;
  box(1.21, 0.09, 0.96, paintedRed, greenhouse, 'porsche-roof-panel', 0, 1.45, -0.12, 0.08);
  box(
    1.46,
    0.055,
    0.055,
    charcoal,
    greenhouse,
    'porsche-windshield-lower-frame',
    0,
    0.94,
    0.73,
    0.01,
  );
  box(
    1.19,
    0.055,
    0.055,
    charcoal,
    greenhouse,
    'porsche-windshield-upper-frame',
    0,
    1.43,
    0.34,
    0.01,
  );
  // 用车窗顶点连接支柱，避免凭旋转角度估算导致四根窗框向车外突出。
  for (const [startIndex, endIndex, name, material, radius] of [
    [0, 2, 'porsche-a-pillar', paintedRed, 0.028],
    [1, 3, 'porsche-a-pillar', paintedRed, 0.028],
    [6, 4, 'porsche-c-pillar', paintedRed, 0.035],
    [7, 5, 'porsche-c-pillar', paintedRed, 0.035],
  ] as const) {
    const start = new THREE.Vector3().fromArray(cabinVertices, startIndex * 3);
    const end = new THREE.Vector3().fromArray(cabinVertices, endIndex * 3);
    const direction = end.clone().sub(start);
    const pillar = mesh(
      new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
      material,
      greenhouse,
      name,
    );
    pillar.position.copy(start).add(end).multiplyScalar(0.5);
    pillar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }

  const interior = group(car, 'porsche-cockpit-interior');
  box(1.34, 0.18, 0.44, leather, interior, 'porsche-dashboard', 0, 0.98, 0.5, 0.07);
  box(0.42, 0.13, 1.0, leather, interior, 'porsche-center-console', 0, 0.72, -0.02, 0.055);
  for (const x of [-0.37, 0.37]) {
    const seat = group(
      interior,
      x < 0 ? 'porsche-driver-seat' : 'porsche-passenger-seat',
      x,
      0,
      -0.35,
    );
    box(0.52, 0.17, 0.62, leather, seat, 'porsche-seat-cushion', 0, 0.7, 0, 0.11);
    const seatBack = box(0.51, 0.76, 0.18, leather, seat, 'porsche-seat-back', 0, 1.02, -0.19, 0.1);
    seatBack.rotation.x = -0.13;
    box(0.38, 0.21, 0.16, leatherAccent, seat, 'porsche-seat-headrest', 0, 1.43, -0.26, 0.08);
    box(
      0.045,
      0.55,
      0.02,
      leatherAccent,
      seat,
      'porsche-seat-center-stripe',
      0,
      1.03,
      -0.09,
      0.008,
    );
  }
  const steering = mesh(
    new THREE.TorusGeometry(0.18, 0.028, 10, 28),
    leather,
    interior,
    'porsche-steering-wheel',
    -0.38,
    1.08,
    0.38,
  );
  steering.rotation.x = -0.36;
  mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.055, 18),
    charcoal,
    interior,
    'porsche-steering-wheel-hub',
    -0.38,
    1.08,
    0.38,
  ).rotation.x = Math.PI / 2;
  for (let gauge = -1; gauge <= 1; gauge++)
    mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.016, 20),
      gauge === 0 ? lightMaterial : charcoal,
      interior,
      'porsche-dashboard-gauge',
      -0.38 + gauge * 0.12,
      1.06,
      0.69,
    ).rotation.x = Math.PI / 2;

  const wheels = group(car, 'porsche-four-wheel-assembly');
  for (const axle of [
    { z: 1.34, label: 'front' },
    { z: -1.38, label: 'rear' },
  ] as const)
    for (const side of [
      { x: -1.02, label: 'left' },
      { x: 1.02, label: 'right' },
    ] as const) {
      const wheel = group(
        wheels,
        `villa-porsche-wheel-${axle.label}-${side.label}`,
        side.x,
        0.395,
        axle.z,
      );
      const tire = mesh(
        new THREE.TorusGeometry(0.29, 0.105, 12, 30),
        rubber,
        wheel,
        'porsche-performance-tire',
      );
      tire.rotation.y = Math.PI / 2;
      const rim = mesh(
        new THREE.CylinderGeometry(0.245, 0.245, 0.16, 28),
        darkSteel,
        wheel,
        'porsche-alloy-rim',
      );
      rim.rotation.z = Math.PI / 2;
      const rimLip = mesh(
        new THREE.TorusGeometry(0.225, 0.018, 6, 24),
        steel,
        wheel,
        'porsche-rim-lip',
        side.x < 0 ? -0.09 : 0.09,
      );
      rimLip.rotation.y = Math.PI / 2;
      for (let spoke = 0; spoke < 5; spoke++) {
        const angle = (spoke / 5) * Math.PI * 2;
        const spokeMesh = box(
          0.035,
          0.2,
          0.045,
          steel,
          wheel,
          'porsche-rim-spoke',
          side.x < 0 ? -0.092 : 0.092,
          Math.cos(angle) * 0.115,
          Math.sin(angle) * 0.115,
          0.006,
        );
        spokeMesh.rotation.x = angle;
      }
      const brakeDisc = mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.012, 24),
        darkSteel,
        wheel,
        'porsche-brake-disc',
      );
      brakeDisc.rotation.z = Math.PI / 2;
      box(
        0.04,
        0.15,
        0.08,
        paintedRed,
        wheel,
        'porsche-red-brake-caliper',
        side.x < 0 ? -0.102 : 0.102,
        0,
        -0.12,
        0.012,
      );
      mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.18, 18),
        gold,
        wheel,
        'porsche-wheel-center-cap',
      ).rotation.z = Math.PI / 2;
    }

  const frontDetails = group(car, 'porsche-front-details');
  for (const x of [-0.59, 0.59]) {
    const lamp = mesh(
      new THREE.SphereGeometry(1, 24, 14),
      lampLens,
      frontDetails,
      'porsche-oval-headlamp',
      x,
      0.82,
      2.16,
    );
    lamp.scale.set(0.235, 0.18, 0.055);
    const bezel = mesh(
      new THREE.TorusGeometry(1, 0.055, 6, 28),
      steel,
      frontDetails,
      'porsche-headlamp-bezel',
      x,
      0.82,
      2.18,
    );
    bezel.scale.set(0.235, 0.18, 0.1);
    for (const dx of [-0.07, 0.07])
      for (const dy of [-0.055, 0.055])
        box(
          0.045,
          0.035,
          0.018,
          lightMaterial,
          frontDetails,
          'porsche-led-projector',
          x + dx,
          0.82 + dy,
          2.214,
          0.009,
        );
    const indicator = box(
      0.22,
      0.055,
      0.035,
      amberLens,
      frontDetails,
      'porsche-front-indicator',
      x,
      0.57,
      2.055,
      0.02,
    );
    indicator.rotation.x = -0.05;
  }
  box(1.48, 0.1, 0.08, paintedRedDark, frontDetails, 'porsche-front-bumper', 0, 0.4, 2.02, 0.035);
  for (const x of [-0.48, 0, 0.48])
    box(
      0.28,
      0.085,
      0.04,
      darkSteel,
      frontDetails,
      'porsche-front-air-intake',
      x,
      0.45,
      2.09,
      0.025,
    );
  const crestShape = new THREE.Shape();
  crestShape.moveTo(-0.045, 0.06);
  crestShape.lineTo(0.045, 0.06);
  crestShape.lineTo(0.035, -0.045);
  crestShape.lineTo(0, -0.072);
  crestShape.lineTo(-0.035, -0.045);
  crestShape.closePath();
  const crest = mesh(
    new THREE.ShapeGeometry(crestShape),
    gold,
    frontDetails,
    'porsche-hood-crest',
    0,
    0.951,
    1.37,
  );
  crest.rotation.x = -Math.PI / 2 + 0.035;

  const rearDetails = group(car, 'porsche-rear-details');
  for (const side of [-1, 1]) {
    box(
      0.025,
      0.042,
      0.19,
      steel,
      body,
      'porsche-flush-door-handle',
      side * 0.924,
      0.77,
      -0.32,
      0.009,
    );
    box(
      0.028,
      0.045,
      2.34,
      darkSteel,
      body,
      'porsche-lower-sill-trim',
      side * 0.98,
      0.27,
      -0.02,
      0.009,
    );
  }
  box(1.25, 0.08, 0.12, darkSteel, rearDetails, 'porsche-rear-diffuser', 0, 0.29, -2.04);
  for (const x of [-0.42, -0.21, 0, 0.21, 0.42])
    box(0.025, 0.12, 0.19, charcoal, rearDetails, 'porsche-diffuser-fin', x, 0.29, -2.05, 0.008);
  box(
    1.55,
    0.105,
    0.055,
    tailLens,
    rearDetails,
    'porsche-full-width-tail-light',
    0,
    0.76,
    -2.02,
    0.03,
  );
  for (let vent = -4; vent <= 4; vent++)
    box(
      0.08,
      0.025,
      0.32,
      darkSteel,
      rearDetails,
      'porsche-engine-deck-vent',
      vent * 0.15,
      1.01,
      -1.55,
      0.006,
    );
  const spoiler = group(rearDetails, 'porsche-rear-spoiler', 0, 0, -1.74);
  for (const x of [-0.56, 0.56])
    box(0.07, 0.28, 0.09, paintedRedDark, spoiler, 'porsche-spoiler-support', x, 1.09, 0, 0.015);
  const wing = box(
    1.58,
    0.1,
    0.34,
    paintedRed,
    spoiler,
    'porsche-spoiler-wing',
    0,
    1.25,
    -0.03,
    0.055,
  );
  wing.rotation.x = -0.06;
  box(1.52, 0.13, 0.1, paintedRedDark, rearDetails, 'porsche-rear-bumper', 0, 0.42, -2.04, 0.035);
  for (const x of [-0.55, 0.55]) {
    const exhaust = mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.19, 18),
      darkSteel,
      rearDetails,
      'porsche-dual-exhaust-tip',
      x,
      0.33,
      -2.08,
    );
    exhaust.rotation.x = Math.PI / 2;
  }

  for (const x of [-0.85, 0.85]) {
    const mirror = group(
      car,
      x < 0 ? 'porsche-left-mirror' : 'porsche-right-mirror',
      x,
      1.05,
      0.48,
    );
    box(
      0.08,
      0.08,
      0.22,
      paintedRed,
      mirror,
      'porsche-mirror-stalk',
      x < 0 ? 0.05 : -0.05,
      0,
      -0.04,
      0.025,
    );
    const shellMesh = mesh(
      new THREE.SphereGeometry(1, 20, 12),
      paintedRed,
      mirror,
      'porsche-mirror-shell',
      x < 0 ? -0.04 : 0.04,
      0.04,
      0.04,
    );
    shellMesh.scale.set(0.17, 0.09, 0.12);
    box(
      0.013,
      0.1,
      0.15,
      carGlass,
      mirror,
      'porsche-mirror-glass',
      x < 0 ? -0.155 : 0.155,
      0.04,
      0.04,
      0.008,
    );
  }

  // 车库照明仅做非常轻微的呼吸变化，避免静态灯带显得生硬。
  const ceilingLights = lighting.children.filter(
    (item): item is THREE.Mesh =>
      item instanceof THREE.Mesh && item.name === 'garage-ceiling-light-strip',
  );
  function animate(elapsed: number) {
    const intensity = 1.25 + Math.sin(elapsed * 0.7) * 0.06;
    for (const item of ceilingLights) {
      const material = item.material;
      if (material instanceof THREE.MeshStandardMaterial) material.emissiveIntensity = intensity;
    }
  }

  return { group: garage, animate };
}
