
import fs from 'fs';

const models = [
  { url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb', name: 'ninja_xbot.glb' },
  { url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb', name: 'spirit_fox.glb' }
];

async function run() {
  for (const m of models) {
    try {
      const res = await fetch(m.url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync('public/models/' + m.name, buf);
        console.log('Saved:', m.name, buf.length, 'bytes');
      }
    } catch(e) {
      console.error(e);
    }
  }
}
run();
