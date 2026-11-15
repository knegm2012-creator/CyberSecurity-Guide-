import * as THREE from 'three';

export type MaterialFinishPreset = 'titanium' | 'gold' | 'sapphire' | 'obsidian';

export interface StudioMaterialSet {
  primaryMetal: THREE.MeshPhysicalMaterial;
  secondaryMetal: THREE.MeshPhysicalMaterial;
  accentAlloy: THREE.MeshPhysicalMaterial;
  matteCeramic: THREE.MeshStandardMaterial;
  opticalGlass: THREE.MeshPhysicalMaterial;
  siliconDie: THREE.MeshPhysicalMaterial;
  emissiveTrace: THREE.MeshStandardMaterial;
  plinthSlate: THREE.MeshStandardMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  waveHaloMaterial: THREE.MeshPhysicalMaterial;
  waveUniforms: { uTime: { value: number } };
  textures: THREE.Texture[];
  dispose: () => void;
}

const FINISH_CONFIGS: Record<
  MaterialFinishPreset,
  {
    primary: number;
    secondary: number;
    accent: number;
    glassTint: number;
    trace: number;
  }
> = {
  titanium: {
    primary: 0xcbd5e1,
    secondary: 0x334155,
    accent: 0x38bdf8,
    glassTint: 0xbae6fd,
    trace: 0x38bdf8,
  },
  gold: {
    primary: 0xf59e0b,
    secondary: 0x1e293b,
    accent: 0xfde68a,
    glassTint: 0xe0f2fe,
    trace: 0xfbbf24,
  },
  sapphire: {
    primary: 0x64748b,
    secondary: 0x0f172a,
    accent: 0x818cf8,
    glassTint: 0x93c5fd,
    trace: 0x60a5fa,
  },
  obsidian: {
    primary: 0x475569,
    secondary: 0x090d16,
    accent: 0x34d399,
    glassTint: 0xa7f3d0,
    trace: 0x10b981,
  },
};

function createBrushedMetalRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y++) {
    const shade = 72 + Math.floor(Math.sin(y * 0.45) * 18 + ((y * 37) % 24));
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 256, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createSiliconWaferAlbedoTexture(
  maxAnisotropy: number,
  accentHex: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const accentColor = `#${accentHex.toString(16).padStart(6, '0')}`;

  ctx.fillStyle = '#070c17';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle bus matrix lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 32; i < 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 16);
    ctx.lineTo(i, 496);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(16, i);
    ctx.lineTo(496, i);
    ctx.stroke();
  }

  // Quad ALU quadrants
  const quadBoxes = [
    [56, 56, 172, 172],
    [284, 56, 172, 172],
    [56, 284, 172, 172],
    [284, 284, 172, 172],
  ];
  for (const [x, y, w, h] of quadBoxes) {
    ctx.fillStyle = '#0d172a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
    for (let ry = y + 18; ry < y + h - 18; ry += 22) {
      ctx.fillRect(x + 16, ry, w - 32, 8);
    }
  }

  // Central ring bus
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(216, 216, 80, 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createContactShadowMap(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createStudioMaterialSet(
  preset: MaterialFinishPreset,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): StudioMaterialSet {
  const cfg = FINISH_CONFIGS[preset];
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const brushedRoughness = createBrushedMetalRoughnessTexture(maxAniso);
  const siliconMap = createSiliconWaferAlbedoTexture(maxAniso, cfg.trace);
  const shadowTex = createContactShadowMap(maxAniso);

  const primaryMetal = new THREE.MeshPhysicalMaterial({
    color: cfg.primary,
    metalness: 0.94,
    roughness: 0.18,
    roughnessMap: brushedRoughness,
    anisotropy: 0.85,
    anisotropyRotation: 0.25,
    clearcoat: 0.35,
    clearcoatRoughness: 0.14,
  });

  // Adjacent dark alloy contrasts roughness by >= 0.27
  const secondaryMetal = new THREE.MeshPhysicalMaterial({
    color: cfg.secondary,
    metalness: 0.78,
    roughness: 0.46,
    clearcoat: 0.1,
  });

  const accentAlloy = new THREE.MeshPhysicalMaterial({
    color: cfg.accent,
    metalness: 0.92,
    roughness: 0.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
  });

  const matteCeramic = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.08,
    roughness: 0.82,
  });

  const opticalGlass = new THREE.MeshPhysicalMaterial({
    color: cfg.glassTint,
    metalness: 0,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.36 : 1,
    ior: 1.72,
    thickness: 1.25,
    attenuationColor: new THREE.Color(cfg.glassTint),
    attenuationDistance: 2.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false,
  });

  const siliconDie = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: siliconMap,
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
  });

  const emissiveTrace = new THREE.MeshStandardMaterial({
    color: cfg.trace,
    emissive: cfg.trace,
    emissiveIntensity: 1.25,
    metalness: 0.25,
    roughness: 0.32,
  });

  const plinthSlate = new THREE.MeshStandardMaterial({
    color: 0x070b14,
    metalness: 0.18,
    roughness: 0.76,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  const contactShadow = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const waveUniforms = { uTime: { value: 0 } };
  const waveHaloMaterial = new THREE.MeshPhysicalMaterial({
    color: cfg.accent,
    metalness: 0.88,
    roughness: 0.22,
    clearcoat: 0.65,
    emissive: cfg.trace,
    emissiveIntensity: 0.28,
  });

  waveHaloMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waveUniforms.uTime;
    shader.vertexShader =
      `uniform float uTime;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float radialAngle = atan(position.z, position.x);
        transformed.y += sin(radialAngle * 6.0 + uTime * 1.4) * 0.035;
        `
      );
  };
  waveHaloMaterial.customProgramCacheKey = () => `cs-odyssey-wave-halo-${preset}`;

  const textures = [brushedRoughness, siliconMap, shadowTex];
  const allMaterials = [
    primaryMetal,
    secondaryMetal,
    accentAlloy,
    matteCeramic,
    opticalGlass,
    siliconDie,
    emissiveTrace,
    plinthSlate,
    contactShadow,
    waveHaloMaterial,
  ];

  return {
    primaryMetal,
    secondaryMetal,
    accentAlloy,
    matteCeramic,
    opticalGlass,
    siliconDie,
    emissiveTrace,
    plinthSlate,
    contactShadow,
    waveHaloMaterial,
    waveUniforms,
    textures,
    dispose: () => {
      allMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
