import * as THREE from 'three';
import type { StudioMaterialSet } from './materials';

export type SpatialSceneId =
  | 'silicon-core'
  | 'memory-helix'
  | 'network-constellation'
  | 'curriculum-orrery';

export interface SpatialSceneMetadata {
  id: SpatialSceneId;
  title: string;
  subtitle: string;
  partCount: number;
}

export const SPATIAL_SCENES: SpatialSceneMetadata[] = [
  {
    id: 'silicon-core',
    title: 'Microarchitecture Die',
    subtitle: '8-part CPU substrate, copper heatpipes, sapphire lens & 64-pin BGA array',
    partCount: 8,
  },
  {
    id: 'memory-helix',
    title: 'Memory Bus Lattice',
    subtitle: '7-part lathe pedestal, dual-helix address bus & 32 instanced cache banks',
    partCount: 7,
  },
  {
    id: 'network-constellation',
    title: 'Packet Mesh Relay',
    subtitle: '9-part gimbal core, 6 edge routers & live spline-routed optical packets',
    partCount: 9,
  },
  {
    id: 'curriculum-orrery',
    title: '16-Stage Mastery Orrery',
    subtitle: 'Orbital stage rings reflecting your completed CS Odyssey curriculum topics',
    partCount: 6,
  },
];

export interface BuiltSpatialModel {
  root: THREE.Group;
  interactables: THREE.Object3D[];
  animatedParts: {
    rotateSlow: THREE.Object3D[];
    rotateReverse: THREE.Object3D[];
    packetStream?: {
      mesh: THREE.InstancedMesh;
      curves: THREE.CatmullRomCurve3[];
    };
  };
  disposeGeometries: () => void;
}

const _dummy = new THREE.Object3D();
const _pt = new THREE.Vector3();
const _tint = new THREE.Color();

function createBeveledRoundedPlateGeo(
  width: number,
  depth: number,
  thickness: number,
  cornerRadius: number
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const r = Math.min(cornerRadius, hw * 0.4, hd * 0.4);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  if (geo.boundingBox) {
    geo.translate(0, -geo.boundingBox.min.y, 0);
  }
  geo.computeVertexNormals();
  geo.computeTangents();
  return geo;
}

function createPrecisionGearGeo(
  innerR: number,
  outerR: number,
  teeth: number,
  depth: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.25;
    const a2 = a0 + step * 0.5;
    const a3 = a0 + step * 0.75;
    const r0 = innerR + 0.18;
    if (i === 0) shape.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
    else shape.lineTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    shape.lineTo(Math.cos(a3) * r0, Math.sin(a3) * r0);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  geo.computeTangents();
  return geo;
}

function tagPart(
  obj: THREE.Object3D,
  partId: string,
  partLabel: string,
  partDetail: string,
  explodeOffset: [number, number, number],
  interactables: THREE.Object3D[]
) {
  obj.userData.partId = partId;
  obj.userData.partLabel = partLabel;
  obj.userData.partDetail = partDetail;
  obj.userData.basePosition = obj.position.clone();
  obj.userData.explodeOffset = new THREE.Vector3(...explodeOffset);
  obj.traverse((child) => {
    child.layers.enable(1);
    child.userData.partId = partId;
    child.userData.partLabel = partLabel;
    child.userData.partDetail = partDetail;
  });
  interactables.push(obj);
}

function addGroundedStudioPlinth(
  root: THREE.Group,
  mats: StudioMaterialSet,
  geos: THREE.BufferGeometry[],
  isSoftwareGl: boolean
) {
  // Radial contact shadow sits at y = 0.005 (offset >= 0.02 below plinth top)
  const shadowGeo = new THREE.PlaneGeometry(7.2, 7.2);
  shadowGeo.rotateX(-Math.PI / 2);
  geos.push(shadowGeo);
  const shadowPlane = new THREE.Mesh(shadowGeo, mats.contactShadow);
  shadowPlane.position.y = 0.005;
  shadowPlane.renderOrder = 0;
  root.add(shadowPlane);

  // Turned studio plinth with bottom flush at y = 0.02
  const plinthPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(2.65, 0),
    new THREE.Vector2(2.6, 0.1),
    new THREE.Vector2(2.42, 0.16),
    new THREE.Vector2(0, 0.16),
  ];
  const plinthGeo = new THREE.LatheGeometry(plinthPoints, 64);
  plinthGeo.computeVertexNormals();
  plinthGeo.computeTangents();
  geos.push(plinthGeo);

  const plinth = new THREE.Mesh(plinthGeo, mats.plinthSlate);
  plinth.position.y = 0.02;
  plinth.receiveShadow = !isSoftwareGl;
  plinth.castShadow = !isSoftwareGl;
  root.add(plinth);

  // Subtle wave telemetry bezel ring around plinth
  const haloGeo = new THREE.TorusGeometry(2.58, 0.026, 16, 96);
  haloGeo.rotateX(Math.PI / 2);
  geos.push(haloGeo);
  const halo = new THREE.Mesh(haloGeo, mats.waveHaloMaterial);
  halo.position.y = 0.18;
  root.add(halo);
}

export function buildSpatialModel(
  sceneId: SpatialSceneId,
  mats: StudioMaterialSet,
  isSoftwareGl: boolean,
  stageProgressRatio = 0.25,
  completedStageFlags?: boolean[]
): BuiltSpatialModel {
  const root = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const rotateSlow: THREE.Object3D[] = [];
  const rotateReverse: THREE.Object3D[] = [];
  let packetStream: BuiltSpatialModel['animatedParts']['packetStream'];

  addGroundedStudioPlinth(root, mats, geos, isSoftwareGl);

  const subject = new THREE.Group();
  subject.position.y = 0.21;
  root.add(subject);

  if (sceneId === 'silicon-core') {
    // 1. Gold BGA Contact Pin Grid (64 instanced pins)
    const pinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12);
    geos.push(pinGeo);
    const bgaPins = new THREE.InstancedMesh(pinGeo, mats.accentAlloy, 64);
    bgaPins.castShadow = !isSoftwareGl;
    let idx = 0;
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        _dummy.position.set((x - 3.5) * 0.34, 0.06, (z - 3.5) * 0.34);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        bgaPins.setMatrixAt(idx++, _dummy.matrix);
      }
    }
    bgaPins.instanceMatrix.needsUpdate = true;
    bgaPins.computeBoundingSphere();
    tagPart(
      bgaPins,
      'bga-pins',
      '64-Pin BGA Interconnect Array',
      'High-density instanced gold solder-ball array routing power and memory channels.',
      [0, -0.35, 0],
      interactables
    );
    subject.add(bgaPins);

    // 2. Multi-Layer Ceramic PCB Substrate
    const pcbGeo = createBeveledRoundedPlateGeo(3.2, 3.2, 0.18, 0.22);
    geos.push(pcbGeo);
    const pcb = new THREE.Mesh(pcbGeo, mats.matteCeramic);
    pcb.position.y = 0.14;
    pcb.castShadow = !isSoftwareGl;
    pcb.receiveShadow = !isSoftwareGl;
    tagPart(
      pcb,
      'pcb-substrate',
      'Multilayer Organic Substrate',
      '12-layer differential trace substrate isolating core power rails from high-frequency I/O.',
      [0, 0.05, 0],
      interactables
    );
    subject.add(pcb);

    // 3. Machined Retention Bracket Frame
    const frameGeo = createPrecisionGearGeo(1.18, 1.46, 24, 0.12);
    geos.push(frameGeo);
    const bracket = new THREE.Mesh(frameGeo, mats.secondaryMetal);
    bracket.position.y = 0.38;
    bracket.castShadow = !isSoftwareGl;
    tagPart(
      bracket,
      'retention-ring',
      'Anodized Socket Retention Frame',
      'Precision-machined clamping collar applying uniform pressure across the IHS flange.',
      [0, 0.55, 0],
      interactables
    );
    subject.add(bracket);
    rotateSlow.push(bracket);

    // 4. Silicon Microprocessor Die with Procedural Trace CanvasTexture
    const dieGeo = createBeveledRoundedPlateGeo(1.68, 1.68, 0.14, 0.08);
    geos.push(dieGeo);
    const die = new THREE.Mesh(dieGeo, mats.siliconDie);
    die.position.y = 0.36;
    die.castShadow = !isSoftwareGl;
    tagPart(
      die,
      'silicon-die',
      'Monolithic Compute Silicon Die',
      'Quad-ALU execution quadrants bridged by an optical coherent ring interconnect.',
      [0, 0.95, 0],
      interactables
    );
    subject.add(die);

    // 5. Brushed Integrated Heat Spreader (IHS) Crown
    const ihsGeo = createBeveledRoundedPlateGeo(2.15, 2.15, 0.12, 0.28);
    geos.push(ihsGeo);
    const ihs = new THREE.Mesh(ihsGeo, mats.primaryMetal);
    ihs.position.y = 0.62;
    ihs.castShadow = !isSoftwareGl;
    tagPart(
      ihs,
      'ihs-spreader',
      'Anisotropic Heatspreader Plate',
      'Brushed nickel-plated IHS distributing thermal flux across four sintered heatpipes.',
      [0, 1.55, 0],
      interactables
    );
    subject.add(ihs);

    // 6. Four Curved Heatpipes (TubeGeometry)
    const pipesGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dx * 0.6, 0.72, dz * 0.6),
        new THREE.Vector3(dx * 1.15, 0.96, dz * 1.15),
        new THREE.Vector3(dx * 1.48, 0.58, dz * 1.48),
      ]);
      const pipeGeo = new THREE.TubeGeometry(curve, 24, 0.065, 12, false);
      geos.push(pipeGeo);
      const pipe = new THREE.Mesh(pipeGeo, mats.accentAlloy);
      pipe.castShadow = !isSoftwareGl;
      pipesGroup.add(pipe);
    }
    tagPart(
      pipesGroup,
      'heatpipes',
      'Sintered Vapor-Chamber Heatpipes',
      'Four radial copper vapor conduits channeling peak thermal load outward.',
      [0, 1.85, 0],
      interactables
    );
    subject.add(pipesGroup);

    // 7. Optical Sapphire Cache Prism Dome
    const prismGeo = new THREE.OctahedronGeometry(0.62, 1);
    geos.push(prismGeo);
    const prism = new THREE.Mesh(prismGeo, mats.opticalGlass);
    prism.position.y = 1.24;
    prism.renderOrder = 3;
    tagPart(
      prism,
      'optical-cache',
      'Sapphire Coherent L3 Lens',
      'High-IOR transmissive crystal resonator refracting the studio optical field.',
      [0, 2.45, 0],
      interactables
    );
    subject.add(prism);
    rotateReverse.push(prism);

    // 8. Inner Illuminated Clock Core
    const coreGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 24);
    geos.push(coreGeo);
    const core = new THREE.Mesh(coreGeo, mats.emissiveTrace);
    core.position.y = 1.24;
    tagPart(
      core,
      'clock-core',
      '5.2 GHz Phase-Locked Oscillator',
      'Precision clock generator driving synchronous pipeline stages.',
      [0, 2.15, 0],
      interactables
    );
    subject.add(core);
  } else if (sceneId === 'memory-helix') {
    // 1. Lathe-Turned Titanium Socket Base
    const basePts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1.55, 0),
      new THREE.Vector2(1.42, 0.22),
      new THREE.Vector2(0.85, 0.34),
      new THREE.Vector2(0, 0.34),
    ];
    const baseGeo = new THREE.LatheGeometry(basePts, 48);
    baseGeo.computeVertexNormals();
    baseGeo.computeTangents();
    geos.push(baseGeo);
    const baseMesh = new THREE.Mesh(baseGeo, mats.secondaryMetal);
    baseMesh.castShadow = !isSoftwareGl;
    baseMesh.receiveShadow = !isSoftwareGl;
    tagPart(
      baseMesh,
      'mm-base',
      'MMU Page-Directory Base',
      'Lathe-turned titanium socket anchoring virtual-to-physical frame translation.',
      [0, -0.2, 0],
      interactables
    );
    subject.add(baseMesh);

    // 2. Dual Helical Address & Data Bus Tubes
    for (let strand = 0; strand < 2; strand++) {
      const pts: THREE.Vector3[] = [];
      const phase = strand * Math.PI;
      for (let i = 0; i <= 48; i++) {
        const t = i / 48;
        const a = t * Math.PI * 4 + phase;
        const r = 0.72 + Math.sin(t * Math.PI) * 0.22;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.4 + t * 1.95, Math.sin(a) * r));
      }
      const helixCurve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(helixCurve, 72, 0.052, 12, false);
      geos.push(tubeGeo);
      const helixMesh = new THREE.Mesh(tubeGeo, strand === 0 ? mats.primaryMetal : mats.accentAlloy);
      helixMesh.castShadow = !isSoftwareGl;
      tagPart(
        helixMesh,
        `bus-strand-${strand}`,
        strand === 0 ? '64-Bit Address Rail' : 'ECC Data Channel',
        'Helical differential bus maintaining matched propagation delay across memory banks.',
        [strand === 0 ? -0.65 : 0.65, 0.9, 0],
        interactables
      );
      subject.add(helixMesh);
      rotateSlow.push(helixMesh);
    }

    // 3. 32 Instanced Cache Line Wafers with per-instance scale & tint variation
    const waferGeo = new THREE.BoxGeometry(0.42, 0.06, 0.24);
    geos.push(waferGeo);
    const wafers = new THREE.InstancedMesh(waferGeo, mats.primaryMetal, 32);
    wafers.castShadow = !isSoftwareGl;
    for (let i = 0; i < 32; i++) {
      const t = i / 31;
      const a = t * Math.PI * 4;
      const scaleMod = 0.88 + (i % 5) * 0.05;
      _dummy.position.set(Math.cos(a) * 0.36, 0.48 + t * 1.82, Math.sin(a) * 0.36);
      _dummy.rotation.set(0, -a, 0);
      _dummy.scale.set(scaleMod, 1, scaleMod);
      _dummy.updateMatrix();
      wafers.setMatrixAt(i, _dummy.matrix);
      _tint.setHSL(0.55 + (i % 6) * 0.02, 0.28, 0.72 - (i % 4) * 0.06);
      wafers.setColorAt(i, _tint);
    }
    wafers.instanceMatrix.needsUpdate = true;
    if (wafers.instanceColor) wafers.instanceColor.needsUpdate = true;
    wafers.computeBoundingSphere();
    tagPart(
      wafers,
      'cache-wafers',
      '32×64B Cache-Line Stack',
      'Instanced SRAM cache-line frames indexed along the virtual address helix.',
      [0, 1.35, 0],
      interactables
    );
    subject.add(wafers);

    // 4. Precision Pointer Index Gear
    const gearGeo = createPrecisionGearGeo(0.92, 1.22, 18, 0.1);
    geos.push(gearGeo);
    const gear = new THREE.Mesh(gearGeo, mats.accentAlloy);
    gear.position.y = 1.25;
    tagPart(
      gear,
      'tlb-gear',
      'TLB Associative Index Ring',
      'Rotary associative lookup ring accelerating page-table hits in single cycles.',
      [0, 1.55, 0],
      interactables
    );
    subject.add(gear);
    rotateReverse.push(gear);

    // 5. Optical Pointer Crystal Crown
    const capGeo = new THREE.ConeGeometry(0.44, 0.72, 6);
    geos.push(capGeo);
    const cap = new THREE.Mesh(capGeo, mats.opticalGlass);
    cap.position.y = 2.65;
    cap.renderOrder = 3;
    tagPart(
      cap,
      'stack-pointer',
      'Stack & Heap Pointer Prism',
      'Refractive capstone marking the active stack top inside the virtual address space.',
      [0, 2.35, 0],
      interactables
    );
    subject.add(cap);
    rotateSlow.push(cap);

    // 6. Emissive Spine Core
    const spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 16);
    geos.push(spineGeo);
    const spine = new THREE.Mesh(spineGeo, mats.emissiveTrace);
    spine.position.y = 1.38;
    tagPart(
      spine,
      'memory-spine',
      'Coherent Memory Spine',
      'Central bus spine synchronizing L1/L2/L3 cache invalidations.',
      [0, 1.15, 0],
      interactables
    );
    subject.add(spine);
  } else if (sceneId === 'network-constellation') {
    // 1. Machined Router Chassis
    const chassisGeo = createBeveledRoundedPlateGeo(2.5, 2.5, 0.16, 0.45);
    geos.push(chassisGeo);
    const chassis = new THREE.Mesh(chassisGeo, mats.matteCeramic);
    chassis.position.y = 0.05;
    chassis.castShadow = !isSoftwareGl;
    tagPart(
      chassis,
      'router-chassis',
      'Layer-3 Spine Chassis',
      'Optical backplane switching packets across autonomous routing domains.',
      [0, -0.2, 0],
      interactables
    );
    subject.add(chassis);

    // 2. Equatorial & Polar Gimbal Rings
    const ringGeoA = new THREE.TorusGeometry(1.15, 0.045, 16, 72);
    const ringGeoB = new THREE.TorusGeometry(0.88, 0.038, 16, 64);
    geos.push(ringGeoA, ringGeoB);

    const eqRing = new THREE.Mesh(ringGeoA, mats.primaryMetal);
    eqRing.position.y = 1.35;
    eqRing.rotation.x = Math.PI * 0.38;
    tagPart(
      eqRing,
      'eq-gimbal',
      'BGP Autonomous Ring',
      'Primary routing gimbal stabilizing inter-domain BGP path selection.',
      [0, 1.45, 0],
      interactables
    );
    subject.add(eqRing);
    rotateSlow.push(eqRing);

    const polRing = new THREE.Mesh(ringGeoB, mats.accentAlloy);
    polRing.position.y = 1.35;
    polRing.rotation.z = Math.PI * 0.35;
    tagPart(
      polRing,
      'pol-gimbal',
      'TLS 1.3 Session Gimbal',
      'Cryptographic handshake ring validating AEAD key-exchange state.',
      [0, 1.75, 0],
      interactables
    );
    subject.add(polRing);
    rotateReverse.push(polRing);

    // 3. 6 Perimeter Edge Nodes + Curved Fiber Curves
    const nodeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.24, 8);
    geos.push(nodeGeo);
    const curves: THREE.CatmullRomCurve3[] = [];
    const centerAnchor = new THREE.Vector3(0, 1.35, 0);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const nx = Math.cos(a) * 1.72;
      const nz = Math.sin(a) * 1.72;
      const ny = 0.42 + (i % 2) * 0.28;

      const nodeMesh = new THREE.Mesh(nodeGeo, i % 2 === 0 ? mats.primaryMetal : mats.secondaryMetal);
      nodeMesh.position.set(nx, ny, nz);
      nodeMesh.castShadow = !isSoftwareGl;
      tagPart(
        nodeMesh,
        `edge-node-${i}`,
        `Edge Relay Node 0${i + 1}`,
        'Regional PoP node terminating TLS streams and forwarding TCP segments.',
        [Math.cos(a) * 0.65, 0.35, Math.sin(a) * 0.65],
        interactables
      );
      subject.add(nodeMesh);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(nx, ny + 0.12, nz),
        new THREE.Vector3(nx * 0.55, 1.85, nz * 0.55),
        centerAnchor.clone(),
      ]);
      curves.push(curve);
      const fiberGeo = new THREE.TubeGeometry(curve, 24, 0.022, 8, false);
      geos.push(fiberGeo);
      const fiber = new THREE.Mesh(fiberGeo, mats.secondaryMetal);
      subject.add(fiber);
    }

    // 4. Instanced Traveling Optical Packets (24 spheres moved cleanly in loop)
    const pktGeo = new THREE.SphereGeometry(0.055, 12, 12);
    geos.push(pktGeo);
    const pktMesh = new THREE.InstancedMesh(pktGeo, mats.emissiveTrace, 24);
    pktMesh.frustumCulled = false;
    pktMesh.computeBoundingSphere();
    subject.add(pktMesh);
    packetStream = { mesh: pktMesh, curves };

    // 5. Central Optical Sapphire Consensus Core
    const orbGeo = new THREE.IcosahedronGeometry(0.46, 2);
    geos.push(orbGeo);
    const coreLens = new THREE.Mesh(orbGeo, mats.opticalGlass);
    coreLens.position.copy(centerAnchor);
    coreLens.renderOrder = 3;
    tagPart(
      coreLens,
      'consensus-core',
      'Optical Consensus Relay',
      'Refractive sapphire core coordinating state across distributed replicas.',
      [0, 2.25, 0],
      interactables
    );
    subject.add(coreLens);
    rotateSlow.push(coreLens);
  } else {
    // 'curriculum-orrery' — dynamically mirrors user's 16-Stage CS Mastery!
    const basePlate = createPrecisionGearGeo(0.85, 1.85, 32, 0.12);
    geos.push(basePlate);
    const dial = new THREE.Mesh(basePlate, mats.secondaryMetal);
    dial.position.y = 0.06;
    dial.castShadow = !isSoftwareGl;
    tagPart(
      dial,
      'orrery-dial',
      'Curriculum Telemetry Astrolabe',
      '32-tooth anodized index ring synchronizing 16 CS Odyssey A–Z mastery tracks.',
      [0, -0.25, 0],
      interactables
    );
    subject.add(dial);
    rotateSlow.push(dial);

    // Three Concentric Orbital Tracks
    const radii = [0.95, 1.48, 2.02];
    radii.forEach((r, idx) => {
      const trackGeo = new THREE.TorusGeometry(r, 0.02, 12, 84);
      trackGeo.rotateX(Math.PI / 2);
      geos.push(trackGeo);
      const track = new THREE.Mesh(trackGeo, idx === 1 ? mats.accentAlloy : mats.primaryMetal);
      track.position.y = 0.65 + idx * 0.24;
      tagPart(
        track,
        `orbit-track-${idx}`,
        ['Foundations Orbit', 'Infrastructure Orbit', 'Systems & Capstone Orbit'][idx],
        'Concentric mastery tier housing grouped CS stages.',
        [0, 0.55 + idx * 0.45, 0],
        interactables
      );
      subject.add(track);
    });

    // 16 Stage Satellites colored dynamically by real completion flags
    const satGeo = new THREE.OctahedronGeometry(0.14, 1);
    geos.push(satGeo);
    const satInst = new THREE.InstancedMesh(satGeo, mats.primaryMetal, 16);
    satInst.castShadow = !isSoftwareGl;
    for (let s = 0; s < 16; s++) {
      const orbitIdx = s < 5 ? 0 : s < 11 ? 1 : 2;
      const r = radii[orbitIdx];
      const y = 0.65 + orbitIdx * 0.24;
      const angle = (s / 16) * Math.PI * 2;
      _dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const isDone = completedStageFlags?.[s] ?? false;
      const sc = isDone ? 1.22 : 0.92;
      _dummy.scale.set(sc, sc, sc);
      _dummy.rotation.set(0.3, angle, 0);
      _dummy.updateMatrix();
      satInst.setMatrixAt(s, _dummy.matrix);
      _tint.setHex(isDone ? 0x34d399 : s / 16 <= stageProgressRatio ? 0x38bdf8 : 0x64748b);
      satInst.setColorAt(s, _tint);
    }
    satInst.instanceMatrix.needsUpdate = true;
    if (satInst.instanceColor) satInst.instanceColor.needsUpdate = true;
    satInst.computeBoundingSphere();
    tagPart(
      satInst,
      'stage-satellites',
      '16-Stage Mastery Satellites',
      'Each crystal octahedron represents Stage 00–15; emerald indicates 100% stage mastery.',
      [0, 1.4, 0],
      interactables
    );
    subject.add(satInst);
    rotateSlow.push(satInst);

    // Central Knowledge Crystal
    const crownHeight = 1.25 + stageProgressRatio * 0.28;
    const crownGeo = new THREE.IcosahedronGeometry(0.48, 0);
    geos.push(crownGeo);
    const crown = new THREE.Mesh(crownGeo, mats.opticalGlass);
    crown.position.y = crownHeight;
    crown.renderOrder = 3;
    tagPart(
      crown,
      'mastery-prism',
      'Core Synthesis Prism',
      'Optical sapphire prism indexing overall CS Odyssey mastery progress.',
      [0, 2.2, 0],
      interactables
    );
    subject.add(crown);
    rotateReverse.push(crown);

    const innerCoreGeo = new THREE.SphereGeometry(0.2, 20, 20);
    geos.push(innerCoreGeo);
    const innerCore = new THREE.Mesh(innerCoreGeo, mats.emissiveTrace);
    innerCore.position.y = crownHeight;
    subject.add(innerCore);
  }

  return {
    root,
    interactables,
    animatedParts: {
      rotateSlow,
      rotateReverse,
      packetStream,
    },
    disposeGeometries: () => {
      geos.forEach((g) => g.dispose());
    },
  };
}

export function updatePacketStreamInstances(
  stream: NonNullable<BuiltSpatialModel['animatedParts']['packetStream']>,
  elapsed: number
) {
  const { mesh, curves } = stream;
  if (!curves.length) return;
  for (let i = 0; i < mesh.count; i++) {
    const curve = curves[i % curves.length];
    const t = ((elapsed * 0.38 + i * 0.21) % 1 + 1) % 1;
    curve.getPointAt(t, _pt);
    _dummy.position.copy(_pt);
    const s = 0.75 + Math.sin(t * Math.PI) * 0.55;
    _dummy.scale.set(s, s, s);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    mesh.setMatrixAt(i, _dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
