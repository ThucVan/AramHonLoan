import fs from 'fs';

function inspectGltf(path) {
  const buf = fs.readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr);
  console.log(`=== ${path} ===`);
  console.log('Nodes:', gltf.nodes.map(n => n.name));
  if (gltf.materials) {
    console.log('Materials:', gltf.materials.map(m => m.name));
  }
}

inspectGltf('public/models/inhibitor_order.glb');
