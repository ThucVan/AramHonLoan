
async function check() {
  const models = [
    { alias: 'tft9_heimerdingerturret', id: '0' },
    { alias: 'tft14_summon_turret', id: '0' },
    { alias: 'tft17_pve_minion', id: '0' },
    { alias: 'tft7_nexusminion', id: '0' },
    { alias: 'ha_ap_healthrelic', id: '0' },
    { alias: 'ha_ap_poro_small', id: '0' },
    { alias: 'tft4_npc_nexus', id: '0' },
    { alias: 'tft12_zaptower', id: '0' },
    { alias: 'strawberry_poi_mapb_turret', id: '0' }
  ];

  for (const m of models) {
    const url = 'https://cdn.modelviewer.lol/extras/models/' + m.alias + '/' + m.id + '/model.glb';
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(m.alias, res.status, res.headers.get('content-length'), 'bytes');
    } catch(e) {
      console.error(m.alias, e.message);
    }
  }
}
check();
