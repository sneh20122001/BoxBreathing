import * as THREE from 'three';
import { BreathingPhase, SessionStatus } from '../types/breathing';
import {
  createRadialShadowTexture,
  createStoneNoiseTexture,
  createRippleTexture,
  createParticleTexture,
} from './proceduralTextures';

export type SanctuaryThemeId = 'lotus' | 'prism' | 'cairn';

export interface SanctuaryModel {
  group: THREE.Group;
  update: (
    time: number,
    phase: BreathingPhase,
    progress: number,
    status: SessionStatus,
    delta: number
  ) => void;
  dispose: () => void;
}

// Module-level pre-allocated scratch objects to avoid GC in animation loop
const _scratchVec3 = new THREE.Vector3();
const _scratchMatrix4 = new THREE.Matrix4();
const _scratchColor = new THREE.Color();

/**
 * Creates the Sacred Lotus Sanctuary model (9 distinct procedural parts).
 * Assembled as a composite THREE.Group with distinct roughness/metalness
 * across adjacent parts, pivoted at bottom-center flush with y=0.
 */
export function createLotusSanctuary(): SanctuaryModel {
  const group = new THREE.Group();
  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  const shadowTex = createRadialShadowTexture(256);
  const stoneTex = createStoneNoiseTexture(256);
  const rippleTex = createRippleTexture(256);
  const particleTex = createParticleTexture(64);
  disposables.push(shadowTex, stoneTex, rippleTex, particleTex);

  // 1. Contact Shadow Plane (grounded at y = 0.001)
  const shadowGeo = new THREE.PlaneGeometry(6.5, 6.5);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  shadowMesh.renderOrder = 0;
  group.add(shadowMesh);
  disposables.push(shadowGeo, shadowMat);

  // 2. Ground Water Ripple Disc
  const rippleGeo = new THREE.RingGeometry(2.2, 5.0, 48);
  const rippleMat = new THREE.MeshBasicMaterial({
    map: rippleTex,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
  rippleMesh.rotation.x = -Math.PI / 2;
  rippleMesh.position.y = 0.004;
  rippleMesh.renderOrder = 1;
  group.add(rippleMesh);
  disposables.push(rippleGeo, rippleMat);

  // 3. Part 1: Stepped Pedestal Base (Dark slate stone, roughness 0.85, metalness 0.08)
  const baseGeo = new THREE.CylinderGeometry(2.1, 2.4, 0.35, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.08,
    bumpMap: stoneTex,
    bumpScale: 0.03,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.35 / 2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);
  disposables.push(baseGeo, baseMat);

  // Stepped upper tier of pedestal
  const tier2Geo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 32);
  const tier2Mat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.75,
    metalness: 0.12,
  });
  const tier2Mesh = new THREE.Mesh(tier2Geo, tier2Mat);
  tier2Mesh.position.y = 0.35 + 0.2 / 2;
  tier2Mesh.castShadow = true;
  tier2Mesh.receiveShadow = true;
  group.add(tier2Mesh);
  disposables.push(tier2Geo, tier2Mat);

  // 4. Part 5: Accent Trim Filigree (Brushed gold toruses, roughness 0.16, metalness 0.94)
  const goldTrimGeo = new THREE.TorusGeometry(1.82, 0.04, 16, 48);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.16,
    metalness: 0.94,
  });
  const goldTrim = new THREE.Mesh(goldTrimGeo, goldMat);
  goldTrim.rotation.x = Math.PI / 2;
  goldTrim.position.y = 0.35;
  group.add(goldTrim);
  disposables.push(goldTrimGeo, goldMat);

  // 5. Part 3: Outer Lotus Petal Ring (8 jade petals, roughness 0.3, metalness 0.15)
  const outerPetalGroup = new THREE.Group();
  outerPetalGroup.position.y = 0.55;
  const petalGeo = new THREE.ConeGeometry(0.38, 1.35, 5);
  petalGeo.scale(1, 1, 0.3); // Flatten to create organic petal silhouette
  const jadeMat = new THREE.MeshStandardMaterial({
    color: 0x0d9488,
    roughness: 0.3,
    metalness: 0.15,
  });
  disposables.push(petalGeo, jadeMat);

  const numOuterPetals = 8;
  const outerPetals: THREE.Mesh[] = [];
  for (let i = 0; i < numOuterPetals; i++) {
    const angle = (i / numOuterPetals) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, jadeMat);
    petal.position.set(Math.cos(angle) * 1.0, 0.45, Math.sin(angle) * 1.0);
    petal.rotation.y = -angle;
    petal.rotation.z = -0.55; // Outward flare
    petal.castShadow = true;
    petal.receiveShadow = true;
    outerPetalGroup.add(petal);
    outerPetals.push(petal);
  }
  group.add(outerPetalGroup);

  // 6. Part 4: Inner Lotus Blooming Petals (8 responsive petals, roughness 0.22, metalness 0.2)
  const innerPetalGroup = new THREE.Group();
  innerPetalGroup.position.y = 0.65;
  const innerPetalGeo = new THREE.ConeGeometry(0.3, 1.1, 5);
  innerPetalGeo.scale(1, 1, 0.25);
  const innerPetalMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    roughness: 0.22,
    metalness: 0.2,
  });
  disposables.push(innerPetalGeo, innerPetalMat);

  const innerPetals: THREE.Mesh[] = [];
  for (let i = 0; i < numOuterPetals; i++) {
    const angle = ((i + 0.5) / numOuterPetals) * Math.PI * 2;
    const petal = new THREE.Mesh(innerPetalGeo, innerPetalMat);
    petal.position.set(Math.cos(angle) * 0.65, 0.45, Math.sin(angle) * 0.65);
    petal.rotation.y = -angle;
    petal.rotation.z = -0.3;
    petal.castShadow = true;
    innerPetalGroup.add(petal);
    innerPetals.push(petal);
  }
  group.add(innerPetalGroup);

  // 7. Part 2: Inner Sacred Crystal Core (Faceted emissive crystal, roughness 0.1, metalness 0.3)
  const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x5eead4,
    emissive: 0x0f766e,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.3,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 1.35;
  coreMesh.castShadow = true;
  group.add(coreMesh);
  disposables.push(coreGeo, coreMat);

  // 8. Part 6: Kinetic Breath Torus Ring (Orbital ring expanding with breath)
  const kineticRingGeo = new THREE.TorusGeometry(1.3, 0.025, 16, 64);
  const kineticRingMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.85,
  });
  const kineticRing = new THREE.Mesh(kineticRingGeo, kineticRingMat);
  kineticRing.position.y = 1.35;
  kineticRing.rotation.x = Math.PI / 2;
  group.add(kineticRing);
  disposables.push(kineticRingGeo, kineticRingMat);

  // 9. Part 9: Floating Zen Aura Motes (InstancedMesh with 32 motes)
  const particleCount = 32;
  const particleGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.75,
  });
  const particleInstances = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
  particleInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const particleOffsets: { radius: number; angle: number; y: number; speed: number }[] = [];
  for (let i = 0; i < particleCount; i++) {
    const radius = 1.0 + Math.random() * 2.2;
    const angle = Math.random() * Math.PI * 2;
    const y = 0.8 + Math.random() * 2.2;
    const speed = 0.3 + Math.random() * 0.7;
    particleOffsets.push({ radius, angle, y, speed });

    _scratchMatrix4.makeTranslation(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
    particleInstances.setMatrixAt(i, _scratchMatrix4);
  }
  particleInstances.instanceMatrix.needsUpdate = true;
  group.add(particleInstances);
  disposables.push(particleGeo, particleMat);

  // Kinetic state smoothing
  let currentBreathScale = 0.85;

  return {
    group,
    update: (time, phase, progress, status, delta) => {
      // 1. Calculate target breath scale based on phase
      let targetBreathScale = 0.82;
      if (status === 'running' || status === 'paused') {
        if (phase === 'inhale') {
          targetBreathScale = 0.75 + 0.38 * progress;
        } else if (phase === 'hold1') {
          targetBreathScale = 1.13 + 0.03 * Math.sin(time * 3);
        } else if (phase === 'exhale') {
          targetBreathScale = 1.13 - 0.38 * progress;
        } else if (phase === 'hold2') {
          targetBreathScale = 0.75 + 0.02 * Math.sin(time * 2);
        }
      } else {
        // Idle gentle meditation breathing rhythm
        targetBreathScale = 0.88 + 0.08 * Math.sin(time * 0.9);
      }

      // Smooth exponential damping
      const lambda = 4.5;
      currentBreathScale += (targetBreathScale - currentBreathScale) * (1 - Math.exp(-lambda * delta));

      // Animate blooming petals: flare outward on expansion
      const petalFlare = (currentBreathScale - 0.75) * 0.7;
      for (let i = 0; i < outerPetals.length; i++) {
        outerPetals[i].rotation.z = -0.45 - petalFlare * 0.4;
      }
      for (let i = 0; i < innerPetals.length; i++) {
        innerPetals[i].rotation.z = -0.22 - petalFlare * 0.65;
        innerPetals[i].position.y = 0.45 + (currentBreathScale - 0.8) * 0.15;
      }

      // Animate sacred crystal core: gentle levitation & spin
      coreMesh.position.y = 1.35 + (currentBreathScale - 0.8) * 0.28;
      coreMesh.rotation.y = time * 0.25;
      coreMesh.rotation.x = Math.sin(time * 0.3) * 0.15;

      // Color/Glow response according to phase
      if (phase === 'inhale') {
        _scratchColor.setHex(0x2dd4bf); // Teal
        coreMat.emissive.lerp(_scratchColor, 0.1);
      } else if (phase === 'hold1') {
        _scratchColor.setHex(0x818cf8); // Indigo
        coreMat.emissive.lerp(_scratchColor, 0.1);
      } else if (phase === 'exhale') {
        _scratchColor.setHex(0xfbbf24); // Amber
        coreMat.emissive.lerp(_scratchColor, 0.1);
      } else {
        _scratchColor.setHex(0x38bdf8); // Sky
        coreMat.emissive.lerp(_scratchColor, 0.1);
      }

      // Kinetic ring expansion & rotation
      kineticRing.scale.setScalar(currentBreathScale * 1.15);
      kineticRing.rotation.z = time * 0.4;
      kineticRing.rotation.y = Math.sin(time * 0.5) * 0.2;
      kineticRing.position.y = 1.35 + (currentBreathScale - 0.8) * 0.15;

      // Ground water ripple expansion
      const rippleScale = 1.0 + (currentBreathScale - 0.75) * 0.45;
      rippleMesh.scale.set(rippleScale, rippleScale, 1);
      rippleMesh.rotation.z = time * 0.05;

      // Animate floating motes
      for (let i = 0; i < particleCount; i++) {
        const p = particleOffsets[i];
        const currentAngle = p.angle + time * 0.1 * p.speed;
        const currentY = ((p.y + time * 0.15 * p.speed) % 3.0) + 0.3;
        const currentRadius = p.radius * currentBreathScale;

        _scratchMatrix4.makeTranslation(
          Math.cos(currentAngle) * currentRadius,
          currentY,
          Math.sin(currentAngle) * currentRadius
        );
        particleInstances.setMatrixAt(i, _scratchMatrix4);
      }
      particleInstances.instanceMatrix.needsUpdate = true;

      // Subtle whole group meditative orientation
      group.rotation.y = time * 0.08;
    },
    dispose: () => {
      disposables.forEach((item) => {
        if ('dispose' in item && typeof item.dispose === 'function') {
          item.dispose();
        }
      });
    },
  };
}

/**
 * Creates the Kinetic Prism Gyroscope Sanctuary model (8 distinct procedural parts).
 * Assembled as a composite THREE.Group with distinct roughness/metalness,
 * pivoted at bottom-center flush with y=0.
 */
export function createPrismSanctuary(): SanctuaryModel {
  const group = new THREE.Group();
  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  const shadowTex = createRadialShadowTexture(256);
  const stoneTex = createStoneNoiseTexture(256);
  disposables.push(shadowTex, stoneTex);

  // 1. Contact Shadow Plane
  const shadowGeo = new THREE.PlaneGeometry(6.0, 6.0);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  group.add(shadowMesh);
  disposables.push(shadowGeo, shadowMat);

  // 2. Part 1: Obsidian Octagonal Plinth Base (roughness 0.25, metalness 0.7)
  const plinthGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.45, 8);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.7,
    bumpMap: stoneTex,
    bumpScale: 0.02,
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = 0.45 / 2;
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  group.add(plinthMesh);
  disposables.push(plinthGeo, plinthMat);

  // Plinth accent gold inlay ring
  const inlayGeo = new THREE.TorusGeometry(1.65, 0.035, 16, 32);
  const inlayMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.95,
  });
  const inlayMesh = new THREE.Mesh(inlayGeo, inlayMat);
  inlayMesh.rotation.x = Math.PI / 2;
  inlayMesh.position.y = 0.45;
  group.add(inlayMesh);
  disposables.push(inlayGeo, inlayMat);

  // 3. Gyroscope Rings (3 nested kinetic gimbal rings)
  // Outer Ring (Titanium, roughness 0.25, metalness 0.88)
  const outerRingGeo = new THREE.TorusGeometry(1.4, 0.05, 16, 64);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.88,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.position.y = 1.7;
  outerRing.castShadow = true;
  group.add(outerRing);
  disposables.push(outerRingGeo, outerRingMat);

  // Middle Ring (Brushed Brass, roughness 0.18, metalness 0.92)
  const midRingGeo = new THREE.TorusGeometry(1.15, 0.045, 16, 64);
  const midRingMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.18,
    metalness: 0.92,
  });
  const midRing = new THREE.Mesh(midRingGeo, midRingMat);
  midRing.position.y = 1.7;
  midRing.castShadow = true;
  group.add(midRing);
  disposables.push(midRingGeo, midRingMat);

  // Inner Ring (Cyan Chrome, roughness 0.12, metalness 0.85)
  const innerRingGeo = new THREE.TorusGeometry(0.9, 0.04, 16, 64);
  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.12,
    metalness: 0.85,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.position.y = 1.7;
  innerRing.castShadow = true;
  group.add(innerRing);
  disposables.push(innerRingGeo, innerRingMat);

  // 4. Center Octahedron Power Gem (roughness 0.08, metalness 0.35)
  const gemGeo = new THREE.OctahedronGeometry(0.55, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.08,
    metalness: 0.35,
  });
  const gemMesh = new THREE.Mesh(gemGeo, gemMat);
  gemMesh.position.y = 1.7;
  gemMesh.castShadow = true;
  group.add(gemMesh);
  disposables.push(gemGeo, gemMat);

  // 5. Four Cardinal Alignment Needles
  const needleGeo = new THREE.ConeGeometry(0.06, 0.45, 8);
  const needleMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.95,
  });
  disposables.push(needleGeo, needleMat);

  const needles: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.set(Math.cos(angle) * 1.55, 1.7, Math.sin(angle) * 1.55);
    needle.rotation.z = Math.PI / 2;
    needle.rotation.y = -angle;
    group.add(needle);
    needles.push(needle);
  }

  let currentScale = 0.9;

  return {
    group,
    update: (time, phase, progress, status, delta) => {
      let targetScale = 0.85;
      if (status === 'running' || status === 'paused') {
        if (phase === 'inhale') {
          targetScale = 0.78 + 0.35 * progress;
        } else if (phase === 'hold1') {
          targetScale = 1.13;
        } else if (phase === 'exhale') {
          targetScale = 1.13 - 0.35 * progress;
        } else if (phase === 'hold2') {
          targetScale = 0.78;
        }
      } else {
        targetScale = 0.9 + 0.07 * Math.sin(time * 1.1);
      }

      currentScale += (targetScale - currentScale) * (1 - Math.exp(-4 * delta));

      // Dynamic 3-axis gyroscopic rotation synchronized with breath
      outerRing.rotation.x = time * 0.45;
      outerRing.rotation.y = time * 0.2;
      outerRing.scale.setScalar(currentScale * 1.05);

      midRing.rotation.y = time * 0.6;
      midRing.rotation.z = time * 0.35;
      midRing.scale.setScalar(currentScale);

      innerRing.rotation.z = -time * 0.75;
      innerRing.rotation.x = time * 0.5;
      innerRing.scale.setScalar(currentScale * 0.95);

      gemMesh.rotation.x = time * 0.8;
      gemMesh.rotation.y = time * 0.5;
      gemMesh.scale.setScalar(currentScale);
      gemMesh.position.y = 1.7 + Math.sin(time * 2) * 0.05;

      // Color shifts
      if (phase === 'inhale') {
        _scratchColor.setHex(0x2dd4bf);
        gemMat.emissive.lerp(_scratchColor, 0.1);
      } else if (phase === 'hold1') {
        _scratchColor.setHex(0x818cf8);
        gemMat.emissive.lerp(_scratchColor, 0.1);
      } else if (phase === 'exhale') {
        _scratchColor.setHex(0xfbbf24);
        gemMat.emissive.lerp(_scratchColor, 0.1);
      } else {
        _scratchColor.setHex(0x38bdf8);
        gemMat.emissive.lerp(_scratchColor, 0.1);
      }

      // Needles expand outwards during breath expansion
      for (let i = 0; i < needles.length; i++) {
        const angle = (i * Math.PI) / 2;
        const rad = 1.55 * currentScale;
        needles[i].position.set(Math.cos(angle) * rad, 1.7, Math.sin(angle) * rad);
      }

      group.rotation.y = time * 0.1;
    },
    dispose: () => {
      disposables.forEach((item) => {
        if ('dispose' in item && typeof item.dispose === 'function') {
          item.dispose();
        }
      });
    },
  };
}

/**
 * Creates the Zen Cairn Sanctuary model (8 distinct procedural parts:
 * 5 vertically stacked organic river stones with varying roughness/metalness,
 * raked sand garden ring base, balance needle, and contact shadow).
 * Pivoted at bottom-center flush with y=0.
 */
export function createCairnSanctuary(): SanctuaryModel {
  const group = new THREE.Group();
  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  const shadowTex = createRadialShadowTexture(256);
  const stoneTex = createStoneNoiseTexture(256);
  const rippleTex = createRippleTexture(256);
  disposables.push(shadowTex, stoneTex, rippleTex);

  // 1. Contact Shadow Plane
  const shadowGeo = new THREE.PlaneGeometry(5.5, 5.5);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  group.add(shadowMesh);
  disposables.push(shadowGeo, shadowMat);

  // 2. Raked Sand Disc Base (Sand garden rings)
  const sandGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.2, 32);
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.92,
    metalness: 0.05,
    bumpMap: stoneTex,
    bumpScale: 0.04,
  });
  const sandMesh = new THREE.Mesh(sandGeo, sandMat);
  sandMesh.position.y = 0.1;
  sandMesh.receiveShadow = true;
  group.add(sandMesh);
  disposables.push(sandGeo, sandMat);

  // Raked ripple ring
  const rippleRingGeo = new THREE.RingGeometry(1.4, 2.3, 32);
  const rippleRingMat = new THREE.MeshBasicMaterial({
    map: rippleTex,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rippleRing = new THREE.Mesh(rippleRingGeo, rippleRingMat);
  rippleRing.rotation.x = -Math.PI / 2;
  rippleRing.position.y = 0.205;
  group.add(rippleRing);
  disposables.push(rippleRingGeo, rippleRingMat);

  // 3. Five Stacked River Stones with varied roughness and metalness
  const stoneConfigs = [
    {
      // Stone 1: Foundation boulder (Basalt slate)
      radius: 1.1,
      heightScale: 0.5,
      y: 0.35,
      color: 0x334155,
      roughness: 0.88,
      metalness: 0.06,
    },
    {
      // Stone 2: Lower balancing river rock (Deep mossy slate)
      radius: 0.85,
      heightScale: 0.52,
      y: 0.82,
      color: 0x1e293b,
      roughness: 0.78,
      metalness: 0.1,
    },
    {
      // Stone 3: Center anchor stone (Granite flecked)
      radius: 0.65,
      heightScale: 0.55,
      y: 1.25,
      color: 0x0f766e,
      roughness: 0.65,
      metalness: 0.15,
    },
    {
      // Stone 4: Upper poise stone (Polished river jade)
      radius: 0.45,
      heightScale: 0.6,
      y: 1.62,
      color: 0x14b8a6,
      roughness: 0.35,
      metalness: 0.25,
    },
    {
      // Stone 5: Crown keystone (Reflective obsidian/hematite)
      radius: 0.28,
      heightScale: 0.65,
      y: 1.95,
      color: 0x38bdf8,
      roughness: 0.12,
      metalness: 0.82,
      emissive: 0x0369a1,
    },
  ];

  const stoneMeshes: THREE.Mesh[] = [];
  stoneConfigs.forEach((cfg, idx) => {
    // Organic river rock geometry using perturbed dodecahedron
    const geo = new THREE.DodecahedronGeometry(cfg.radius, 1);
    geo.scale(1.15, cfg.heightScale, 0.95);

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
      bumpMap: stoneTex,
      bumpScale: 0.02,
      ...(cfg.emissive ? { emissive: cfg.emissive, emissiveIntensity: 0.4 } : {}),
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = cfg.y;
    mesh.rotation.y = idx * 0.8;
    mesh.rotation.z = (idx % 2 === 0 ? 0.05 : -0.05);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    stoneMeshes.push(mesh);
    disposables.push(geo, mat);
  });

  // Crown balance accent needle
  const balancePinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
  const balancePinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.95,
  });
  const balancePin = new THREE.Mesh(balancePinGeo, balancePinMat);
  balancePin.position.y = 2.15;
  group.add(balancePin);
  disposables.push(balancePinGeo, balancePinMat);

  let currentElevation = 0;

  return {
    group,
    update: (time, phase, progress, status, delta) => {
      let targetElevation = 0;
      if (status === 'running' || status === 'paused') {
        if (phase === 'inhale') {
          targetElevation = 0.02 + 0.12 * progress;
        } else if (phase === 'hold1') {
          targetElevation = 0.14 + 0.01 * Math.sin(time * 3);
        } else if (phase === 'exhale') {
          targetElevation = 0.14 - 0.12 * progress;
        } else if (phase === 'hold2') {
          targetElevation = 0.01;
        }
      } else {
        targetElevation = 0.04 + 0.03 * Math.sin(time * 1.2);
      }

      currentElevation += (targetElevation - currentElevation) * (1 - Math.exp(-4 * delta));

      // Each upper stone gently breathes upward in harmonic succession
      for (let i = 1; i < stoneMeshes.length; i++) {
        const base = stoneConfigs[i].y;
        const offset = currentElevation * (i * 0.45);
        stoneMeshes[i].position.y = base + offset;
        // Tiny gentle breathing sway
        stoneMeshes[i].rotation.z =
          (i % 2 === 0 ? 0.05 : -0.05) + Math.sin(time * 0.8 + i) * 0.015;
      }
      balancePin.position.y = 2.15 + currentElevation * 1.8;

      // Crown stone emissive glow shifts with breath phase
      const crownMat = stoneMeshes[4].material as THREE.MeshStandardMaterial;
      if (phase === 'inhale') {
        _scratchColor.setHex(0x2dd4bf);
        crownMat.emissive.lerp(_scratchColor, 0.1);
      } else if (phase === 'hold1') {
        _scratchColor.setHex(0x818cf8);
        crownMat.emissive.lerp(_scratchColor, 0.1);
      } else if (phase === 'exhale') {
        _scratchColor.setHex(0xfbbf24);
        crownMat.emissive.lerp(_scratchColor, 0.1);
      } else {
        _scratchColor.setHex(0x38bdf8);
        crownMat.emissive.lerp(_scratchColor, 0.1);
      }

      group.rotation.y = time * 0.06;
    },
    dispose: () => {
      disposables.forEach((item) => {
        if ('dispose' in item && typeof item.dispose === 'function') {
          item.dispose();
        }
      });
    },
  };
}
