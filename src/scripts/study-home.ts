import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { HOME_FIXTURES, type HomeActivity } from './study-home-layout.ts';

type HomeOptions = {
  woodTexture?: THREE.Texture;
  plasterTexture?: THREE.Texture;
  landscape: THREE.Texture;
  journal?: THREE.Texture;
  bookCovers?: THREE.Texture[];
};

/** 以低隔墙保留四个房间的边界，从斜上方能看见生活和场景内容入口。 */
export function createStudyHome(options: HomeOptions) {
  const home = new THREE.Group();
  home.name = 'study-one-bedroom-home';
  const destinations: {
    object: THREE.Object3D;
    id: string;
    label: string;
    point: THREE.Vector3;
  }[] = [];
  const material = (
    color: number,
    roughness = 0.85,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const cream = material(0xeadfc8, 0.92, { map: options.plasterTexture ?? null });
  const wallEdge = material(0xf1e8d8);
  const walnut = material(0x805d3e, 0.82, { map: options.woodTexture ?? null });
  const oak = material(0xbd956b, 0.86, { map: options.woodTexture ?? null });
  const paleWood = material(0xd7b58b, 0.92, { map: options.woodTexture ?? null });
  const floorWood = material(0xc5a27c, 0.96, { map: options.woodTexture ?? null });
  const sage = material(0x8d9d89);
  const deepSage = material(0x677e6d);
  const linen = material(0xe6d6ba, 1);
  const white = material(0xf9f5e9, 0.36);
  const beige = material(0xbaa892, 1);
  const gold = material(0xc7a569, 0.35, { metalness: 0.6 });
  const steel = material(0xacb5b3, 0.25, { metalness: 0.8 });
  const charcoal = material(0x343b3a, 0.55);
  const glass = material(0xa9c7c5, 0.2, { transparent: true, opacity: 0.32, depthWrite: false });
  const mirror = material(0xb9d0ca, 0.15, { metalness: 0.6 });
  const blue = material(0x718d9c);
  const terracotta = material(0xb87c61);
  const leaf = material(0x65815b, 0.96);
  const leafLight = material(0x839873, 0.96);
  const warmGlow = material(0xffdfaa, 0.5, { emissive: 0xffc677, emissiveIntensity: 0.3 });
  const waterMaterial = material(0xc3e8eb, 0.15, {
    transparent: true,
    opacity: 0.7,
    metalness: 0.1,
    depthWrite: false,
  });
  const steamMaterial = material(0xf5f1e5, 1, {
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const sharedSphere = new THREE.SphereGeometry(1, 16, 12);
  const sharedCylinder = new THREE.CylinderGeometry(1, 1, 1, 24);

  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = home,
    name = '',
  ) {
    const item = new THREE.Mesh(geometry, mat);
    item.position.set(x, y, z);
    item.name = name;
    // 透明水汽和玻璃不写入固定家具阴影，活动开始后不会残留黑影。
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
    parent: THREE.Object3D = home,
    radius = 0.035,
    name = '',
  ) {
    const rounding = Math.min(radius, width / 4, height / 4, depth / 4);
    return mesh(
      new RoundedBoxGeometry(width, height, depth, 2, rounding),
      mat,
      x,
      y,
      z,
      parent,
      name,
    );
  }
  function sphere(
    rx: number,
    ry: number,
    rz: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = home,
    name = '',
  ) {
    const item = mesh(sharedSphere, mat, x, y, z, parent, name);
    item.scale.set(rx, ry, rz);
    return item;
  }
  function cylinder(
    radius: number,
    height: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = home,
    name = '',
  ) {
    const item = mesh(sharedCylinder, mat, x, y, z, parent, name);
    item.scale.set(radius, height, radius);
    return item;
  }
  function group(x: number, y: number, z: number, name: string, parent: THREE.Object3D = home) {
    const result = new THREE.Group();
    result.position.set(x, y, z);
    result.name = name;
    parent.add(result);
    return result;
  }
  function tube(
    points: THREE.Vector3[],
    radius: number,
    mat: THREE.Material,
    parent: THREE.Object3D = home,
  ) {
    return mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, radius, 8, false),
      mat,
      0,
      0,
      0,
      parent,
    );
  }
  function ring(
    radius: number,
    thickness: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = home,
  ) {
    return mesh(new THREE.TorusGeometry(radius, thickness, 8, 32), mat, x, y, z, parent);
  }
  function addDestination(
    object: THREE.Object3D,
    id: string,
    label: string,
    x: number,
    y: number,
    z: number,
  ) {
    object.userData.destination = id;
    destinations.push({ object, id, label, point: new THREE.Vector3(x, y, z) });
  }
  function wall(width: number, height: number, depth: number, x: number, y: number, z: number) {
    const panel = box(width, height, depth, cream, x, y, z, home, 0.02);
    panel.userData.seasonWall = true;
    return panel;
  }
  function plant(x: number, y: number, z: number, scale = 1, parent: THREE.Object3D = home) {
    const p = group(x, y, z, 'home-potted-plant', parent);
    p.scale.setScalar(scale);
    cylinder(0.16, 0.26, terracotta, 0, 0.13, 0, p);
    cylinder(0.17, 0.035, terracotta, 0, 0.25, 0, p);
    cylinder(0.145, 0.02, walnut, 0, 0.255, 0, p);
    for (let branch = 0; branch < 7; branch++) {
      const angle = (branch / 7) * Math.PI * 2;
      const top = 0.53 + (branch % 3) * 0.12;
      const stem = cylinder(
        0.008,
        top - 0.25,
        leaf,
        Math.sin(angle) * 0.04,
        (top + 0.25) / 2,
        Math.cos(angle) * 0.04,
        p,
      );
      stem.rotation.z = Math.sin(angle) * 0.22;
      const blade = sphere(
        0.075,
        0.18,
        0.035,
        branch % 2 ? leaf : leafLight,
        Math.sin(angle) * 0.12,
        top,
        Math.cos(angle) * 0.12,
        p,
      );
      blade.rotation.set(0.2, angle, Math.sin(angle) * 0.45);
    }
    return p;
  }
  function legs(
    x: number,
    z: number,
    width: number,
    depth: number,
    top: number,
    mat: THREE.Material,
    parent: THREE.Object3D = home,
  ) {
    for (const dx of [-width / 2 + 0.1, width / 2 - 0.1]) {
      for (const dz of [-depth / 2 + 0.1, depth / 2 - 0.1]) {
        box(0.075, top - 0.1, 0.075, mat, x + dx, (top - 0.1) / 2 + 0.05, z + dz, parent, 0.01);
      }
    }
  }
  function book(
    width: number,
    height: number,
    depth: number,
    color: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D,
    texture?: THREE.Texture,
  ) {
    const cover = texture ? material(0xffffff, 0.8, { map: texture }) : material(color);
    const result = box(width, height, depth, cover, x, y, z, parent, 0.007);
    box(width * 0.88, height * 0.92, 0.014, linen, x, y, z + depth / 2 + 0.002, parent, 0.002);
    return result;
  }
  function towel(
    width: number,
    depth: number,
    color: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = home,
  ) {
    const folded = box(width, 0.075, depth, color, x, y, z, parent, 0.035);
    for (const dz of [-depth / 2 + 0.07, depth / 2 - 0.07])
      box(width * 0.9, 0.007, 0.013, linen, x, y + 0.039, z + dz, parent, 0.002);
    return folded;
  }
  function bottle(
    x: number,
    y: number,
    z: number,
    color: THREE.Material,
    parent: THREE.Object3D = home,
    scale = 1,
  ) {
    const item = group(x, y, z, 'home-bottle', parent);
    item.scale.setScalar(scale);
    cylinder(0.043, 0.16, color, 0, 0.08, 0, item);
    cylinder(0.029, 0.045, color, 0, 0.18, 0, item);
    cylinder(0.03, 0.018, charcoal, 0, 0.211, 0, item);
    box(0.061, 0.065, 0.007, linen, 0, 0.088, 0.042, item, 0.005);
    return item;
  }
  function picture(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    texture?: THREE.Texture,
    parent: THREE.Object3D = home,
  ) {
    const frame = group(x, y, z, 'home-framed-picture', parent);
    box(width + 0.12, height + 0.12, 0.05, oak, 0, 0, 0, frame, 0.018);
    box(width + 0.02, height + 0.02, 0.009, white, 0, 0, 0.029, frame, 0.002);
    if (texture) {
      mesh(
        new THREE.PlaneGeometry(width, height),
        material(0xffffff, 0.8, { map: texture }),
        0,
        0,
        0.036,
        frame,
      );
    } else {
      sphere(width * 0.25, height * 0.23, 0.008, sage, -width * 0.1, height * 0.13, 0.036, frame);
      sphere(
        width * 0.3,
        height * 0.19,
        0.008,
        terracotta,
        width * 0.09,
        -height * 0.2,
        0.04,
        frame,
      );
      sphere(width * 0.09, width * 0.09, 0.008, gold, width * 0.27, height * 0.28, 0.044, frame);
    }
    return frame;
  }
  function lamp(x: number, y: number, z: number, scale = 1, parent: THREE.Object3D = home) {
    const light = group(x, y, z, 'home-table-lamp', parent);
    light.scale.setScalar(scale);
    cylinder(0.12, 0.035, gold, 0, 0.018, 0, light);
    cylinder(0.023, 0.25, gold, 0, 0.155, 0, light);
    mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.21, 24, 1, true), linen, 0, 0.34, 0, light);
    cylinder(0.13, 0.012, warmGlow, 0, 0.27, 0, light);
    const glow = new THREE.PointLight(0xffd19a, 0.45, 3, 2);
    glow.position.set(0, 0.3, 0);
    light.add(glow);
    return glow;
  }

  // 四间房使用不同地面材质；木地板的细缝沿着家里的长边铺开。
  // 所有普通地面的可踩表面均为 y=0.05；右侧瓷砖不与木地面重叠。
  box(13.6, 0.2, 9.4, walnut, 0, -0.075, 0, home, 0.09, 'home-floor-foundation');
  box(9.425, 0.025, 9.25, floorWood, -2.0125, 0.0375, 0, home, 0.01, 'home-oak-floor');
  const floorSeam = material(0x987b5b, 1);
  for (let plank = -17; plank <= 17; plank++) {
    if (plank * 0.39 < 2.67) box(0.012, 0.002, 9.18, floorSeam, plank * 0.39, 0.05, 0, home, 0.001);
    for (let joint = -2; joint <= 2; joint++) {
      const x = plank * 0.39 + 0.195;
      const z = joint * 2.1 + (plank % 2) * 0.75;
      if (x > -6.49 && x < 2.49 && Math.abs(z) < 4.5)
        box(0.37, 0.002, 0.008, floorSeam, x, 0.05, z, home, 0.001);
    }
  }
  const tile = material(0xd7e2d9, 0.63);
  const tileGrout = material(0xc5d2c8, 0.9);
  box(4.05, 0.009, 4.1, tileGrout, 4.73, 0.0445, -2.6, home, 0.002, 'home-bathroom-floor-grout');
  for (let ix = 0; ix < 6; ix++)
    for (let iz = 0; iz < 6; iz++) {
      box(
        0.65,
        0.012,
        0.65,
        (ix + iz) % 2 ? tile : white,
        3.05 + ix * 0.67,
        0.044,
        -4.31 + iz * 0.67,
        home,
        0.005,
        'home-bathroom-floor-tile',
      );
    }
  box(
    4.03,
    0.015,
    5.1,
    material(0xe4ddd0),
    4.73,
    0.0415,
    2.0,
    home,
    0.01,
    'home-kitchen-floor-grout',
  );
  for (let ix = 0; ix < 6; ix++)
    for (let iz = 0; iz < 7; iz++) {
      box(
        0.65,
        0.004,
        0.7,
        material((ix + iz) % 2 ? 0xe9e1d2 : 0xe4dac8),
        3.05 + ix * 0.67,
        0.048,
        -0.14 + iz * 0.72,
        home,
        0.004,
        'home-kitchen-floor-tile',
      );
    }

  wall(13.6, 2.65, 0.16, 0, 1.375, -4.65);
  wall(0.16, 2.65, 9.4, -6.72, 1.375, 0);
  box(13.42, 0.075, 0.035, oak, 0, 0.13, -4.55, home, 0.009);
  box(0.035, 0.075, 9.2, oak, -6.61, 0.13, 0, home, 0.009);
  box(13.6, 0.055, 0.2, wallEdge, 0, 2.72, -4.65, home, 0.012);
  box(0.2, 0.055, 9.4, wallEdge, -6.72, 2.72, 0, home, 0.012);
  function partitionZ(x: number, start: number, end: number) {
    wall(0.14, 0.62, end - start, x, 0.36, (start + end) / 2);
    box(0.19, 0.035, end - start, paleWood, x, 0.687, (start + end) / 2, home, 0.01);
  }
  function partitionX(z: number, start: number, end: number) {
    wall(end - start, 0.62, 0.14, (start + end) / 2, 0.36, z);
    box(end - start, 0.035, 0.19, paleWood, (start + end) / 2, 0.687, z, home, 0.01);
  }
  function doorway(x: number, start: number, end: number) {
    for (const edge of [start, end]) box(0.13, 2.12, 0.13, oak, x, 1.12, edge, home, 0.014);
    box(0.13, 0.13, end - start + 0.12, oak, x, 2.16, (start + end) / 2, home, 0.018);
    box(
      0.22,
      0.008,
      end - start,
      paleWood,
      x,
      0.049,
      (start + end) / 2,
      home,
      0.002,
      'home-door-threshold',
    );
  }
  partitionX(-0.5, -6.7, -0.8);
  partitionZ(-0.8, -4.6, -2.65);
  partitionZ(-0.8, -1.25, -0.5);
  doorway(-0.8, -2.65, -1.25);
  partitionZ(2.7, -4.6, -3.0);
  partitionZ(2.7, -1.65, 1.3);
  partitionZ(2.7, 3.35, 4.6);
  doorway(2.7, -3.0, -1.65);
  doorway(2.7, 1.3, 3.35);
  partitionX(-0.5, 2.7, 6.65);

  // 透亮的季节窗和窄木格，让原站的四季仍能进入屋里。
  const seasonalWindow = group(0.9, 1.75, -4.545, 'home-season-window');
  box(2.2, 1.46, 0.1, paleWood, 0, 0, 0, seasonalWindow, 0.035);
  mesh(
    new THREE.PlaneGeometry(2.02, 1.28),
    material(0xffffff, 0.9, {
      map: options.landscape,
      emissive: 0x96927e,
      emissiveIntensity: 0.18,
    }),
    0,
    0,
    0.06,
    seasonalWindow,
  );
  box(0.045, 1.3, 0.04, white, 0, 0, 0.086, seasonalWindow, 0.009);
  box(2.03, 0.045, 0.04, white, 0, 0, 0.086, seasonalWindow, 0.009);
  box(2.3, 0.1, 0.35, paleWood, 0, -0.76, 0.12, seasonalWindow, 0.025);
  plant(0.18, 1.08, -4.34, 0.55);
  const bedroomWindow = seasonalWindow.clone();
  bedroomWindow.name = 'home-bedroom-window';
  bedroomWindow.position.set(-6.6, 1.74, -2.65);
  bedroomWindow.rotation.y = Math.PI / 2;
  bedroomWindow.scale.set(0.85, 0.85, 0.85);
  home.add(bedroomWindow);

  // 卧室：柔软床铺、双门衣柜、床边灯、拖鞋和小盆栽。
  const bed = group(HOME_FIXTURES.bed.x, 0.05, HOME_FIXTURES.bed.z, 'home-bed');
  box(2.02, 0.24, 2.72, oak, 0, 0.25, 0, bed, 0.065);
  for (const x of [-0.8, 0.8])
    for (const z of [-1.1, 1.1]) cylinder(0.065, 0.23, walnut, x, 0.12, z, bed);
  box(2.0, 1.1, 0.15, paleWood, 0, 0.63, -1.32, bed, 0.05);
  box(1.77, 0.63, 0.05, sage, 0, 0.7, -1.215, bed, 0.045);
  box(1.9, 0.23, 2.57, white, 0, 0.475, 0, bed, 0.105);
  box(1.91, 0.05, 2.44, linen, 0, 0.594, 0.04, bed, 0.018);
  box(1.96, 0.105, 1.72, sage, 0, 0.653, 0.38, bed, 0.04);
  box(1.96, 0.12, 0.34, material(0xa9b19b, 1), 0, 0.706, -0.33, bed, 0.045);
  for (let stitch = -4; stitch <= 4; stitch++)
    box(0.009, 0.003, 1.5, material(0xaab5a0), stitch * 0.2, 0.708, 0.48, bed, 0.001);
  for (const x of [-0.49, 0.49]) {
    const pillow = box(0.77, 0.18, 0.49, linen, x, 0.705, -0.84, bed, 0.085);
    pillow.rotation.y = x * 0.08;
    box(0.68, 0.006, 0.028, beige, x, 0.797, -1.0, bed, 0.002);
  }
  picture(-5.25, 1.95, -4.54, 1.03, 0.53);
  const nightstand = group(-3.7, 0.05, -3.55, 'home-bedside-table');
  box(0.58, 0.53, 0.58, oak, 0, 0.3, 0, nightstand);
  box(0.5, 0.21, 0.02, paleWood, 0, 0.4, 0.3, nightstand, 0.01);
  box(0.12, 0.02, 0.028, gold, 0, 0.42, 0.324, nightstand, 0.006);
  box(0.63, 0.07, 0.63, paleWood, 0, 0.59, 0, nightstand, 0.02);
  const bedroomLamp = lamp(-3.7, 0.68, -3.64, 0.82);
  book(0.2, 0.025, 0.15, 0x818f9a, -3.7, 0.66, -3.38, home);
  plant(-3.52, 0.05, -4.2, 0.9);
  const wardrobe = group(HOME_FIXTURES.wardrobe.x, 0.05, HOME_FIXTURES.wardrobe.z, 'home-wardrobe');
  box(2.05, 2.13, 0.72, paleWood, 0, 1.08, 0, wardrobe, 0.045);
  for (const x of [-0.51, 0.51]) {
    box(0.98, 1.93, 0.07, oak, x, 1.1, 0.39, wardrobe, 0.022);
    box(0.85, 1.8, 0.02, paleWood, x, 1.1, 0.435, wardrobe, 0.016);
    box(0.024, 0.3, 0.035, gold, x > 0 ? 0.1 : -0.1, 1.02, 0.47, wardrobe, 0.006);
  }
  box(2.15, 0.09, 0.81, oak, 0, 2.19, 0, wardrobe, 0.025);
  for (const x of [-0.51, 0.51]) box(0.58, 0.26, 0.49, beige, x, 2.36, 0, wardrobe, 0.025);
  const fullMirror = group(-0.99, 1.04, -3.82, 'home-full-length-mirror');
  box(0.58, 1.8, 0.08, oak, 0, 0, 0, fullMirror, 0.035);
  box(0.47, 1.66, 0.018, mirror, 0, 0, 0.047, fullMirror, 0.015);
  fullMirror.rotation.y = -0.11;
  const slippers = group(-4.01, 0.13, -1.05, 'home-bedroom-slippers');
  for (const x of [-0.12, 0.12]) {
    sphere(0.09, 0.038, 0.17, beige, x, 0, 0, slippers);
    sphere(0.09, 0.055, 0.08, linen, x, 0.031, -0.055, slippers);
  }
  box(2.8, 0.004, 1.25, material(0xbfa886, 1), -4.4, 0.05, -1.02, home, 0.002, 'home-bedroom-rug');

  // 客厅保留书桌、书架和唱片；各物件仍是原网站内容的入口。
  const sofa = group(HOME_FIXTURES.sofa.x, 0.05, HOME_FIXTURES.sofa.z, 'home-living-sofa');
  box(2.55, 0.23, 1.05, walnut, 0, 0.27, 0, sofa, 0.04);
  box(2.48, 0.54, 0.22, sage, 0, 0.66, -0.44, sofa, 0.09);
  for (const x of [-0.8, 0, 0.8]) box(0.77, 0.22, 0.78, sage, x, 0.44, 0.1, sofa, 0.08);
  for (const x of [-1.19, 1.19]) box(0.21, 0.47, 0.98, deepSage, x, 0.54, 0, sofa, 0.08);
  for (const x of [-0.77, 0.74]) {
    const cushion = box(0.43, 0.43, 0.16, x < 0 ? linen : terracotta, x, 0.7, -0.21, sofa, 0.07);
    cushion.rotation.set(-0.1, 0, x * 0.17);
  }
  towel(0.45, 0.36, beige, 1.11, 0.8, 0.15, sofa);
  const livingRug = material(0xded3bd, 1);
  box(3.65, 0.004, 2.47, livingRug, -4.6, 0.05, 2.04, home, 0.002, 'home-living-rug');
  for (const z of [1.0, 3.06]) box(3.45, 0.002, 0.025, beige, -4.6, 0.052, z, home, 0.001);
  const coffee = group(
    HOME_FIXTURES.coffeeTable.x,
    0.05,
    HOME_FIXTURES.coffeeTable.z,
    'home-coffee-table',
  );
  box(1.5, 0.1, 0.75, paleWood, 0, 0.48, 0, coffee, 0.09);
  legs(0, 0, 1.3, 0.6, 0.47, oak, coffee);
  book(0.33, 0.04, 0.24, 0x667d70, -0.3, 0.556, 0.04, coffee, options.journal);
  cylinder(0.076, 0.085, white, 0.32, 0.595, -0.04, coffee);
  cylinder(0.064, 0.004, walnut, 0.32, 0.64, -0.04, coffee);
  const coffeeHandle = ring(0.033, 0.012, white, 0.41, 0.603, -0.04, coffee);
  coffeeHandle.rotation.y = Math.PI / 2;
  addDestination(coffee, 'main', '首页', -4.85, 0.87, 2.05);
  const desk = group(HOME_FIXTURES.desk.x, 0.05, HOME_FIXTURES.desk.z, 'home-writing-desk');
  box(2.1, 0.095, 0.8, paleWood, 0, 0.83, 0, desk, 0.035);
  legs(0, 0, 2.04, 0.74, 0.82, oak, desk);
  box(0.47, 0.34, 0.63, oak, 0.74, 0.64, 0, desk, 0.02);
  for (const y of [0.57, 0.72]) {
    box(0.41, 0.12, 0.015, paleWood, 0.74, y, 0.33, desk, 0.005);
    box(0.09, 0.012, 0.02, gold, 0.74, y, 0.347, desk, 0.003);
  }
  const notebook = book(0.52, 0.045, 0.35, 0x7a8e79, -0.12, 0.91, 0.14, desk, options.journal);
  notebook.rotation.y = -0.12;
  cylinder(0.045, 0.007, gold, 0.4, 0.9, 0.25, desk);
  box(0.16, 0.015, 0.16, beige, 0.35, 0.903, -0.22, desk, 0.002);
  box(0.08, 0.11, 0.08, white, -0.63, 0.938, 0.25, desk, 0.018);
  for (let pen = 0; pen < 4; pen++) {
    const pencil = cylinder(
      0.006,
      0.18,
      pen % 2 ? gold : walnut,
      -0.65 + pen * 0.014,
      1.025,
      0.25,
      desk,
    );
    pencil.rotation.z = (pen - 1.5) * 0.06;
  }
  const deskLamp = lamp(-2.35, 0.936, -0.13, 0.85);
  addDestination(desk, 'writing', '文字', -1.55, 1.18, 0.04);
  const deskChair = group(
    HOME_FIXTURES.deskChair.x,
    0.05,
    HOME_FIXTURES.deskChair.z,
    'home-desk-chair',
  );
  box(1.12, 0.1, 0.7, walnut, 0, 0.38, 0, deskChair, 0.06);
  box(1.0, 0.11, 0.58, sage, 0, 0.45, -0.015, deskChair, 0.09);
  cylinder(0.065, 0.3, steel, 0, 0.22, 0, deskChair);
  for (let spoke = 0; spoke < 5; spoke++) {
    const angle = (spoke / 5) * Math.PI * 2;
    const base = box(0.58, 0.045, 0.065, steel, 0, 0.07, 0, deskChair, 0.02);
    base.rotation.y = angle;
    sphere(
      0.058,
      0.035,
      0.058,
      charcoal,
      Math.cos(angle) * 0.3,
      0.05,
      Math.sin(angle) * 0.3,
      deskChair,
    );
  }
  for (const x of [-0.42, 0.42])
    box(0.05, 0.48, 0.05, steel, x, 0.69, 0.27, deskChair, 0.018);
  box(1.0, 0.48, 0.12, deepSage, 0, 0.77, 0.27, deskChair, 0.06);
  box(0.82, 0.34, 0.055, linen, 0, 0.77, 0.2, deskChair, 0.035);
  const laptop = group(-1.18, 0.944, -0.16, 'home-project-laptop');
  box(0.58, 0.035, 0.39, steel, 0, 0, 0.03, laptop, 0.018);
  box(0.5, 0.005, 0.21, charcoal, 0, 0.021, 0.04, laptop, 0.002);
  const laptopScreen = group(0, 0.2, -0.157, 'home-laptop-screen', laptop);
  laptopScreen.rotation.x = -0.12;
  box(0.58, 0.39, 0.022, charcoal, 0, 0, 0, laptopScreen, 0.015);
  box(
    0.52,
    0.33,
    0.003,
    material(0xb4c2ac, 0.7, { emissive: 0x9aac8e, emissiveIntensity: 0.15 }),
    0,
    0,
    0.014,
    laptopScreen,
    0.004,
  );
  for (let line = 0; line < 5; line++)
    box(
      0.2 + (line % 2) * 0.09,
      0.012,
      0.003,
      linen,
      -0.065,
      0.1 - line * 0.039,
      0.018,
      laptopScreen,
      0.002,
    );
  addDestination(laptop, 'projects', '项目', -1.15, 1.43, -0.16);
  const bookshelf = group(-6.13, 0.05, 1.3, 'home-bookshelf');
  bookshelf.rotation.y = Math.PI / 2;
  box(1.54, 1.92, 0.46, oak, 0, 0.98, 0, bookshelf, 0.025);
  box(1.35, 1.72, 0.025, walnut, 0, 0.98, 0.248, bookshelf, 0.008);
  for (const y of [0.22, 0.73, 1.24, 1.75])
    box(1.44, 0.055, 0.5, paleWood, 0, y, 0.035, bookshelf, 0.008);
  const bookPalette = [0x7f9a87, 0xb57862, 0xd2b478, 0x788a97, 0x9b8c73, 0xb7b994];
  for (let shelf = 0; shelf < 3; shelf++) {
    for (let index = 0; index < 8; index++) {
      const height = 0.28 + ((index * 3 + shelf) % 5) * 0.031;
      const volume = book(
        0.095,
        height,
        0.23,
        bookPalette[(index + shelf) % bookPalette.length],
        -0.55 + index * 0.13,
        0.25 + shelf * 0.51 + height / 2,
        0.17,
        bookshelf,
        options.bookCovers?.[(index + shelf * 8) % (options.bookCovers?.length || 1)],
      );
      volume.rotation.z = index === 7 ? -0.1 : 0;
      box(
        0.071,
        0.007,
        0.009,
        gold,
        -0.55 + index * 0.13,
        0.3 + shelf * 0.51,
        0.299,
        bookshelf,
        0.001,
      );
    }
  }
  plant(-6.11, 2.03, 1.82, 0.68);
  addDestination(bookshelf, 'books', '书架', -5.85, 2.23, 1.3);
  const recordCabinet = group(-0.6, 0.05, 3.75, 'home-record-cabinet');
  box(1.35, 0.7, 0.62, walnut, 0, 0.41, 0, recordCabinet, 0.035);
  for (const x of [-0.42, 0.42])
    box(0.57, 0.54, 0.025, paleWood, x, 0.42, 0.327, recordCabinet, 0.018);
  box(1.42, 0.065, 0.69, oak, 0, 0.8, 0, recordCabinet, 0.023);
  box(0.89, 0.09, 0.49, deepSage, -0.1, 0.875, 0, recordCabinet, 0.025);
  const record = cylinder(0.197, 0.009, charcoal, -0.22, 0.93, 0, recordCabinet, 'home-record');
  cylinder(0.061, 0.013, terracotta, -0.22, 0.938, 0, recordCabinet);
  cylinder(0.008, 0.016, gold, -0.22, 0.947, 0, recordCabinet);
  for (const radius of [0.11, 0.14, 0.17]) {
    const groove = ring(radius, 0.0017, material(0x535852), -0.22, 0.936, 0, recordCabinet);
    groove.rotation.x = -Math.PI / 2;
  }
  tube(
    [
      new THREE.Vector3(0.23, 0.97, -0.14),
      new THREE.Vector3(0.15, 0.98, -0.1),
      new THREE.Vector3(0.05, 0.98, 0.05),
      new THREE.Vector3(-0.01, 0.97, 0.08),
    ],
    0.012,
    steel,
    recordCabinet,
  );
  box(0.045, 0.016, 0.048, charcoal, -0.01, 0.965, 0.08, recordCabinet, 0.008);
  const speaker = box(0.25, 0.39, 0.26, charcoal, 0.51, 1.026, 0.02, recordCabinet, 0.025);
  sphere(0.079, 0.079, 0.005, steel, 0.51, 1.02, 0.155, recordCabinet);
  sphere(0.041, 0.041, 0.007, charcoal, 0.51, 1.02, 0.163, recordCabinet);
  speaker.name = 'home-record-speaker';
  addDestination(recordCabinet, 'music', '唱片', -0.6, 1.46, 3.75);
  const gameTable = group(-4.18, 0.05, 3.66, 'home-game-table');
  box(0.74, 0.065, 0.64, paleWood, 0, 0.52, 0, gameTable, 0.035);
  legs(0, 0, 0.71, 0.61, 0.51, oak, gameTable);
  box(0.3, 0.02, 0.3, linen, 0, 0.567, 0, gameTable, 0.008);
  for (let squareX = 0; squareX < 4; squareX++)
    for (let squareZ = 0; squareZ < 4; squareZ++) {
      box(
        0.065,
        0.005,
        0.065,
        (squareX + squareZ) % 2 ? walnut : sage,
        (squareX - 1.5) * 0.071,
        0.58,
        (squareZ - 1.5) * 0.071,
        gameTable,
        0.001,
      );
    }
  for (const [x, z] of [
    [-0.1, -0.1],
    [0.05, -0.1],
    [0.1, 0.1],
    [-0.05, 0.1],
  ]) {
    cylinder(0.027, 0.035, z < 0 ? charcoal : white, x, 0.603, z, gameTable);
    sphere(0.019, 0.023, 0.019, z < 0 ? charcoal : white, x, 0.637, z, gameTable);
  }
  addDestination(gameTable, 'games', '游戏', -4.18, 0.93, 3.66);
  const letterTable = group(-2.18, 0.05, 3.91, 'home-letter-table');
  box(0.73, 0.06, 0.52, oak, 0, 0.62, 0, letterTable, 0.035);
  legs(0, 0, 0.7, 0.49, 0.61, walnut, letterTable);
  box(0.32, 0.012, 0.22, white, -0.05, 0.661, 0.06, letterTable, 0.003);
  tube(
    [
      new THREE.Vector3(-0.19, 0.669, -0.04),
      new THREE.Vector3(-0.05, 0.669, 0.06),
      new THREE.Vector3(0.1, 0.669, -0.04),
    ],
    0.002,
    beige,
    letterTable,
  );
  cylinder(0.024, 0.006, terracotta, -0.05, 0.674, 0.06, letterTable);
  addDestination(letterTable, 'guestbook', '留言', -2.18, 0.98, 3.91);
  const friendsFrame = picture(-6.58, 1.61, 3.26, 0.91, 0.62);
  friendsFrame.rotation.y = Math.PI / 2;
  for (const [x, y] of [
    [-0.2, 0.0],
    [0, 0.06],
    [0.19, -0.02],
  ]) {
    sphere(0.1, 0.1, 0.015, linen, x, y + 0.08, 0.053, friendsFrame);
    sphere(0.13, 0.13, 0.012, sage, x, y - 0.11, 0.048, friendsFrame);
  }
  addDestination(friendsFrame, 'friends', '朋友', -6.3, 2.1, 3.26);
  plant(-5.99, 0.05, -0.27, 1.3);
  const standingLamp = group(-3.1, 0.05, 0.27, 'home-living-floor-lamp');
  cylinder(0.2, 0.055, charcoal, 0, 0.028, 0, standingLamp);
  cylinder(0.023, 1.49, gold, 0, 0.8, 0, standingLamp);
  mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.32, 24, 1, true), linen, 0, 1.65, 0, standingLamp);
  cylinder(0.19, 0.02, warmGlow, 0, 1.51, 0, standingLamp);
  const livingLamp = new THREE.PointLight(0xffd6a4, 0.45, 4, 2);
  livingLamp.position.set(-3.1, 1.58, 0.27);
  home.add(livingLamp);

  // 厨房：沿外侧排开台面，常用工具触手可及，内侧通道空出来。
  const kitchen = group(
    HOME_FIXTURES.kitchenCounter.x,
    0.05,
    HOME_FIXTURES.kitchenCounter.z,
    'home-kitchen-counter',
  );
  box(1.1, 0.75, 3.4, sage, 0, 0.43, 0, kitchen, 0.035);
  box(1.18, 0.105, 3.48, white, 0, 0.87, 0, kitchen, 0.035);
  box(0.05, 0.32, 3.42, tile, 0.57, 1.08, 0, kitchen, 0.018);
  for (const z of [-1.26, -0.42, 0.42, 1.26]) {
    box(0.055, 0.62, 0.73, deepSage, -0.575, 0.47, z, kitchen, 0.018);
    box(0.032, 0.025, 0.25, gold, -0.613, 0.67, z, kitchen, 0.006);
  }
  box(0.93, 0.26, 1.0, oak, 0.02, 1.77, -0.78, kitchen, 0.023);
  for (const z of [-1.09, -0.49]) {
    box(0.53, 0.2, 0.028, sage, -0.22, 1.77, z, kitchen, 0.014).rotation.y = Math.PI / 2;
  }
  const kitchenSink = group(
    HOME_FIXTURES.kitchenSink.x,
    0.97,
    HOME_FIXTURES.kitchenSink.z,
    'home-kitchen-sink',
  );
  box(0.63, 0.025, 0.72, steel, 0, 0, 0, kitchenSink, 0.035);
  box(0.5, 0.013, 0.58, charcoal, 0, 0.019, 0, kitchenSink, 0.065);
  box(
    0.44,
    0.015,
    0.51,
    material(0x839d9a, 0.28, { metalness: 0.6 }),
    0,
    0.026,
    0,
    kitchenSink,
    0.06,
  );
  cylinder(0.035, 0.008, steel, 0, 0.039, 0.04, kitchenSink);
  tube(
    [
      new THREE.Vector3(0.38, 0.01, -0.1),
      new THREE.Vector3(0.38, 0.29, -0.1),
      new THREE.Vector3(0.27, 0.35, -0.1),
      new THREE.Vector3(0.04, 0.25, -0.1),
    ],
    0.026,
    steel,
    kitchenSink,
  );
  box(0.026, 0.024, 0.1, steel, 0.4, 0.12, -0.17, kitchenSink, 0.008);
  bottle(0.39, 0.02, 0.24, sage, kitchenSink, 0.8);
  box(0.13, 0.045, 0.08, gold, -0.33, 0.03, 0.25, kitchenSink, 0.02);
  const dishRack = group(6.18, 0.995, 0.2, 'home-dish-draining-rack');
  box(0.5, 0.023, 0.32, steel, 0, 0, 0, dishRack, 0.013);
  for (let index = 0; index < 4; index++) {
    const plate = cylinder(0.105, 0.015, white, 0, 0.097, -0.11 + index * 0.074, dishRack);
    plate.rotation.x = Math.PI / 2;
    tube(
      [
        new THREE.Vector3(-0.2, 0.01, -0.14 + index * 0.08),
        new THREE.Vector3(-0.2, 0.13, -0.14 + index * 0.08),
        new THREE.Vector3(0.2, 0.13, -0.14 + index * 0.08),
        new THREE.Vector3(0.2, 0.01, -0.14 + index * 0.08),
      ],
      0.007,
      steel,
      dishRack,
    );
  }
  const stove = group(HOME_FIXTURES.stove.x, 0.978, HOME_FIXTURES.stove.z, 'home-stove');
  box(0.87, 0.035, 0.83, charcoal, 0, 0, 0, stove, 0.023);
  const burnerMaterial = material(0xb9663e, 0.6, { emissive: 0xe86a1b, emissiveIntensity: 0.1 });
  for (const z of [-0.2, 0.2]) {
    const burner = ring(0.135, 0.014, burnerMaterial, 0, 0.032, z, stove);
    burner.rotation.x = -Math.PI / 2;
    for (const angle of [0, Math.PI / 2])
      box(0.34, 0.023, 0.022, steel, 0, 0.049, z, stove, 0.003).rotation.y = angle;
  }
  for (const z of [-0.2, 0.02, 0.24]) cylinder(0.024, 0.028, gold, -0.35, 0.03, z, stove);
  const pot = group(0, 0.07, 0.2, 'home-cooking-pot', stove);
  cylinder(0.16, 0.15, terracotta, 0, 0.075, 0, pot);
  cylinder(0.148, 0.009, material(0xb19856), 0, 0.155, 0, pot);
  for (const x of [-0.21, 0.21]) box(0.12, 0.035, 0.04, charcoal, x, 0.08, 0, pot, 0.012);
  const pan = group(0, 0.07, -0.2, 'home-frying-pan', stove);
  cylinder(0.16, 0.036, charcoal, 0, 0.018, 0, pan);
  box(0.23, 0.035, 0.055, walnut, -0.23, 0.025, 0, pan, 0.017);
  sphere(0.069, 0.016, 0.087, white, 0, 0.045, 0, pan);
  sphere(0.027, 0.018, 0.027, gold, 0.01, 0.06, 0, pan);
  const steam = group(0, 0.2, 0.2, 'home-cooking-steam', stove);
  const steamPuffs: THREE.Mesh[] = [];
  for (let puff = 0; puff < 5; puff++)
    steamPuffs.push(
      sphere(0.07, 0.1, 0.07, steamMaterial, Math.sin(puff * 2) * 0.06, puff * 0.08, 0, steam),
    );
  const preparation = group(6.12, 0.982, 1.77, 'home-kitchen-preparation');
  box(0.51, 0.03, 0.36, paleWood, 0, 0, 0, preparation, 0.015);
  box(0.2, 0.008, 0.033, steel, -0.03, 0.024, -0.09, preparation, 0.004).rotation.y = -0.23;
  box(0.1, 0.015, 0.041, walnut, -0.16, 0.028, -0.062, preparation, 0.007).rotation.y = -0.23;
  sphere(0.06, 0.045, 0.058, terracotta, 0.13, 0.052, 0.03, preparation);
  sphere(0.058, 0.052, 0.05, leafLight, 0.03, 0.059, 0.12, preparation);
  cylinder(0.044, 0.13, terracotta, -0.09, 0.078, 0.045, preparation).rotation.z = 1.1;
  for (let jar = 0; jar < 3; jar++)
    bottle(
      6.56,
      0.99,
      1.46 + jar * 0.17,
      jar === 0 ? leaf : jar === 1 ? gold : terracotta,
      home,
      0.85,
    );
  const utensilHolder = group(6.57, 0.99, 3.13, 'home-utensil-holder');
  cylinder(0.082, 0.16, white, 0, 0.08, 0, utensilHolder);
  for (let utensil = 0; utensil < 3; utensil++) {
    cylinder(0.008, 0.26, oak, (utensil - 1) * 0.045, 0.24, 0, utensilHolder);
    sphere(
      0.025,
      0.048,
      0.015,
      utensil === 1 ? steel : oak,
      (utensil - 1) * 0.045,
      0.39,
      0,
      utensilHolder,
    );
  }
  const fridge = group(HOME_FIXTURES.fridge.x, 0.05, HOME_FIXTURES.fridge.z, 'home-fridge');
  box(0.85, 1.86, 0.85, white, 0, 0.96, 0, fridge, 0.06);
  box(0.78, 0.56, 0.035, linen, 0, 1.57, 0.437, fridge, 0.022);
  box(0.78, 1.12, 0.035, linen, 0, 0.67, 0.437, fridge, 0.022);
  for (const y of [1.42, 1.12]) box(0.038, 0.22, 0.04, gold, -0.28, y, 0.479, fridge, 0.011);
  box(0.22, 0.21, 0.008, white, 0.07, 1.65, 0.463, fridge, 0.003);
  sphere(0.025, 0.025, 0.007, terracotta, 0.07, 1.72, 0.472, fridge);
  for (const x of [-0.2, 0.19]) sphere(0.027, 0.027, 0.008, sage, x, 0.91, 0.463, fridge);
  const dining = group(
    HOME_FIXTURES.diningTable.x,
    0.05,
    HOME_FIXTURES.diningTable.z,
    'home-dining-table',
  );
  box(1.5, 0.095, 0.85, paleWood, 0, 0.77, 0, dining, 0.065);
  legs(0, 0, 1.43, 0.78, 0.76, oak, dining);
  const diningPlate = cylinder(0.15, 0.02, white, -0.29, 0.83, 0, dining);
  cylinder(0.11, 0.006, linen, -0.29, 0.846, 0, dining);
  sphere(0.071, 0.024, 0.06, gold, -0.29, 0.862, 0, dining);
  cylinder(0.07, 0.12, white, 0.15, 0.881, -0.19, dining);
  for (const z of [-0.05, 0.05])
    box(0.22, 0.013, 0.013, walnut, -0.3, 0.833, z + 0.27, dining, 0.003);
  plant(4.9, 0.87, 4.03, 0.42);
  function diningChair(x: number, z: number, rotation: number) {
    const chair = group(x, 0.05, z, 'home-dining-chair');
    chair.rotation.y = rotation;
    box(0.5, 0.075, 0.48, oak, 0, 0.31, 0, chair, 0.035);
    box(0.45, 0.06, 0.4, sage, 0, 0.37, 0.02, chair, 0.025);
    legs(0, 0, 0.46, 0.43, 0.31, oak, chair);
    for (const x of [-0.2, 0.2]) box(0.035, 0.45, 0.035, oak, x, 0.6, -0.21, chair, 0.007);
    box(0.47, 0.24, 0.057, paleWood, 0, 0.78, -0.21, chair, 0.035);
  }
  diningChair(3.12, 4.03, Math.PI / 2);
  diningChair(4.5, 3.25, Math.PI);
  cylinder(0.16, 0.4, deepSage, 6.2, 0.29, 4.12);
  cylinder(0.17, 0.035, steel, 6.2, 0.51, 4.12);
  box(0.075, 0.04, 0.1, steel, 6.02, 0.12, 4.12, home, 0.012);

  // 卫生间：镜前洗漱区、淋浴、马桶和洗衣角各有固定的位置。
  const bathroomSink = group(
    HOME_FIXTURES.bathroomSink.x,
    0.05,
    HOME_FIXTURES.bathroomSink.z,
    'home-bathroom-vanity',
  );
  box(1.35, 0.65, 0.75, paleWood, 0, 0.45, 0, bathroomSink, 0.035);
  for (const x of [-0.33, 0.33]) {
    box(0.61, 0.52, 0.035, sage, x, 0.47, 0.4, bathroomSink, 0.023);
    box(0.12, 0.022, 0.033, gold, x, 0.59, 0.432, bathroomSink, 0.008);
  }
  box(1.42, 0.085, 0.81, white, 0, 0.79, 0, bathroomSink, 0.035);
  sphere(0.37, 0.085, 0.255, white, 0, 0.837, 0.07, bathroomSink);
  sphere(0.28, 0.007, 0.175, material(0xc1d1c9, 0.28), 0, 0.89, 0.08, bathroomSink);
  cylinder(0.026, 0.008, steel, 0, 0.901, 0.08, bathroomSink);
  tube(
    [
      new THREE.Vector3(0, 0.83, -0.23),
      new THREE.Vector3(0, 1.07, -0.23),
      new THREE.Vector3(0, 1.09, -0.08),
      new THREE.Vector3(0, 1.03, -0.03),
    ],
    0.025,
    steel,
    bathroomSink,
  );
  bottle(-0.48, 0.84, 0.02, terracotta, bathroomSink, 0.7);
  const toothbrushCup = cylinder(0.056, 0.1, blue, 0.49, 0.885, 0.05, bathroomSink);
  toothbrushCup.name = 'home-toothbrush-cup';
  for (const x of [0.47, 0.51]) {
    cylinder(0.009, 0.2, x < 0.5 ? sage : linen, x, 1.004, 0.05, bathroomSink);
    box(0.023, 0.045, 0.027, white, x, 1.115, 0.052, bathroomSink, 0.008);
  }
  const vanityMirror = group(4.08, 1.82, -4.545, 'home-bathroom-mirror');
  const mirrorRim = ring(0.54, 0.025, gold, 0, 0, 0, vanityMirror);
  cylinder(0.526, 0.015, mirror, 0, 0, 0.0, vanityMirror).rotation.x = Math.PI / 2;
  mirrorRim.castShadow = false;
  box(0.5, 0.035, 0.2, paleWood, 4.93, 1.71, -4.35, home, 0.012);
  bottle(4.85, 1.74, -4.34, sage, home, 0.75);
  bottle(5.01, 1.74, -4.34, blue, home, 0.65);
  const bathroomLight = new THREE.PointLight(0xffe4bb, 0.35, 3.5, 2);
  bathroomLight.position.set(4.08, 2.3, -3.98);
  home.add(bathroomLight);
  box(0.48, 0.07, 0.08, warmGlow, 4.08, 2.39, -4.38, home, 0.02);
  const toilet = group(HOME_FIXTURES.toilet.x, 0.05, HOME_FIXTURES.toilet.z, 'home-toilet');
  box(0.58, 0.64, 0.19, white, 0, 0.45, -0.32, toilet, 0.055);
  box(0.62, 0.05, 0.23, linen, 0, 0.79, -0.32, toilet, 0.022);
  cylinder(0.037, 0.008, steel, 0.13, 0.821, -0.32, toilet);
  sphere(0.28, 0.15, 0.37, white, 0, 0.28, 0.33, toilet);
  sphere(0.17, 0.16, 0.2, white, 0, 0.17, 0.33, toilet);
  sphere(0.285, 0.02, 0.35, linen, 0, 0.383, 0.33, toilet);
  sphere(0.175, 0.006, 0.245, material(0xc5d1c9, 0.4), 0, 0.41, 0.33, toilet);
  const toiletPaper = cylinder(0.071, 0.15, white, 5.44, 0.74, -3.51);
  toiletPaper.rotation.z = Math.PI / 2;
  cylinder(0.045, 0.13, oak, 5.44, 0.74, -3.51).rotation.z = Math.PI / 2;
  box(0.14, 0.12, 0.01, white, 5.43, 0.64, -3.447, home, 0.006);
  const shower = group(HOME_FIXTURES.shower.x, 0.05, HOME_FIXTURES.shower.z, 'home-shower');
  box(1.15, 0.1, 1.3, white, 0, 0.065, 0, shower, 0.06);
  box(1.0, 0.01, 1.14, tile, 0, 0.122, 0, shower, 0.028);
  cylinder(0.065, 0.008, steel, 0.26, 0.132, 0.29, shower);
  // 玻璃只有右侧和后侧，留出正面的入口与人物视线。
  box(0.024, 1.8, 1.29, glass, 0.57, 1.05, 0, shower, 0.004);
  box(1.15, 1.8, 0.024, glass, 0, 1.05, -0.64, shower, 0.004);
  for (const z of [-0.65, 0.65]) cylinder(0.015, 1.96, steel, 0.58, 1.09, z, shower);
  tube(
    [
      new THREE.Vector3(0, 0.92, -0.62),
      new THREE.Vector3(0, 1.95, -0.62),
      new THREE.Vector3(0, 2.05, -0.41),
      new THREE.Vector3(0, 2.05, -0.2),
    ],
    0.022,
    steel,
    shower,
  );
  cylinder(0.115, 0.034, steel, 0, 2.025, -0.18, shower);
  cylinder(0.095, 0.008, charcoal, 0, 2.006, -0.18, shower);
  box(0.27, 0.065, 0.09, steel, 0, 0.98, -0.62, shower, 0.016);
  box(0.035, 0.1, 0.065, gold, -0.07, 1.035, -0.58, shower, 0.009);
  box(0.44, 0.06, 0.22, paleWood, 0.24, 0.57, -0.54, shower, 0.015);
  bottle(0.14, 0.61, -0.49, sage, shower);
  bottle(0.31, 0.61, -0.49, terracotta, shower, 0.8);
  const showerWater = group(0, 0, -0.18, 'home-shower-water', shower);
  const showerDrops: THREE.Mesh[] = [];
  for (let drop = 0; drop < 13; drop++) {
    const angle = drop * 2.4;
    const radius = Math.sqrt(drop / 13) * 0.14;
    showerDrops.push(
      sphere(
        0.012,
        0.046,
        0.012,
        waterMaterial,
        Math.cos(angle) * radius,
        0.25 + (drop % 5) * 0.3,
        Math.sin(angle) * radius,
        showerWater,
      ),
    );
  }
  const washer = group(
    HOME_FIXTURES.washingMachine.x,
    0.05,
    HOME_FIXTURES.washingMachine.z,
    'home-washing-machine',
  );
  washer.rotation.y = Math.PI / 2;
  box(0.83, 0.86, 0.83, white, 0, 0.44, 0, washer, 0.045);
  box(0.75, 0.13, 0.04, linen, 0, 0.76, 0.433, washer, 0.015);
  box(0.25, 0.075, 0.006, sage, 0.09, 0.78, 0.457, washer, 0.009);
  cylinder(0.036, 0.015, charcoal, -0.23, 0.78, 0.457, washer).rotation.x = Math.PI / 2;
  const washerDoor = group(0, 0.41, 0.448, 'home-washer-door', washer);
  ring(0.265, 0.037, steel, 0, 0, 0, washerDoor);
  cylinder(0.225, 0.017, charcoal, 0, 0, 0.003, washerDoor).rotation.x = Math.PI / 2;
  const washerDrum = group(0, 0, 0.027, 'home-washer-drum', washerDoor);
  for (let cloth = 0; cloth < 3; cloth++) {
    const angle = (cloth * Math.PI * 2) / 3;
    box(
      0.19,
      0.12,
      0.01,
      cloth === 0 ? terracotta : cloth === 1 ? sage : linen,
      Math.cos(angle) * 0.1,
      Math.sin(angle) * 0.1,
      0,
      washerDrum,
      0.04,
    ).rotation.z = angle;
  }
  cylinder(0.224, 0.007, glass, 0, 0, 0.041, washerDoor).rotation.x = Math.PI / 2;
  box(0.08, 0.07, 0.03, steel, 0.21, 0, 0.057, washerDoor, 0.018);
  towel(0.55, 0.48, beige, 0, 0.91, 0, washer);
  towel(0.48, 0.44, linen, 0, 0.99, 0, washer);
  const basket = group(3.26, 0.05, -0.42, 'home-laundry-basket');
  cylinder(0.24, 0.43, paleWood, 0, 0.235, 0, basket);
  cylinder(0.23, 0.035, walnut, 0, 0.465, 0, basket);
  for (let woven = 0; woven < 12; woven++) {
    const angle = (woven * Math.PI * 2) / 12;
    box(
      0.013,
      0.33,
      0.013,
      beige,
      Math.cos(angle) * 0.242,
      0.235,
      Math.sin(angle) * 0.242,
      basket,
      0.003,
    );
  }
  for (const y of [0.13, 0.24, 0.35]) {
    const weave = ring(0.242, 0.005, beige, 0, y, 0, basket);
    weave.rotation.x = Math.PI / 2;
  }
  towel(0.29, 0.28, sage, 0.04, 0.45, 0, basket);
  towel(0.27, 0.24, terracotta, -0.05, 0.5, 0.02, basket);
  tube([new THREE.Vector3(3.13, 1.18, -4.49), new THREE.Vector3(3.57, 1.18, -4.49)], 0.015, gold);
  box(0.28, 0.4, 0.025, linen, 3.35, 0.99, -4.46, home, 0.018);
  box(0.25, 0.03, 0.027, beige, 3.35, 0.81, -4.439, home, 0.003);
  box(1.12, 0.004, 0.64, beige, 4.15, 0.051, -3.13, home, 0.002, 'home-bathroom-sink-mat');
  box(0.72, 0.004, 0.4, linen, 4.49, 0.051, -1.44, home, 0.002, 'home-laundry-mat');

  const bathroomStream = cylinder(
    0.012,
    0.19,
    waterMaterial,
    4.08,
    1.003,
    -4.14,
    home,
    'home-bathroom-water-stream',
  );
  const kitchenStream = cylinder(
    0.013,
    0.21,
    waterMaterial,
    6.19,
    1.125,
    0.8,
    home,
    'home-kitchen-water-stream',
  );
  const cleaningCloth = towel(0.14, 0.19, blue, 5.87, 0.998, 1.8);
  cleaningCloth.name = 'home-cleaning-cloth';
  const dishFoam = group(6.14, 1.02, 0.9, 'home-dish-soap-foam');
  for (let bubble = 0; bubble < 7; bubble++)
    sphere(
      0.022 + (bubble % 2) * 0.011,
      0.018,
      0.025,
      white,
      Math.sin(bubble * 2.2) * 0.16,
      (bubble % 2) * 0.02,
      Math.cos(bubble * 2.2) * 0.15,
      dishFoam,
    );
  let elapsed = 0;
  bathroomStream.visible = false;
  kitchenStream.visible = false;
  showerWater.visible = false;
  steam.visible = false;
  dishFoam.visible = false;

  return {
    group: home,
    destinations,
    animate(delta: number, activity: HomeActivity, progress: number, daylight: number) {
      elapsed += Math.max(0, Math.min(delta, 0.1));
      const night = 1 - THREE.MathUtils.clamp(daylight, 0, 1);
      bedroomLamp.intensity = 0.08 + night * 0.57;
      deskLamp.intensity = 0.07 + night * 0.48;
      livingLamp.intensity = 0.08 + night * 0.54;
      bathroomLight.intensity =
        activity === 'brush' ||
        activity === 'wash-face' ||
        activity === 'shower' ||
        activity === 'laundry'
          ? 0.45
          : 0.08 + night * 0.23;
      warmGlow.emissiveIntensity = 0.2 + night * 0.6;
      bathroomStream.visible = activity === 'brush' || activity === 'wash-face';
      kitchenStream.visible = activity === 'wash-dishes';
      dishFoam.visible = activity === 'wash-dishes';
      showerWater.visible = activity === 'shower';
      steam.visible = activity === 'cook';
      burnerMaterial.emissiveIntensity = activity === 'cook' ? 1.7 : 0.02;
      for (const [index, puff] of steamPuffs.entries()) {
        const phase = (elapsed * 0.4 + index * 0.18) % 1;
        puff.position.set(
          Math.sin(elapsed * 0.9 + index) * 0.055,
          phase * 0.65,
          Math.cos(elapsed + index) * 0.035,
        );
        puff.scale.set(0.045 + phase * 0.05, 0.08 + phase * 0.06, 0.045 + phase * 0.05);
      }
      if (activity === 'laundry') washerDrum.rotation.z += delta * 3.6;
      for (const [index, drop] of showerDrops.entries())
        drop.position.y = 0.2 + ((((2 - elapsed * 1.8 + index * 0.14) % 1.75) + 1.75) % 1.75);
      bathroomStream.scale.x = 0.012 * (1 + Math.sin(elapsed * 18) * 0.08);
      kitchenStream.scale.x = 0.013 * (1 + Math.sin(elapsed * 17) * 0.08);
      if (activity === 'clean') {
        cleaningCloth.position.z = 1.8 + Math.sin(elapsed * 4.8) * 0.15;
        cleaningCloth.rotation.y = Math.sin(elapsed * 4.8) * 0.08;
      }
      diningPlate.visible = activity !== 'wash-dishes' || progress > 0.6;
      record.userData.daylight = daylight;
    },
  };
}
