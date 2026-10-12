import * as THREE from 'three';

/** 开口朝向房间的针织软窝，局部原点为地面，垫面高 0.12。 */
export function createStudyCatBed() {
  const bed = new THREE.Group();
  bed.name = 'study-cat-bed';
  const fabric = (color: number) =>
    new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
  const sage = fabric(0x88947b);
  const seam = fabric(0xabb29a);
  const linen = fabric(0xe6dac5);
  const tuft = fabric(0xcebea4);
  const underside = fabric(0x717960);

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, name: string) {
    const item = new THREE.Mesh(geometry, material);
    item.name = name;
    item.castShadow = true;
    item.receiveShadow = true;
    bed.add(item);
    return item;
  }

  const base = mesh(new THREE.CylinderGeometry(1, 0.96, 0.055, 64), underside, 'cat-bed-base');
  base.scale.set(0.54, 1, 0.45);
  base.position.y = 0.0275;
  const cushion = mesh(new THREE.SphereGeometry(1, 48, 20), linen, 'cat-bed-linen-cushion');
  cushion.scale.set(0.47, 0.065, 0.385);
  cushion.position.y = 0.055;

  // 椭圆围边的右侧稍低，猫可以顺着入口踏进软垫。
  const vertices: number[] = [];
  const indices: number[] = [];
  const segments = 64;
  const radial = 12;
  function rimPoint(angle: number, around: number) {
    const entrance = Math.pow(Math.max(0, Math.cos(angle)), 10);
    const radius = 0.085;
    return new THREE.Vector3(
      Math.cos(angle) * (0.48 + Math.cos(around) * radius),
      0.145 - entrance * 0.062 + Math.sin(around) * (0.095 - entrance * 0.025),
      Math.sin(angle) * (0.385 + Math.cos(around) * radius),
    );
  }
  for (let segment = 0; segment <= segments; segment++) {
    const angle = (segment / segments) * Math.PI * 2;
    for (let side = 0; side <= radial; side++) {
      const point = rimPoint(angle, (side / radial) * Math.PI * 2);
      vertices.push(...point);
      if (segment < segments && side < radial) {
        const a = segment * (radial + 1) + side;
        const b = a + radial + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const rimGeometry = new THREE.BufferGeometry();
  rimGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  rimGeometry.setIndex(indices);
  rimGeometry.computeVertexNormals();
  mesh(rimGeometry, sage, 'cat-bed-padded-rim');

  for (let stitch = 0; stitch < 36; stitch++) {
    const angle = (stitch / 36) * Math.PI * 2;
    const points = [-0.022, 0, 0.022].map((offset, index) =>
      rimPoint(angle + offset, 0.34 + index * 0.43).add(new THREE.Vector3(0, 0.002, 0)),
    );
    const curve = new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve, 6, 0.0028, 4, false), seam, 'cat-bed-knit-stitch');
  }
  const buttonGeometry = new THREE.SphereGeometry(1, 12, 8);
  for (const x of [-0.19, 0.19]) {
    const button = mesh(buttonGeometry, tuft, 'cat-bed-cushion-tuft');
    button.position.set(x, 0.114, 0.015);
    button.scale.set(0.016, 0.003, 0.016);
  }

  // 缝在前沿的小布标用几何猫爪点缀。
  const tag = new THREE.Group();
  tag.name = 'cat-bed-paw-tag';
  tag.position.set(0.12, 0.104, 0.474);
  bed.add(tag);
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.087, 0.008), linen);
  tag.add(label);
  const pawPad = new THREE.Mesh(buttonGeometry, sage);
  pawPad.scale.set(0.021, 0.018, 0.005);
  pawPad.position.set(0, -0.009, 0.008);
  tag.add(pawPad);
  for (let toe = 0; toe < 3; toe++) {
    const dot = new THREE.Mesh(buttonGeometry, sage);
    dot.scale.set(0.008, 0.01, 0.004);
    dot.position.set((toe - 1) * 0.019, 0.014 + (toe === 1 ? 0.006 : 0), 0.009);
    tag.add(dot);
  }
  return bed;
}
