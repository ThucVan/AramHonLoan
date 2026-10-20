
import fs from 'fs';

const assets = [
  { url: 'https://cdn.modelviewer.lol/extras/models/tft9_heimerdingerturret/0/model.glb', file: 'turret_league.glb' },
  { url: 'https://cdn.modelviewer.lol/extras/models/tft17_pve_minion/0/model.glb', file: 'minion_melee.glb' },
  { url: 'https://cdn.modelviewer.lol/extras/models/tft7_nexusminion/0/model.glb', file: 'minion_nexus.glb' },
  { url: 'https://cdn.modelviewer.lol/extras/models/ha_ap_poro_small/0/model.glb', file: 'poro.glb' },
  { url: 'https://cdn.modelviewer.lol/extras/models/tft4_npc_nexus/0/model.glb', file: 'nexus_crystal.glb' },
  { url: 'https://cdn.modelviewer.lol/extras/models/ha_ap_healthrelic/0/model.glb', file: 'health_relic.glb' }
];

async function run() {
  for (const a of assets) {
    const dest = 'public/models/' + a.file;
    console.log('Downloading ' + a.file + '...');
    try {
      const res = await fetch(a.url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log('Saved ' + dest + ' (' + buf.length + ' bytes)');
      } else {
        console.error('Failed to download ' + a.file, res.status);
      }
    } catch(e) {
      console.error(a.file, e.message);
    }
  }
}
run();
