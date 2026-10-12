import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { HomeActivity } from './study-home-layout';

export type StudyCharacter = {
  group: THREE.Group;
  animate: (delta: number, moving: boolean, playing: boolean) => void;
  faceTo: (yaw: number, delta: number) => void;
  setPetting: (active: boolean) => void;
  setActivity: (activity: HomeActivity, progress?: number) => void;
  wave: () => void;
};

/** 小阿雷的立体人偶。脚底为原点，正面朝 +Z，行走路线由书房控制器负责。 */
export function createStudyCharacter(): StudyCharacter {
  const group = new THREE.Group();
  group.name = 'little-alei';
  const rig = new THREE.Group();
  rig.name = 'alei-body-rig';
  group.add(rig);

  const material = (color: number, roughness = 0.88) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  const skin = material(0xf3c6a2);
  const earPink = material(0xd99a81);
  const blush = material(0xe5a18c);
  const hair = material(0x33332f);
  const hairLight = material(0x3f4039);
  const ink = material(0x302b27);
  const shirt = material(0x414441);
  const shirtSeam = material(0x555852);
  const trousers = material(0x353b39);
  const bagMaterial = material(0x4a4e49);
  const strapMaterial = material(0x72766d);
  const ivory = material(0xefe7d9);
  const white = material(0xfffaf0, 0.6);
  const watchFace = new THREE.MeshStandardMaterial({ color: 0x1f3031, roughness: 0.35 });
  const watchLight = new THREE.MeshStandardMaterial({
    color: 0x89c7ba,
    emissive: 0x427e79,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });
  const sphereGeometry = new THREE.SphereGeometry(1, 24, 16);

  function ellipsoid(
    parent: THREE.Object3D,
    position: [number, number, number],
    scale: [number, number, number],
    surface: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(sphereGeometry, surface);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function rounded(
    parent: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    surface: THREE.Material,
    radius = 0.025,
  ) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map((value) => value * 0.35))),
      surface,
    );
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function capsule(
    parent: THREE.Object3D,
    radius: number,
    length: number,
    position: [number, number, number],
    surface: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 16), surface);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function line(
    parent: THREE.Object3D,
    points: [number, number, number][],
    thickness: number,
    surface: THREE.Material,
  ) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, thickness, 6, false), surface);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const upperBody = new THREE.Group();
  upperBody.position.y = 0.49;
  rig.add(upperBody);
  const torso = new THREE.Group();
  torso.position.y = -0.49;
  upperBody.add(torso);
  rounded(torso, [0.365, 0.355, 0.265], [0, 0.71, 0], shirt, 0.07);
  // 宽松衣摆与露出的一小圈白色内搭，延续原头像的穿着。
  rounded(torso, [0.395, 0.11, 0.295], [0, 0.548, 0.008], shirt, 0.036);
  rounded(torso, [0.365, 0.022, 0.264], [0, 0.49, 0.006], ivory, 0.008);
  ellipsoid(torso, [0, 0.884, 0], [0.076, 0.067, 0.065], skin);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.014, 8, 24), shirtSeam);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.872, 0);
  torso.add(collar);
  const hips = rounded(rig, [0.325, 0.12, 0.25], [0, 0.448, -0.004], trousers, 0.045);

  const legs: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  const feet: THREE.Group[] = [];
  const footwear: THREE.Object3D[] = [];
  const sleepingFeet: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.092, 0.48, 0);
    rig.add(leg);
    capsule(leg, 0.081, 0.092, [0, -0.117, -0.007], trousers);
    const knee = new THREE.Group();
    knee.position.set(0, -0.22, 0);
    leg.add(knee);
    capsule(knee, 0.074, 0.065, [0, -0.088, -0.007], trousers);
    rounded(knee, [0.149, 0.045, 0.16], [0, -0.12, -0.004], shirtSeam, 0.014);
    const foot = new THREE.Group();
    foot.position.set(0, -0.225, 0.025);
    knee.add(foot);
    rounded(foot, [0.151, 0.055, 0.244], [0, -0.0075, 0.023], ivory, 0.021);
    rounded(foot, [0.143, 0.082, 0.226], [0, 0.044, 0.018], trousers, 0.034);
    rounded(foot, [0.133, 0.033, 0.094], [0, 0.039, 0.108], shirt, 0.015);
    for (let lace = 0; lace < 2; lace++) {
      const thread = rounded(
        foot,
        [0.083, 0.009, 0.014],
        [0, 0.086 - lace * 0.004, 0.067 + lace * 0.026],
        ivory,
        0.003,
      );
      thread.rotation.x = -0.12;
      thread.rotation.y = side * 0.04;
    }
    footwear.push(...foot.children);
    const bareFoot = ellipsoid(foot, [0, 0.012, 0.032], [0.069, 0.048, 0.099], skin);
    bareFoot.visible = false;
    sleepingFeet.push(bareFoot);
    legs.push(leg);
    knees.push(knee);
    feet.push(foot);
  }

  const arms: THREE.Group[] = [];
  const elbows: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.185, 0.812, 0);
    arm.rotation.z = side * 0.11;
    torso.add(arm);
    capsule(arm, 0.077, 0.071, [0, -0.061, 0], shirt);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.145, 0.012);
    arm.add(elbow);
    capsule(elbow, 0.047, 0.073, [0, -0.061, 0], skin);
    ellipsoid(elbow, [0, -0.157, 0.008], [0.051, 0.063, 0.046], skin);
    ellipsoid(elbow, [-side * 0.029, -0.144, 0.031], [0.02, 0.032, 0.022], skin);
    if (side === 1) {
      // 小米手环的腕带、圆角屏幕和细小的薄荷色显示条均为立体几何。
      const wristband = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.026, 16), ink);
      wristband.position.set(0, -0.11, 0);
      wristband.castShadow = true;
      elbow.add(wristband);
      rounded(elbow, [0.069, 0.035, 0.022], [0.022, -0.11, 0.046], watchFace, 0.01);
      rounded(elbow, [0.024, 0.004, 0.003], [0.022, -0.107, 0.059], watchLight, 0.001);
    }
    arms.push(arm);
    elbows.push(elbow);
  }

  // 肩带从左肩绕到背后，侧面和背面也有完整体积。
  const frontStrap = line(
    torso,
    [
      [-0.137, 0.843, 0.112],
      [-0.088, 0.757, 0.146],
      [0.045, 0.629, 0.166],
      [0.18, 0.531, 0.183],
    ],
    0.016,
    strapMaterial,
  );
  const backStrap = line(
    torso,
    [
      [-0.137, 0.843, 0.112],
      [-0.138, 0.886, 0.002],
      [-0.12, 0.83, -0.133],
      [0.012, 0.665, -0.15],
      [0.161, 0.538, -0.1],
      [0.18, 0.531, 0.183],
    ],
    0.016,
    strapMaterial,
  );
  const bag = new THREE.Group();
  bag.position.set(0.177, 0.526, 0.165);
  bag.rotation.z = 0.085;
  torso.add(bag);
  rounded(bag, [0.16, 0.207, 0.083], [0, 0, 0], strapMaterial, 0.041);
  rounded(bag, [0.143, 0.184, 0.086], [0, -0.004, 0.012], bagMaterial, 0.035);
  for (const tilt of [-Math.PI / 4, Math.PI / 4]) {
    const cross = rounded(bag, [0.014, 0.055, 0.005], [0.022, -0.012, 0.058], ivory, 0.002);
    cross.rotation.z = tilt;
  }

  const head = new THREE.Group();
  head.name = 'alei-head';
  head.position.set(0, 0.649, 0.015);
  upperBody.add(head);
  ellipsoid(head, [0, 0, 0], [0.294, 0.278, 0.256], skin);
  for (const side of [-1, 1]) {
    ellipsoid(head, [side * 0.284, -0.038, -0.007], [0.063, 0.081, 0.061], skin);
    ellipsoid(head, [side * 0.317, -0.038, 0.026], [0.028, 0.041, 0.018], earPink);
  }

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hair,
  );
  cap.position.set(0, 0.046, -0.024);
  cap.scale.set(0.31, 0.279, 0.269);
  cap.castShadow = true;
  cap.receiveShadow = true;
  head.add(cap);
  // 交错的发束构成蓬松轮廓，避免用贴图平面冒充头发。
  for (let i = 0; i < 13; i++) {
    const angle = (i / 13) * Math.PI * 2;
    const lock = ellipsoid(
      head,
      [Math.sin(angle) * 0.255, 0.101 + Math.sin(i * 2.8) * 0.025, Math.cos(angle) * 0.203 - 0.024],
      [0.069, 0.124, 0.064],
      i % 4 === 0 ? hairLight : hair,
    );
    lock.rotation.z = -Math.sin(angle) * 0.6;
    lock.rotation.x = Math.cos(angle) * 0.31;
  }
  for (let i = 0; i < 8; i++) {
    const x = (i - 3.5) * 0.065;
    const fringe = ellipsoid(
      head,
      [x, 0.126 + Math.sin(i * 2.3) * 0.017, 0.196 - Math.abs(x) * 0.09],
      [0.046, 0.116 - Math.abs(x) * 0.09, 0.052],
      i % 3 === 0 ? hairLight : hair,
    );
    fringe.rotation.z = -0.31 + Math.sin(i * 1.5) * 0.22;
    fringe.rotation.x = -0.22;
  }
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.4;
    const tuft = ellipsoid(
      head,
      [Math.sin(angle) * 0.13, 0.274 + (i % 2) * 0.022, Math.cos(angle) * 0.105 - 0.043],
      [0.046, 0.08, 0.051],
      i % 3 === 0 ? hairLight : hair,
    );
    tuft.rotation.z = Math.sin(angle) * 0.8;
    tuft.rotation.x = Math.cos(angle) * 0.5;
  }

  const eyes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eye = ellipsoid(head, [side * 0.1, -0.023, 0.242], [0.028, 0.042, 0.018], ink);
    ellipsoid(eye, [-0.18, 0.27, 0.81], [0.26, 0.2, 0.28], white);
    ellipsoid(head, [side * 0.161, -0.084, 0.208], [0.046, 0.024, 0.012], blush);
    line(
      head,
      [
        [side * 0.065, 0.047, 0.243],
        [side * 0.095, 0.058, 0.24],
        [side * 0.128, 0.049, 0.23],
      ],
      0.009,
      ink,
    );
    eyes.push(eye);
  }
  ellipsoid(head, [0, -0.062, 0.256], [0.017, 0.018, 0.014], skin);
  line(
    head,
    [
      [-0.04, -0.113, 0.23],
      [-0.019, -0.127, 0.231],
      [0.008, -0.13, 0.231],
      [0.038, -0.114, 0.23],
    ],
    0.006,
    ink,
  );

  // 日常用品接在腕部，随手臂关节运动；行走和聊天时收起。
  const sage = material(0x91a99a);
  const ceramic = material(0xf8f0db, 0.48);
  const timber = material(0xab8053);
  const steel = new THREE.MeshStandardMaterial({
    color: 0x9fa9a5,
    roughness: 0.36,
    metalness: 0.65,
  });
  const clothMaterial = material(0xe2b078);
  const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xe1f5ed,
    roughness: 0.3,
    transparent: true,
    opacity: 0.65,
  });
  const props: { group: THREE.Group; activities: HomeActivity[] }[] = [];

  function heldProp(hand: number, name: string, activities: HomeActivity[]) {
    const prop = new THREE.Group();
    prop.name = name;
    prop.position.set(0, -0.157, 0.028);
    prop.visible = false;
    elbows[hand].add(prop);
    props.push({ group: prop, activities });
    return prop;
  }

  const toothbrush = heldProp(1, 'alei-toothbrush', ['brush']);
  capsule(toothbrush, 0.012, 0.12, [0, -0.043, 0], sage);
  rounded(toothbrush, [0.054, 0.029, 0.022], [0, -0.124, 0], sage, 0.009);
  for (let i = 0; i < 4; i++) {
    rounded(toothbrush, [0.008, 0.018, 0.019], [(i - 1.5) * 0.012, -0.126, 0.017], white, 0.002);
  }

  const spatula = heldProp(1, 'alei-spatula', ['cook']);
  capsule(spatula, 0.013, 0.17, [0, -0.057, 0], timber);
  rounded(spatula, [0.073, 0.086, 0.014], [0, -0.19, 0], steel, 0.014);
  for (const x of [-0.018, 0, 0.018])
    rounded(spatula, [0.005, 0.045, 0.017], [x, -0.186, 0], ink, 0.002);

  const plate = heldProp(0, 'alei-washing-plate', ['wash-dishes']);
  const plateMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.091, 0.016, 24), ceramic);
  plateMesh.rotation.x = Math.PI / 2;
  plateMesh.position.set(0, -0.055, 0.017);
  plate.add(plateMesh);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.097, 0.01, 8, 24), sage);
  rim.position.copy(plateMesh.position);
  rim.position.z += 0.011;
  plate.add(rim);
  const sponge = heldProp(1, 'alei-sponge', ['wash-dishes']);
  sponge.position.x = -0.045;
  rounded(sponge, [0.069, 0.029, 0.049], [0, -0.02, 0.035], clothMaterial, 0.015);
  rounded(sponge, [0.069, 0.01, 0.049], [0, -0.035, 0.035], sage, 0.004);
  for (const point of [
    [-0.016, 0, 0.037],
    [0.011, 0.005, 0.04],
    [0.029, -0.01, 0.031],
  ] as [number, number, number][])
    ellipsoid(sponge, point, [0.014, 0.014, 0.014], foamMaterial);

  const cloth = heldProp(1, 'alei-cleaning-cloth', ['clean']);
  rounded(cloth, [0.136, 0.022, 0.099], [0, -0.041, 0.005], clothMaterial, 0.009);
  rounded(cloth, [0.099, 0.012, 0.087], [0.01, -0.057, 0.005], ivory, 0.006);

  const laundry = heldProp(0, 'alei-laundry', ['laundry']);
  rounded(laundry, [0.22, 0.05, 0.14], [0.06, -0.018, 0.015], sage, 0.02);
  rounded(laundry, [0.2, 0.018, 0.125], [0.061, -0.051, 0.02], ivory, 0.008);
  line(
    laundry,
    [
      [-0.04, -0.03, 0.051],
      [0.04, -0.034, 0.06],
      [0.15, -0.035, 0.045],
    ],
    0.005,
    shirtSeam,
  );

  const bowl = heldProp(0, 'alei-rice-bowl', ['eat']);
  bowl.rotation.x = 2.6;
  const bowlSurface = new THREE.Mesh(
    new THREE.SphereGeometry(0.084, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    ceramic,
  );
  bowlSurface.material = ceramic.clone();
  (bowlSurface.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  bowl.add(bowlSurface);
  ellipsoid(bowl, [0, -0.013, 0], [0.071, 0.024, 0.071], ivory);
  for (const point of [
    [-0.02, 0.006, 0.018],
    [0.022, 0.012, -0.018],
    [0.004, 0.008, 0.024],
  ] as [number, number, number][])
    ellipsoid(bowl, point, [0.015, 0.009, 0.014], sage);
  const spoon = heldProp(1, 'alei-spoon', ['eat']);
  capsule(spoon, 0.008, 0.09, [0, -0.035, 0], timber);
  ellipsoid(spoon, [0, -0.095, 0], [0.022, 0.031, 0.008], steel);

  const book = heldProp(0, 'alei-open-book', ['read']);
  book.position.x = 0.15;
  book.rotation.x = 1.95;
  book.rotation.z = -0.15;
  for (const side of [-1, 1]) {
    const page = new THREE.Group();
    page.rotation.z = side * 0.15;
    book.add(page);
    rounded(page, [0.14, 0.013, 0.19], [side * 0.07, 0, 0], sage, 0.005);
    rounded(page, [0.126, 0.018, 0.178], [side * 0.069, 0.013, 0], ivory, 0.003);
    for (let row = 0; row < 6; row++)
      rounded(
        page,
        [0.092 - (row % 3) * 0.008, 0.002, 0.003],
        [side * 0.068, 0.024, row * 0.022 - 0.053],
        shirtSeam,
        0.001,
      );
  }

  const faceWater = heldProp(0, 'alei-face-water', ['wash-face']);
  for (const side of [-1, 1])
    ellipsoid(faceWater, [side * 0.014, 0.017, 0.046], [0.012, 0.016, 0.012], foamMaterial);
  const showerFoam = heldProp(1, 'alei-shampoo', ['shower']);
  for (const point of [
    [0, -0.025, 0.026],
    [0.035, -0.009, 0.02],
    [-0.024, 0.008, 0.021],
  ] as [number, number, number][])
    ellipsoid(showerFoam, point, [0.028, 0.028, 0.02], foamMaterial);

  let elapsed = 0;
  let walkPhase = 0;
  let walkAmount = 0;
  let waveRemaining = 0;
  let waveAmount = 0;
  let petting = false;
  let petAmount = 0;
  let activity: HomeActivity = 'idle';
  let activityProgress = 1;
  const activityWeights = new Map<HomeActivity, number>();
  const damp = (value: number, target: number, delta: number, speed = 9) =>
    THREE.MathUtils.lerp(value, target, 1 - Math.exp(-delta * speed));

  type ActivityPose = {
    lean: number;
    lower: number;
    armsX: [number, number];
    armsY: [number, number];
    armsZ: [number, number];
    elbowsX: [number, number];
    elbowsZ: [number, number];
    armsScale: number;
    legX: number;
    kneeX: number;
    footX: number;
    headX: number;
    headY: number;
    headZ: number;
    sleeping: number;
    eyesClosed: number;
  };

  function activityPose(kind: HomeActivity): ActivityPose {
    const pose: ActivityPose = {
      lean: 0,
      lower: 0,
      armsX: [-0.09, 0],
      armsY: [0, 0],
      armsZ: [-0.11, 0.11],
      elbowsX: [-0.12, 0],
      elbowsZ: [0, 0],
      armsScale: 1,
      legX: 0,
      kneeX: 0,
      footX: 0,
      headX: 0,
      headY: 0,
      headZ: 0,
      sleeping: 0,
      eyesClosed: 0,
    };
    const stroke = Math.sin(elapsed * 5.2);
    const slow = Math.sin(elapsed * 2.3);
    switch (kind) {
      case 'brush':
        pose.armsX = [-0.4, -1.35 + stroke * 0.045];
        pose.armsY = [0, stroke * 0.07];
        pose.armsZ = [-0.11, -0.8];
        pose.elbowsX = [-0.5, -0.8];
        pose.headX = 0.03;
        break;
      case 'wash-face':
        pose.lean = 0.14 + slow * 0.035;
        pose.armsX = [-1.72 + stroke * 0.05, -1.72 - stroke * 0.05];
        pose.armsZ = [0.34, -0.34];
        pose.elbowsX = [-1.1 + slow * 0.15, -1.1 + slow * 0.15];
        pose.headX = 0.12;
        pose.eyesClosed = 0.7;
        break;
      case 'cook':
        pose.armsX = [-1.5, -1.91 + slow * 0.12];
        pose.armsY = [0, Math.sin(elapsed * 2.6) * 0.23];
        pose.armsZ = [-0.1, 0.1];
        pose.elbowsX = [-0.12, 0.02];
        pose.headX = 0.14;
        pose.lean = 0.04;
        break;
      case 'wash-dishes':
        pose.armsX = [-1.64, -1.48 + stroke * 0.055];
        pose.armsY = [-0.15, 0.13 + stroke * 0.1];
        pose.armsZ = [0.42, -0.52];
        pose.elbowsX = [-0.1, -0.1];
        pose.armsScale = 1.1;
        pose.lean = 0.1;
        pose.headX = 0.17;
        break;
      case 'clean':
        pose.armsX = [-0.8, -1.91 + slow * 0.065];
        pose.armsY = [0, Math.sin(elapsed * 3.8) * 0.3];
        pose.armsZ = [-0.11, 0.025];
        pose.elbowsX = [-0.45, 0.025];
        pose.armsScale = 1.13;
        pose.lean = 0.14;
        pose.headX = 0.2;
        break;
      case 'laundry':
        pose.lean = 0.72 + slow * 0.19;
        pose.lower = 0.04;
        pose.armsX = [-1.22 + slow * 0.14, -1.22 + slow * 0.14];
        pose.armsZ = [0.12, -0.12];
        pose.elbowsX = [-0.45, -0.45];
        pose.headX = 0.17;
        break;
      case 'eat':
        pose.lower = 0.19;
        pose.legX = -Math.PI / 2;
        pose.kneeX = Math.PI / 2;
        pose.armsX = [-1.2, -1.52 + slow * 0.12];
        pose.armsZ = [0.21, -0.68];
        pose.elbowsX = [-1.4, -0.86 - slow * 0.14];
        pose.headX = 0.07;
        break;
      case 'read':
        pose.armsX = [-1.2, -1.2];
        pose.armsZ = [0.15, -0.15];
        pose.elbowsX = [-0.75, -0.75];
        pose.headX = 0.2;
        pose.headY = Math.sin(elapsed * 0.5) * 0.028;
        break;
      case 'shower':
        pose.armsX = [-2.94 + stroke * 0.1, -2.94 - stroke * 0.1];
        pose.armsZ = [-0.37, 0.37];
        pose.elbowsX = [-0.38, -0.38];
        pose.armsScale = 1.48;
        pose.headX = 0.15;
        pose.headZ = slow * 0.035;
        pose.eyesClosed = 0.6;
        break;
      case 'toilet':
        pose.lower = 0.19;
        pose.legX = -Math.PI / 2;
        pose.kneeX = Math.PI / 2;
        pose.armsX = [-0.63, -0.63];
        pose.armsZ = [0.03, -0.03];
        pose.elbowsX = [-0.75, -0.75];
        pose.headX = 0.08;
        break;
      case 'sleep':
        pose.sleeping = 1;
        pose.armsX = [-0.22, -0.22];
        pose.armsZ = [0.16, -0.16];
        pose.elbowsX = [-0.85, -0.85];
        pose.kneeX = 0.035;
        pose.headY = -0.09;
        pose.eyesClosed = 1;
        break;
    }
    return pose;
  }

  function animate(delta: number, moving: boolean, playing: boolean) {
    const dt = Math.min(Math.max(delta, 0), 0.08);
    elapsed += dt;
    walkPhase += dt * 7.8;
    petAmount = damp(petAmount, petting ? 1 : 0, dt, 4.5);
    walkAmount = damp(walkAmount, moving && !petting ? 1 : 0, dt);
    waveRemaining = Math.max(0, waveRemaining - dt);
    waveAmount = damp(waveAmount, waveRemaining > 0 && !petting ? 1 : 0, dt);
    const dailyAllowed = !moving && !petting && waveRemaining <= 0;
    const activities: HomeActivity[] = [
      'brush',
      'wash-face',
      'cook',
      'eat',
      'wash-dishes',
      'clean',
      'laundry',
      'read',
      'shower',
      'toilet',
      'sleep',
    ];
    for (const kind of activities) {
      const target =
        dailyAllowed && activity === kind ? (kind === 'sleep' ? activityProgress : 1) : 0;
      activityWeights.set(
        kind,
        damp(activityWeights.get(kind) ?? 0, target, dt, kind === 'sleep' ? 2.8 : 6),
      );
    }
    const stride = Math.sin(walkPhase) * walkAmount * (1 - petAmount);
    const stroke = Math.sin(elapsed * 3.2);
    const crouch = petAmount * 0.055;
    // 只调整局部关节；腿部轻微压缩，并同步降低髋部，鞋底仍贴近地面。
    for (const leg of legs) {
      leg.position.y = 0.48 - crouch;
      leg.scale.y = 1 - crouch / 0.48;
      leg.rotation.y = 0;
      leg.rotation.z = 0;
    }
    hips.position.y = 0.448 - crouch;
    upperBody.position.y = 0.49 - crouch;
    legs[0].rotation.x = stride * 0.36;
    legs[1].rotation.x = -stride * 0.36;
    feet[0].rotation.x = Math.max(0, -stride) * 0.17;
    feet[1].rotation.x = Math.max(0, stride) * 0.17;
    for (const knee of knees) knee.rotation.x = 0;
    for (const arm of arms) {
      arm.rotation.y = 0;
      arm.scale.y = 1;
    }
    arms[0].rotation.x = THREE.MathUtils.lerp(
      -stride * 0.28 - 0.09,
      -1.83 + stroke * 0.075,
      petAmount,
    );
    arms[1].rotation.x = stride * 0.28 - waveAmount * 0.25;
    arms[0].rotation.z = THREE.MathUtils.lerp(-0.11, 0.36, petAmount);
    arms[1].rotation.z = THREE.MathUtils.lerp(
      0.11,
      2.05 + Math.sin(elapsed * 12) * 0.15,
      waveAmount,
    );
    elbows[0].rotation.x = THREE.MathUtils.lerp(-0.12, -0.045 - stroke * 0.025, petAmount);
    elbows[0].rotation.z = 0;
    elbows[1].rotation.x = 0;
    elbows[1].rotation.z = waveAmount * -0.38;
    rig.position.y = Math.abs(Math.cos(walkPhase)) * 0.016 * walkAmount * (1 - petAmount);
    rig.rotation.x = 0;
    rig.rotation.z =
      (playing && !moving ? Math.sin(elapsed * 2.8) * 0.024 : stride * 0.018) * (1 - petAmount);
    upperBody.rotation.x = THREE.MathUtils.lerp(
      Math.sin(elapsed * 1.9) * 0.005 * (1 - walkAmount),
      0.8 + stroke * 0.015,
      petAmount,
    );
    head.rotation.x = petAmount * 0.12;
    head.rotation.y = Math.sin(elapsed * 0.63) * 0.055 * (1 - walkAmount) * (1 - petAmount);
    head.rotation.z = Math.sin(elapsed * 1.4) * 0.018 * (1 - walkAmount) * (1 - petAmount);
    bag.rotation.z = 0.085 + stride * 0.05;

    // 对局部关节做加权过渡。外层 group 的位置完全交给生活控制器，
    // 上床、坐下和恢复行走时不会因动作切换把角色瞬间挪走。
    const totalWeight = Math.min(
      1,
      [...activityWeights.values()].reduce((sum, weight) => sum + weight, 0),
    );
    const rawWeight = [...activityWeights.values()].reduce((sum, weight) => sum + weight, 0);
    const normalize = rawWeight > 1 ? 1 / rawWeight : 1;
    const weighted = activityPose('idle');
    for (const key of [
      'lean',
      'lower',
      'legX',
      'kneeX',
      'footX',
      'headX',
      'headY',
      'headZ',
      'sleeping',
      'eyesClosed',
      'armsScale',
    ] as const)
      weighted[key] = 0;
    for (const key of ['armsX', 'armsY', 'armsZ', 'elbowsX', 'elbowsZ'] as const)
      weighted[key] = [0, 0];
    for (const [kind, amount] of activityWeights) {
      const weight = amount * normalize;
      if (weight < 0.00001) continue;
      const pose = activityPose(kind);
      for (const key of [
        'lean',
        'lower',
        'legX',
        'kneeX',
        'footX',
        'headX',
        'headY',
        'headZ',
        'sleeping',
        'eyesClosed',
        'armsScale',
      ] as const)
        weighted[key] += pose[key] * weight;
      for (const key of ['armsX', 'armsY', 'armsZ', 'elbowsX', 'elbowsZ'] as const) {
        for (const index of [0, 1]) weighted[key][index] += pose[key][index] * weight;
      }
    }
    const blend = (base: number, value: number) => base * (1 - totalWeight) + value;
    const lower = blend(crouch, weighted.lower);
    const seated = (activityWeights.get('eat') ?? 0) + (activityWeights.get('toilet') ?? 0);
    hips.position.y = 0.448 - lower;
    upperBody.position.y = 0.49 - lower;
    upperBody.rotation.x = blend(upperBody.rotation.x, weighted.lean);
    upperBody.scale.y = 1 + Math.sin(elapsed * 1.65) * 0.004 * weighted.sleeping;
    for (const index of [0, 1]) {
      legs[index].position.y = 0.48 - lower;
      legs[index].scale.y = 1 - (lower * (1 - Math.min(seated, 1))) / 0.48;
      legs[index].rotation.x = blend(legs[index].rotation.x, weighted.legX);
      knees[index].rotation.x = weighted.kneeX;
      feet[index].rotation.x = blend(feet[index].rotation.x, weighted.footX);
      arms[index].rotation.x = blend(arms[index].rotation.x, weighted.armsX[index]);
      arms[index].rotation.y = weighted.armsY[index];
      arms[index].rotation.z = blend(arms[index].rotation.z, weighted.armsZ[index]);
      arms[index].scale.y = blend(1, weighted.armsScale);
      elbows[index].rotation.x = blend(elbows[index].rotation.x, weighted.elbowsX[index]);
      elbows[index].rotation.z = blend(elbows[index].rotation.z, weighted.elbowsZ[index]);
    }
    rig.rotation.x = (-Math.PI / 2) * weighted.sleeping;
    rig.rotation.z *= 1 - totalWeight;
    rig.position.y =
      rig.position.y * (1 - totalWeight) + Math.sin(elapsed * 1.65) * 0.0015 * weighted.sleeping;
    head.rotation.x = blend(head.rotation.x, weighted.headX);
    head.rotation.y = blend(head.rotation.y, weighted.headY);
    head.rotation.z = blend(head.rotation.z, weighted.headZ);
    const asleep = weighted.sleeping > 0.28;
    bag.visible = !asleep;
    frontStrap.visible = !asleep;
    backStrap.visible = !asleep;
    for (const item of footwear) item.visible = !asleep;
    for (const foot of sleepingFeet) foot.visible = asleep;
    for (const prop of props)
      prop.group.visible =
        dailyAllowed && prop.activities.some((kind) => (activityWeights.get(kind) ?? 0) > 0.3);
    const blinkPhase = elapsed % 4.7;
    const blink = blinkPhase > 4.49 && blinkPhase < 4.64;
    for (const eye of eyes)
      eye.scale.y = THREE.MathUtils.lerp(blink ? 0.007 : 0.042, 0.007, weighted.eyesClosed);
  }

  function faceTo(yaw: number, delta: number) {
    const difference = Math.atan2(
      Math.sin(yaw - group.rotation.y),
      Math.cos(yaw - group.rotation.y),
    );
    group.rotation.y += difference * (1 - Math.exp(-Math.max(delta, 0) * 8));
  }

  return {
    group,
    animate,
    faceTo,
    setPetting: (active) => {
      petting = active && activity !== 'sleep';
      if (active) waveRemaining = 0;
    },
    setActivity: (next, progress = 1) => {
      activity = next;
      activityProgress = Number.isFinite(progress) ? THREE.MathUtils.clamp(progress, 0, 1) : 1;
      if (next === 'sleep') {
        petting = false;
        waveRemaining = 0;
      }
    },
    wave: () => {
      if (
        ['sleep', 'eat', 'toilet'].some(
          (kind) => activity === kind || (activityWeights.get(kind as HomeActivity) ?? 0) > 0.3,
        )
      )
        return;
      petting = false;
      waveRemaining = 2.25;
    },
  };
}
