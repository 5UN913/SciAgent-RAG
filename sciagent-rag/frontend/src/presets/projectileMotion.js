/**
 * Preset: Projectile Motion (平抛运动)
 * h=20m, v0=5m/s, g=10m/s², scale=0.5 (1m = 0.5 units)
 */
const projectileMotionCode = `
// Projectile Motion: h=20m, v0=5m/s, g=10m/s²
const h = 20;        // height in meters
const v0 = 5;        // horizontal velocity m/s
const g = 10;        // gravity m/s²
const scale = 0.5;   // 1 meter = 0.5 scene units
const totalTime = Math.sqrt(2 * h / g); // 2 seconds

let ball, table, trail, vxArrow, vyArrow, hDash, vDash, hud;
let accTime = 0;
const startX = -4;
const startY = h * scale;

function setupScene() {
  // Table
  const tableGeom = new THREE.PlaneGeometry(3, 0.2);
  const tableMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
  table = new THREE.Mesh(tableGeom, tableMat);
  table.position.set(startX - 0.5, startY - 0.1, 0);
  scene.add(table);

  // Ball
  const ballGeom = new THREE.CircleGeometry(0.25, 32);
  const ballMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
  ball = new THREE.Mesh(ballGeom, ballMat);
  ball.position.set(startX, startY, 0);
  scene.add(ball);

  // Helpers
  trail = createTrail(0xff8800, 500);
  vxArrow = createVector({x: startX, y: startY, z: 0}, {x: 1, y: 0, z: 0}, v0 * scale * 0.5, 0x2196F3);
  vyArrow = createVector({x: startX, y: startY, z: 0}, {x: 0, y: -1, z: 0}, 0.1, 0x4CAF50);
  hDash = createDashedLine({x: startX, y: startY, z: 0}, {x: startX, y: 0, z: 0}, 0xaaaaaa);
  vDash = createDashedLine({x: startX, y: 0, z: 0}, {x: startX, y: 0, z: 0}, 0xaaaaaa);
  hud = createHUD();
}

function update(deltaTime) {
  if (accTime >= totalTime) return;
  accTime += deltaTime;
  const t = Math.min(accTime, totalTime);

  const x = startX + v0 * t * scale;
  const y = Math.max(0, startY - 0.5 * g * t * t * scale);
  ball.position.set(x, y, 0);

  trail.addPoint({x, y, z: 0});

  // Velocity vectors
  const vy = g * t;
  updateVector(vxArrow, {x, y, z: 0}, {x: 1, y: 0, z: 0}, v0 * scale * 0.5);
  updateVector(vyArrow, {x, y, z: 0}, {x: 0, y: -1, z: 0}, vy * scale * 0.3);

  // Dashed decomposition lines
  updateDashedLine(hDash, {x, y, z: 0}, {x, y: 0, z: 0});
  updateDashedLine(vDash, {x: startX, y: 0, z: 0}, {x, y: 0, z: 0});

  const hReal = h - 0.5 * g * t * t;
  const xReal = v0 * t;
  hud.update({
    't (s)': t,
    'vx (m/s)': v0,
    'vy (m/s)': vy,
    'x (m)': xReal,
    'h (m)': Math.max(0, hReal),
  });
}

setupScene();
animate(update);
`.trim();

export default projectileMotionCode;
