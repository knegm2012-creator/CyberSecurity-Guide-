import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function createStudioRenderer(
  container: HTMLElement,
  isSoftwareGl: boolean
): THREE.WebGLRenderer {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  return renderer;
}

export interface StudioLightingRig {
  keyLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  rimLight: THREE.DirectionalLight;
  softboxKey: THREE.RectAreaLight | null;
  softboxFill: THREE.RectAreaLight | null;
  envTexture: THREE.Texture;
}

export function setupStudioEnvironmentAndLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): StudioLightingRig {
  // Obsidian studio backdrop with matching atmospheric horizon fog
  const bgColor = new THREE.Color('#03050b');
  scene.background = bgColor;
  scene.fog = new THREE.FogExp2(0x03050b, 0.036);

  // Mandatory procedural RoomEnvironment via PMREMGenerator on every device
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envTarget.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Balanced 3-point rig: warm Key + cool Hemisphere fill + Indigo/Sky Rim
  const keyLight = new THREE.DirectionalLight(0xfff1de, 2.35);
  keyLight.position.set(5.5, 8.2, 6.0);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 26;
    const d = 6.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 3;
  }
  scene.add(keyLight);

  const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0b1020, 0.72);
  hemiLight.position.set(0, 12, 0);
  scene.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(0x6366f1, 1.55);
  rimLight.position.set(-6.0, 4.5, -5.5);
  scene.add(rimLight);

  let softboxKey: THREE.RectAreaLight | null = null;
  let softboxFill: THREE.RectAreaLight | null = null;

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    softboxKey = new THREE.RectAreaLight(0xe0f2fe, 3.2, 5.5, 2.4);
    softboxKey.position.set(4.5, 4.8, 3.2);
    softboxKey.lookAt(0, 0.8, 0);
    scene.add(softboxKey);

    softboxFill = new THREE.RectAreaLight(0x818cf8, 2.0, 4.5, 2.0);
    softboxFill.position.set(-4.8, 3.0, -2.5);
    softboxFill.lookAt(0, 0.8, 0);
    scene.add(softboxFill);
  }

  return {
    keyLight,
    hemiLight,
    rimLight,
    softboxKey,
    softboxFill,
    envTexture: envTarget.texture,
  };
}

export function scheduleSoftwareFrameAfterDraw(
  renderer: THREE.WebGLRenderer,
  registerTimer: (id: number) => void,
  callback: () => void
): void {
  const gl = renderer.getContext() as WebGL2RenderingContext | null;
  if (!gl || typeof gl.fenceSync !== 'function') {
    const id = window.setTimeout(callback, 80);
    registerTimer(id);
    return;
  }

  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
    if (status === gl.UNSIGNALED) {
      const id = window.setTimeout(poll, 5);
      registerTimer(id);
    } else {
      if (sync) gl.deleteSync(sync);
      const id = window.setTimeout(callback, 80);
      registerTimer(id);
    }
  };
  const id = window.setTimeout(poll, 5);
  registerTimer(id);
}
