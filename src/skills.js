import * as THREE from 'three';
import { SKILL_CATALOG, getAllSkills } from './skill_catalog.js';
import { gltfLoader } from './champion.js';
import { create3DShuriken, create3DBattleAxe, create3DAnchor, create3DTornado, create3DMysticLance } from './skill_models.js';

export class SkillSystem {
  constructor(scene, player, vfx, sounds) {
    this.scene = scene;
    this.player = player;
    this.vfx = vfx;
    this.sounds = sounds;

    this.projectiles = [];
    this.aoeZones = [];
    this.laserBeams = [];
    this.windWalls = [];

    // Player loadout (default starter loadout)
    this.equipped = {
      Q: 'ezreal_q',
      W: 'lux_e',
      E: 'ezreal_e',
      R: 'ezreal_r', // Global Ult
      D: 'snowball'
    };

    // Cooldown timers
    this.cooldowns = { Q: 0, W: 0, E: 0, R: 0, D: 0 };
    this.maxCooldowns = { Q: 2.5, W: 5.0, E: 5.5, R: 15.0, D: 7.0 };
    this.manaCosts = { Q: 35, W: 65, E: 60, R: 100, D: 0 };

    this.markedEnemy = null; // for Snowball recast
    this.allSkillsMap = {};
    getAllSkills().forEach(s => { this.allSkillsMap[s.id] = s; });

    // Sync stats from equipped skills
    this.updateEquippedStats();

    // Aim Indicator
    this.indicator = this.createAimIndicator();
    this.activeAimSkill = null;

    // 3D Skill Models
    this.models = {
      rocket: null,
      crystal: null,
      meteor: null
    };
    this.loadSkillModels();
  }

  loadSkillModels() {
    gltfLoader.load('/models/rocket_baseA.glb', (gltf) => {
      this.models.rocket = gltf.scene;
      this.models.rocket.scale.set(1.6, 1.6, 1.6);
      this.models.rocket.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.material = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xf97316,
            emissiveIntensity: 1.8,
            metalness: 0.8
          });
        }
      });
    });

    gltfLoader.load('/models/rock_crystalsLargeA.glb', (gltf) => {
      this.models.crystal = gltf.scene;
      this.models.crystal.scale.set(2.2, 2.2, 2.2);
      this.models.crystal.traverse(c => {
        if (c.isMesh) {
          c.material = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x00ffff,
            emissiveIntensity: 2.8,
            roughness: 0.1,
            metalness: 0.9
          });
        }
      });
    });

    gltfLoader.load('/models/meteor_detailed.glb', (gltf) => {
      this.models.meteor = gltf.scene;
      this.models.meteor.scale.set(1.5, 1.5, 1.5);
      this.models.meteor.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.material = new THREE.MeshStandardMaterial({
            color: 0x78716c,
            emissive: 0xd97706,
            emissiveIntensity: 1.5,
            roughness: 0.9
          });
        }
      });
    });
  }

  updateEquippedStats() {
    ['Q', 'W', 'E', 'R'].forEach(slot => {
      const skill = this.allSkillsMap[this.equipped[slot]];
      if (skill) {
        this.maxCooldowns[slot] = skill.cd;
        this.manaCosts[slot] = skill.mana;
      }
    });
  }

  setSkill(slot, skillId) {
    const skill = this.allSkillsMap[skillId];
    if (!skill) return false;
    if (slot === 'R' && skill.type !== 'ultimate') return false;
    if (slot !== 'R' && skill.type === 'ultimate') return false;

    this.equipped[slot] = skillId;
    this.updateEquippedStats();
    return true;
  }

  getSkill(slot) {
    return this.allSkillsMap[this.equipped[slot]];
  }

  createAimIndicator() {
    const group = new THREE.Group();

    // Arrow indicator for skillshots
    const arrowGeo = new THREE.PlaneGeometry(2.4, 25);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    this.arrowMesh.rotation.x = -Math.PI / 2;
    this.arrowMesh.position.z = -12.5;
    group.add(this.arrowMesh);

    // Circle AoE indicator
    const circleGeo = new THREE.RingGeometry(0.1, 4.5, 32);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    this.circleMesh = new THREE.Mesh(circleGeo, circleMat);
    this.circleMesh.rotation.x = -Math.PI / 2;
    group.add(this.circleMesh);

    group.position.y = 0.06;
    group.visible = false;
    this.scene.add(group);
    return group;
  }

  // Cast by Slot: Q, W, E, R, D
  cast(slot, targetPoint, targets = []) {
    if (this.player.isDead) return false;
    if (this.cooldowns[slot] > 0) return false;
    const manaCost = this.manaCosts[slot] || 0;
    if (this.player.mp < manaCost) return false;

    const skillId = this.equipped[slot];
    let success = false;

    if (slot === 'D') {
      success = this.castSnowball(targetPoint);
    } else {
      success = this.executeSkill(skillId, targetPoint, targets);
    }

    if (success) {
      this.player.mp -= manaCost;
      this.cooldowns[slot] = this.maxCooldowns[slot];
      this.player.playAttackAnimation();
    }
    return success;
  }

  executeSkill(skillId, targetPoint, targets) {
    const playerPos = this.player.mesh.position;
    const dir = new THREE.Vector3().subVectors(targetPoint, playerPos);
    dir.y = 0;
    dir.normalize();

    // Turn player towards cast direction
    this.player.mesh.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI;

    switch (skillId) {
      // 1. GLOBAL ULTIMATES
      case 'ezreal_r': // Trueshot Barrage - giant golden crescent across whole map
        this.castEzrealR(dir, targets);
        return true;

      case 'jinx_r': // Super Mega Death Rocket - massive rocket flying across map
        this.castJinxR(dir, targets);
        return true;

      case 'ashe_r': // Enchanted Crystal Arrow - giant crystal arrow across map
        this.castAsheR(dir, targets);
        return true;

      // 2. MARKSMEN BASICS
      case 'ezreal_q': // 3D Mystic Energy Lance
        this.cast3DMysticShot(dir);
        return true;

      case 'ezreal_e': // Arcane shift blink
      case 'kat_e':
        this.castBlink(targetPoint, 9.0, 220, targets);
        return true;

      case 'jinx_w': // Zap electric beam
        this.castZap(dir, targets);
        return true;

      case 'ashe_w': // Volley
        this.castVolley(dir);
        return true;

      // 3. ASSASSINS
      case 'zed_q': // 3D Razor Shuriken
      case 'akali_e':
        this.cast3DShuriken(dir);
        return true;

      case 'zed_w': // Living shadow blink
        this.castBlink(targetPoint, 10.0, 150, targets);
        return true;

      case 'zed_r': // Death Mark
      case 'akali_r':
      case 'darius_r':
        this.castExecuteSlam(targetPoint, 600, targets);
        return true;

      case 'kat_r': // Death Lotus
        this.castDeathLotus(targets);
        return true;

      // 4. MAGES
      case 'lux_q': // Light binding snare
        this.castProjectile({ dir, speed: 32, range: 30, damage: 300, color: 0xfef08a, emissive: 0xfef08a, scale: 0.6, pierce: 2 });
        this.sounds.playCastQ();
        return true;

      case 'lux_e': // Lucent Singularity AoE
        this.castAoEZone(targetPoint, 4.5, 320, 0x38bdf8);
        return true;

      case 'lux_r': // Final Spark Laser
        this.castLaserBeam(dir, 80, 580, targets, 0xfef08a);
        return true;

      case 'ahri_q': // Orb of Deception
        this.castAhriOrb(dir);
        return true;

      case 'ahri_e': // Charm heart
        this.castProjectile({ dir, speed: 28, range: 26, damage: 200, color: 0xf472b6, emissive: 0xf472b6, scale: 0.55 });
        this.sounds.playCastQ();
        return true;

      case 'syndra_e': // Scatter the weak wave
        this.castConeKnockback(dir, targets);
        return true;

      // 5. TANKS
      case 'malphite_q': // Rolling 3D boulder
        this.castMeteorBoulder(dir, targets);
        return true;

      case 'malphite_r': // Unstoppable Force slam
        this.castMalphiteR(targetPoint, targets);
        return true;

      case 'naut_q': // Dredge Line anchor
        this.castAnchorHook(dir, targets);
        return true;

      case 'naut_w': // Titan shield
        this.player.heal(350, this.vfx);
        this.vfx.spawnIceExplosion(this.player.mesh.position, 0x0284c7, 20);
        this.sounds.playHeal();
        return true;

      case 'chogath_q': // Rupture ground spikes
        this.castAoEZone(targetPoint, 4.0, 340, 0x15803d);
        return true;

      case 'chogath_r': // Feast
        this.castExecuteSlam(targetPoint, 750, targets);
        this.player.maxHp += 100;
        this.player.heal(150, this.vfx);
        return true;

      // 6. FIGHTERS
      case 'yasuo_q': // Steel tempest / Tornado
        this.castTornado(dir);
        return true;

      case 'yasuo_w': // Windwall
        this.castWindWall(dir);
        return true;

      case 'yasuo_r': // Last breath
        this.castExecuteSlam(targetPoint, 550, targets);
        return true;

      case 'darius_q': // Decimate circle
        this.castAxeDecimate(targets);
        return true;

      case 'darius_e': // Apprehend pull
        this.castConeKnockback(dir, targets, true);
        return true;

      default:
        // Generic fallback skillshot
        this.castProjectile({ dir, speed: 35, range: 28, damage: 250, color: 0x38bdf8, emissive: 0x38bdf8, scale: 0.5 });
        this.sounds.playCastQ();
        return true;
    }
  }

  // --- SPECIFIC SKILL IMPLEMENTATIONS ---

  // Ezreal R: Cung Ánh Sáng (Global Crescent Wave)
  castEzrealR(dir, targets) {
    const waveGeo = new THREE.TorusGeometry(5.0, 0.5, 12, 32, Math.PI);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfde047,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });
    const mesh = new THREE.Mesh(waveGeo, waveMat);
    mesh.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.z = Math.atan2(dir.x, dir.z) + Math.PI / 2;
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      dir,
      speed: 38,
      range: 220, // Whole map
      traveled: 0,
      damage: 650,
      radius: 4.5,
      pierce: 999, // Pierces everything!
      type: 'global_wave'
    });

    this.sounds.playUlt();
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0xfacc15, 25);
  }

  // Jinx R: Tên Lửa Đạn Đạo (Global Mega Rocket with real 3D GLB Model)
  castJinxR(dir, targets) {
    const group = new THREE.Group();
    if (this.models.rocket) {
      const rocketClone = this.models.rocket.clone();
      rocketClone.rotation.x = Math.PI / 2;
      group.add(rocketClone);
    } else {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 2.8, 12),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xf97316, emissiveIntensity: 2.0 })
      );
      body.rotation.x = Math.PI / 2;
      group.add(body);
    }

    group.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 1.5, 0));
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 30,
      accelerate: 18, // Accelerates across the map!
      range: 220, // Whole map
      traveled: 0,
      damage: 800,
      radius: 1.5,
      aoeRadius: 6.5,
      type: 'jinx_rocket'
    });

    this.sounds.playUlt();
  }

  // Ashe R: Đại Băng Tiễn (Global Giant Crystal Arrow with real 3D Crystal Model)
  castAsheR(dir, targets) {
    const group = new THREE.Group();
    if (this.models.crystal) {
      const crystalClone = this.models.crystal.clone();
      crystalClone.rotation.x = Math.PI / 2;
      group.add(crystalClone);
    } else {
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 4.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00ffff, emissiveIntensity: 3.5 })
      );
      arrow.rotation.x = Math.PI / 2;
      group.add(arrow);
    }

    group.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 1.4, 0));
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 36,
      range: 220, // Whole map
      traveled: 0,
      damage: 700,
      radius: 1.8,
      aoeRadius: 5.5,
      type: 'ashe_arrow'
    });

    this.sounds.playUlt();
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0x00ffff, 20);
  }

  // Malphite Q: Rolling 3D Meteor
  castMeteorBoulder(dir, targets) {
    const group = new THREE.Group();
    if (this.models.meteor) {
      const clone = this.models.meteor.clone();
      group.add(clone);
    } else {
      const boulder = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8),
        new THREE.MeshStandardMaterial({ color: 0x78716c, emissive: 0xd97706, emissiveIntensity: 1.5 })
      );
      group.add(boulder);
    }

    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    group.position.copy(startPos);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 28,
      range: 24,
      traveled: 0,
      damage: 260,
      radius: 1.2,
      isRolling: true,
      type: 'meteor'
    });
    this.sounds.playCastQ();
  }

  // Instant Blink / Dash (Ezreal E, Katarina Shunpo, Zed W)
  castBlink(targetPoint, maxDist, damage, targets) {
    const oldPos = this.player.mesh.position.clone();
    const dir = new THREE.Vector3().subVectors(targetPoint, oldPos);
    dir.y = 0;
    const dist = Math.min(maxDist, dir.length());
    dir.normalize();

    const newPos = oldPos.clone().addScaledVector(dir, dist);
    newPos.x = Math.max(-11, Math.min(11, newPos.x));
    newPos.z = Math.max(-115, Math.min(115, newPos.z));

    this.player.mesh.position.copy(newPos);
    this.player.targetPos = null;

    this.vfx.spawnIceExplosion(oldPos, 0x38bdf8, 14);
    this.vfx.spawnIceExplosion(newPos, 0xfacc15, 18);
    this.sounds.playDash();

    // Damage nearest enemy
    for (const t of targets) {
      if (t.isDead) continue;
      if (newPos.distanceTo(t.mesh.position) < 8.0) {
        t.takeDamage(damage, this.vfx);
        this.vfx.spawnIceExplosion(t.mesh.position, 0xfacc15, 12);
        break;
      }
    }
  }

  // Laser Beam (Lux R, Mega Beam)
  castLaserBeam(dir, length, damage, targets, colorHex = 0x67e8f9) {
    const beamGeo = new THREE.CylinderGeometry(1.5, 1.5, length, 16);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
    const beam = new THREE.Mesh(beamGeo, beamMat);

    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    beam.position.copy(startPos).addScaledVector(dir, length / 2);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(beam);

    this.laserBeams.push({ mesh: beam, life: 0.45 });
    this.sounds.playUlt();

    for (const target of targets) {
      if (target.isDead) continue;
      const toTarget = new THREE.Vector3().subVectors(target.mesh.position, startPos);
      const projDist = toTarget.dot(dir);
      if (projDist > 0 && projDist < length) {
        const perpDist = toTarget.clone().subScaledVector(dir, projDist).length();
        if (perpDist < 2.6) {
          target.takeDamage(damage, this.vfx);
          this.vfx.spawnIceExplosion(target.mesh.position, colorHex, 20);
        }
      }
    }
  }

  // AoE Zone (Lux E, Cho'Gath Q)
  castAoEZone(targetPoint, radius, damage, colorHex) {
    const ringGeo = new THREE.RingGeometry(0.2, radius, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(ringGeo, ringMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(targetPoint.x, 0.08, targetPoint.z);
    this.scene.add(mesh);

    this.aoeZones.push({
      mesh,
      center: mesh.position.clone(),
      radius,
      delay: 0.75,
      damage,
      colorHex
    });
    this.sounds.playCastW();
  }

  // Jinx Zap electric line
  castZap(dir, targets) {
    this.castLaserBeam(dir, 35, 280, targets, 0x38bdf8);
  }

  // Ezreal Q: 3D Mystic Energy Lance
  cast3DMysticShot(dir) {
    const group = create3DMysticLance();
    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    group.position.copy(startPos);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 42,
      range: 32,
      traveled: 0,
      damage: 260,
      radius: 1.1,
      type: 'lance',
      onHit: () => {
        ['W', 'E', 'R'].forEach(k => { this.cooldowns[k] = Math.max(0, this.cooldowns[k] - 1.5); });
      }
    });
    this.sounds.playCastQ();
  }

  // Zed Q: 3D Razor Shuriken
  cast3DShuriken(dir) {
    const group = create3DShuriken();
    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    group.position.copy(startPos);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 38,
      range: 28,
      traveled: 0,
      damage: 290,
      radius: 1.2,
      type: 'shuriken'
    });
    this.sounds.playCastQ();
  }

  // Ashe Volley: 7 arrows in cone
  castVolley(mainDir) {
    const baseAngle = Math.atan2(mainDir.x, mainDir.z);
    const spread = 0.55;
    for (let i = -3; i <= 3; i++) {
      const angle = baseAngle + (i / 3) * spread;
      const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
      this.castProjectile({ dir, speed: 34, range: 24, damage: 180, color: 0x38bdf8, emissive: 0x38bdf8, scale: 0.35 });
    }
    this.sounds.playCastQ();
  }

  // Yasuo 3D Whirling Tornado
  castTornado(dir) {
    const group = create3DTornado();
    group.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 0.2, 0));
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 26,
      range: 35,
      traveled: 0,
      damage: 320,
      radius: 1.8,
      pierce: 99,
      type: 'tornado'
    });
    this.sounds.playCastW();
  }

  // Yasuo Windwall
  castWindWall(dir) {
    const wallGeo = new THREE.BoxGeometry(7.0, 3.5, 0.4);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      wireframe: false
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    const wallPos = this.player.mesh.position.clone().addScaledVector(dir, 4.0);
    wall.position.set(wallPos.x, 1.75, wallPos.z);
    wall.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2;
    this.scene.add(wall);

    this.windWalls.push({ mesh: wall, life: 3.5 });
    this.sounds.playDash();
  }

  // Ahri Orb (out & back)
  castAhriOrb(dir) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.5 })
    );
    orb.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 1.3, 0));
    this.scene.add(orb);

    this.projectiles.push({
      mesh: orb,
      dir,
      speed: 30,
      range: 24,
      traveled: 0,
      damage: 220,
      radius: 1.2,
      returning: false,
      playerRef: this.player,
      type: 'ahri_orb'
    });
    this.sounds.playCastQ();
  }

  // Malphite R: Unstoppable Force slam
  castMalphiteR(targetPoint, targets) {
    const dir = new THREE.Vector3().subVectors(targetPoint, this.player.mesh.position);
    dir.y = 0;
    const dist = Math.min(22, dir.length());
    dir.normalize();

    const targetLanding = this.player.mesh.position.clone().addScaledVector(dir, dist);
    this.player.mesh.position.copy(targetLanding);
    this.player.targetPos = null;

    this.vfx.spawnIceExplosion(targetLanding, 0xd97706, 30);
    this.sounds.playUlt();

    for (const t of targets) {
      if (t.isDead) continue;
      if (targetLanding.distanceTo(t.mesh.position) <= 5.5) {
        t.takeDamage(600, this.vfx);
        // Knockup visual effect
        t.mesh.position.y += 2.5;
        setTimeout(() => { if (t.mesh) t.mesh.position.y = 0; }, 400);
      }
    }
  }

  // Execution Slam (Zed R, Darius R)
  castExecuteSlam(targetPoint, damage, targets) {
    let closest = null;
    let closestDist = 12.0;
    for (const t of targets) {
      if (t.isDead) continue;
      const d = targetPoint.distanceTo(t.mesh.position);
      if (d < closestDist) {
        closestDist = d;
        closest = t;
      }
    }

    if (closest) {
      this.player.mesh.position.copy(closest.mesh.position.clone().add(new THREE.Vector3(0, 0, 1.5)));
      this.player.targetPos = null;
      closest.takeDamage(damage, this.vfx);
      this.vfx.spawnIceExplosion(closest.mesh.position, 0xef4444, 30);
      this.sounds.playUlt();
    }
  }

  // Katarina R: Death Lotus
  castDeathLotus(targets) {
    this.sounds.playUlt();
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const d = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      this.castProjectile({ dir: d, speed: 30, range: 10, damage: 160, color: 0xef4444, emissive: 0xef4444, scale: 0.3 });
    }
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0xef4444, 25);
  }

  // Darius Q: 3D Whirling Battle Axe Cleave
  castAxeDecimate(targets) {
    const center = this.player.mesh.position.clone();
    this.vfx.spawnIceExplosion(center, 0xef4444, 25);
    this.sounds.playHit();

    // 3D Battle Axe spinning in full 360 cleave
    const axe = create3DBattleAxe();
    axe.position.copy(center).add(new THREE.Vector3(0, 0.2, 0));
    this.scene.add(axe);

    const spinDuration = 0.45;
    let elapsed = 0;
    const spinInterval = () => {
      elapsed += 0.03;
      axe.rotation.y += 0.45;
      axe.position.copy(this.player.mesh.position).add(new THREE.Vector3(0, 0.2, 0));
      if (elapsed < spinDuration) {
        requestAnimationFrame(spinInterval);
      } else {
        this.scene.remove(axe);
      }
    };
    requestAnimationFrame(spinInterval);

    for (const t of targets) {
      if (t.isDead) continue;
      const d = center.distanceTo(t.mesh.position);
      if (d <= 5.5) {
        const dmg = d >= 2.5 ? 320 : 160; // Outer ring blade bonus
        t.takeDamage(dmg, this.vfx);
      }
    }
  }

  // Cone Knockback (Syndra E, Darius E)
  castConeKnockback(dir, targets, pull = false) {
    const origin = this.player.mesh.position;
    this.sounds.playHit();
    for (const t of targets) {
      if (t.isDead) continue;
      const toT = new THREE.Vector3().subVectors(t.mesh.position, origin);
      const dist = toT.length();
      if (dist <= 12.0 && toT.normalize().dot(dir) > 0.6) {
        t.takeDamage(240, this.vfx);
        const shoveDir = pull ? dir.clone().negate() : dir;
        t.mesh.position.addScaledVector(shoveDir, 4.0);
        this.vfx.spawnIceExplosion(t.mesh.position, 0xc084fc, 15);
      }
    }
  }

  // Nautilus Q: 3D Heavy Iron Anchor
  castAnchorHook(dir, targets) {
    const group = create3DAnchor();
    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    group.position.copy(startPos);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      dir,
      speed: 34,
      range: 24,
      traveled: 0,
      damage: 280,
      radius: 1.4,
      type: 'anchor',
      onHit: (hitEnemy) => {
        const mid = this.player.mesh.position.clone().add(hitEnemy.mesh.position).multiplyScalar(0.5);
        this.player.mesh.position.copy(mid.clone().addScaledVector(dir, -1.5));
        hitEnemy.mesh.position.copy(mid.clone().addScaledVector(dir, 1.5));
      }
    });
    this.sounds.playCastQ();
  }

  // Generic Projectile helper
  castProjectile({ dir, speed, range, damage, color, emissive, scale = 0.5, onHit, pierce = 1 }) {
    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    const geo = new THREE.ConeGeometry(0.35 * scale, 1.8 * scale, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      dir,
      speed,
      range,
      traveled: 0,
      damage,
      radius: 1.0 * scale + 0.4,
      onHit,
      pierce,
      hits: 0,
      type: 'normal'
    });
  }

  // Snowball D
  castSnowball(targetPoint) {
    if (this.markedEnemy && !this.markedEnemy.target.isDead) {
      const targetPos = this.markedEnemy.target.mesh.position.clone();
      this.player.mesh.position.copy(targetPos.clone().add(new THREE.Vector3(0, 0, 1.5)));
      this.player.targetPos = null;
      this.vfx.spawnIceExplosion(this.player.mesh.position, 0xffffff, 20);
      this.sounds.playDash();
      this.markedEnemy.target.takeDamage(120, this.vfx);
      this.markedEnemy = null;
      this.cooldowns.D = this.maxCooldowns.D;
      return true;
    }

    this.cooldowns.D = this.maxCooldowns.D;
    const startPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const dir = new THREE.Vector3().subVectors(targetPoint, this.player.mesh.position);
    dir.y = 0;
    dir.normalize();

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe0f2fe, emissiveIntensity: 2.0 })
    );
    ball.position.copy(startPos);
    this.scene.add(ball);

    this.projectiles.push({
      mesh: ball,
      dir,
      speed: 32,
      range: 40,
      traveled: 0,
      damage: 120,
      radius: 1.1,
      type: 'D'
    });

    this.sounds.playSnowball();
    return true;
  }

  update(delta, targets = []) {
    // 1. Cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - delta);
      }
    }

    // 2. Snowball mark expiration
    if (this.markedEnemy) {
      this.markedEnemy.timer -= delta;
      if (this.markedEnemy.timer <= 0 || this.markedEnemy.target.isDead) {
        this.markedEnemy = null;
      }
    }

    // 3. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Jinx rocket acceleration
      if (p.accelerate) {
        p.speed += p.accelerate * delta;
      }

      // Ahri orb return
      if (p.type === 'ahri_orb') {
        if (!p.returning && p.traveled >= p.range) {
          p.returning = true;
        }
        if (p.returning) {
          const retDir = new THREE.Vector3().subVectors(this.player.mesh.position, p.mesh.position);
          retDir.y = 0;
          if (retDir.length() < 1.5) {
            this.scene.remove(p.mesh);
            this.projectiles.splice(i, 1);
            continue;
          }
          p.dir.copy(retDir.normalize());
        }
      }

      const step = p.speed * delta;
      p.mesh.position.addScaledVector(p.dir, step);
      p.traveled += step;

      // 3D Model Dynamic Rotations
      if (p.isRolling) {
        p.mesh.rotation.x += 14 * delta;
      }
      if (p.type === 'jinx_rocket' || p.type === 'ashe_arrow') {
        p.mesh.rotation.z += 8 * delta;
      }
      if (p.type === 'shuriken') {
        p.mesh.rotation.y += 35 * delta;
      }
      if (p.type === 'tornado') {
        p.mesh.rotation.y += 20 * delta;
      }
      if (p.type === 'lance') {
        p.mesh.rotation.z += 12 * delta;
      }
      if (p.type === 'anchor') {
        p.mesh.rotation.z += 8 * delta;
      }

      // Check collision with targets
      let hit = false;
      for (const target of targets) {
        if (target.isDead) continue;
        const d = p.mesh.position.distanceTo(target.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (d < p.radius + 0.8) {
          // Apply AP / AD stat bonus to damage
          const bonusDmg = Math.round((this.player.ap || 0) * 0.75 + (this.player.ad || 0) * 0.5);
          const totalDmg = p.damage + bonusDmg;
          target.takeDamage(totalDmg, this.vfx);
          this.vfx.spawnIceExplosion(p.mesh.position, 0x38bdf8, 16);
          this.sounds.playHit();

          // Apply Lifesteal
          if (this.player.lifesteal > 0) {
            const healAmt = Math.max(1, Math.round(totalDmg * this.player.lifesteal));
            this.player.heal(healAmt, this.vfx);
          }

          if (p.onHit) p.onHit(target);

          if (p.type === 'D') {
            this.markedEnemy = { target, timer: 4.0 };
            this.cooldowns.D = 0;
          }

          // AoE blast on rocket/arrow
          if (p.aoeRadius) {
            this.vfx.spawnIceExplosion(p.mesh.position, 0xf97316, 35);
            for (const other of targets) {
              if (other !== target && !other.isDead && p.mesh.position.distanceTo(other.mesh.position) <= p.aoeRadius) {
                other.takeDamage(p.damage * 0.75, this.vfx);
              }
            }
          }

          p.hits = (p.hits || 0) + 1;
          if (!p.pierce || p.hits >= p.pierce) {
            hit = true;
            break;
          }
        }
      }

      if (hit || p.traveled >= p.range) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Update AoE Zones
    for (let i = this.aoeZones.length - 1; i >= 0; i--) {
      const aoe = this.aoeZones[i];
      aoe.delay -= delta;
      aoe.mesh.material.opacity = 0.5 + Math.sin(aoe.delay * 16) * 0.3;

      if (aoe.delay <= 0) {
        this.vfx.spawnIceExplosion(aoe.center, aoe.colorHex || 0x67e8f9, 25);
        this.sounds.playHit();

        for (const target of targets) {
          if (target.isDead) continue;
          if (aoe.center.distanceTo(target.mesh.position) <= aoe.radius) {
            target.takeDamage(aoe.damage, this.vfx);
          }
        }

        this.scene.remove(aoe.mesh);
        this.aoeZones.splice(i, 1);
      }
    }

    // 5. Update Lasers
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const beam = this.laserBeams[i];
      beam.life -= delta;
      beam.mesh.material.opacity = Math.max(0, beam.life / 0.45);
      if (beam.life <= 0) {
        this.scene.remove(beam.mesh);
        this.laserBeams.splice(i, 1);
      }
    }

    // 6. Update Windwalls
    for (let i = this.windWalls.length - 1; i >= 0; i--) {
      const wall = this.windWalls[i];
      wall.life -= delta;
      if (wall.life <= 0) {
        this.scene.remove(wall.mesh);
        this.windWalls.splice(i, 1);
      }
    }
  }
}
