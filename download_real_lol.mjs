
import fs from 'fs';
import path from 'path';

const champs = [
  { name: 'yasuo', id: '157000', file: 'yasuo.glb' },
  { name: 'jinx', id: '222000', file: 'jinx.glb' },
  { name: 'zed', id: '238000', file: 'zed.glb' },
  { name: 'ashe', id: '22000', file: 'ashe.glb' },
  { name: 'darius', id: '122000', file: 'darius.glb' }
];

async function run() {
  for (const c of champs) {
    const url = 'https://cdn.modelviewer.lol/lol/models/' + c.name + '/' + c.id + '/model.glb';
    const dest = 'public/models/' + c.file;
    console.log('Downloading ' + c.name + ' from ' + url + '...');
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log('Saved ' + dest + ' (' + buf.length + ' bytes)');
      } else {
        console.error('Failed to download ' + c.name, res.status);
      }
    } catch(e) {
      console.error(c.name, e.message);
    }
  }
}
run();
