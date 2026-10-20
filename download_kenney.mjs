
import fs from 'fs';

const models = [
  'meteor_detailed.glb',
  'meteor.glb',
  'rock_crystalsLargeA.glb',
  'rock_crystals.glb',
  'rocket_baseA.glb',
  'rocket_topA.glb',
  'bear.glb',
  'blasterA.glb'
];

async function run() {
  for (const m of models) {
    const url = 'https://raw.githubusercontent.com/Kenney-CCO/Kenney-CCO.glb/master/' + m;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync('public/models/' + m, buf);
        console.log('Saved:', m, buf.length, 'bytes');
      } else {
        console.log('Fail:', m, res.status);
      }
    } catch(e) {
      console.error(e);
    }
  }
}
run();
