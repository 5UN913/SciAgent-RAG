/**
 * Preset: Newton's Second Law (牛顿第二定律)
 * F=10N, m=2kg, a=5m/s², scale=0.5 (1m = 0.5 units)
 */
const newtonSecondLawCode = `
// Newton's Second Law: F=10N, m=2kg, a=5m/s²
const F = 10;
const m = 2;
const a = F / m;    // 5 m/s²
const scale = 0.5;  // 1 meter = 0.5 scene units
const totalTime = 4;

let block, forceArrow, velArrow, trail, forceLabel, hud;
let accTime = 0;
const startX = -8;
const groundY = 0.3;

function setupScene() {
  // Block
  const blockGeom = new THREE.PlaneGeometry(0.8, 0.6);
  const blockMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
  block = new THREE.Mesh(blockGeom, blockMat);
  block.position.set(startX, groundY, 0);
  scene.add(block);

  // Ground surface line (thicker, at y=0)
  const surfaceGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-10, 0, 0),
    new THREE.Vector3(15, 0, 0),
  ]);
  const surfaceMat = new THREE.LineBasicMaterial({ color: 0x666666 });
  const surface = new THREE.Line(surfaceGeom, surfaceMat);
  scene.add(surface);

  // Helpers
  forceArrow = createVector({x: startX + 0.5, y: groundY, z: 0}, {x: 1, y: 0, z: 0}, F * 0.15, 0xff0000);
  velArrow = createVector({x: startX, y: groundY + 0.5, z: 0}, {x: 1, y: 0, z: 0}, 0.1, 0x00aa00);
  forceLabel = createLabel('F = 10N', {x: startX + 2, y: groundY + 0.8, z: 0}, 14, '#ff0000');
  trail = createTrail(0x4488ff, 500);
  hud = createHUD();
}

function update(deltaTime) {
  if (accTime >= totalTime) return;
  accTime += deltaTime;
  const t = Math.min(accTime, totalTime);

  const v = a * t;
  const s = 0.5 * a * t * t;
  const x = startX + s * scale;
  block.position.x = x;

  trail.addPoint({x, y: groundY, z: 0});

  // Update force arrow (constant, follows block)
  updateVector(forceArrow, {x: x + 0.5, y: groundY, z: 0}, {x: 1, y: 0, z: 0}, F * 0.15);

  // Update velocity arrow (grows with time)
  const vLen = Math.max(0.1, v * scale * 0.15);
  updateVector(velArrow, {x, y: groundY + 0.5, z: 0}, {x: 1, y: 0, z: 0}, vLen);

  // Update label position
  updateLabel(forceLabel, 'F = 10N', {x: x + 2, y: groundY + 0.8, z: 0});

  hud.update({
    't (s)': t,
    'F (N)': F,
    'a (m/s²)': a,
    'v (m/s)': v,
    's (m)': s,
  });
}

setupScene();
animate(update);
`.trim();

export default newtonSecondLawCode;
