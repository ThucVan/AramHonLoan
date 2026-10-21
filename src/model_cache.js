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

// Preload all 12 essential gameplay assets into RAM
export async function preloadAllModels() {
  const assets = [
    '/models/minion_melee_order.glb',
    '/models/minion_melee_chaos.glb',
    '/models/minion_ranged_order.glb',
    '/models/minion_ranged_chaos.glb',
    '/models/minion_super_order.glb',
    '/models/minion_super_chaos.glb',
    '/models/turret_order.glb',
    '/models/turret_chaos.glb',
    '/models/inhibitor_order.glb',
    '/models/inhibitor_chaos.glb',
    '/models/nexus_order.glb',
    '/models/nexus_chaos.glb'
  ];

  await Promise.all(assets.map(url => fetchBufferOnce(url)));
  console.log('✅ [ModelCache] Đã nạp sẵn toàn bộ 12 mô hình vào RAM (Buffer Cache).');
}
