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

    // Player loadout (default starter loadout - Yasuo)
    this.equipped = {
      Q: 'yasuo_q',
      W: 'yasuo_w',
      E: 'yasuo_e',
      R: 'yasuo_r',
      D: 'snowball'
    };

    // Cooldown timers
    this.cooldowns = { Q: 0, W: 0, E: 0, R: 0, D: 0 };
    this.maxCooldowns = { Q: 2.5, W: 18.0, E: 0.5, R: 25.0, D: 7.0 };
    this.manaCosts = { Q: 0, W: 0, E: 0, R: 0, D: 0 };

    // Champion specific skill states
    this.yasuoQStacks = 0;
    this.yasuoQTimer = 0;
    this.jinxRocketMode = false;
    this.zedShadow = null;
    this.zedShadowTimer = 0;
    this.ahriRCharges = 0;
    this.ahriRTimer = 0;

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

  equipChampionKit(heroKey) {
    const kitMap = {
      yasuo: { Q: 'yasuo_q', W: 'yasuo_w', E: 'yasuo_e', R: 'yasuo_r' },
      jinx: { Q: 'jinx_q', W: 'jinx_w', E: 'jinx_e', R: 'jinx_r' },
      zed: { Q: 'zed_q', W: 'zed_w', E: 'zed_e', R: 'zed_r' },
      ashe: { Q: 'ashe_q', W: 'ashe_w', E: 'ashe_e', R: 'ashe_r' },
      darius: { Q: 'darius_q', W: 'darius_w', E: 'darius_e', R: 'darius_r' },
      ahri: { Q: 'ahri_q', W: 'ahri_w', E: 'ahri_e', R: 'ahri_r' },
      ezreal: { Q: 'ezreal_q', W: 'ezreal_w', E: 'ezreal_e', R: 'ezreal_r' },
      lux: { Q: 'lux_q', W: 'lux_w', E: 'lux_e', R: 'lux_r' },
      malphite: { Q: 'malphite_q', W: 'malphite_w', E: 'malphite_e', R: 'malphite_r' },
      nautilus: { Q: 'nautilus_q', W: 'nautilus_w', E: 'nautilus_e', R: 'nautilus_r' },
      chogath: { Q: 'chogath_q', W: 'chogath_w', E: 'chogath_e', R: 'chogath_r' },
      katarina: { Q: 'katarina_q', W: 'katarina_w', E: 'katarina_e', R: 'katarina_r' },
      akali: { Q: 'akali_q', W: 'akali_w', E: 'akali_e', R: 'akali_r' },
      syndra: { Q: 'syndra_q', W: 'syndra_w', E: 'syndra_e', R: 'syndra_r' }
    };
    const kit = kitMap[heroKey] || kitMap.yasuo;
    this.equipped.Q = kit.Q;
    this.equipped.W = kit.W;
    this.equipped.E = kit.E;
    this.equipped.R = kit.R;
    this.updateEquippedStats();
    return this.equipped;
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

  // Tính toán sát thương chuẩn LMHT có tỉ lệ scale theo AD và AP của Tướng
  getScaledDamage(base, adRatio = 0, apRatio = 0) {
    const ad = this.player?.ad || 65;
    const ap = this.player?.ap || 0;
    return Math.round(base + (ad * adRatio) + (ap * apRatio));
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
      case 'ezreal_r':
        this.castEzrealR(dir, targets);
        return true;

      case 'jinx_r':
        this.castJinxR(dir, targets);
        return true;

      case 'ashe_r':
        this.castAsheR(dir, targets);
        return true;

      // 2. MARKSMEN BASICS
      case 'ezreal_q':
        this.cast3DMysticShot(dir);
        return true;

      case 'ezreal_w':
        this.castEzrealW(dir);
        return true;

      case 'ezreal_e':
        this.castBlink(targetPoint, 9.0, this.getScaledDamage(120, 0.5, 0.75), targets);
        return true;

      case 'jinx_q':
        this.castJinxQ(dir);
        return true;

      case 'jinx_w':
        this.castZap(dir, targets);
        return true;

      case 'jinx_e':
        this.castJinxE(targetPoint);
        return true;

      case 'ashe_q':
        this.castAsheQ(dir);
        return true;

      case 'ashe_w':
        this.castVolley(dir);
        return true;

      case 'ashe_e':
        this.castAsheE(dir);
        return true;

      // 3. ASSASSINS
      case 'zed_q':
        this.cast3DShuriken(dir);
        return true;

      case 'zed_w':
        this.castZedW(targetPoint, targets);
        return true;

      case 'zed_e':
        this.castZedE(targets);
        return true;

      case 'zed_r':
        this.castZedR(targetPoint, targets);
        return true;

      case 'akali_r':
        this.castAkaliR(targetPoint, targets);
        return true;

      case 'darius_r':
        this.castDariusR(targetPoint, targets);
        return true;

      case 'katarina_q':
        this.castKatarinaQ(dir, targets);
        return true;

      case 'katarina_w':
        this.castKatarinaW();
        return true;

      case 'kat_e':
      case 'katarina_e':
        this.castBlink(targetPoint, 9.0, this.getScaledDamage(110, 0.6, 0.6), targets);
        return true;

      case 'kat_r':
      case 'katarina_r':
        this.castDeathLotus(targets);
        return true;

      case 'akali_q':
        this.castAkaliQ(dir);
        return true;

      case 'akali_w':
        this.castAkaliW(targetPoint);
        return true;

      case 'akali_e':
        this.cast3DShuriken(dir);
        return true;

      // 4. MAGES
      case 'lux_q':
        this.castProjectile({
          dir,
          speed: 32,
          range: 30,
          damage: this.getScaledDamage(130, 0, 0.75),
          color: 0xfef08a,
          emissive: 0xfef08a,
          scale: 0.6,
          pierce: 2
        });
        this.sounds.playCastQ();
        return true;

      case 'lux_w':
        this.castLuxW(dir);
        return true;

      case 'lux_e':
        this.castAoEZone(targetPoint, 4.5, this.getScaledDamage(150, 0, 0.8), 0x38bdf8);
        return true;

      case 'lux_r':
        this.castLaserBeam(dir, 80, this.getScaledDamage(450, 0, 1.2), targets, 0xfef08a);
        return true;

      case 'ahri_q':
        this.castAhriOrb(dir);
        return true;

      case 'ahri_w':
        this.castAhriW(targets);
        return true;

      case 'ahri_e':
        this.castAhriE(dir);
        return true;

      case 'ahri_r':
        this.castAhriR(targetPoint, targets);
        return true;

      case 'syndra_q':
        this.castSyndraQ(targetPoint);
        return true;

      case 'syndra_w':
        this.castSyndraW(targetPoint);
        return true;

      case 'syndra_e':
        this.castConeKnockback(dir, targets);
        return true;

      case 'syndra_r':
        this.castSyndraR(targetPoint, targets);
        return true;

      // 5. TANKS
      case 'malphite_q':
        this.castMeteorBoulder(dir, targets);
        return true;

      case 'malphite_w':
        this.castMalphiteW();
        return true;

      case 'malphite_e':
        this.castMalphiteE(targets);
        return true;

      case 'malphite_r':
        this.castMalphiteR(targetPoint, targets);
        return true;

      case 'naut_q':
      case 'nautilus_q':
        this.castAnchorHook(dir, targets);
        return true;

      case 'naut_w':
      case 'nautilus_w':
        const shieldAmt = this.getScaledDamage(250, 0, 0.8);
        this.player.heal(shieldAmt, this.vfx);
        this.vfx.spawnIceExplosion(this.player.mesh.position, 0x0284c7, 20);
        this.sounds.playHeal();
        return true;

      case 'nautilus_e':
        this.castNautilusE(targets);
        return true;

      case 'nautilus_r':
        this.castNautilusR(targetPoint, targets);
        return true;

      case 'chogath_q':
        this.castAoEZone(targetPoint, 4.0, this.getScaledDamage(140, 0, 1.0), 0x15803d);
        return true;

      case 'chogath_w':
        this.castChogathW(dir, targets);
        return true;

      case 'chogath_e':
        this.castChogathE(dir);
        return true;

      case 'chogath_r':
        this.castExecuteSlam(targetPoint, this.getScaledDamage(450, 0, 0.7) + Math.round(this.player.maxHp * 0.1), targets);
        this.player.maxHp += 120;
        this.player.heal(200, this.vfx);
        return true;

      // 6. FIGHTERS
      case 'yasuo_q':
        this.castYasuoQ(dir, targets);
        return true;

      case 'yasuo_w':
        this.castWindWall(dir);
        return true;

      case 'yasuo_e':
        this.castYasuoE(targetPoint, targets);
        return true;

      case 'yasuo_r':
        this.castYasuoR(targetPoint, targets);
        return true;

      case 'darius_q':
        this.castAxeDecimate(targets);
        return true;

      case 'darius_w':
        this.castDariusW(targets);
        return true;

      case 'darius_e':
        this.castDariusE(dir, targets);
        return true;

      case 'darius_r':
        this.castDariusR(targetPoint, targets);
        return true;
        this.castConeKnockback(dir, targets, true);
        return true;

      default:
        // Generic fallback skillshot (scale theo AD + AP)
        this.castProjectile({
          dir,
          speed: 35,
          range: 28,
          damage: this.getScaledDamage(120, 0.8, 0.6),
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          scale: 0.5
        });
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
      damage: this.getScaledDamage(450, 1.4, 1.0),
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
      damage: this.getScaledDamage(500, 1.6, 0),
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
      damage: this.getScaledDamage(400, 0.5, 1.0),
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
      damage: this.getScaledDamage(140, 0, 0.65),
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
    this.castLaserBeam(dir, 35, this.getScaledDamage(150, 1.6, 0), targets, 0x38bdf8);
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
      damage: this.getScaledDamage(130, 1.3, 0.25),
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
      damage: this.getScaledDamage(130, 1.2, 0),
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
      this.castProjectile({ dir, speed: 34, range: 24, damage: this.getScaledDamage(60, 0.4, 0), color: 0x38bdf8, emissive: 0x38bdf8, scale: 0.35 });
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
      damage: this.getScaledDamage(120, 1.4, 0),
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
      damage: this.getScaledDamage(110, 0, 0.65),
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

    const damage = this.getScaledDamage(400, 0, 0.9);
    for (const t of targets) {
      if (t.isDead) continue;
      if (targetLanding.distanceTo(t.mesh.position) <= 5.5) {
        t.takeDamage(damage, this.vfx);
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
    const damage = this.getScaledDamage(55, 0.35, 0.3);
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const d = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      this.castProjectile({ dir: d, speed: 30, range: 10, damage, color: 0xef4444, emissive: 0xef4444, scale: 0.3 });
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

    const baseDmg = this.getScaledDamage(140, 1.4, 0);
    for (const t of targets) {
      if (t.isDead) continue;
      const d = center.distanceTo(t.mesh.position);
      if (d <= 5.5) {
        const dmg = d >= 2.5 ? Math.round(baseDmg * 1.5) : Math.round(baseDmg * 0.7); // Outer ring blade bonus
        t.takeDamage(dmg, this.vfx);
      }
    }
  }

  // Cone Knockback (Syndra E, Darius E)
  castConeKnockback(dir, targets, pull = false) {
    const origin = this.player.mesh.position;
    this.sounds.playHit();
    const damage = this.getScaledDamage(120, 0.8, 0.65);
    for (const t of targets) {
      if (t.isDead) continue;
      const toT = new THREE.Vector3().subVectors(t.mesh.position, origin);
      const dist = toT.length();
      if (dist <= 12.0 && toT.normalize().dot(dir) > 0.6) {
        t.takeDamage(damage, this.vfx);
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

    // 2b. Champion Buffs & Stacks Timers
    if (this.yasuoQTimer > 0) {
      this.yasuoQTimer -= delta;
      if (this.yasuoQTimer <= 0) {
        this.yasuoQStacks = 0;
      }
    }
    if (this.zedShadowTimer > 0) {
      this.zedShadowTimer -= delta;
      if (this.zedShadowTimer <= 0 && this.zedShadow) {
        this.scene.remove(this.zedShadow);
        this.zedShadow = null;
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

      // Check collision with Windwalls (Tường Gió Yasuo chặn đường đạn)
      let blockedByWall = false;
      for (const wall of this.windWalls) {
        if (p.mesh.position.distanceTo(wall.mesh.position) < 4.2) {
          blockedByWall = true;
          this.vfx.spawnIceExplosion(p.mesh.position, 0x38bdf8, 14);
          break;
        }
      }
      if (blockedByWall) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with targets
      let hit = false;
      for (const target of targets) {
        if (target.isDead) continue;
        const targetPos = target.mesh ? target.mesh.position : (target.group ? target.group.position : null);
        if (!targetPos) continue;

        const d = p.mesh.position.distanceTo(targetPos.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (d < p.radius + 0.8) {
          const totalDmg = p.damage;
          target.takeDamage(totalDmg, this.vfx);
          this.vfx.spawnIceExplosion(p.mesh.position, p.color || 0x38bdf8, 16);
          this.sounds.playHit();

          // Hất tung trên không nếu là chiêu hất tung (Lốc Xoáy Yasuo Q3)
          if (p.knockup && target.mesh) {
            target.mesh.position.y += 2.8;
            setTimeout(() => { if (target.mesh) target.mesh.position.y = 0; }, 1000);
          }

          // Hiệu ứng Mê Hoặc (Ahri E)
          if (p.charm) {
            this.vfx.spawnDamageNumber('💘 MÊ HOẶC!', targetPos, 'heal');
          }

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
              const otherPos = other.mesh ? other.mesh.position : (other.group ? other.group.position : null);
              if (other !== target && !other.isDead && otherPos && p.mesh.position.distanceTo(otherPos) <= p.aoeRadius) {
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

  // ==========================================
  // CÁC CHIÊU THỨC CHUẨN LMHT (COMMUNITYDRAGON)
  // ==========================================

  // Yasuo Q: Bão Kiếm (Steel Tempest - Đâm kiếm Q1/Q2 & Phóng Lốc Xoáy Hất Tung Q3)
  castYasuoQ(dir, targets) {
    if (this.yasuoQStacks === 2) {
      // Q3: LỐC XOÁY HẤT TUNG
      this.yasuoQStacks = 0;
      this.yasuoQTimer = 0;
      this.castTornado(dir);
      this.vfx.spawnDamageNumber('🌪️ LỐC XOÁY BÃO KIẾM!', this.player.mesh.position, 'crit');
    } else {
      // Q1 & Q2: ĐÂM KIẾM THẲNG XUYÊN THẤU
      this.castYasuoThrust(dir, targets);
    }
  }

  castYasuoThrust(dir, targets) {
    const pPos = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const range = 13.0;
    const damage = this.getScaledDamage(100, 1.05, 0);

    // Đường kiếm khí đâm thẳng chớp nhoáng
    const thrustGeo = new THREE.CylinderGeometry(0.12, 0.28, range, 8);
    thrustGeo.rotateX(Math.PI / 2);
    const thrustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 });
    const thrustMesh = new THREE.Mesh(thrustGeo, thrustMat);
    thrustMesh.position.copy(pPos).addScaledVector(dir, range / 2);
    thrustMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(thrustMesh);
    setTimeout(() => this.scene.remove(thrustMesh), 120);

    this.sounds.playHit();
    this.vfx.spawnIceExplosion(pPos.clone().addScaledVector(dir, range * 0.4), 0x38bdf8, 12);

    let hitAny = false;
    for (const t of targets) {
      if (t.isDead) continue;
      const tPos = t.mesh ? t.mesh.position : (t.group ? t.group.position : null);
      if (!tPos) continue;
      const toT = new THREE.Vector3().subVectors(tPos, pPos);
      const proj = toT.dot(dir);
      if (proj > 0 && proj <= range) {
        const perp = toT.clone().subScaledVector(dir, proj).length();
        if (perp <= 2.2) {
          t.takeDamage(damage, this.vfx);
          this.vfx.spawnIceExplosion(tPos, 0x38bdf8, 14);
          hitAny = true;
        }
      }
    }

    if (hitAny) {
      this.yasuoQStacks = Math.min(2, this.yasuoQStacks + 1);
      this.yasuoQTimer = 6.0;
      if (this.yasuoQStacks === 2) {
        this.vfx.spawnDamageNumber('🌪️ LỐC XOÁY SẴN SÀNG! (Q3)', this.player.mesh.position, 'crit');
      } else {
        this.vfx.spawnDamageNumber('⚔️ TỤ BÃO (CỘNG DỒN 1)', this.player.mesh.position, 'heal');
      }
    }
  }

  // Yasuo E: Quét Kiếm (Dash xuyên mục tiêu chém kiếm)
  castYasuoE(targetPoint, targets) {
    const pPos = this.player.mesh.position;
    let dashTarget = null;
    let minDist = 9.0;
    for (const t of targets) {
      if (t.isDead) continue;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(targetPoint) < minDist) {
        minDist = tPos.distanceTo(targetPoint);
        dashTarget = t;
      }
    }

    const dir = new THREE.Vector3().subVectors(targetPoint, pPos);
    dir.y = 0;
    dir.normalize();

    let dest = null;
    const damage = this.getScaledDamage(90, 0.6, 0.6);

    if (dashTarget) {
      const tPos = dashTarget.mesh ? dashTarget.mesh.position : dashTarget.group.position;
      const toTarget = new THREE.Vector3().subVectors(tPos, pPos).normalize();
      // Dash xuyên qua kẻ địch và xuất hiện phía sau
      dest = tPos.clone().addScaledVector(toTarget, 1.8);
      dashTarget.takeDamage(damage, this.vfx);
      this.sounds.playHit();
    } else {
      const dist = Math.min(8.0, new THREE.Vector3().subVectors(targetPoint, pPos).length());
      dest = pPos.clone().addScaledVector(dir, Math.max(5.0, dist));
    }

    dest.x = Math.max(-11, Math.min(11, dest.x));
    dest.z = Math.max(-115, Math.min(115, dest.z));

    this.player.mesh.position.copy(dest);
    this.player.targetPos = null;
    this.vfx.spawnIceExplosion(pPos, 0x38bdf8, 14);
    this.vfx.spawnIceExplosion(dest, 0x67e8f9, 18);
    this.sounds.playDash();
  }

  // Yasuo R: Trăn Trối (Last Breath)
  castYasuoR(targetPoint, targets) {
    let bestTarget = null;
    let bestDist = 20.0;
    // Ưu tiên kẻ địch đang bị hất tung trên không hoặc gần con trỏ
    for (const t of targets) {
      if (t.isDead) continue;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (!tPos) continue;
      const d = this.player.mesh.position.distanceTo(tPos);
      if (d <= 20.0) {
        if (t.mesh && t.mesh.position.y > 1.0) {
          bestTarget = t;
          break;
        }
        if (d < bestDist) {
          bestDist = d;
          bestTarget = t;
        }
      }
    }

    if (!bestTarget) {
      this.vfx.spawnDamageNumber('CẦN MỤC TIÊU TRONG TẦM CHIÊU!', this.player.mesh.position, 'heal');
      return;
    }

    const tPos = bestTarget.mesh ? bestTarget.mesh.position : bestTarget.group.position;
    this.player.mesh.position.copy(tPos.clone().add(new THREE.Vector3(0, 0, 1.5)));
    this.player.targetPos = null;

    if (bestTarget.mesh) {
      bestTarget.mesh.position.y = 2.5;
      setTimeout(() => { if (bestTarget.mesh) bestTarget.mesh.position.y = 0; }, 900);
    }

    this.sounds.playUlt();
    const damage = this.getScaledDamage(380, 1.6, 0);

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.vfx.spawnIceExplosion(tPos, 0x38bdf8, 20);
        this.sounds.playHit();
      }, i * 150);
    }

    setTimeout(() => {
      bestTarget.takeDamage(damage, this.vfx);
      this.vfx.spawnIceExplosion(tPos, 0x0284c7, 35);
      this.vfx.spawnDamageNumber(`TRĂN TRỐI! -${damage}`, tPos, 'crit');
    }, 500);
  }

  // Jinx Q: Tráo Hàng! (Chuyển đổi Bằng Chíu & Xương Cá)
  castJinxQ(dir) {
    this.jinxRocketMode = !this.jinxRocketMode;
    if (this.jinxRocketMode) {
      this.player.rangeLol = 675;
      this.player.range = +(675 * (20 / 775)).toFixed(2);
      this.player.updateRangeRing();
      this.vfx.spawnDamageNumber('🚀 XƯƠNG CÁ (SÚNG PHÓNG LỰU)! TẦM 675', this.player.mesh.position, 'crit');
    } else {
      this.player.rangeLol = 525;
      this.player.range = +(525 * (20 / 775)).toFixed(2);
      this.player.updateRangeRing();
      this.vfx.spawnDamageNumber('⚡ BẰNG CHÍU (SÚNG SÁU NÒNG)! TẦM 525', this.player.mesh.position, 'heal');
    }

    // Đồng thời phóng 1 phát rocket về hướng chỉ định
    const damage = this.getScaledDamage(120, 1.3, 0);
    this.castProjectile({
      dir,
      speed: 36,
      range: 32,
      damage,
      color: 0xf472b6,
      emissive: 0xf43f5e,
      scale: 0.65,
      aoeRadius: 4.5,
      pierce: 1
    });
    this.sounds.playCastQ();
  }

  // Jinx E: Lựu Đạn Ma Hỏa (3 quả bẫy nổ trói chân)
  castJinxE(targetPoint) {
    const damage = this.getScaledDamage(130, 0, 1.0);
    for (let i = -1; i <= 1; i++) {
      const offset = new THREE.Vector3(i * 1.5, 0, 0);
      const pos = targetPoint.clone().add(offset);
      this.castAoEZone(pos, 2.2, damage, 0xf43f5e);
    }
  }

  // Zed W: Phân Thân Bóng Tối (Living Shadow & Hoán Đổi Vị Trí)
  castZedW(targetPoint, targets) {
    if (this.zedShadow && this.zedShadowTimer > 0) {
      // Tái kích hoạt: Hoán đổi vị trí với bóng
      const oldPos = this.player.mesh.position.clone();
      const shadowPos = this.zedShadow.position.clone();
      this.player.mesh.position.copy(shadowPos);
      this.player.targetPos = null;

      this.scene.remove(this.zedShadow);
      this.zedShadow = null;
      this.zedShadowTimer = 0;

      this.vfx.spawnIceExplosion(oldPos, 0x9333ea, 20);
      this.vfx.spawnIceExplosion(shadowPos, 0xc084fc, 25);
      this.sounds.playDash();
      this.vfx.spawnDamageNumber('HOÁN ĐỔI BÓNG TỐI!', this.player.mesh.position, 'crit');
      return;
    }

    // Thả phân thân bóng tối về điểm chỉ định
    const pPos = this.player.mesh.position;
    const toTarget = new THREE.Vector3().subVectors(targetPoint, pPos);
    toTarget.y = 0;
    const dist = Math.min(12.0, toTarget.length());
    const dir = toTarget.clone().normalize();
    const shadowPos = pPos.clone().addScaledVector(dir, dist);

    const shadowGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.0, 8);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x581c87, transparent: true, opacity: 0.75 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(shadowPos.x, 1.0, shadowPos.z);
    this.scene.add(shadow);

    this.zedShadow = shadow;
    this.zedShadowTimer = 5.0;
    this.vfx.spawnIceExplosion(shadowPos, 0x9333ea, 18);
    this.sounds.playDash();
    this.vfx.spawnDamageNumber('PHÂN THÂN XUẤT HIỆN! (Nhấn W đổi chỗ)', this.player.mesh.position, 'heal');
  }

  // Zed R: Dấu Ấn Tử Thần (Death Mark)
  castZedR(targetPoint, targets) {
    let target = null;
    let minDist = 15.0;
    for (const t of targets) {
      if (t.isDead) continue;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(targetPoint) < minDist) {
        minDist = tPos.distanceTo(targetPoint);
        target = t;
      }
    }

    if (!target) {
      this.castExecuteSlam(targetPoint, this.getScaledDamage(350, 1.8, 0), targets);
      return;
    }

    const tPos = target.mesh ? target.mesh.position : target.group.position;
    const oldPos = this.player.mesh.position.clone();

    // Để lại bóng tại vị trí xuất phát
    const shadowGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.0, 8);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x581c87, transparent: true, opacity: 0.75 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(oldPos.x, 1.0, oldPos.z);
    this.scene.add(shadow);
    this.zedShadow = shadow;
    this.zedShadowTimer = 6.0;

    // Lướt ra sau lưng mục tiêu
    this.player.mesh.position.copy(tPos.clone().add(new THREE.Vector3(0, 0, 1.5)));
    this.player.targetPos = null;

    this.sounds.playUlt();
    this.vfx.spawnIceExplosion(tPos, 0xef4444, 30);

    const damage = this.getScaledDamage(350, 1.6, 0);
    target.takeDamage(damage, this.vfx);
    this.vfx.spawnDamageNumber(`DẤU ẤN TỬ THẦN! -${damage}`, tPos, 'crit');
  }

  // Darius E: Bắt Giữ (Apprehend - Kéo kẻ địch về phía Darius)
  castDariusE(dir, targets) {
    this.sounds.playHit();
    const damage = this.getScaledDamage(90, 0.6, 0);
    const pPos = this.player.mesh.position;
    let hooked = false;

    targets.forEach(t => {
      if (t.isDead) return;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (!tPos) return;
      const toT = new THREE.Vector3().subVectors(tPos, pPos);
      const dist = toT.length();
      if (dist <= 11.0 && toT.normalize().dot(dir) > 0.5) {
        t.takeDamage(damage, this.vfx);
        // Kéo mục tiêu về cự ly cận chiến của Darius
        if (t.mesh) {
          t.mesh.position.copy(pPos.clone().addScaledVector(dir, 2.2));
        }
        this.vfx.spawnIceExplosion(tPos, 0xdc2626, 18);
        hooked = true;
      }
    });

    if (hooked) {
      this.vfx.spawnDamageNumber('BẮT GIỮ!', this.player.mesh.position, 'crit');
    }
  }

  // Darius R: Máy Chém Noxus (Noxian Guillotine - Sát thương chuẩn kết liễu)
  castDariusR(targetPoint, targets) {
    let target = null;
    let minDist = 12.0;
    for (const t of targets) {
      if (t.isDead) continue;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(targetPoint) < minDist) {
        minDist = tPos.distanceTo(targetPoint);
        target = t;
      }
    }

    if (!target) {
      this.castExecuteSlam(targetPoint, this.getScaledDamage(380, 1.6, 0), targets);
      return;
    }

    const tPos = target.mesh ? target.mesh.position : target.group.position;
    this.player.mesh.position.copy(tPos.clone().add(new THREE.Vector3(0, 0, 1.4)));
    this.player.targetPos = null;

    this.sounds.playUlt();
    const trueDamage = this.getScaledDamage(420, 1.8, 0);

    // Bỏ qua giáp (True Damage): gây sát thương trực tiếp
    target.hp = Math.max(0, target.hp - trueDamage);
    if (target.healthBar) target.healthBar.updateBar(target.hp, target.maxHp);
    this.vfx.spawnIceExplosion(tPos, 0xdc2626, 40);
    this.vfx.spawnDamageNumber(`SÁT THƯƠNG CHUẨN! -${trueDamage}`, tPos, 'crit');

    if (target.hp <= 0 && target.die) {
      target.die(this.vfx);
      this.cooldowns.R = 0; // Hồi lại chiêu khi kết liễu mục tiêu thành công!
      this.vfx.spawnDamageNumber('HỒI CHIÊU MÁY CHÉM NOXUS!', this.player.mesh.position, 'heal');
    }
  }

  // Akali R: Sát Chiêu Hoàn Hảo (Perfect Execution - Lướt chém xuyên mục tiêu)
  castAkaliR(targetPoint, targets) {
    const pPos = this.player.mesh.position;
    const dir = new THREE.Vector3().subVectors(targetPoint, pPos);
    dir.y = 0;
    dir.normalize();

    const dest = pPos.clone().addScaledVector(dir, 14.0);
    dest.x = Math.max(-11, Math.min(11, dest.x));
    dest.z = Math.max(-115, Math.min(115, dest.z));

    this.player.mesh.position.copy(dest);
    this.player.targetPos = null;

    this.sounds.playUlt();
    this.vfx.spawnIceExplosion(pPos, 0x10b981, 20);
    this.vfx.spawnIceExplosion(dest, 0x059669, 25);

    const damage = this.getScaledDamage(350, 1.2, 1.0);
    targets.forEach(t => {
      if (t.isDead) return;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(dest) <= 5.5) {
        t.takeDamage(damage, this.vfx);
        this.vfx.spawnIceExplosion(tPos, 0x10b981, 15);
      }
    });
  }

  // Ahri E: Hôn Gió (Charm - Bắn trái tim pha lê hồng)
  castAhriE(dir) {
    const damage = this.getScaledDamage(120, 0, 0.7);
    this.castProjectile({
      dir,
      speed: 30,
      range: 28,
      damage,
      color: 0xf472b6,
      emissive: 0xf472b6,
      scale: 0.6,
      charm: true
    });
    this.sounds.playCastQ();
  }

  // Ashe Q: Chú Tâm Tiễn (Bắn loạt 5 mũi tên băng liên hoàn)
  castAsheQ(dir) {
    const damage = this.getScaledDamage(45, 0.35, 0);
    for (let i = -2; i <= 2; i++) {
      setTimeout(() => {
        const spread = i * 0.05;
        const shootDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
        this.castProjectile({
          dir: shootDir,
          speed: 36,
          range: 28,
          damage,
          color: 0x67e8f9,
          emissive: 0x38bdf8,
          scale: 0.4
        });
        this.sounds.playCastQ();
      }, (i + 2) * 50);
    }
  }

  // Ashe E: Ưng Tiễn (Chim ưng do thám)
  castAsheE(dir) {
    this.castProjectile({
      dir,
      speed: 40,
      range: 180,
      damage: 10,
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      scale: 0.8,
      pierce: 99
    });
    this.sounds.playUlt();
  }

  // Darius W: Đánh Thọt (Cường hóa chém rìu làm chậm 90%)
  castDariusW(targets) {
    const damage = this.getScaledDamage(120, 1.5, 0);
    let hit = false;
    targets.forEach(t => {
      if (t.isDead) return;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(this.player.mesh.position) <= 4.2) {
        t.takeDamage(damage, this.vfx);
        this.vfx.spawnIceExplosion(tPos, 0xdc2626, 15);
        hit = true;
      }
    });
    this.sounds.playHit();
    if (hit) this.vfx.spawnDamageNumber('LÀM CHẬM 90%!', this.player.mesh.position, 'crit');
  }

  // Zed E: Đường Kiếm Bóng Tối (Xoay lưỡi kiếm bóng tối)
  castZedE(targets) {
    const damage = this.getScaledDamage(95, 1.0, 0);
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0x9333ea, 25);
    this.sounds.playHit();
    targets.forEach(t => {
      if (t.isDead) return;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(this.player.mesh.position) <= 4.5) {
        t.takeDamage(damage, this.vfx);
      }
    });
  }

  // Ezreal W: Tinh Hoa Tuôn Chảy
  castEzrealW(dir) {
    const damage = this.getScaledDamage(100, 0.6, 0.8);
    this.castProjectile({
      dir,
      speed: 32,
      range: 28,
      damage,
      color: 0xfacc15,
      emissive: 0xfde047,
      scale: 0.55,
      pierce: 1
    });
    this.sounds.playCastQ();
  }

  // Lux W: Lăng Kính Phòng Hộ (Tạo lớp khiên bảo hộ)
  castLuxW(dir) {
    const shield = this.getScaledDamage(200, 0, 0.75);
    this.player.heal(shield, this.vfx);
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0xfef08a, 20);
    this.sounds.playHeal();
  }

  // Ahri W: Lửa Hồ Ly (3 ngọn lửa tự nhắm địch)
  castAhriW(targets) {
    const damage = this.getScaledDamage(65, 0, 0.35);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        let nearest = null;
        let minDist = 16.0;
        targets.forEach(t => {
          if (t.isDead) return;
          const pos = t.mesh ? t.mesh.position : t.group?.position;
          if (pos) {
            const d = pos.distanceTo(this.player.mesh.position);
            if (d < minDist) { minDist = d; nearest = t; }
          }
        });
        if (nearest) {
          const tPos = nearest.mesh ? nearest.mesh.position : nearest.group.position;
          const d = new THREE.Vector3().subVectors(tPos, this.player.mesh.position).normalize();
          this.castProjectile({
            dir: d,
            speed: 32,
            range: 20,
            damage,
            color: 0x38bdf8,
            emissive: 0x67e8f9,
            scale: 0.35
          });
          this.sounds.playCastQ();
        }
      }, i * 120);
    }
  }

  // Ahri R: Phi Hồ (Lướt nhanh)
  castAhriR(targetPoint, targets) {
    const damage = this.getScaledDamage(180, 0, 0.6);
    this.castBlink(targetPoint, 8.5, damage, targets);
  }

  // Malphite W: Nắm Đấm Chấn Động
  castMalphiteW() {
    this.player.armor += 30;
    this.vfx.spawnDamageNumber('+30 GIÁP!', this.player.mesh.position, 'heal');
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0xca8a04, 15);
    this.sounds.playHeal();
    setTimeout(() => {
      this.player.armor = Math.max(28, this.player.armor - 30);
    }, 6000);
  }

  // Malphite E: Dậm Đất (Đập tay địa chấn)
  castMalphiteE(targets) {
    const damage = this.getScaledDamage(120, 0, 0.6) + Math.round(this.player.armor * 0.4);
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0x78716c, 25);
    this.sounds.playHit();
    targets.forEach(t => {
      if (t.isDead) return;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(this.player.mesh.position) <= 5.0) {
        t.takeDamage(damage, this.vfx);
      }
    });
  }

  // Nautilus E: Thủy Triều Dữ Dội (Sóng nước lan tỏa)
  castNautilusE(targets) {
    const damage = this.getScaledDamage(130, 0, 0.7);
    this.vfx.spawnIceExplosion(this.player.mesh.position, 0x0284c7, 30);
    this.sounds.playHit();
    targets.forEach(t => {
      if (t.isDead) return;
      const tPos = t.mesh ? t.mesh.position : t.group?.position;
      if (tPos && tPos.distanceTo(this.player.mesh.position) <= 5.5) {
        t.takeDamage(damage, this.vfx);
      }
    });
  }

  // Nautilus R: Thủy Lôi Tầm Nhiệt
  castNautilusR(targetPoint, targets) {
    this.castExecuteSlam(targetPoint, this.getScaledDamage(450, 0, 0.9), targets);
  }

  // Cho'Gath W: Tiếng Gầm Hoang Dã (Sóng âm hình nón)
  castChogathW(dir, targets) {
    this.castConeKnockback(dir, targets);
  }

  // Cho'Gath E: Phóng Gai
  castChogathE(dir) {
    const damage = this.getScaledDamage(80, 0.4, 0.4);
    this.castProjectile({
      dir,
      speed: 32,
      range: 22,
      damage,
      color: 0x15803d,
      emissive: 0x4ade80,
      scale: 0.5,
      pierce: 3
    });
    this.sounds.playCastQ();
  }

  // Katarina Q: Phi Dao (Ném dao găm)
  castKatarinaQ(dir, targets) {
    const damage = this.getScaledDamage(100, 0, 0.65);
    this.castProjectile({
      dir,
      speed: 34,
      range: 24,
      damage,
      color: 0xef4444,
      emissive: 0xf87171,
      scale: 0.4,
      pierce: 3
    });
    this.sounds.playCastQ();
  }

  // Katarina W: Tung Hứng (Tăng tốc chạy)
  castKatarinaW() {
    this.player.speed += 4.0;
    this.vfx.spawnDamageNumber('+TỐC ĐỘ CHẠY!', this.player.mesh.position, 'heal');
    this.sounds.playMove();
    setTimeout(() => {
      this.player.speed = Math.max(13.0, this.player.speed - 4.0);
    }, 3000);
  }

  // Akali Q: Phi Đao Năm Cánh
  castAkaliQ(dir) {
    const damage = this.getScaledDamage(110, 0.7, 0.6);
    for (let i = -2; i <= 2; i++) {
      const spread = i * 0.12;
      const shootDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
      this.castProjectile({
        dir: shootDir,
        speed: 32,
        range: 16,
        damage,
        color: 0x10b981,
        emissive: 0x34d399,
        scale: 0.35
      });
    }
    this.sounds.playCastQ();
  }

  // Akali W: Bom Khói
  castAkaliW(targetPoint) {
    this.castAoEZone(targetPoint, 4.5, 50, 0x064e3b);
    this.vfx.spawnDamageNumber('BOM KHÓI TÀNG HÌNH!', this.player.mesh.position, 'heal');
  }

  // Syndra Q: Quả Cầu Bóng Tối
  castSyndraQ(targetPoint) {
    const damage = this.getScaledDamage(120, 0, 0.75);
    this.castAoEZone(targetPoint, 3.5, damage, 0x7c3aed);
  }

  // Syndra W: Ý Lực
  castSyndraW(targetPoint) {
    const damage = this.getScaledDamage(140, 0, 0.85);
    this.castAoEZone(targetPoint, 4.0, damage, 0x6d28d9);
  }

  // Syndra R: Bùng Nổ Sức Mạnh (Bão cầu ma thuật)
  castSyndraR(targetPoint, targets) {
    this.castExecuteSlam(targetPoint, this.getScaledDamage(550, 0, 1.2), targets);
  }
}
