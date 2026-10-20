
async function probe() {
  const testPaths = [
    // Minions
    'lol/models/order_minion_melee/model.glb',
    'lol/models/order_minion_melee/1000/model.glb',
    'lol/models/minion/model.glb',
    'lol/models/minion/1000/model.glb',
    'lol/models/sru_order_minion_melee/model.glb',
    'lol/models/sru_chaos_minion_melee/model.glb',
    'lol/models/ha_order_minion_melee/model.glb',
    'lol/models/red_minion_melee/model.glb',
    'lol/models/blue_minion_melee/model.glb',
    'lol/models/melee_minion/model.glb',
    
    // Turrets & Structures
    'lol/models/turret/model.glb',
    'lol/models/turret/1000/model.glb',
    'lol/models/ha_order_turret/model.glb',
    'lol/models/ha_chaos_turret/model.glb',
    'lol/models/sru_orderturret/model.glb',
    'lol/models/sru_chaosturret/model.glb',
    'lol/models/order_turret/model.glb',
    'lol/models/chaos_turret/model.glb',
    'lol/models/tower/model.glb',
    'lol/models/nexus/model.glb',
    'lol/models/inhibitor/model.glb',
    
    // Skills / Props / Monsters
    'lol/models/poro/model.glb',
    'lol/models/poro/1000/model.glb',
    'lol/models/tibbers/model.glb',
    'lol/models/tibbers/1000/model.glb',
    'lol/models/daisy/model.glb',
    'lol/models/scuttleracer/model.glb',
    'lol/models/baron/model.glb',
    'lol/models/dragon/model.glb'
  ];

  for (const p of testPaths) {
    const url = 'https://cdn.modelviewer.lol/' + p;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 200) {
        console.log('FOUND:', url, res.headers.get('content-length'), 'bytes');
      }
    } catch(e) {}
  }
}
probe();
