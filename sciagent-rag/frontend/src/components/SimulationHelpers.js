import * as THREE from 'three';

/**
 * Create an arrow vector visualisation and add it to the scene.
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3|{x:number,y:number,z:number}} origin
 * @param {THREE.Vector3|{x:number,y:number,z:number}} direction - will be normalised internally
 * @param {number} length
 * @param {number} [color=0xff0000]
 * @returns {THREE.ArrowHelper} arrow — also has a dispose() method
 */
export function createVector(scene, origin, direction, length, color = 0xff0000) {
  const dir = new THREE.Vector3(direction.x, direction.y, direction.z);
  if (dir.lengthSq() > 0) dir.normalize();

  const orig = new THREE.Vector3(origin.x, origin.y, origin.z);
  const headLength = length * 0.2;
  const headWidth = length * 0.1;

  const arrow = new THREE.ArrowHelper(dir, orig, length, color, headLength, headWidth);
  arrow.userData.isHelper = true;
  scene.add(arrow);

  arrow.dispose = () => {
    scene.remove(arrow);
    if (arrow.line) {
      arrow.line.geometry?.dispose();
      arrow.line.material?.dispose();
    }
    if (arrow.cone) {
      arrow.cone.geometry?.dispose();
      arrow.cone.material?.dispose();
    }
  };

  return arrow;
}

/**
 * @param {THREE.ArrowHelper} arrow
 * @param {{x,y,z}} origin
 * @param {{x,y,z}} direction - zero vector hides the arrow
 * @param {number} length
 */
export function updateVector(arrow, origin, direction, length) {
  const dir = new THREE.Vector3(direction.x, direction.y, direction.z);

  if (dir.lengthSq() === 0) {
    arrow.visible = false;
    return;
  }

  arrow.visible = true;
  dir.normalize();
  arrow.position.set(origin.x, origin.y, origin.z);
  arrow.setDirection(dir);
  arrow.setLength(length, length * 0.2, length * 0.1);
}

/**
 * Create a trail (polyline) that grows as points are added.
 * Uses a ring-buffer approach for efficiency.
 *
 * @param {THREE.Scene} scene
 * @param {number} [color=0x0088ff]
 * @param {number} [maxPoints=200]
 * @returns {{ line: THREE.Line, addPoint(v:THREE.Vector3|{x,y,z}): void, clear(): void, dispose(): void }}
 */
export function createTrail(scene, color = 0x0088ff, maxPoints = 200) {
  const positions = new Float32Array(maxPoints * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geometry, material);
  line.userData.isHelper = true;
  line.frustumCulled = false;
  scene.add(line);

  let head = 0;
  let count = 0;

  function addPoint(vec) {
    const x = vec.x ?? 0;
    const y = vec.y ?? 0;
    const z = vec.z ?? 0;

    if (count < maxPoints) {
      const idx = count * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      count++;
      head = count % maxPoints;
    } else {
      const idx = head * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      head = (head + 1) % maxPoints;

      const tmp = new Float32Array(maxPoints * 3);
      const tailBytes = (maxPoints - head) * 3;
      tmp.set(positions.subarray(head * 3, head * 3 + tailBytes), 0);
      tmp.set(positions.subarray(0, head * 3), tailBytes);
      positions.set(tmp);
      head = 0;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.setDrawRange(0, count);
  }

  function clear() {
    positions.fill(0);
    count = 0;
    head = 0;
    geometry.attributes.position.needsUpdate = true;
    geometry.setDrawRange(0, 0);
  }

  function dispose() {
    scene.remove(line);
    geometry.dispose();
    material.dispose();
  }

  return { line, addPoint, clear, dispose };
}

/**
 * Create a text label Sprite using a Canvas texture.
 *
 * @param {THREE.Scene} scene
 * @param {string} text
 * @param {THREE.Vector3|{x,y,z}} position
 * @param {number} [fontSize=14]
 * @param {string} [color='#333333']
 * @returns {THREE.Sprite} sprite — also has dispose() and updateText(newText) methods
 */
export function createLabel(scene, text, position, fontSize = 14, color = '#333333') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const canvasWidth = 256;
  const canvasHeight = 64;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  function drawText(t) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = `${fontSize * 2}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, canvasWidth / 2, canvasHeight / 2);
  }

  drawText(text);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.position.set(position.x, position.y, position.z ?? 0);
  sprite.scale.set(3, 1, 1);
  sprite.userData.isHelper = true;
  sprite.userData._canvas = canvas;
  sprite.userData._texture = texture;
  sprite.userData._drawText = drawText;
  scene.add(sprite);

  sprite.updateText = (newText) => {
    drawText(newText);
    texture.needsUpdate = true;
  };

  sprite.dispose = () => {
    scene.remove(sprite);
    texture.dispose();
    spriteMaterial.dispose();
  };

  return sprite;
}

/** @param {THREE.Sprite} sprite  @param {string} [text]  @param {{x,y,z}} [position] */
export function updateLabel(sprite, text, position) {
  if (text != null && sprite.updateText) {
    sprite.updateText(text);
  }
  if (position) {
    sprite.position.set(position.x, position.y, position.z ?? 0);
  }
}

/**
 * Create a dashed auxiliary line between two points.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3|{x,y,z}} from
 * @param {THREE.Vector3|{x,y,z}} to
 * @param {number} [color=0x999999]
 * @returns {THREE.Line} line — also has a dispose() method
 */
export function createDashedLine(scene, from, to, color = 0x999999) {
  const points = [
    new THREE.Vector3(from.x, from.y, from.z ?? 0),
    new THREE.Vector3(to.x, to.y, to.z ?? 0),
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.5,
    gapSize: 0.3,
  });

  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  line.userData.isHelper = true;
  scene.add(line);

  line.dispose = () => {
    scene.remove(line);
    geometry.dispose();
    material.dispose();
  };

  return line;
}

/** @param {THREE.Line} line  @param {{x,y,z}} from  @param {{x,y,z}} to */
export function updateDashedLine(line, from, to) {
  const posAttr = line.geometry.attributes.position;
  posAttr.setXYZ(0, from.x, from.y, from.z ?? 0);
  posAttr.setXYZ(1, to.x, to.y, to.z ?? 0);
  posAttr.needsUpdate = true;
  line.computeLineDistances();
}

/**
 * Create an HTML overlay HUD for real-time data display.
 *
 * @param {HTMLElement} container - the simulation canvas container element
 * @returns {{ element: HTMLDivElement, update(data: Record<string,number>): void, dispose(): void }}
 */
export function createHUD(container) {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: '#ffffff',
    padding: '10px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '13px',
    pointerEvents: 'none',
    zIndex: '10',
    lineHeight: '1.6',
    whiteSpace: 'pre',
  });

  const containerPos = window.getComputedStyle(container).position;
  if (containerPos === 'static') {
    container.style.position = 'relative';
  }

  container.appendChild(el);

  function update(data) {
    const lines = Object.entries(data).map(([key, val]) => {
      const formatted = typeof val === 'number' ? val.toFixed(2) : String(val);
      return `${key} = ${formatted}`;
    });
    el.innerHTML = lines.join('<br>');
  }

  function dispose() {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  return { element: el, update, dispose };
}
