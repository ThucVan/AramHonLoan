import * as THREE from 'three';
import { gltfLoader } from './champion.js';

// Centralized in-memory ArrayBuffer cache
// Parsing directly from cached ArrayBuffer ensures 100% pristine skeleton/rigging
// and completely avoids SkeletonUtils.clone multi-root SkinnedMesh breakage.
const bufferCache = new Map();
const bufferPromises = new Map();

export async function fetchBufferOnce(url) {
  if (bufferCache.has(url)) {
    return bufferCache.get(url);
  }
  if (bufferPromises.has(url)) {
    return bufferPromises.get(url);
  }

  const p = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      bufferCache.set(url, buf);
      return buf;
    })
    .catch((err) => {
      console.error(`[ModelCache] Lỗi tải buffer: ${url}`, err);
      return null;
    });

  bufferPromises.set(url, p);
  return p;
}

// Instantiate a clean, fully rigged 3D model from buffer (0ms network latency)
export function parseModel(url, onLoaded) {
  const buf = bufferCache.get(url);
  if (buf) {
    gltfLoader.parse(
      buf.slice(0),
      '',
      (gltf) => {
        onLoaded(gltf);
      },
      (err) => {
        console.error(`[ModelCache] Lỗi parse buffer: ${url}`, err);
        gltfLoader.load(url, onLoaded);
      }
    );
  } else {
    // Fallback to standard loader while preloading finishes
    gltfLoader.load(url, onLoaded);
  }
}

// ---------------------------------------------------------------------------
// PRELOAD THEO MỨC ƯU TIÊN (thay vì tải hết 12 model cùng lúc)
// ---------------------------------------------------------------------------
// Trước đây tải song song cả 12 file (~12MB) ngay khi vào game, làm chậm
// thời điểm chơi được. Giờ chia 2 đợt:
//   - Đợt 1 (bắt buộc): những gì XUẤT HIỆN NGAY khi vào trận
//   - Đợt 2 (nền): tải rảnh sau khi đã chơi được
// Model tướng KHÔNG preload ở đây — chỉ tải đúng tướng đang chơi.
// ---------------------------------------------------------------------------
const TIER1 = [
  '/models/minion_melee_order.glb',
  '/models/minion_melee_chaos.glb',
  '/models/minion_ranged_order.glb',
  '/models/minion_ranged_chaos.glb'
];

const TIER2 = [
  '/models/minion_super_order.glb',
  '/models/minion_super_chaos.glb',
  '/models/turret_order.glb',
  '/models/turret_chaos.glb',
  '/models/inhibitor_order.glb',
  '/models/inhibitor_chaos.glb',
  '/models/nexus_order.glb',
  '/models/nexus_chaos.glb'
];

export async function preloadAllModels() {
  // Đợt 1: phải có trước khi lính xuất hiện
  await Promise.all(TIER1.map(url => fetchBufferOnce(url)));
  console.log('✅ [ModelCache] Đợt 1 xong (lính cơ bản) — game sẵn sàng chơi.');

  // Đợt 2: tải nền, không chặn gameplay
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => loadTier2(), { timeout: 8000 });
  } else {
    setTimeout(loadTier2, 1200);
  }
}

function loadTier2() {
  Promise.all(TIER2.map(url => fetchBufferOnce(url)))
    .then(() => console.log('✅ [ModelCache] Đợt 2 xong (trụ/nhà/lính siêu cấp).'))
    .catch(() => {});
}

// Tải riêng model 1 tướng (chỉ khi cần) — tránh tải cả 14 tướng.
export function preloadChampionModel(url) {
  return fetchBufferOnce(url);
}
