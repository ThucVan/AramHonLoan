import * as THREE from 'three';

// =============================================================================
// HỆ THỐNG VFX DÙNG TEXTURE THẬT CỦA RIOT
// =============================================================================
// Trước đây mọi chiêu thức được vẽ bằng hình học Three.js cơ bản
// (SphereGeometry, RingGeometry...) nên trông "tự chế", không giống LMHT.
//
// Module này nạp texture VFX chính thức lấy từ CommunityDragon:
//   assets/characters/<champ>/skins/base/particles/*.png
// và render chúng dưới dạng sprite/billboard + particle theo đúng kiểu Riot.
//
// Texture được nạp lười (lazy) và cache lại, nên chỉ tải khi thực sự dùng.
// =============================================================================

const VFX_ROOT = '/vfx';

// Cache THREE.Texture theo đường dẫn
const textureCache = new Map();
const loader = new THREE.TextureLoader();

/**
 * Nạp texture VFX của 1 tướng.
 * @param {string} champ  vd 'ahri'
 * @param {string} file   tên file, vd 'ahri_base_orb_fox_01.png'
 * @returns {THREE.Texture|null}
 */
export function loadVfxTexture(champ, file) {
  const path = `${VFX_ROOT}/${champ}/${file}`;
  if (textureCache.has(path)) return textureCache.get(path);

  const tex = loader.load(
    path,
    undefined,
    undefined,
    () => { /* 404 -> bỏ khỏi cache để không spam */ textureCache.set(path, null); }
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  textureCache.set(path, tex);
  return tex;
}

/**
 * Kiểm tra nhanh xem texture có tồn tại không (dùng để chọn fallback).
 */
export function hasVfxTexture(champ, file) {
  return textureCache.get(`${VFX_ROOT}/${champ}/${file}`) !== null;
}

/**
 * Tạo sprite billboard phát sáng từ texture VFX thật.
 * Đây là "viên đạn" chiêu thức nhìn giống Riot nhất.
 */
export function createVfxSprite(champ, file, opts = {}) {
  const tex = loadVfxTexture(champ, file);
  if (!tex) return null;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: opts.color ?? 0xffffff,
    transparent: true,
    opacity: opts.opacity ?? 1,
    blending: opts.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });

  const sprite = new THREE.Sprite(mat);
  const size = opts.size ?? 2.0;
  sprite.scale.set(size, size, 1);
  sprite.userData.isVfx = true;
  return sprite;
}

/**
 * Tạo cụm hạt (particle burst) dùng texture thật — dùng cho nổ/tan.
 * Trả về một Group chứa nhiều sprite nhỏ, tự huỷ sau `lifetime` giây.
 */
export function createVfxParticles(champ, files, opts = {}) {
  const group = new THREE.Group();
  group.userData.isVfx = true;
  group.userData.particles = [];

  const count = opts.count ?? 10;
  const spread = opts.spread ?? 2.5;
  const size = opts.size ?? 0.8;
  const lifetime = opts.lifetime ?? 0.7;
  const speed = opts.speed ?? 4;

  for (let i = 0; i < count; i++) {
    const file = files[i % files.length];
    const sprite = createVfxSprite(champ, file, { size, opacity: 1 });
    if (!sprite) continue;

    // Hướng ngẫu nhiên
    const a = Math.random() * Math.PI * 2;
    const el = (Math.random() - 0.5) * 1.2;
    const dir = new THREE.Vector3(Math.cos(a), el, Math.sin(a)).normalize();

    sprite.position.set(0, 0, 0);
    group.add(sprite);
    group.userData.particles.push({
      sprite,
      dir,
      speed: speed * (0.5 + Math.random()),
      life: lifetime,
      maxLife: lifetime
    });
  }
  return group;
}

/**
 * Cập nhật chuyển động hạt. Gọi mỗi frame từ game loop.
 * Trả về true khi cụm hạt đã chết (cần xoá khỏi scene).
 */
export function updateVfxParticles(group, dt) {
  const parts = group.userData.particles;
  if (!parts || parts.length === 0) return true;

  let alive = 0;
  for (const p of parts) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.sprite.visible = false;
      continue;
    }
    alive++;
    const t = p.life / p.maxLife;
    p.sprite.position.addScaledVector(p.dir, p.speed * dt);
    p.dir.y -= 2.0 * dt;              // trọng lực nhẹ
    p.sprite.material.opacity = t;
    const s = (p.sprite.scale.x) * (1 + dt * 0.6); // nở ra
    p.sprite.scale.set(s, s, 1);
  }
  return alive === 0;
}

/**
 * Hạ tầng vòng tròn dưới đất dùng texture thật (indicator chiêu).
 */
export function createVfxGroundRing(champ, file, radius, opts = {}) {
  const tex = loadVfxTexture(champ, file);
  if (!tex) return null;

  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: opts.opacity ?? 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.06;
  mesh.userData.isVfx = true;
  return mesh;
}

/** Giải phóng texture của 1 tướng khi không cần nữa */
export function disposeChampTextures(champ) {
  const prefix = `${VFX_ROOT}/${champ}/`;
  for (const [k, tex] of textureCache) {
    if (k.startsWith(prefix) && tex) tex.dispose();
    if (k.startsWith(prefix)) textureCache.delete(k);
  }
}
