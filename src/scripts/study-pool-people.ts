import * as THREE from 'three';

/** 两位成年泳客沿各自的小环形泳道游动，动作只更新关节，不逐帧创建网格。 */
export function createStudyPoolPeople() {
  const group = new THREE.Group();
  group.name = 'villa-pool-people';
  const skin = new THREE.MeshStandardMaterial({ color: 0xdca880, roughness: 0.7 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x287ca3, roughness: 0.65 });
  const coral = new THREE.MeshStandardMaterial({ color: 0xda675c, roughness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26363b, roughness: 0.5 });
  const lens = new THREE.MeshStandardMaterial({ color: 0x9bdde0, metalness: 0.25, roughness: 0.2 });
  const geometry = new THREE.SphereGeometry(1, 18, 12);
  const white = new THREE.MeshStandardMaterial({ color: 0xf4e9d3, roughness: 0.65 });
  const wakeMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8ffff,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  function part(
    parent: THREE.Object3D,
    name: string,
    material: THREE.Material,
    position: [number, number, number],
    size: [number, number, number],
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...size);
    parent.add(mesh);
    return mesh;
  }
  const people = (['male', 'female'] as const).map((gender, index) => {
    const person = new THREE.Group();
    person.name = `villa-pool-swimmer-${gender}`;
    group.add(person);
    const suit = index === 0 ? blue : coral;
    part(person, 'swimmer-torso', index === 0 ? skin : suit, [0, 0, 0.06], [0.2, 0.1, 0.31]);
    part(
      person,
      index === 0 ? 'swimmer-blue-trunks' : 'swimmer-coral-swimsuit',
      suit,
      [0, 0, -0.23],
      [0.18, 0.105, 0.17],
    );
    part(person, 'swimmer-neck', skin, [0, 0.025, 0.37], [0.07, 0.07, 0.1]);
    part(person, 'swimmer-head', skin, [0, 0.095, 0.51], [0.135, 0.14, 0.15]);
    part(person, 'swimmer-cap', suit, [0, 0.155, 0.48], [0.14, 0.1, 0.14]);
    part(person, 'swimmer-nose', skin, [0, 0.065, 0.659], [0.025, 0.03, 0.035]);
    for (const side of [-1, 1]) {
      part(person, 'swimmer-ear', skin, [side * 0.131, 0.085, 0.51], [0.024, 0.043, 0.026]);
      part(
        person,
        'swimmer-suit-piping',
        white,
        [side * 0.13, 0.084, index === 0 ? -0.23 : 0.05],
        [0.012, 0.016, index === 0 ? 0.105 : 0.23],
      );
    }
    part(person, 'swimmer-goggle-strap', dark, [0, 0.1, 0.53], [0.141, 0.024, 0.125]);
    for (const side of [-1, 1])
      part(person, 'swimmer-goggle', lens, [side * 0.062, 0.1, 0.645], [0.047, 0.032, 0.02]);
    const arms: THREE.Group[] = [];
    const legs: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.name = 'swimmer-arm';
      arm.position.set(side * 0.19, 0.015, 0.22);
      person.add(arm);
      part(
        arm,
        'swimmer-upper-arm',
        skin,
        [side * 0.09, 0, 0.12],
        [0.055, 0.055, 0.17],
      ).rotation.y = side * 0.55;
      part(arm, 'swimmer-forearm', skin, [side * 0.15, 0, 0.35], [0.046, 0.045, 0.14]);
      part(arm, 'swimmer-elbow', skin, [side * 0.15, 0, 0.235], [0.052, 0.05, 0.055]);
      part(arm, 'swimmer-hand', skin, [side * 0.15, 0, 0.49], [0.05, 0.028, 0.075]);
      arms.push(arm);
      const leg = new THREE.Group();
      leg.name = 'swimmer-leg';
      leg.position.set(side * 0.095, 0, -0.32);
      person.add(leg);
      part(leg, 'swimmer-thigh', skin, [0, 0, -0.13], [0.075, 0.067, 0.19]);
      part(leg, 'swimmer-calf', skin, [0, 0, -0.39], [0.05, 0.046, 0.14]);
      part(leg, 'swimmer-knee', skin, [0, 0, -0.285], [0.055, 0.05, 0.065]);
      part(leg, 'swimmer-foot', skin, [0, 0, -0.55], [0.05, 0.03, 0.09]);
      legs.push(leg);
    }
    const wake = new THREE.Mesh(
      new THREE.TorusGeometry(0.37, 0.009, 4, 28, Math.PI * 1.5),
      wakeMaterial.clone(),
    );
    wake.name = 'swimmer-surface-wake';
    wake.rotation.x = -Math.PI / 2;
    wake.scale.set(1, 1.6, 1);
    wake.renderOrder = 6;
    group.add(wake);
    return { person, arms, legs, wake, index };
  });
  function animate(time: number) {
    for (const { person, arms, legs, wake, index } of people) {
      const phase = time * 0.24 + index * Math.PI;
      const stroke = time * 2.6 + index * 1.7;
      person.position.set(
        (index === 0 ? -0.95 : 0.95) + Math.cos(phase) * 0.12,
        0.2 + Math.sin(stroke) * 0.008,
        Math.sin(phase) * 1.2,
      );
      person.rotation.y = Math.atan2(-0.12 * Math.sin(phase), 1.2 * Math.cos(phase));
      wake.position.set(person.position.x, 0.15, person.position.z);
      wake.rotation.z = -person.rotation.y;
      wake.material.opacity = 0.2 + (Math.sin(stroke) + 1) * 0.1;
      arms.forEach((arm, i) => {
        arm.rotation.y = (i === 0 ? -1 : 1) * (0.25 + (Math.sin(stroke) + 1) * 0.65);
      });
      legs.forEach((leg, i) => {
        leg.rotation.y = (i === 0 ? -1 : 1) * (0.06 + (Math.sin(stroke - 0.7) + 1) * 0.12);
        leg.rotation.x = Math.sin(stroke + i * Math.PI) * 0.035;
      });
    }
  }
  animate(0);
  return { group, animate };
}
