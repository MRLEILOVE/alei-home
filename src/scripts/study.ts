import '../scripts/atmosphere';
import { STUDY_CAT_HOME } from './study-cat-home';

const panel = document.querySelector<HTMLDialogElement>('#room-content')!;
const scroller = document.querySelector<HTMLElement>('.room-panel-body')!;
const stage = document.querySelector<HTMLElement>('#room-stage')!;
const status = document.querySelector<HTMLElement>('#room-status')!;
const knownIds = new Set([
  'main',
  'writing',
  'projects',
  'music',
  'games',
  'books',
  'friends',
  'guestbook',
  'signature',
  'footprints',
]);
let lastTrigger: HTMLElement | null = null;
// 共用原站内容，保持播放器和留言组件挂载，关闭面板不会销毁它们。
function openContent(id: string, trigger?: HTMLElement) {
  if (!knownIds.has(id)) return;
  if (!panel.open) {
    lastTrigger = trigger ?? (document.activeElement as HTMLElement);
    panel.showModal();
  }
  const target =
    id === 'signature'
      ? panel.querySelector<HTMLElement>('.signature')
      : panel.querySelector<HTMLElement>(`#${id}`);
  document.querySelector('#room-panel-title')!.textContent =
    target?.querySelector('h2, h1')?.textContent?.trim().replace(/\s+/g, ' ') || '书房里的日常';
  requestAnimationFrame(() => {
    if (target)
      scroller.scrollTop +=
        target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 24;
  });
}
function navigate(id: string, trigger?: HTMLElement) {
  if (!knownIds.has(id)) return;
  if (location.hash !== `#${id}`) {
    if (panel.open) history.replaceState(history.state, '', `#${id}`);
    else history.pushState({ roomPanel: true }, '', `#${id}`);
  }
  openContent(id, trigger);
}
function closeContent() {
  if (history.state?.roomPanel) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    panel.close();
  }
}
document.addEventListener('click', (event) => {
  const item = (event.target as Element).closest<HTMLElement>('[data-room-open]');
  if (item) {
    event.preventDefault();
    navigate(item.dataset.roomOpen!, item);
    return;
  }
  const anchor = (event.target as Element).closest<HTMLAnchorElement>(
    '#room-content a[href^="#"], .skip-link',
  );
  if (anchor && knownIds.has(anchor.hash.slice(1))) {
    event.preventDefault();
    navigate(anchor.hash.slice(1), anchor);
  }
});
document.querySelector('#room-close')!.addEventListener('click', closeContent);
panel.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeContent();
});
panel.addEventListener('close', () => lastTrigger?.focus());
function syncHash() {
  const id = location.hash.slice(1);
  if (knownIds.has(id)) openContent(id);
  else if (panel.open) panel.close();
}
window.addEventListener('popstate', syncHash);
window.addEventListener('hashchange', syncHash);
syncHash();
const audioToggle = document.querySelector<HTMLButtonElement>('#room-audio')!;
audioToggle.addEventListener('click', () => {
  document.querySelector<HTMLElement>('#audio-player .aplayer-button')?.click();
});
document.addEventListener('alei:audio', ((event: CustomEvent<{ playing: boolean }>) => {
  audioToggle.hidden = false;
  audioToggle.textContent = event.detail.playing ? 'Ⅱ 暂停音乐' : '▷ 继续播放';
}) as EventListener);
document.addEventListener('alei:mascot-navigate', ((
  event: CustomEvent<{ id: string; trigger: HTMLElement }>,
) => {
  navigate(event.detail.id, event.detail.trigger);
}) as EventListener);

async function buildRoom() {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { createStudyHome } = await import('./study-home');
  const { createStudyDailyLife } = await import('./study-daily-life');
  const { createStudyCharacter } = await import('./study-character');
  const { createStudyCompanions } = await import('./study-companions');
  const { createStudyCat } = await import('./study-cat');
  const { createStudyCatBed } = await import('./study-cat-bed');
  const mount = document.querySelector<HTMLElement>('#room-canvas')!;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = Math.PI / 5;
  controls.maxPolarAngle = Math.PI / 2.6;
  controls.minAzimuthAngle = -0.15;
  controls.maxAzimuthAngle = Math.PI / 2.2;
  controls.minDistance = 14;
  controls.maxDistance = 48;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ambient = new THREE.HemisphereLight(0xfff6e6, 0x8d7660, 1.9);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffedca, 3.1);
  sun.position.set(-5, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(
    mount.clientWidth < 650 ? 1024 : 2048,
    mount.clientWidth < 650 ? 1024 : 2048,
  );
  sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 11,
    bottom: -11,
    near: 0.5,
    far: 45,
  });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  fill.position.set(-4, 5, 1);
  scene.add(fill);
  // 在本地绘制轻量材质，木纹、布纹和墙纸随三维物件变化。
  const ownedTextures: InstanceType<typeof THREE.Texture>[] = [];
  function texture(draw: (ctx: CanvasRenderingContext2D) => void, size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);
    const value = new THREE.CanvasTexture(canvas);
    value.colorSpace = THREE.SRGBColorSpace;
    value.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    ownedTextures.push(value);
    return value;
  }
  const grain = texture((ctx) => {
    ctx.fillStyle = '#e6c9a0';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = i % 3 ? '#7d583b18' : '#fff4dc32';
      ctx.lineWidth = i % 4 ? 0.5 : 1.3;
      ctx.beginPath();
      ctx.moveTo(0, i * 2.9);
      ctx.bezierCurveTo(
        80,
        i * 2.9 + Math.sin(i) * 7,
        180,
        i * 2.9 - Math.cos(i) * 5,
        256,
        i * 2.9,
      );
      ctx.stroke();
    }
  });
  const plaster = texture((ctx) => {
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = i % 2 ? '#ad988c09' : '#ffffff50';
      ctx.fillRect((i * 67) % 256, (i * 97 + Math.floor(i / 256) * 13) % 256, 1, 1);
    }
  });
  const objects: InstanceType<typeof THREE.Object3D>[] = [];
  type Hotspot = { button: HTMLButtonElement; point: InstanceType<typeof THREE.Vector3> };
  const hotspots: Hotspot[] = [];
  function destination(
    object: InstanceType<typeof THREE.Object3D>,
    id: string,
    label: string,
    point: InstanceType<typeof THREE.Vector3>,
  ) {
    object.userData.destination = id;
    objects.push(object);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-hotspot';
    button.textContent = label;
    button.dataset.roomOpen = id;
    document.querySelector('#room-hotspots')!.appendChild(button);
    hotspots.push({ button, point });
  }
  const contactTexture = texture((ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    gradient.addColorStop(0, '#ffffffa0');
    gradient.addColorStop(0.55, '#ffffff36');
    gradient.addColorStop(1, '#ffffff00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  });
  function contact(x: number, z: number, w: number, d: number, y = 0.058, opacity = 0.2) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        color: 0x5b4030,
        map: contactTexture,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  const loader = new THREE.TextureLoader();
  function imageTexture(url: string) {
    const value = loader.load(url, () => render());
    value.colorSpace = THREE.SRGBColorSpace;
    ownedTextures.push(value);
    return value;
  }
  const landscape = imageTexture(stage.dataset.landscape!);
  landscape.repeat.set(0.5, 0.5);
  const home = createStudyHome({
    woodTexture: grain,
    plasterTexture: plaster,
    landscape,
    journal: imageTexture(stage.dataset.journal!),
    bookCovers: (JSON.parse(stage.dataset.bookCovers || '[]') as string[]).map(imageTexture),
  });
  scene.add(home.group);
  contact(0, 0.25, 17, 12.5, -0.34, 0.28);
  for (const entry of home.destinations)
    destination(entry.object, entry.id, entry.label, entry.point);
  const spaceLabels = [
    ['卧室', -4.8, 0.9, -2.8],
    ['客厅', -3.0, 0.1, 2.6],
    ['厨房', 4.45, 0.1, 2.9],
    ['卫生间', 5.18, 0.9, -3.35],
  ] as const;
  const spaceMarkers = spaceLabels.map(([label, x, y, z]) => {
    const element = document.createElement('span');
    element.className = 'room-space-label';
    element.textContent = label;
    element.setAttribute('aria-hidden', 'true');
    document.querySelector('#room-hotspots')!.appendChild(element);
    return { element, point: new THREE.Vector3(x, y, z) };
  });
  const dailyLife = createStudyDailyLife(Math.random, () => new Date());
  let lifeState = dailyLife.update(0);
  const mascotRoot = document.querySelector<HTMLElement>('#mascot')!;
  const mascotDialog = document.querySelector<HTMLElement>('#mascot-dialog')!;
  const mascotButton = document.querySelector<HTMLButtonElement>('#mascot-character')!;
  const characterRig = createStudyCharacter();
  const companions = createStudyCompanions();
  let lastSocial = 'wandering';
  const character = characterRig.group;
  character.position.set(lifeState.person.x, 0.05 + lifeState.person.elevation, lifeState.person.z);
  character.rotation.y = lifeState.person.yaw;
  // 人物使用跟随脚下的柔和投影，家具阴影可以继续缓存。
  character.traverse((item) => {
    if (item instanceof THREE.Mesh) item.castShadow = false;
  });
  scene.add(character);
  character.userData.destination = 'mascot';
  objects.push(character);
  const characterShadow = contact(lifeState.person.x, lifeState.person.z, 0.8, 0.65, 0.071, 0.3);
  const catBed = createStudyCatBed();
  catBed.position.set(STUDY_CAT_HOME.position.x, 0.05, STUDY_CAT_HOME.position.z);
  scene.add(catBed);
  catBed.userData.destination = 'cat';
  objects.push(catBed);
  contact(STUDY_CAT_HOME.position.x, STUDY_CAT_HOME.position.z, 1.25, 1.05, 0.061, 0.2);
  const catRig = createStudyCat();
  const cat = catRig.group;
  cat.position.set(companions.catPosition.x, 0.05, companions.catPosition.z);
  cat.traverse((item) => {
    if (item instanceof THREE.Mesh) item.castShadow = false;
  });
  scene.add(cat);
  cat.userData.destination = 'cat';
  objects.push(cat);
  const catShadow = contact(
    companions.catPosition.x,
    companions.catPosition.z,
    0.75,
    0.48,
    0.071,
    0.25,
  );
  let manipulating = false;
  let hoveringCharacter = false;
  let pressedCharacter = false;
  let lastMascotState = '';
  let lifePaused = false;
  let showContentLabels = true;
  let following = false;
  let frameDrivingCamera = false;
  const pauseButton = document.querySelector<HTMLButtonElement>('#life-pause')!;
  const labelsButton = document.querySelector<HTMLButtonElement>('#room-labels')!;
  const followButton = document.querySelector<HTMLButtonElement>('#room-follow')!;
  function setFollowing(value: boolean) {
    following = value;
    followButton.textContent = following ? '停止跟随' : '跟随小阿雷';
    followButton.setAttribute('aria-pressed', String(following));
    document.querySelector<HTMLElement>('.study-app')!.dataset.following = String(following);
  }
  followButton.addEventListener('click', () => {
    setFollowing(!following);
    if (following && reduced.matches) {
      const target =
        character.getObjectByName('alei-head')?.getWorldPosition(new THREE.Vector3()) ??
        character.position.clone();
      target.y -= 0.25;
      controls.target.copy(target);
      camera.position.copy(target).add(new THREE.Vector3(7.5, 8, 9.5));
      controls.update();
      render();
    }
  });
  const clock = document.querySelector<HTMLTimeElement>('#life-clock')!;
  const activityText = document.querySelector<HTMLElement>('#life-activity')!;
  const dayText = document.querySelector<HTMLElement>('#life-day')!;
  const lightText = document.querySelector<HTMLElement>('#life-light')!;
  const dayProgress = document.querySelector<HTMLElement>('#life-progress')!;
  function updateLifeDisplay() {
    const now = new Date();
    const minute = now.getHours() * 60 + now.getMinutes();
    const text = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    if (clock.textContent !== text) clock.textContent = text;
    clock.dateTime = text;
    const label = talking()
      ? '停下来，和你聊聊。'
      : lastSocial === 'rubbing'
        ? '低下头，摸摸狸花猫。'
        : lifeState.label;
    if (activityText.textContent !== label) activityText.textContent = label;
    dayText.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
    lightText.textContent = lifeState.daylight > 0.45 ? '☀' : '☾';
    dayProgress.style.width = `${(minute / 1440) * 100}%`;
    stage.dataset.lifeActivity = lifeState.activity;
    stage.dataset.lifePhase = lifeState.phase;
    stage.dataset.lifeMinute = (minute + now.getSeconds() / 60).toFixed(2);
    stage.dataset.lifeDay = String(lifeState.day);
    stage.dataset.lifePaused = String(lifePaused);
    stage.dataset.lifeSpeed = '1';
  }
  pauseButton.addEventListener('click', () => {
    lifePaused = !lifePaused;
    pauseButton.textContent = lifePaused ? '继续活动' : '暂停活动';
    pauseButton.setAttribute('aria-pressed', String(lifePaused));
    updateLifeDisplay();
  });
  // 时钟不依赖渲染帧率，聊天、阅读、暂停活动或减少动态效果时仍与现实一致。
  const wallClockTimer = window.setInterval(updateLifeDisplay, 1000);
  function updateLabelControl() {
    labelsButton.textContent = showContentLabels ? '隐藏内容入口' : '显示内容入口';
    labelsButton.setAttribute('aria-pressed', String(showContentLabels));
  }
  labelsButton.addEventListener('click', () => {
    showContentLabels = !showContentLabels;
    updateLabelControl();
    render();
  });
  updateLabelControl();
  function talking() {
    return !mascotDialog.hidden;
  }
  function updateCharacterVisibility() {
    character.visible = !mascotRoot.hidden;
    characterShadow.visible = character.visible;
    if (mascotRoot.dataset.state === 'hello' && lastMascotState !== 'hello' && !reduced.matches)
      characterRig.wave();
    lastMascotState = mascotRoot.dataset.state || '';
    updateAnimation();
  }

  // 窗内的小粒子跟随季节和原站动效偏好，阅读时停止渲染。
  const weatherPositions = new Float32Array(24 * 3);
  for (let i = 0; i < 24; i++) {
    weatherPositions[i * 3] = -6.15 + ((i * 0.618) % 1) * 3.9;
    weatherPositions[i * 3 + 1] = 1.15 + ((i * 0.381) % 1) * 1.4;
    weatherPositions[i * 3 + 2] = -4.6;
  }
  const weatherGeometry = new THREE.BufferGeometry();
  weatherGeometry.setAttribute('position', new THREE.BufferAttribute(weatherPositions, 3));
  const weatherMaterial = new THREE.PointsMaterial({
    color: 0xfff4d5,
    size: 0.045,
    transparent: true,
    opacity: 0.8,
  });
  const weather = new THREE.Points(weatherGeometry, weatherMaterial);
  scene.add(weather);
  let playing = false;
  let frame = 0;
  let previous = 0;
  let disposed = false;
  function positionLabels() {
    const width = mount.clientWidth,
      height = mount.clientHeight;
    const actorHead = character.getObjectByName('alei-head');
    const headWorld = actorHead
      ? actorHead.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.4, 0))
      : character.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const headPoint = headWorld.clone().project(camera);
    const feetPoint = character.position.clone().project(camera);
    const headX = (headPoint.x * 0.5 + 0.5) * width;
    const headY = (-headPoint.y * 0.5 + 0.5) * height;
    const feetY = (-feetPoint.y * 0.5 + 0.5) * height;
    const bodyHalfWidth = Math.abs(feetY - headY) * 0.28 + 5;
    const catPoint = new THREE.Vector3(
      cat.position.x,
      cat.position.y + 0.3,
      cat.position.z,
    ).project(camera);
    const catX = (catPoint.x * 0.5 + 0.5) * width;
    const catY = (-catPoint.y * 0.5 + 0.5) * height;
    const catPadding = Math.abs(feetY - headY) * 0.2 + 5;
    for (const { button, point } of hotspots) {
      const projected = point.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.hidden =
        !showContentLabels ||
        projected.z > 1 ||
        x < 15 ||
        x > width - 15 ||
        y < 15 ||
        y > height - 15;
      // 让路过的人物保持可见、可点击；所有内容仍可由底部目录访问。
      const overlapsCharacter =
        character.visible &&
        Math.abs(x - headX) < button.offsetWidth / 2 + bodyHalfWidth &&
        y + button.offsetHeight / 2 > headY - 4 &&
        y - button.offsetHeight / 2 < feetY + 3;
      const overlapsCat =
        Math.abs(x - catX) < button.offsetWidth / 2 + catPadding &&
        Math.abs(y - catY) < button.offsetHeight / 2 + catPadding;
      button.style.visibility =
        (overlapsCharacter || overlapsCat) && document.activeElement !== button ? 'hidden' : '';
    }
    for (const { element, point } of spaceMarkers) {
      const projected = point.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      // 遮挡时保留标签尺寸，避免 hidden 使宽度归零后逐帧交替显隐。
      element.style.visibility =
        projected.z > 1 ||
        (character.visible &&
          Math.abs(x - headX) < element.offsetWidth / 2 + bodyHalfWidth &&
          y > Math.min(headY, feetY) - 7 &&
          y < Math.max(headY, feetY) + 7) ||
        (Math.abs(x - catX) < catPadding + 15 && Math.abs(y - catY) < catPadding + 7)
          ? 'hidden'
          : '';
    }
    const anchor = headWorld
      .clone()
      .add(new THREE.Vector3(0.16, 0.08, 0))
      .project(camera);
    const x = (anchor.x * 0.5 + 0.5) * width;
    const y = (-anchor.y * 0.5 + 0.5) * height;
    mascotRoot.style.left = `${x - 18}px`;
    mascotRoot.style.top = `${y - 34}px`;
    const bubbleWidth = Math.min(275, innerWidth - 32);
    const centerX = mount.getBoundingClientRect().left + x;
    mascotRoot.style.setProperty(
      '--mascot-bubble-shift',
      `${Math.max(16 + bubbleWidth / 2 - centerX, Math.min(0, innerWidth - 16 - bubbleWidth / 2 - centerX))}px`,
    );
  }
  function render() {
    if (disposed || document.hidden) return;
    renderer.render(scene, camera);
    positionLabels();
  }
  function animate(time: number) {
    frame = 0;
    if (
      disposed ||
      document.hidden ||
      panel.open ||
      reduced.matches ||
      (!playing && !weather.visible && !character.visible && !cat.visible)
    ) {
      previous = 0;
      return;
    }
    if (previous && time - previous < 1000 / 30) {
      frame = requestAnimationFrame(animate);
      return;
    }
    const delta = Math.min((time - (previous || time)) / 1000, 0.1);
    const chatting = talking();
    const simulationDelta = lifePaused || manipulating ? 0 : delta;
    lifeState = dailyLife.update(simulationDelta, {
      paused:
        chatting ||
        hoveringCharacter ||
        pressedCharacter ||
        !character.visible ||
        lastSocial !== 'wandering',
      canMove: (from, to) => {
        const other = companions.catPosition;
        const dx = to.x - from.x,
          dz = to.z - from.z;
        const lengthSquared = dx * dx + dz * dz;
        const t = lengthSquared
          ? Math.max(
              0,
              Math.min(1, ((other.x - from.x) * dx + (other.z - from.z) * dz) / lengthSquared),
            )
          : 0;
        const startGap = Math.hypot(from.x - other.x, from.z - other.z);
        const closestGap = Math.hypot(from.x + dx * t - other.x, from.z + dz * t - other.z);
        return startGap < 0.47
          ? closestGap >= startGap - 1e-8 && Math.hypot(to.x - other.x, to.z - other.z) > startGap
          : closestGap >= 0.47;
      },
    });
    const availableForCat = lifeState.atRest && lifeState.poseActivity === 'idle';
    const companionState = companions.update(simulationDelta, {
      paused: lifePaused || manipulating,
      characterPaused: chatting || hoveringCharacter || pressedCharacter,
      allowSocial: availableForCat,
      characterVisible: character.visible,
      personPose: lifeState.person,
      personWaiting: lifeState.waiting,
    });
    lastSocial = companionState.social;
    characterRig.setPetting(companionState.petting && !chatting);
    const keepSeatedOrSleeping = ['sleep', 'eat', 'toilet'].includes(lifeState.poseActivity);
    const poseActivity = chatting && !keepSeatedOrSleeping ? 'idle' : lifeState.poseActivity;
    characterRig.setActivity(poseActivity, poseActivity === 'sleep' ? 1 : lifeState.progress);
    if (character.visible) {
      const pose = lifeState.person;
      character.position.set(pose.x, 0.05 + pose.elevation, pose.z);
      characterRig.faceTo(
        chatting && poseActivity !== 'sleep'
          ? Math.atan2(camera.position.x - pose.x, camera.position.z - pose.z)
          : companionState.social !== 'wandering'
            ? Math.atan2(companionState.cat.x - pose.x, companionState.cat.z - pose.z)
            : pose.yaw,
        simulationDelta,
      );
      characterRig.animate(simulationDelta, pose.moving, playing);
      characterShadow.position.set(pose.x, 0.071, pose.z);
      characterShadow.visible = pose.elevation < 0.3;
      mascotRoot.dataset.roomMotion = chatting
        ? 'talking'
        : companionState.petting
          ? 'petting'
          : pose.moving
            ? 'walking'
            : poseActivity;
      mascotRoot.dataset.roomX = pose.x.toFixed(3);
      mascotRoot.dataset.roomZ = pose.z.toFixed(3);
      mascotRoot.dataset.roomElevation = pose.elevation.toFixed(3);
    }
    const catPose = companionState.cat;
    cat.position.set(catPose.x, 0.05 + STUDY_CAT_HOME.surfaceHeight * catPose.bedBlend, catPose.z);
    catRig.faceTo(catPose.yaw, simulationDelta);
    catRig.animate(simulationDelta, catPose.moving, catPose.mode);
    catShadow.position.set(
      catPose.x,
      0.071 + (STUDY_CAT_HOME.surfaceHeight - 0.02) * catPose.bedBlend,
      catPose.z,
    );
    stage.dataset.catMotion = catPose.moving ? 'walking' : catPose.mode;
    stage.dataset.catX = catPose.x.toFixed(3);
    stage.dataset.catZ = catPose.z.toFixed(3);
    stage.dataset.companionState = companionState.social;
    stage.dataset.catEncounters = String(companionState.encounters);
    stage.dataset.catRoutine = companionState.catRoutine;
    stage.dataset.catBedBlend = catPose.bedBlend.toFixed(3);
    home.animate(simulationDelta, poseActivity, lifeState.progress, lifeState.daylight);
    ambient.intensity = 0.75 + lifeState.daylight * 1.15;
    sun.intensity = 0.48 + lifeState.daylight * 2.5;
    fill.intensity = 0.35 + lifeState.daylight * 0.65;
    updateLifeDisplay();
    if (following && character.visible && !manipulating) {
      const target =
        character.getObjectByName('alei-head')?.getWorldPosition(new THREE.Vector3()) ??
        character.position.clone();
      target.y -= 0.25;
      const blend = 1 - Math.exp(-delta * 4);
      controls.target.lerp(target, blend);
      camera.position.lerp(target.clone().add(new THREE.Vector3(7.5, 8, 9.5)), blend);
      frameDrivingCamera = true;
      controls.update();
      frameDrivingCamera = false;
    }
    const record = home.group.getObjectByName('home-record');
    if (playing && record) record.rotation.y -= delta * 1.4;
    if (weather.visible) {
      for (let i = 0; i < 24; i++) {
        weatherPositions[i * 3 + 1] -= delta * 0.16;
        if (weatherPositions[i * 3 + 1] < 1.15) weatherPositions[i * 3 + 1] = 2.55;
      }
      weatherGeometry.attributes.position.needsUpdate = true;
    }
    previous = time;
    render();
    frame = requestAnimationFrame(animate);
  }
  function updateAnimation() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (reduced.matches) {
      characterRig.setPetting(false);
      characterRig.animate(0, false, playing);
      catRig.animate(0, false, 'idle');
      if (talking())
        characterRig.faceTo(
          Math.atan2(
            camera.position.x - character.position.x,
            camera.position.z - character.position.z,
          ),
          1,
        );
      mascotRoot.dataset.roomMotion = talking() ? 'talking' : 'resting';
    }
    render();
    if (
      (playing || weather.visible || character.visible || cat.visible) &&
      !document.hidden &&
      !panel.open &&
      !reduced.matches
    )
      frame = requestAnimationFrame(animate);
  }
  function seasonChanged() {
    const season = document.documentElement.dataset.season || 'autumn';
    const config: Record<string, [number, number, number, number]> = {
      spring: [0, 0.5, 0xd8ddc4, 0xffefd7],
      summer: [0.5, 0.5, 0xcddbd0, 0xf5ffe4],
      autumn: [0, 0, 0xd7d3bc, 0xffedca],
      winter: [0.5, 0, 0xd4dce0, 0xe9f2ff],
    };
    const [x, y, wallColor, lightColor] = config[season] || config.autumn;
    landscape.offset.set(x, y);
    home.group.traverse((item) => {
      if (item instanceof THREE.Mesh && item.userData.seasonWall) {
        const material = item.material as InstanceType<typeof THREE.MeshStandardMaterial>;
        material.color.setHex(wallColor);
      }
    });
    sun.color.setHex(lightColor);
    weather.visible = document.documentElement.dataset.weather === 'on' && !reduced.matches;
    weatherMaterial.color.setHex(
      season === 'winter'
        ? 0xffffff
        : season === 'spring'
          ? 0xfad1d8
          : season === 'summer'
            ? 0xdce8b9
            : 0xe1ad59,
    );
    updateAnimation();
  }
  const observer = new MutationObserver(seasonChanged);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-season', 'data-weather'],
  });
  const panelObserver = new MutationObserver(updateAnimation);
  panelObserver.observe(panel, { attributes: true, attributeFilter: ['open'] });
  const mascotObserver = new MutationObserver(updateCharacterVisibility);
  mascotObserver.observe(mascotRoot, {
    attributes: true,
    subtree: true,
    attributeFilter: ['hidden', 'data-state', 'aria-expanded'],
  });
  mascotRoot.addEventListener('focusin', updateAnimation);
  mascotRoot.addEventListener('focusout', updateAnimation);
  function reset() {
    setFollowing(false);
    camera.position.set(14, 12, 16).multiplyScalar(mount.clientWidth < 650 ? 1.35 : 1);
    controls.target.set(0, 0.8, 0);
    controls.update();
    render();
  }
  function resize() {
    const width = mount.clientWidth,
      height = mount.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    reset();
  }
  const resizer = new ResizeObserver(resize);
  resizer.observe(mount);
  controls.addEventListener('change', () => {
    if (!frameDrivingCamera) render();
  });
  controls.addEventListener('start', () => {
    setFollowing(false);
    manipulating = true;
  });
  controls.addEventListener('end', () => {
    manipulating = false;
  });
  document.querySelector('#room-reset')!.addEventListener('click', reset);
  document.addEventListener('alei:audio', ((event: CustomEvent<{ playing: boolean }>) => {
    playing = event.detail.playing;
    updateAnimation();
  }) as EventListener);
  document.addEventListener('visibilitychange', updateAnimation);
  reduced.addEventListener('change', updateAnimation);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = { x: 0, y: 0 };
  function hit(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    let object: InstanceType<typeof THREE.Object3D> | undefined = raycaster.intersectObjects(
      objects.filter((object) => object.visible),
      true,
    )[0]?.object;
    while (object && !object.userData.destination) object = object.parent ?? undefined;
    return object?.userData.destination as string | undefined;
  }
  renderer.domElement.addEventListener('pointerdown', (event) => {
    down = { x: event.clientX, y: event.clientY };
    pressedCharacter = hit(event) === 'mascot';
    if (pressedCharacter) event.stopPropagation();
  });
  renderer.domElement.addEventListener('pointermove', (event) => {
    const id = hit(event);
    hoveringCharacter = id === 'mascot';
    renderer.domElement.style.cursor = id && id !== 'cat' ? 'pointer' : 'grab';
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    hoveringCharacter = false;
  });
  renderer.domElement.addEventListener('pointercancel', () => {
    pressedCharacter = false;
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    pressedCharacter = false;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
    const id = hit(event);
    if (id === 'mascot') {
      mascotButton.click();
      mascotButton.focus({ preventScroll: true });
    } else if (id && id !== 'cat') navigate(id);
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    status.textContent = '3D 画面暂时不可用，仍可通过下方目录阅读全部内容。';
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    renderer.shadowMap.needsUpdate = true;
    render();
    status.textContent = '拖动看看四周 · 点击物件，打开一段日常';
  });
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    disposed = true;
    window.clearInterval(wallClockTimer);
    cancelAnimationFrame(frame);
    observer.disconnect();
    panelObserver.disconnect();
    mascotObserver.disconnect();
    resizer.disconnect();
    controls.dispose();
    scene.traverse((item) => {
      if (item instanceof THREE.Mesh || item instanceof THREE.Line) {
        item.geometry.dispose();
        const materials = Array.isArray(item.material) ? item.material : [item.material];
        materials.forEach((material) => material.dispose());
      }
    });
    ownedTextures.forEach((value) => value.dispose());
    weatherGeometry.dispose();
    weatherMaterial.dispose();
    renderer.dispose();
  });
  // 家具与光源位置固定，缓存阴影，避免窗外粒子每帧重画阴影贴图。
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  character.visible = !mascotRoot.hidden;
  characterShadow.visible = character.visible;
  home.animate(0, lifeState.poseActivity, lifeState.progress, lifeState.daylight);
  updateLifeDisplay();
  resize();
  seasonChanged();
  status.textContent = '拖动看看四周 · 点击物件，打开一段日常';
}
buildRoom().catch((error) => {
  console.error('3D 书房初始化失败', error);
  status.textContent = '当前设备未能加载 3D；下方目录仍可打开全部内容，也可以返回原网站。';
});
