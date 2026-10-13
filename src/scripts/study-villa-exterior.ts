import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStudyVillaGarage } from './study-villa-garage.ts';
import { createStudyVillaUpper } from './study-villa-upper.ts';

type Swimmer = {
  object: THREE.Group;
  radiusX: number;
  radiusZ: number;
  speed: number;
  phase: number;
  height: number;
};

/**
 * 小别墅的半透明外壳与庭院。
 * 屋内生活区仍沿用原来的米制坐标，庭院从住宅四周向外展开。
 */
export function createStudyVillaExterior() {
  const estate = new THREE.Group();
  estate.name = 'study-panoramic-villa';
  const shell = new THREE.Group();
  shell.name = 'villa-transparent-shell';
  estate.add(shell);

  const material = (
    color: number,
    roughness = 0.82,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const lawn = material(0x809b72, 0.98);
  const lawnLight = material(0xa6b98b, 0.96);
  const lawnShade = material(0x69865f, 1, {
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
  });
  const soil = material(0x7f5f46, 1);
  const stone = material(0xc9c5ba, 0.94);
  const stoneDark = material(0x8f918a, 0.92);
  const warmStone = material(0xe0d4bc, 0.9);
  const stucco = material(0xeee7d7, 0.92);
  const stuccoShade = material(0xd4c9b5, 0.95);
  const gravel = material(0xb7a98f, 1);
  const wood = material(0x75543b, 0.82);
  const windowTrim = material(0x9b7a5b, 0.8);
  const roofTrim = material(0x71645a, 0.72);
  const darkDetail = material(0x454842, 0.7);
  const bronze = material(0xa28755, 0.4, { metalness: 0.58 });
  const foliage = material(0x4f704c, 0.96);
  const foliageLight = material(0x7f9f6d, 0.96);
  const foliageShadow = material(0x3f6043, 0.98);
  const warmLight = material(0xffd99b, 0.28, {
    emissive: 0xffb957,
    emissiveIntensity: 0.9,
  });
  const flowerColors = [
    material(0xe79a99, 0.9),
    material(0xf1c978, 0.9),
    material(0xc4a5cf, 0.9),
    material(0xf3eee1, 0.9),
  ];
  const wallGlass = material(0xeaf4ef, 0.14, {
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const roofGlass = material(0xaecbc8, 0.14, {
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pondWater = material(0x6bb8ac, 0.1, {
    transparent: true,
    opacity: 0.63,
    depthWrite: false,
    metalness: 0.12,
  });
  const poolWater = material(0x64c6d7, 0.08, {
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    metalness: 0.16,
  });
  const waterHighlight = material(0xdffbfd, 0.15, {
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const sharedSphere = new THREE.SphereGeometry(1, 16, 12);
  const sharedCylinder = new THREE.CylinderGeometry(1, 1, 1, 20);

  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = estate,
    name = '',
  ) {
    const item = new THREE.Mesh(geometry, mat);
    item.position.set(x, y, z);
    item.name = name;
    item.castShadow = !(mat instanceof THREE.MeshStandardMaterial && mat.transparent);
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }

  function box(
    width: number,
    height: number,
    depth: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = estate,
    radius = 0.035,
    name = '',
  ) {
    const rounding = Math.min(radius, width / 4, height / 4, depth / 4);
    const item = mesh(
      new RoundedBoxGeometry(width, height, depth, 2, rounding),
      mat,
      x,
      y,
      z,
      parent,
      name,
    );
    // 地缝、栏杆等极薄装饰不进入阴影贴图，移动端旋转全景时更稳定。
    item.castShadow = item.castShadow && Math.min(width, height, depth) >= 0.045;
    return item;
  }

  function sphere(
    rx: number,
    ry: number,
    rz: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = estate,
    name = '',
  ) {
    const item = mesh(sharedSphere, mat, x, y, z, parent, name);
    item.scale.set(rx, ry, rz);
    item.castShadow =
      item.castShadow && Math.max(rx, ry, rz) >= 0.15 && Math.min(rx, ry, rz) >= 0.045;
    return item;
  }

  function cylinder(
    radius: number,
    height: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = estate,
    name = '',
  ) {
    const item = mesh(sharedCylinder, mat, x, y, z, parent, name);
    item.scale.set(radius, height, radius);
    item.castShadow = item.castShadow && radius >= 0.04 && height >= 0.12;
    return item;
  }

  function group(x: number, y: number, z: number, name: string, parent: THREE.Object3D = estate) {
    const item = new THREE.Group();
    item.position.set(x, y, z);
    item.name = name;
    parent.add(item);
    return item;
  }

  function seasonalPanel(
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    parent = shell,
    name = '',
  ) {
    const panel = box(width, height, depth, wallGlass, x, y, z, parent, 0.02, name);
    panel.userData.seasonWall = true;
    panel.renderOrder = 3;
    return panel;
  }

  // 草坪加入细微深浅变化、围墙绿篱与乔木，避免庭院像一整块平面模型。
  box(25.6, 0.34, 20.2, lawn, 0, -0.25, 0.9, estate, 0.18, 'villa-estate-ground');
  const lawnDetails = group(0, 0, 0, 'villa-lawn-details');
  for (let index = 0; index < 34; index++) {
    const x = -11.4 + ((index * 7.17) % 22.8);
    const z = -7.8 + ((index * 5.31) % 17.2);
    const patch = mesh(new THREE.CircleGeometry(1, 24), lawnShade, x, -0.074, z, lawnDetails);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = index * 0.73;
    patch.scale.set(0.45 + (index % 4) * 0.14, 0.18 + (index % 3) * 0.08, 1);
    patch.renderOrder = 1;
  }
  for (const z of [-8.75, 10.55]) box(25.8, 0.16, 0.22, stoneDark, 0, -0.02, z, estate, 0.05);
  for (const x of [-12.8, 12.8]) box(0.22, 0.16, 19.3, stoneDark, x, -0.02, 0.9, estate, 0.05);
  const fence = group(0, 0, 0, 'villa-garden-fence');
  for (let x = -12.2; x <= 12.2; x += 1.22) {
    const insideGarageGate = x > -11.45 && x < -7.75;
    const insideGardenGate = x > -0.5 && x < 2.3;
    if (insideGarageGate || insideGardenGate) continue;
    box(0.075, 0.68, 0.075, wood, x, 0.29, 10.36, fence, 0.014);
    sphere(0.075, 0.055, 0.075, bronze, x, 0.66, 10.36, fence);
  }
  for (const [x, width] of [
    [-11.98, 0.96],
    [-4.22, 7.06],
    [7.51, 9.78],
  ] as const) {
    box(width, 0.055, 0.055, wood, x, 0.28, 10.36, fence, 0.01);
    box(width, 0.055, 0.055, wood, x, 0.53, 10.36, fence, 0.01);
  }
  for (const x of [-11.5, -7.7, -0.7, 2.62]) {
    box(0.54, 1.05, 0.54, stucco, x, 0.46, 10.26, fence, 0.08);
    box(0.64, 0.12, 0.64, warmStone, x, 1.0, 10.26, fence, 0.06);
    sphere(0.11, 0.11, 0.11, warmLight, x, 1.15, 10.26, fence);
  }
  // 前院保留两处入口，其余三边连续围合，栏杆与现有入口使用同样的木色。
  const perimeter = group(0, 0, 0, 'villa-perimeter-fence', fence);
  for (const x of [-12.55, 12.55]) {
    for (let i = 0; i <= 19; i++) {
      const z = -8.5 + i * (18.86 / 19);
      box(0.09, 0.86, 0.09, wood, x, 0.37, z, perimeter, 0.016);
      sphere(0.07, 0.055, 0.07, bronze, x, 0.84, z, perimeter);
    }
    for (const y of [0.24, 0.64]) box(0.065, 0.07, 18.86, wood, x, y, 0.93, perimeter, 0.012);
  }
  for (let i = 0; i <= 25; i++) {
    const x = -12.55 + i * (25.1 / 25);
    box(0.09, 0.86, 0.09, wood, x, 0.37, -8.5, perimeter, 0.016);
    sphere(0.07, 0.055, 0.07, bronze, x, 0.84, -8.5, perimeter);
  }
  for (const y of [0.24, 0.64]) box(25.1, 0.07, 0.065, wood, 0, y, -8.5, perimeter, 0.012);

  // 左侧车库拥有独立车行入口，浅色铺装从车库门连续延伸到前院门。
  const driveway = group(-9.6, 0, 6.25, 'villa-garage-driveway');
  box(3.46, 0.085, 8.2, gravel, 0, -0.018, 0, driveway, 0.11, 'villa-driveway-paving');
  for (const x of [-1.72, 1.72])
    box(0.14, 0.075, 8.34, warmStone, x, 0.018, 0, driveway, 0.035, 'villa-driveway-edge');
  for (let seam = -3; seam <= 3; seam++)
    box(3.32, 0.012, 0.026, stoneDark, 0, 0.033, seam * 1.04, driveway, 0.004);
  for (const x of [-0.72, 0.72])
    box(0.46, 0.016, 7.85, lawnShade, x, 0.041, 0, driveway, 0.02, 'villa-driveway-wheel-band');
  const garage = createStudyVillaGarage();
  estate.add(garage.group);
  for (const sectionName of ['villa-garage-transparent-shell', 'garage-sectional-glass-door']) {
    garage.group.getObjectByName(sectionName)?.traverse((item) => {
      if (!(item instanceof THREE.Mesh)) return;
      const materials = Array.isArray(item.material) ? item.material : [item.material];
      if (materials.every((garageMaterial) => garageMaterial.transparent))
        item.userData.seasonWall = true;
    });
  }

  function landscapeTree(x: number, z: number, scale: number, name = 'villa-landscape-tree') {
    const tree = group(x, -0.06, z, name);
    tree.scale.setScalar(scale);
    cylinder(0.13, 1.32, wood, 0, 0.6, 0, tree);
    for (const [cx, cy, cz, size, leafMaterial] of [
      [-0.24, 1.34, 0.02, 0.48, foliage],
      [0.2, 1.45, -0.1, 0.52, foliageLight],
      [0.02, 1.72, 0.04, 0.5, foliage],
      [-0.1, 1.5, 0.27, 0.42, foliageShadow],
      [0.34, 1.63, 0.18, 0.38, foliageLight],
    ] as const)
      sphere(size, size * 0.9, size, leafMaterial, cx, cy, cz, tree);
    return tree;
  }
  landscapeTree(-10.9, -6.95, 1.15, 'villa-landscape-tree-back-left');
  landscapeTree(-9.15, -7.35, 0.88);
  landscapeTree(10.9, -6.9, 1.02, 'villa-landscape-tree-back-right');
  const hedge = group(0, 0, 0, 'villa-perimeter-hedge');
  for (let x = -9.8; x <= 9.8; x += 1.12) {
    sphere(0.64, 0.46, 0.42, x % 2 ? foliage : foliageLight, x, 0.34, -8.2, hedge);
    sphere(0.43, 0.37, 0.38, foliageShadow, x + 0.28, 0.42, -8.05, hedge);
  }

  // 半透明四面墙与坡屋顶保留完整轮廓，同时从任意角度都能看到内部房间。
  seasonalPanel(13.82, 2.72, 0.06, 0, 1.39, -4.75, shell, 'villa-glass-wall-back');
  seasonalPanel(0.06, 2.72, 9.52, -6.86, 1.39, 0, shell, 'villa-glass-wall-left');
  seasonalPanel(0.06, 2.72, 9.52, 6.86, 1.39, 0, shell, 'villa-glass-wall-right');
  seasonalPanel(5.9, 2.72, 0.06, -3.91, 1.39, 4.75, shell, 'villa-glass-wall-front-left');
  seasonalPanel(4.02, 2.72, 0.06, 4.85, 1.39, 4.75, shell, 'villa-glass-wall-front-right');
  seasonalPanel(1.92, 0.47, 0.06, 0.96, 2.515, 4.75, shell, 'villa-glass-wall-front-door-top');
  const terrace = group(0, 0, 0, 'villa-stone-terrace');
  for (const z of [-5.02, 5.02]) box(14.8, 0.12, 0.62, warmStone, 0, -0.025, z, terrace, 0.08);
  for (const x of [-7.12, 7.12]) box(0.62, 0.12, 9.45, warmStone, x, -0.025, 0, terrace, 0.08);
  for (let seam = -6; seam <= 6; seam++) {
    box(0.018, 0.006, 0.56, gravel, seam * 1.05, 0.038, 5.02, terrace, 0.002);
    box(0.018, 0.006, 0.56, gravel, seam * 1.05, 0.038, -5.02, terrace, 0.002);
  }
  // 半高实墙、浅色柱和细木窗格让透明剖面更像建筑，而不是玻璃展示盒。
  box(5.92, 0.42, 0.15, stucco, -3.91, 0.21, 4.74, shell, 0.025, 'villa-facade-plinth');
  box(4.04, 0.42, 0.15, stucco, 4.85, 0.21, 4.74, shell, 0.025);
  box(13.72, 0.42, 0.15, stuccoShade, 0, 0.21, -4.74, shell, 0.025);
  box(0.15, 0.42, 9.34, stuccoShade, -6.85, 0.21, 0, shell, 0.025);
  box(0.15, 0.42, 9.34, stucco, 6.85, 0.21, 0, shell, 0.025);
  for (const x of [-6.88, 6.88])
    for (const z of [-4.77, 4.77]) {
      box(0.22, 2.98, 0.22, stucco, x, 1.47, z, shell, 0.035);
      box(0.34, 0.11, 0.34, warmStone, x, 0.08, z, shell, 0.035);
      box(0.31, 0.11, 0.31, stuccoShade, x, 2.92, z, shell, 0.035);
    }
  for (const z of [-4.77, 4.77]) box(13.9, 0.16, 0.16, stuccoShade, 0, 2.9, z, shell, 0.025);
  for (const x of [-6.88, 6.88]) box(0.16, 0.16, 9.55, stuccoShade, x, 2.9, 0, shell, 0.025);
  for (const x of [-5.35, -3.88, -2.42, 3.62, 5.02, 6.25])
    box(0.052, 2.2, 0.07, windowTrim, x, 1.55, 4.79, shell, 0.01);
  for (const x of [-3.9, 4.85]) {
    box(x < 0 ? 5.75 : 3.86, 0.052, 0.07, windowTrim, x, 1.14, 4.79, shell, 0.01);
    box(x < 0 ? 5.75 : 3.86, 0.052, 0.07, windowTrim, x, 2.13, 4.79, shell, 0.01);
  }
  for (const z of [-3.45, -1.72, 0, 1.72, 3.45])
    box(0.07, 2.2, 0.052, windowTrim, 6.9, 1.55, z, shell, 0.01);
  for (const z of [-2.55, 0.85, 3.55])
    box(0.07, 0.052, 2.95, windowTrim, 6.9, 1.55, z, shell, 0.01);
  const frontDoor = group(0.96, 0.05, 4.79, 'villa-front-door', shell);
  for (const x of [-0.93, 0, 0.93]) box(0.1, 2.3, 0.11, wood, x, 1.15, 0, frontDoor, 0.018);
  box(1.95, 0.11, 0.11, wood, 0, 2.3, 0, frontDoor, 0.018);
  for (const x of [-0.465, 0.465]) {
    const door = box(0.87, 2.15, 0.045, wallGlass, x, 1.1, 0.025, frontDoor, 0.01);
    door.renderOrder = 4;
    sphere(0.045, 0.045, 0.045, bronze, x + (x < 0 ? 0.28 : -0.28), 1.05, 0.09, frontDoor);
    box(0.65, 0.045, 0.045, bronze, x, 0.55, 0.08, frontDoor, 0.008);
    box(0.65, 0.045, 0.045, bronze, x, 1.65, 0.08, frontDoor, 0.008);
  }
  const upper = createStudyVillaUpper();
  estate.add(upper.group);
  const porch = group(0.96, 0, 5.08, 'villa-front-porch');
  box(3.25, 0.16, 1.05, warmStone, 0, -0.005, 0.12, porch, 0.07);
  box(2.85, 0.14, 0.7, stuccoShade, 0, -0.14, 0.72, porch, 0.06);
  for (const x of [-1.38, 1.38]) {
    box(0.18, 2.3, 0.18, stucco, x, 1.15, 0, porch, 0.03);
    box(0.28, 0.13, 0.28, warmStone, x, 0.065, 0, porch, 0.035);
    box(0.27, 0.11, 0.27, stuccoShade, x, 2.26, 0, porch, 0.035);
  }
  const porchGable = group(0, 0, 0, 'villa-porch-gable', porch);
  const porchPitch = Math.atan2(0.34, 0.68);
  const porchSlope = Math.hypot(0.68, 0.34) + 0.08;
  const porchFrontRoof = box(3.65, 0.065, porchSlope, roofGlass, 0, 2.49, 0.23, porchGable, 0.02);
  porchFrontRoof.rotation.x = porchPitch;
  porchFrontRoof.renderOrder = 4;
  const porchBackRoof = box(3.65, 0.065, porchSlope, roofGlass, 0, 2.49, -0.45, porchGable, 0.02);
  porchBackRoof.rotation.x = -porchPitch;
  porchBackRoof.renderOrder = 4;
  box(3.72, 0.1, 0.1, roofTrim, 0, 2.66, -0.11, porchGable, 0.018);
  box(3.65, 0.1, 0.1, roofTrim, 0, 2.32, 0.57, porchGable, 0.018);
  for (const x of [-1.08, 1.08]) {
    box(0.1, 0.28, 0.08, roofTrim, x, 1.72, -0.51, porch, 0.018);
    sphere(0.1, 0.13, 0.08, warmLight, x, 1.53, -0.46, porch, 'villa-porch-lantern');
    const light = new THREE.PointLight(0xffcf8d, 0.5, 3.4, 2);
    light.position.set(x, 1.56, -0.34);
    porch.add(light);
  }

  // 入口石板路一直通到院门，左右两座石狮守在门廊前。
  const path = group(0.96, 0, 7.68, 'villa-entrance-path');
  for (let step = 0; step < 10; step++) {
    const tile = box(
      1.52,
      0.08,
      0.44,
      step % 2 ? warmStone : stone,
      Math.sin(step * 1.7) * 0.05,
      -0.015,
      -2.15 + step * 0.48,
      path,
      0.08,
    );
    tile.rotation.y = Math.sin(step * 1.2) * 0.025;
  }

  function stoneLion(x: number, z: number, name: string, pawSide: -1 | 1) {
    const lion = group(x, 0.03, z, name);
    box(0.9, 0.2, 0.76, stoneDark, 0, 0.1, 0, lion, 0.055);
    box(0.78, 0.15, 0.66, warmStone, 0, 0.275, 0, lion, 0.05);
    box(0.66, 0.08, 0.55, stone, 0, 0.39, 0.02, lion, 0.035);
    sphere(0.36, 0.5, 0.34, stone, 0, 0.79, -0.07, lion);
    for (const side of [-1, 1]) {
      sphere(0.22, 0.31, 0.22, stone, side * 0.26, 0.62, -0.09, lion);
      sphere(0.13, 0.31, 0.14, warmStone, side * 0.23, 0.55, 0.24, lion);
      sphere(0.17, 0.1, 0.2, stone, side * 0.23, 0.34, 0.39, lion);
      for (let claw = -1; claw <= 1; claw++)
        box(0.035, 0.025, 0.1, stoneDark, side * 0.23 + claw * 0.04, 0.42, 0.52, lion, 0.008);
    }
    sphere(0.46, 0.45, 0.4, stoneDark, 0, 1.25, 0.05, lion);
    sphere(0.33, 0.32, 0.3, stone, 0, 1.27, 0.22, lion);
    sphere(0.22, 0.14, 0.2, warmStone, 0, 1.17, 0.47, lion);
    for (const side of [-1, 1]) {
      const ear = mesh(new THREE.ConeGeometry(0.12, 0.24, 4), stone, side * 0.24, 1.61, 0.14, lion);
      ear.rotation.z = side * -0.18;
      sphere(0.064, 0.045, 0.035, darkDetail, side * 0.12, 1.33, 0.49, lion);
      const brow = box(0.15, 0.035, 0.045, stoneDark, side * 0.12, 1.41, 0.47, lion, 0.009);
      brow.rotation.z = side * -0.18;
    }
    sphere(0.075, 0.055, 0.06, stoneDark, 0, 1.22, 0.64, lion);
    box(0.2, 0.025, 0.025, stoneDark, 0, 1.1, 0.64, lion, 0.008);
    for (const toothX of [-0.07, 0.07]) {
      const tooth = mesh(
        new THREE.ConeGeometry(0.025, 0.09, 5),
        warmStone,
        toothX,
        1.055,
        0.65,
        lion,
      );
      tooth.rotation.z = Math.PI;
    }
    for (let curl = 0; curl < 14; curl++) {
      const angle = (curl / 14) * Math.PI * 2;
      sphere(
        0.085 + (curl % 2) * 0.018,
        0.085,
        0.075,
        curl % 2 ? stone : warmStone,
        Math.cos(angle) * 0.39,
        1.26 + Math.sin(angle) * 0.4,
        0.01,
        lion,
      );
    }
    sphere(0.2, 0.2, 0.2, stoneDark, pawSide * 0.28, 0.49, 0.47, lion);
    for (let band = 0; band < 4; band++) {
      const ring = mesh(
        new THREE.TorusGeometry(0.12 + band * 0.015, 0.018, 6, 18),
        stone,
        0,
        0,
        0,
        lion,
      );
      ring.position.set(-pawSide * 0.3, 0.65 + band * 0.065, -0.28 + band * 0.03);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = pawSide * 0.5;
    }
    sphere(0.12, 0.12, 0.12, stoneDark, -pawSide * 0.42, 0.88, -0.2, lion);
    lion.scale.setScalar(1.04);
    return lion;
  }
  stoneLion(-0.65, 5.72, 'villa-stone-lion-left', -1);
  stoneLion(2.57, 5.72, 'villa-stone-lion-right', 1);

  // 左前方的小花园：两排花床，花茎、叶片与花瓣全部是立体构造。
  const flowerGarden = group(-4.45, 0, 7.4, 'villa-flower-garden');
  const gardenIsland = mesh(new THREE.CircleGeometry(1, 48), lawnLight, 0, -0.068, 0, flowerGarden);
  gardenIsland.rotation.x = -Math.PI / 2;
  gardenIsland.scale.set(2.48, 1.88, 1);
  for (const bedX of [-1.05, 1.05]) {
    const bed = mesh(new THREE.CircleGeometry(1, 40), soil, bedX, 0.045, 0, flowerGarden);
    bed.rotation.x = -Math.PI / 2;
    bed.scale.set(0.78, 1.42, 1);
    for (let pebble = 0; pebble < 14; pebble++) {
      const angle = (pebble / 14) * Math.PI * 2;
      sphere(
        0.09 + (pebble % 2) * 0.02,
        0.055,
        0.075,
        pebble % 3 ? warmStone : stone,
        bedX + Math.cos(angle) * 0.82,
        0.075,
        Math.sin(angle) * 1.43,
        flowerGarden,
      ).rotation.y = -angle;
    }
  }
  for (let step = 0; step < 5; step++) {
    const gardenStep = box(
      0.55,
      0.055,
      0.34,
      step % 2 ? stone : warmStone,
      0,
      0.01,
      -1.02 + step * 0.51,
      flowerGarden,
      0.09,
    );
    gardenStep.rotation.y = Math.sin(step * 1.4) * 0.08;
  }
  for (let index = 0; index < 18; index++) {
    const bed = index % 2 ? 1.05 : -1.05;
    const row = Math.floor(index / 2);
    const x = bed + Math.sin(index * 1.7) * 0.36;
    const z = -1.08 + row * 0.27;
    const height = 0.3 + (index % 3) * 0.06;
    cylinder(0.018, height, foliage, x, 0.16 + height / 2, z, flowerGarden);
    for (const side of [-1, 1]) {
      const leaf = sphere(0.085, 0.035, 0.14, foliageLight, x + side * 0.07, 0.24, z, flowerGarden);
      leaf.rotation.y = side * 0.6;
    }
    const color = flowerColors[index % flowerColors.length];
    for (let petal = 0; petal < 6; petal++) {
      const angle = (petal / 6) * Math.PI * 2;
      sphere(
        0.075,
        0.035,
        0.1,
        color,
        x + Math.cos(angle) * 0.08,
        0.16 + height,
        z + Math.sin(angle) * 0.08,
        flowerGarden,
      ).rotation.y = angle;
    }
    sphere(0.055, 0.04, 0.055, flowerColors[1], x, 0.17 + height, z, flowerGarden);
  }
  for (const [x, z, scale] of [
    [-2.0, -1.38, 0.86],
    [2.0, -1.38, 0.92],
    [-2.06, 1.36, 0.78],
    [2.06, 1.36, 0.82],
  ] as const) {
    const shrub = group(x, 0, z, 'villa-flowering-shrub', flowerGarden);
    cylinder(0.075, 0.44, wood, 0, 0.19, 0, shrub);
    sphere(0.4 * scale, 0.43 * scale, 0.37 * scale, foliage, -0.12, 0.57, 0, shrub);
    sphere(0.34 * scale, 0.36 * scale, 0.32 * scale, foliageLight, 0.2, 0.68, -0.06, shrub);
    sphere(0.28 * scale, 0.31 * scale, 0.28 * scale, foliageShadow, 0.05, 0.88, 0.05, shrub);
    for (let bloom = 0; bloom < 7; bloom++) {
      const angle = bloom * 2.4;
      sphere(
        0.055,
        0.035,
        0.055,
        flowerColors[(bloom + (x > 0 ? 1 : 0)) % flowerColors.length],
        Math.cos(angle) * 0.3,
        0.7 + (bloom % 3) * 0.09,
        Math.sin(angle) * 0.27,
        shrub,
      );
    }
  }
  const gardenBench = group(0, 0, -1.62, 'villa-garden-bench', flowerGarden);
  box(1.25, 0.09, 0.36, wood, 0, 0.38, 0, gardenBench, 0.04);
  box(1.25, 0.08, 0.08, wood, 0, 0.75, -0.15, gardenBench, 0.025);
  for (const x of [-0.52, 0.52]) {
    box(0.07, 0.42, 0.07, bronze, x, 0.2, 0, gardenBench, 0.015);
    box(0.07, 0.46, 0.07, bronze, x, 0.56, -0.15, gardenBench, 0.015);
  }

  // 鱼池位于主路右侧，透明水面下可看到游动的小鱼和乌龟。
  const fishPond = group(4.55, -0.015, 7.65, 'villa-fish-pond');
  const pondFloorMaterial = material(0x40574c, 0.92);
  const pondPebbleMaterial = material(0x9f957c, 0.96);
  const pondRippleMaterial = new THREE.MeshBasicMaterial({
    color: 0xe4fffa,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const pondBasin = mesh(
    new THREE.CircleGeometry(1, 48),
    stoneDark,
    0,
    -0.03,
    0,
    fishPond,
    'villa-pond-basin',
  );
  pondBasin.rotation.x = -Math.PI / 2;
  pondBasin.scale.set(2.42, 1.42, 1);
  const pondFloor = mesh(
    new THREE.CircleGeometry(1, 64),
    pondFloorMaterial,
    0,
    0.012,
    0,
    fishPond,
    'villa-pond-floor',
  );
  pondFloor.rotation.x = -Math.PI / 2;
  pondFloor.scale.set(2.16, 1.15, 1);
  const pondPebbles = group(0, 0, 0, 'villa-pond-pebbles', fishPond);
  for (let index = 0; index < 28; index++) {
    const angle = index * 2.399;
    const radius = 0.22 + ((index * 37) % 100) / 100;
    const pebble = sphere(
      0.035 + (index % 4) * 0.011,
      0.014 + (index % 3) * 0.006,
      0.045 + (index % 5) * 0.008,
      index % 3 ? pondPebbleMaterial : warmStone,
      Math.cos(angle) * radius * 1.62,
      0.027,
      Math.sin(angle) * radius * 0.78,
      pondPebbles,
    );
    pebble.rotation.y = angle;
  }
  for (let index = 0; index < 24; index++) {
    const angle = (index / 24) * Math.PI * 2;
    const edgeX = 2.34 + Math.sin(index * 2.17) * 0.065;
    const edgeZ = 1.34 + Math.cos(index * 1.37) * 0.045;
    const rock = sphere(
      0.225 + (index % 4) * 0.024,
      0.115 + (index % 3) * 0.018,
      0.18 + (index % 2) * 0.035,
      index % 2 ? stone : warmStone,
      Math.cos(angle) * edgeX,
      0.055 + Math.sin(index * 1.9) * 0.012,
      Math.sin(angle) * edgeZ,
      fishPond,
    );
    rock.rotation.y = -angle + Math.sin(index) * 0.18;
  }
  const pondSurface = mesh(
    new THREE.CircleGeometry(1, 64),
    pondWater,
    0,
    0.075,
    0,
    fishPond,
    'villa-pond-water',
  );
  pondSurface.rotation.x = -Math.PI / 2;
  pondSurface.scale.set(2.18, 1.17, 1);
  pondSurface.renderOrder = 5;
  const pondRippleGroup = group(0, 0, 0, 'villa-pond-ripples', fishPond);
  const pondRipples: Array<{
    mesh: THREE.Mesh;
    x: number;
    z: number;
    phase: number;
    scaleX: number;
    scaleZ: number;
  }> = [];
  for (let index = 0; index < 4; index++) {
    const ripple = mesh(
      new THREE.RingGeometry(0.72, 1, 32),
      pondRippleMaterial.clone(),
      0,
      0.09,
      0,
      pondRippleGroup,
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.castShadow = false;
    ripple.receiveShadow = false;
    ripple.renderOrder = 6;
    pondRipples.push({
      mesh: ripple,
      x: [-0.92, 0.78, -0.18, 1.22][index],
      z: [-0.38, 0.42, 0.58, -0.24][index],
      phase: index * 0.25,
      scaleX: 0.1 + (index % 2) * 0.025,
      scaleZ: 0.06 + (index % 3) * 0.012,
    });
  }
  const lilyPads = group(0, 0, 0, 'villa-pond-lilies', fishPond);
  const lilyShape = new THREE.Shape();
  lilyShape.moveTo(0, 0);
  for (let step = 0; step <= 28; step++) {
    const angle = 0.34 + (step / 28) * (Math.PI * 2 - 0.68);
    lilyShape.lineTo(Math.cos(angle), Math.sin(angle));
  }
  lilyShape.closePath();
  const lilyGeometry = new THREE.ShapeGeometry(lilyShape);
  const lilyMaterial = material(0x64845d, 0.86, { side: THREE.DoubleSide });
  const lilyFlowerMaterial = material(0xf4d8df, 0.78);
  const lilyPositions = [
    [-1.28, 0.56, 0.24, -0.3],
    [-0.78, 0.79, 0.18, 0.55],
    [1.3, 0.51, 0.21, 1.25],
  ] as const;
  for (let index = 0; index < lilyPositions.length; index++) {
    const [x, z, size, rotation] = lilyPositions[index];
    const pad = mesh(lilyGeometry, lilyMaterial, x, 0.092, z, lilyPads);
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = rotation;
    pad.scale.setScalar(size);
    pad.castShadow = false;
    pad.renderOrder = 6;
    if (index === 1) {
      for (let petal = 0; petal < 7; petal++) {
        const angle = (petal / 7) * Math.PI * 2;
        const blossom = sphere(
          0.045,
          0.018,
          0.075,
          lilyFlowerMaterial,
          x + Math.cos(angle) * 0.045,
          0.13,
          z + Math.sin(angle) * 0.045,
          lilyPads,
        );
        blossom.rotation.y = angle;
        blossom.rotation.z = 0.2;
      }
      sphere(0.034, 0.022, 0.034, flowerColors[1], x, 0.145, z, lilyPads);
    }
  }
  const pondReeds = group(0, 0, 0, 'villa-pond-reeds', fishPond);
  const cattailMaterial = material(0x6f4a32, 0.94);
  for (let clump = 0; clump < 3; clump++) {
    const baseX = -1.72 + clump * 1.72;
    const baseZ = -1.05 + Math.abs(clump - 1) * 0.08;
    for (let stalk = 0; stalk < 4; stalk++) {
      const height = 0.44 + ((stalk + clump) % 3) * 0.1;
      const x = baseX + (stalk - 1.5) * 0.09;
      const z = baseZ + Math.sin(stalk * 2.2) * 0.055;
      cylinder(0.014, height, foliage, x, 0.13 + height / 2, z, pondReeds);
      if ((stalk + clump) % 2 === 0)
        cylinder(0.035, 0.14, cattailMaterial, x, 0.17 + height, z, pondReeds);
    }
  }
  const fishMaterials = [material(0xd97c4e, 0.7), material(0xe9c75d, 0.7), material(0xeee7d8, 0.7)];
  const fishFinMaterial = material(0xf3b487, 0.68, { transparent: true, opacity: 0.88 });
  const swimmers: Swimmer[] = [];
  function pondFish(index: number, phase: number, radiusX: number, radiusZ: number, speed: number) {
    const fish = group(0, 0, 0, `villa-pond-fish-${index + 1}`, fishPond);
    sphere(0.13, 0.065, 0.28, fishMaterials[index % fishMaterials.length], 0, 0, 0, fish);
    sphere(0.09, 0.055, 0.1, fishMaterials[index % fishMaterials.length], 0, 0, 0.22, fish);
    for (const side of [-1, 1]) {
      const fin = sphere(0.075, 0.016, 0.12, fishFinMaterial, side * 0.105, -0.005, -0.015, fish);
      fin.rotation.z = side * 0.32;
      fin.rotation.y = side * 0.2;
    }
    const tail = mesh(
      new THREE.ConeGeometry(0.13, 0.22, 4),
      fishMaterials[index % fishMaterials.length],
      0,
      0,
      -0.31,
      fish,
    );
    tail.rotation.x = Math.PI / 2;
    tail.rotation.z = Math.PI / 4;
    fish.userData.tail = tail;
    sphere(0.016, 0.018, 0.012, darkDetail, -0.07, 0.035, 0.23, fish);
    sphere(0.016, 0.018, 0.012, darkDetail, 0.07, 0.035, 0.23, fish);
    swimmers.push({ object: fish, radiusX, radiusZ, speed, phase, height: 0.095 + index * 0.012 });
  }
  pondFish(0, 0, 1.45, 0.72, 0.65);
  pondFish(1, 2.3, 1.12, 0.88, -0.48);
  pondFish(2, 4.4, 1.7, 0.54, 0.42);
  pondFish(3, 1.2, 0.86, 0.48, -0.58);
  pondFish(4, 3.5, 1.38, 0.82, 0.36);
  const turtle = group(0, 0.13, 0, 'villa-pond-turtle', fishPond);
  sphere(0.29, 0.105, 0.36, material(0x61714a, 0.94), 0, 0, 0, turtle);
  sphere(0.22, 0.07, 0.28, material(0x87915d, 0.92), 0, 0.075, 0, turtle);
  sphere(0.1, 0.085, 0.13, foliageLight, 0, 0, 0.4, turtle);
  const turtleShellDetail = material(0x526341, 0.94);
  for (const [x, z] of [
    [0, 0],
    [-0.12, -0.1],
    [0.12, -0.1],
    [-0.11, 0.12],
    [0.11, 0.12],
  ] as const) {
    const shellPlate = mesh(
      new THREE.CylinderGeometry(0.072, 0.082, 0.018, 6),
      turtleShellDetail,
      x,
      0.151,
      z,
      turtle,
    );
    shellPlate.rotation.y = Math.PI / 6;
  }
  for (const x of [-0.23, 0.23])
    for (const z of [-0.24, 0.24]) {
      const leg = sphere(0.09, 0.035, 0.12, foliageLight, x, -0.025, z, turtle);
      leg.rotation.y = x * z * 3;
    }
  sphere(0.04, 0.025, 0.08, foliageLight, 0, -0.015, -0.39, turtle);

  // 右侧游泳池与房屋平行，浅色池沿、透明水面和金属扶梯清晰可见。
  const swimmingPool = group(9.62, 0, 0.15, 'villa-swimming-pool');
  const poolTile = material(0x9fd7d6, 0.72);
  const poolGrout = material(0xd9eeea, 0.86);
  const poolAccent = material(0x438e9f, 0.68);
  const poolMetal = material(0xd7ddd8, 0.24, { metalness: 0.82 });
  box(4.85, 0.2, 7.55, warmStone, 0, -0.1, 0, swimmingPool, 0.25);
  box(4.25, 0.16, 6.95, stoneDark, 0, -0.005, 0, swimmingPool, 0.2, 'villa-pool-basin');
  box(4.02, 0.075, 6.7, poolTile, 0, 0.046, 0, swimmingPool, 0.15, 'villa-pool-floor');
  const poolTileGrid = group(0, 0, 0, 'villa-pool-tile-grid', swimmingPool);
  for (const x of [-1.5, -1, -0.5, 0, 0.5, 1, 1.5])
    box(0.012, 0.008, 6.38, poolGrout, x, 0.088, 0, poolTileGrid, 0.002);
  for (let z = -3; z <= 3.01; z += 0.5)
    box(3.8, 0.008, 0.012, poolGrout, 0, 0.088, z, poolTileGrid, 0.002);
  for (const x of [-1.26, 0, 1.26])
    box(0.055, 0.012, 5.85, poolAccent, x, 0.094, -0.1, poolTileGrid, 0.008);
  const poolSurface = box(
    4.05,
    0.07,
    6.72,
    poolWater,
    0,
    0.095,
    0,
    swimmingPool,
    0.16,
    'villa-pool-water',
  );
  poolSurface.renderOrder = 5;
  const poolSteps = group(1.18, 0, 2.86, 'villa-pool-steps', swimmingPool);
  for (let step = 0; step < 3; step++) {
    box(
      1.28 - step * 0.12,
      0.06 + step * 0.025,
      0.38,
      step % 2 ? poolTile : poolGrout,
      0,
      0.105 - step * 0.022,
      -step * 0.34,
      poolSteps,
      0.045,
    );
  }
  for (const z of [-3.62, 3.62]) box(4.7, 0.09, 0.24, stone, 0, 0.03, z, swimmingPool, 0.06);
  for (const x of [-2.27, 2.27]) box(0.24, 0.09, 7.05, stone, x, 0.03, 0, swimmingPool, 0.06);
  const poolDeckDetail = group(0, 0, 0, 'villa-pool-deck-detail', swimmingPool);
  for (let index = 0; index < 12; index++) {
    const z = -3.05 + index * 0.555;
    for (const x of [-2.43, 2.43])
      box(0.16, 0.025, 0.038, stoneDark, x, 0.082, z, poolDeckDetail, 0.008);
  }
  const poolRippleGroup = group(0, 0, 0, 'villa-pool-ripples', swimmingPool);
  const poolRipples: Array<{ mesh: THREE.Mesh; baseZ: number; phase: number }> = [];
  for (let index = 0; index < 7; index++) {
    const points: THREE.Vector3[] = [];
    for (let point = 0; point < 7; point++) {
      const x = -1.72 + point * 0.573;
      points.push(new THREE.Vector3(x, 0, Math.sin(point * 1.45 + index) * 0.035));
    }
    const rippleMaterial = waterHighlight.clone();
    rippleMaterial.opacity = 0.18 + (index % 3) * 0.055;
    const ripple = mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, 0.012, 5, false),
      rippleMaterial,
      0,
      0.148,
      -2.58 + index * 0.86,
      poolRippleGroup,
    );
    ripple.castShadow = false;
    ripple.receiveShadow = false;
    ripple.renderOrder = 6;
    poolRipples.push({ mesh: ripple, baseZ: ripple.position.z, phase: index * 0.73 });
  }
  const ladder = group(-1.75, 0.11, -2.65, 'villa-pool-ladder', swimmingPool);
  for (const x of [-0.22, 0.22]) {
    const rail = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, -0.04, 0.4),
          new THREE.Vector3(x, 0.55, 0.25),
          new THREE.Vector3(x, 0.7, -0.15),
        ]),
        16,
        0.035,
        8,
        false,
      ),
      poolMetal,
      0,
      0,
      0,
      ladder,
    );
    rail.castShadow = true;
  }
  for (let rung = 0; rung < 3; rung++)
    box(0.5, 0.045, 0.055, poolMetal, 0, 0.05 + rung * 0.2, 0.31, ladder, 0.015);
  const floatRing = group(0.74, 0.19, -0.42, 'villa-pool-float-ring', swimmingPool);
  floatRing.rotation.x = Math.PI / 2;
  const floatMaterials = [material(0xd97f69, 0.58), material(0xf4ddad, 0.62)];
  for (let segment = 0; segment < 8; segment++) {
    const ringSegment = mesh(
      new THREE.TorusGeometry(0.38, 0.082, 8, 10, Math.PI / 4 + 0.02),
      floatMaterials[segment % 2],
      0,
      0,
      0,
      floatRing,
    );
    ringSegment.rotation.z = segment * (Math.PI / 4);
  }

  let elapsed = 0;
  return {
    group: estate,
    setFloorView(level: 'all' | 'first' | 'second' | 'roof') {
      upper.second.visible = level !== 'first';
      upper.rooftop.visible = level === 'all' || level === 'roof';
      upper.stairs.visible = level !== 'first';
    },
    animate(delta: number) {
      elapsed += Math.max(0, Math.min(delta, 0.1));
      for (const swimmer of swimmers) {
        const angle = swimmer.phase + elapsed * swimmer.speed;
        const x = Math.cos(angle) * swimmer.radiusX;
        const z = Math.sin(angle) * swimmer.radiusZ;
        const dx = -Math.sin(angle) * swimmer.radiusX * swimmer.speed;
        const dz = Math.cos(angle) * swimmer.radiusZ * swimmer.speed;
        swimmer.object.position.set(x, swimmer.height + Math.sin(angle * 2) * 0.012, z);
        swimmer.object.rotation.y = Math.atan2(dx, dz);
        const tail = swimmer.object.userData.tail as THREE.Object3D | undefined;
        if (tail) tail.rotation.y = Math.sin(elapsed * 8 + swimmer.phase) * 0.32;
      }
      const turtleAngle = elapsed * 0.13 + 0.8;
      turtle.position.set(
        Math.cos(turtleAngle) * 0.72,
        0.135 + Math.sin(elapsed * 1.4) * 0.008,
        Math.sin(turtleAngle) * 0.42,
      );
      turtle.rotation.y = turtleAngle + Math.PI / 2;
      for (const ripple of pondRipples) {
        const progress = (elapsed * 0.24 + ripple.phase) % 1;
        ripple.mesh.position.set(ripple.x, 0.09, ripple.z);
        ripple.mesh.scale.set(
          ripple.scaleX * (0.55 + progress),
          ripple.scaleZ * (0.55 + progress),
          1,
        );
        (ripple.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.32;
      }
      for (const ripple of poolRipples) {
        ripple.mesh.position.z = ripple.baseZ + Math.sin(elapsed * 0.72 + ripple.phase) * 0.07;
        (ripple.mesh.material as THREE.MeshStandardMaterial).opacity =
          0.14 + (Math.sin(elapsed * 1.35 + ripple.phase) + 1) * 0.075;
      }
      floatRing.position.y = 0.19 + Math.sin(elapsed * 1.15) * 0.018;
      floatRing.rotation.z = Math.sin(elapsed * 0.32) * 0.08;
      pondWater.opacity = 0.55 + Math.sin(elapsed * 0.7) * 0.035;
      poolWater.opacity = 0.68 + Math.sin(elapsed * 0.55) * 0.025;
      garage.animate(elapsed);
      upper.animate(elapsed);
    },
  };
}
