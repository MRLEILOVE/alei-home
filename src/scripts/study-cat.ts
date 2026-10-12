import * as THREE from 'three';

export type StudyCatMode = 'idle' | 'rub' | 'sit' | 'sleep';

export type StudyCat = {
  group: THREE.Group;
  animate: (delta: number, moving: boolean, mode?: StudyCatMode) => void;
  faceTo: (yaw: number, delta: number) => void;
};

/** 狸花猫的立体人偶，四只脚的脚底为原点，正面朝 +Z。 */
export function createStudyCat(): StudyCat {
  const group = new THREE.Group();
  group.name = 'study-tabby-cat';
  const rig = new THREE.Group();
  rig.name = 'tabby-cat-rig';
  group.add(rig);

  const material = (color: number, roughness = 0.95) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
  const fur = material(0x958571);
  const softFur = material(0xb1a38b);
  const stripe = material(0x493f35);
  stripe.side = THREE.DoubleSide;
  const cream = material(0xd9cbb1);
  const pink = material(0xc98580);
  const dark = material(0x272720);
  const amber = material(0xa6b66f, 0.5);
  const gleam = material(0xfff9e9, 0.3);
  const whiskerMaterial = material(0xe7ddc9);
  const sphere = new THREE.SphereGeometry(1, 20, 12);

  function ellipsoid(
    parent: THREE.Object3D,
    name: string,
    position: [number, number, number],
    scale: [number, number, number],
    surface: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(sphere, surface);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function thread(
    parent: THREE.Object3D,
    name: string,
    points: [number, number, number][],
    radius: number,
    surface: THREE.Material,
  ) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, radius, 5, false), surface);
    mesh.name = name;
    mesh.castShadow = radius > 0.003;
    parent.add(mesh);
    return mesh;
  }

  // 条纹沿身体的曲面贴合，在侧面与背面都有真实体积。
  function bodyStripe(
    parent: THREE.Object3D,
    index: number,
    z: number,
    start: number,
    end: number,
  ) {
    const vertices: number[] = [];
    const indices: number[] = [];
    const steps = 24;
    for (let step = 0; step <= steps; step++) {
      const fraction = step / steps;
      const theta = THREE.MathUtils.lerp(start, end, fraction);
      const taper = Math.pow(Math.sin(fraction * Math.PI), 0.45);
      const width = (0.006 + taper * 0.014) * (index % 3 === 0 ? 1.1 : 1);
      const bend = Math.sin(theta * 1.8 + index * 0.9) * 0.011;
      for (const side of [-1, 1]) {
        const stripeZ = z + bend + side * width * 0.5;
        const section = Math.sqrt(Math.max(0.015, 1 - (stripeZ / 0.25) ** 2));
        vertices.push(
          Math.sin(theta) * (0.14 * section + 0.0018),
          Math.cos(theta) * (0.13 * section + 0.0018),
          stripeZ,
        );
      }
      if (step < steps) {
        const a = step * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, stripe);
    mesh.name = `mackerel-body-stripe-${index}`;
    parent.add(mesh);
  }

  const torso = new THREE.Group();
  torso.name = 'cat-torso';
  torso.position.set(0, 0.279, -0.027);
  rig.add(torso);
  ellipsoid(torso, 'cat-body', [0, 0, 0], [0.14, 0.13, 0.25], fur);
  ellipsoid(torso, 'cat-cream-belly', [0, -0.074, 0.021], [0.105, 0.062, 0.183], cream);
  ellipsoid(torso, 'cat-chest', [0, -0.025, 0.183], [0.107, 0.102, 0.096], softFur);
  ellipsoid(torso, 'cat-cream-chest', [0, -0.047, 0.232], [0.068, 0.079, 0.044], cream);
  for (let index = 0; index < 8; index++) {
    bodyStripe(torso, index, -0.208 + index * 0.056, -1.87, 1.87);
  }
  // 一条细背线和两侧断续的鱼骨纹是狸花猫的主要辨识特征。
  thread(
    torso,
    'cat-dorsal-stripe',
    [
      [0, 0.069, -0.215],
      [0, 0.12, -0.09],
      [0, 0.132, 0],
      [0, 0.103, 0.145],
    ],
    0.005,
    stripe,
  );
  for (const side of [-1, 1]) {
    for (let index = 0; index < 4; index++) {
      const z = -0.145 + index * 0.083;
      const section = Math.sqrt(1 - (z / 0.25) ** 2);
      ellipsoid(
        torso,
        `cat-flank-spot-${side}-${index}`,
        [side * (0.14 * section + 0.001), -0.032, z],
        [0.0028, 0.008, 0.011],
        stripe,
      );
    }
  }

  const legs: THREE.Group[] = [];
  const lowerLegs: THREE.Group[] = [];
  const paws: THREE.Group[] = [];
  for (const front of [true, false]) {
    for (const side of [-1, 1]) {
      const label = `${front ? 'front' : 'hind'}-${side === -1 ? 'left' : 'right'}`;
      const leg = new THREE.Group();
      leg.name = `cat-${label}-leg`;
      leg.position.set(side * 0.096, 0.25, front ? 0.147 : -0.193);
      rig.add(leg);
      ellipsoid(
        leg,
        `${label}-upper-leg`,
        [0, -0.049, 0],
        [front ? 0.038 : 0.046, 0.065, front ? 0.042 : 0.06],
        fur,
      );
      const shin = new THREE.Group();
      shin.name = `${label}-shin-joint`;
      shin.position.set(0, -0.1, 0);
      leg.add(shin);
      ellipsoid(shin, `${label}-lower-leg`, [0, -0.049, 0], [0.027, 0.065, 0.031], softFur);
      for (let band = 0; band < 2; band++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.0055, 5, 16), stripe);
        ring.name = `${label}-leg-stripe-${band}`;
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, -0.025 - band * 0.031, 0);
        ring.scale.set(1, 1.12, 1);
        shin.add(ring);
      }
      const paw = new THREE.Group();
      paw.name = `cat-${label}-paw`;
      paw.position.set(0, -0.121, 0.019);
      shin.add(paw);
      ellipsoid(paw, `${label}-paw-pad`, [0, 0, 0], [0.037, 0.027, 0.054], softFur);
      for (let toe = -1; toe <= 1; toe++) {
        ellipsoid(
          paw,
          `${label}-toe-${toe}`,
          [toe * 0.016, -0.004, 0.032],
          [0.012, 0.017, 0.022],
          cream,
        );
      }
      legs.push(leg);
      lowerLegs.push(shin);
      paws.push(paw);
    }
  }

  const head = new THREE.Group();
  head.name = 'cat-head';
  head.position.set(0, 0.365, 0.253);
  rig.add(head);
  ellipsoid(head, 'cat-neck', [0, -0.065, -0.055], [0.085, 0.091, 0.087], fur);
  ellipsoid(head, 'cat-head-fur', [0, 0, 0], [0.122, 0.103, 0.103], fur);
  ellipsoid(head, 'cat-cheeks', [0, -0.039, 0.032], [0.126, 0.063, 0.075], softFur);
  ellipsoid(head, 'cat-chin', [0, -0.077, 0.082], [0.041, 0.025, 0.038], cream);

  function ear(side: number) {
    const earGroup = new THREE.Group();
    earGroup.name = `cat-${side === -1 ? 'left' : 'right'}-ear`;
    earGroup.position.set(side * 0.081, 0.07, -0.005);
    earGroup.rotation.z = -side * 0.12;
    const vertices = [
      -0.048,
      0,
      0.021,
      0.048,
      0,
      0.021,
      side * 0.022,
      0.109,
      -0.005,
      -0.037,
      0,
      -0.027,
      0.038,
      0,
      -0.027,
      side * 0.022,
      0.103,
      -0.026,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex([0, 1, 2, 5, 4, 3, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1]);
    geometry.computeVertexNormals();
    const outer = new THREE.Mesh(geometry, stripe);
    outer.name = 'triangular-ear-shell';
    outer.castShadow = true;
    earGroup.add(outer);
    const innerGeometry = new THREE.BufferGeometry();
    innerGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-0.03, 0.012, 0.0225, 0.031, 0.012, 0.0225, side * 0.018, 0.084, 0.003],
        3,
      ),
    );
    innerGeometry.setIndex([0, 1, 2]);
    innerGeometry.computeVertexNormals();
    const inner = new THREE.Mesh(innerGeometry, pink);
    inner.name = 'pink-ear-interior';
    earGroup.add(inner);
    ellipsoid(earGroup, 'ear-base-fur', [0, 0.003, -0.014], [0.043, 0.026, 0.028], fur);
    head.add(earGroup);
    return earGroup;
  }
  const ears = [ear(-1), ear(1)];

  const eyes: THREE.Group[] = [];
  const sleepingEyelids: THREE.Group[] = [];
  const eyelidMaterial = dark.clone();
  eyelidMaterial.transparent = true;
  eyelidMaterial.opacity = 0;
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.name = `cat-${side === -1 ? 'left' : 'right'}-eye`;
    eye.position.set(side * 0.052, 0.001, 0.09);
    eye.rotation.y = side * 0.19;
    eye.rotation.z = side * 0.09;
    head.add(eye);
    ellipsoid(eye, 'almond-eye-outline', [0, 0, 0], [0.031, 0.021, 0.013], dark);
    ellipsoid(eye, 'green-amber-iris', [0, 0, 0.007], [0.025, 0.017, 0.011], amber);
    ellipsoid(eye, 'vertical-pupil', [0, 0, 0.016], [0.0047, 0.016, 0.004], dark);
    ellipsoid(eye, 'eye-highlight', [-0.007, 0.006, 0.018], [0.004, 0.004, 0.003], gleam);
    eyes.push(eye);
    const eyelid = new THREE.Group();
    eyelid.name = `cat-${side === -1 ? 'left' : 'right'}-sleeping-eyelid`;
    eyelid.position.copy(eye.position);
    eyelid.rotation.copy(eye.rotation);
    thread(
      eyelid,
      'closed-eyelid-curve',
      [
        [-0.025, 0.003, 0.016],
        [0, -0.003, 0.021],
        [0.025, 0.003, 0.016],
      ],
      0.0024,
      eyelidMaterial,
    );
    eyelid.visible = false;
    head.add(eyelid);
    sleepingEyelids.push(eyelid);
    ellipsoid(
      head,
      `cream-muzzle-${side}`,
      [side * 0.031, -0.05, 0.105],
      [0.037, 0.029, 0.032],
      cream,
    );
    for (let dot = 0; dot < 3; dot++) {
      ellipsoid(
        head,
        `whisker-follicle-${side}-${dot}`,
        [side * (0.027 + dot * 0.01), -0.046 + (dot % 2) * 0.01, 0.136 - dot * 0.004],
        [0.002, 0.002, 0.0018],
        stripe,
      );
    }
    for (let whisker = 0; whisker < 3; whisker++) {
      const height = -0.046 - whisker * 0.008;
      thread(
        head,
        `whisker-${side}-${whisker}`,
        [
          [side * 0.042, height, 0.128],
          [side * 0.116, height + (1 - whisker) * 0.009, 0.134],
          [side * (0.197 - whisker * 0.008), height + (1 - whisker) * 0.023, 0.119],
        ],
        0.0014,
        whiskerMaterial,
      );
    }
    for (let mark = 0; mark < 2; mark++) {
      const y = -0.023 - mark * 0.023;
      thread(
        head,
        `tabby-cheek-stripe-${side}-${mark}`,
        [
          [side * 0.08, y + 0.006, 0.08],
          [side * 0.109, y, 0.057],
          [side * 0.12, y - 0.013, 0.025],
        ],
        0.0045,
        stripe,
      );
    }
  }

  // 额头的 M 字纹沿圆润头骨延伸，两颊也保留狸花条纹。
  thread(
    head,
    'tabby-forehead-M',
    [
      [-0.065, 0.024, 0.087],
      [-0.057, 0.064, 0.069],
      [-0.032, 0.035, 0.097],
      [0, 0.073, 0.077],
      [0.032, 0.035, 0.097],
      [0.057, 0.064, 0.069],
      [0.065, 0.024, 0.087],
    ],
    0.0053,
    stripe,
  );
  for (const side of [-1, 1]) {
    thread(
      head,
      `tabby-crown-stripe-${side}`,
      [
        [side * 0.024, 0.084, 0.061],
        [side * 0.03, 0.102, 0.017],
        [side * 0.036, 0.088, -0.052],
      ],
      0.0045,
      stripe,
    );
  }
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-0.016, 0.007);
  noseShape.quadraticCurveTo(0, 0.013, 0.016, 0.007);
  noseShape.quadraticCurveTo(0.008, -0.007, 0, -0.009);
  noseShape.quadraticCurveTo(-0.008, -0.007, -0.016, 0.007);
  const nose = new THREE.Mesh(
    new THREE.ExtrudeGeometry(noseShape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
      steps: 1,
    }),
    pink,
  );
  nose.name = 'cat-pink-nose';
  nose.position.set(0, -0.04, 0.132);
  head.add(nose);
  thread(
    head,
    'cat-mouth',
    [
      [-0.021, -0.068, 0.127],
      [-0.011, -0.07, 0.135],
      [0, -0.061, 0.14],
      [0.011, -0.07, 0.135],
      [0.021, -0.068, 0.127],
    ],
    0.0018,
    dark,
  );
  thread(
    head,
    'cat-philtrum',
    [
      [0, -0.047, 0.143],
      [0, -0.061, 0.14],
    ],
    0.0018,
    dark,
  );

  const tail = new THREE.Group();
  tail.name = 'cat-tail-joint';
  tail.position.set(0, 0.319, -0.257);
  rig.add(tail);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.012, -0.1),
    new THREE.Vector3(0.004, 0.058, -0.22),
    new THREE.Vector3(0.035, 0.15, -0.3),
    new THREE.Vector3(0.074, 0.192, -0.28),
    new THREE.Vector3(0.09, 0.176, -0.232),
  ]);
  const tailSegments = 64;
  const radialSegments = 8;
  const tailFrames = tailCurve.computeFrenetFrames(tailSegments, false);
  const tailVertices: number[] = [];
  const tailIndices: number[] = [];
  const tailGeometry = new THREE.BufferGeometry();
  for (let segment = 0; segment <= tailSegments; segment++) {
    const t = segment / tailSegments;
    const point = tailCurve.getPointAt(t);
    const radius = 0.024 * (1 - t * 0.61);
    for (let radial = 0; radial <= radialSegments; radial++) {
      const angle = (radial / radialSegments) * Math.PI * 2;
      const vertex = point
        .clone()
        .addScaledVector(tailFrames.normals[segment], Math.cos(angle) * radius)
        .addScaledVector(tailFrames.binormals[segment], Math.sin(angle) * radius);
      tailVertices.push(vertex.x, vertex.y, vertex.z);
      if (segment < tailSegments && radial < radialSegments) {
        const a = segment * (radialSegments + 1) + radial;
        const b = a + radialSegments + 1;
        tailIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    if (segment < tailSegments) {
      const band = Math.floor(t * 14);
      tailGeometry.addGroup(
        segment * radialSegments * 6,
        radialSegments * 6,
        band % 2 === 1 ? 1 : 0,
      );
    }
  }
  tailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tailVertices, 3));
  tailGeometry.setIndex(tailIndices);
  tailGeometry.computeVertexNormals();
  const ringedTail = new THREE.Mesh(tailGeometry, [fur, stripe]);
  ringedTail.name = 'cat-ringed-curled-tail';
  ringedTail.castShadow = true;
  ringedTail.receiveShadow = true;
  tail.add(ringedTail);
  const tailTip = ellipsoid(
    tail,
    'cat-dark-tail-tip',
    [0.09, 0.176, -0.232],
    [0.01, 0.012, 0.01],
    stripe,
  );

  // 同一条环纹尾巴变形后绕到腹部和前爪，睡醒时平滑恢复原来的竖起卷尾。
  const sleepingTailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.1, -0.011, 0.008),
    new THREE.Vector3(-0.17, -0.021, 0.14),
    new THREE.Vector3(-0.12, -0.026, 0.3),
    new THREE.Vector3(0.04, -0.028, 0.37),
    new THREE.Vector3(0.18, -0.028, 0.34),
    new THREE.Vector3(0.21, -0.03, 0.27),
  ]);
  const sleepingTailFrames = sleepingTailCurve.computeFrenetFrames(tailSegments, false);
  const sleepingTailVertices = new Float32Array(tailVertices.length);
  for (let segment = 0; segment <= tailSegments; segment++) {
    const t = segment / tailSegments;
    const point = sleepingTailCurve.getPointAt(t);
    const radius = 0.024 * (1 - t * 0.61);
    for (let radial = 0; radial <= radialSegments; radial++) {
      const angle = (radial / radialSegments) * Math.PI * 2;
      const vertex = point
        .clone()
        .addScaledVector(sleepingTailFrames.normals[segment], Math.cos(angle) * radius)
        .addScaledVector(sleepingTailFrames.binormals[segment], Math.sin(angle) * radius);
      const offset = (segment * (radialSegments + 1) + radial) * 3;
      sleepingTailVertices.set([vertex.x, vertex.y, vertex.z], offset);
    }
  }
  const standingTailVertices = new Float32Array(tailVertices);
  const standingTailNormals = new Float32Array(tailGeometry.getAttribute('normal').array);
  const sleepingTailGeometry = tailGeometry.clone();
  sleepingTailGeometry.setAttribute('position', new THREE.BufferAttribute(sleepingTailVertices, 3));
  sleepingTailGeometry.computeVertexNormals();
  const sleepingTailNormals = new Float32Array(sleepingTailGeometry.getAttribute('normal').array);
  sleepingTailGeometry.dispose();
  let previousTailSleepAmount = 0;

  function curlTail(amount: number) {
    if (Math.abs(amount - previousTailSleepAmount) < 0.000001) return;
    const position = tailGeometry.getAttribute('position') as THREE.BufferAttribute;
    const normal = tailGeometry.getAttribute('normal') as THREE.BufferAttribute;
    for (let index = 0; index < standingTailVertices.length; index++) {
      position.array[index] = THREE.MathUtils.lerp(
        standingTailVertices[index],
        sleepingTailVertices[index],
        amount,
      );
      normal.array[index] = THREE.MathUtils.lerp(
        standingTailNormals[index],
        sleepingTailNormals[index],
        amount,
      );
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
    tailGeometry.computeBoundingSphere();
    tailGeometry.computeBoundingBox();
    previousTailSleepAmount = amount;
  }

  let elapsed = 0;
  let walkPhase = 0;
  let walkAmount = 0;
  let rubAmount = 0;
  let sitAmount = 0;
  let sleepAmount = 0;
  const damp = (value: number, target: number, delta: number, speed = 8) =>
    THREE.MathUtils.lerp(value, target, 1 - Math.exp(-delta * speed));

  function animate(delta: number, moving: boolean, mode: StudyCatMode = 'idle') {
    const dt = Math.min(Math.max(delta, 0), 0.08);
    elapsed += dt;
    walkPhase += dt * 9;
    walkAmount = damp(walkAmount, moving ? 1 : 0, dt);
    rubAmount = damp(rubAmount, mode === 'rub' && !moving ? 1 : 0, dt, 5);
    sitAmount = damp(sitAmount, mode === 'sit' && !moving ? 1 : 0, dt, 5);
    sleepAmount = damp(sleepAmount, mode === 'sleep' && !moving ? 1 : 0, dt, 3.6);
    const sway = Math.sin(elapsed * 2.8);
    const breathing = Math.sin(elapsed * 1.45) * 0.007 * sleepAmount;
    rig.position.y =
      (Math.abs(Math.sin(walkPhase * 2)) * 0.006 * walkAmount + Math.abs(sway) * 0.01 * rubAmount) *
      (1 - sleepAmount);
    rig.position.x = sway * 0.014 * rubAmount * (1 - sleepAmount);
    rig.rotation.z =
      (Math.sin(walkPhase) * 0.014 * walkAmount + sway * 0.075 * rubAmount) * (1 - sleepAmount);
    torso.position.x = -0.06 * sleepAmount;
    torso.position.y = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.279, 0.23, sitAmount) + Math.sin(elapsed * 2) * 0.0018,
      0.143 + breathing * 0.18,
      sleepAmount,
    );
    torso.position.z = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(-0.027, -0.08, sitAmount),
      -0.014,
      sleepAmount,
    );
    torso.rotation.x = -0.6 * sitAmount * (1 - sleepAmount);
    torso.rotation.y = -0.3 * sleepAmount;
    torso.rotation.z = THREE.MathUtils.lerp(sway * 0.035 * rubAmount, 0.12, sleepAmount);
    torso.scale.set(
      1 + sleepAmount * 0.1,
      1 - sleepAmount * 0.045 + breathing,
      1 - sleepAmount * 0.13,
    );

    for (let index = 0; index < legs.length; index++) {
      const front = index < 2;
      // 对角两腿交替，小幅抬脚，形成猫慢步时的四足节奏。
      const phase = walkPhase + (index === 0 || index === 3 ? 0 : Math.PI);
      const stride = Math.sin(phase) * walkAmount;
      legs[index].rotation.x = THREE.MathUtils.lerp(
        stride * 0.31 + (front ? -0.035 : -0.96) * sitAmount,
        front ? -1.23 : 1.05,
        sleepAmount,
      );
      const side = index % 2 === 0 ? -1 : 1;
      legs[index].position.x = THREE.MathUtils.lerp(
        side * 0.096,
        (front ? 0.025 : -0.04) + side * 0.062,
        sleepAmount,
      );
      legs[index].position.y = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(0.25, front ? 0.25 : 0.16, sitAmount),
        front ? 0.168 : 0.173,
        sleepAmount,
      );
      legs[index].position.z = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(front ? 0.147 : -0.193, front ? 0.094 : -0.165, sitAmount),
        front ? 0.04 : -0.115,
        sleepAmount,
      );
      lowerLegs[index].rotation.x = THREE.MathUtils.lerp(
        Math.max(0, -stride) * 0.17,
        front ? 1.95 : -1.75,
        sleepAmount,
      );
      paws[index].rotation.x = THREE.MathUtils.lerp(
        -legs[index].rotation.x * 0.68,
        front ? -0.72 : 0.7,
        sleepAmount,
      );
      // 折腿过程中按爪垫朝向保持接触高度，避免从站姿下趴时穿过软垫。
      if (sleepAmount > 0.00001) {
        const kneeAngle = legs[index].rotation.x + lowerLegs[index].rotation.x;
        const pawAngle = kneeAngle + paws[index].rotation.x;
        const pawDepth = Math.hypot(Math.cos(pawAngle) * 0.027, Math.sin(pawAngle) * 0.054);
        const contactHeight =
          0.002 +
          Math.cos(legs[index].rotation.x) * 0.1 +
          Math.cos(kneeAngle) * 0.121 +
          Math.sin(kneeAngle) * 0.019 +
          pawDepth;
        legs[index].position.y = Math.max(legs[index].position.y, contactHeight);
      }
    }

    head.position.x = 0.12 * sleepAmount;
    head.position.y = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.365, 0.405, sitAmount),
      0.149 + breathing * 0.045,
      sleepAmount,
    );
    head.position.z = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.253, 0.158, sitAmount),
      0.11,
      sleepAmount,
    );
    head.rotation.x = THREE.MathUtils.lerp(
      -0.075 * rubAmount + Math.sin(walkPhase * 2) * 0.012 * walkAmount,
      0.22,
      sleepAmount,
    );
    head.rotation.y = THREE.MathUtils.lerp(
      Math.sin(elapsed * 0.7) * 0.055 * (1 - walkAmount) + sway * 0.09 * rubAmount,
      -0.86,
      sleepAmount,
    );
    head.rotation.z = THREE.MathUtils.lerp(
      sway * 0.14 * rubAmount + Math.sin(elapsed * 1.1) * 0.018 * (1 - walkAmount),
      -0.08,
      sleepAmount,
    );
    tail.position.x = -0.065 * sleepAmount;
    tail.position.y = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.319, 0.152, sitAmount),
      0.06,
      sleepAmount,
    );
    tail.position.z = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(-0.257, -0.244, sitAmount),
      -0.2,
      sleepAmount,
    );
    tail.rotation.y = Math.sin(elapsed * 1.6) * (0.21 + rubAmount * 0.16) * (1 - sleepAmount);
    tail.rotation.z = (Math.sin(elapsed * 2.2) * 0.065 + rubAmount * 0.12) * (1 - sleepAmount);
    tail.rotation.x = sitAmount * 0.55 * (1 - sleepAmount);
    tailTip.position.set(
      THREE.MathUtils.lerp(0.09, 0.21, sleepAmount),
      THREE.MathUtils.lerp(0.176, -0.03, sleepAmount),
      THREE.MathUtils.lerp(-0.232, 0.27, sleepAmount),
    );
    curlTail(sleepAmount);
    ears[0].rotation.z = 0.12 + Math.sin(elapsed * 0.85) * 0.015 * (1 - sleepAmount);
    ears[1].rotation.z = -0.12 - Math.sin(elapsed * 0.85 + 0.9) * 0.015 * (1 - sleepAmount);
    const blinkPhase = elapsed % 5.6;
    const blink = blinkPhase > 5.36 && blinkPhase < 5.49;
    for (const eye of eyes) {
      eye.scale.y = THREE.MathUtils.lerp(blink ? 0.15 : 1, 0.03, sleepAmount);
      eye.visible = sleepAmount < 0.9;
    }
    eyelidMaterial.opacity = THREE.MathUtils.smoothstep(sleepAmount, 0.15, 0.9);
    for (const eyelid of sleepingEyelids) eyelid.visible = eyelidMaterial.opacity > 0.005;
  }

  function faceTo(yaw: number, delta: number) {
    const difference = Math.atan2(
      Math.sin(yaw - group.rotation.y),
      Math.cos(yaw - group.rotation.y),
    );
    group.rotation.y += difference * (1 - Math.exp(-Math.max(delta, 0) * 7));
  }

  return { group, animate, faceTo };
}
