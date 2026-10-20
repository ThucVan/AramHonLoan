
async function search() {
  const queries = [
    'https://api.github.com/search/code?q=path:models+filename:gltf+league',
    'https://api.github.com/search/repositories?q=league+champions+glb',
    'https://api.github.com/search/repositories?q=leagueoflegends+assets+models',
    'https://api.github.com/search/repositories?q=lol-models+glb',
    'https://api.github.com/search/repositories?q=league-3d-models',
    'https://api.github.com/search/repositories?q=league+skin+viewer+gltf'
  ];

  for (const q of queries) {
    try {
      const res = await fetch(q, { headers: { 'User-Agent': 'node-fetch' } });
      const data = await res.json();
      console.log('Query:', q.split('?q=').pop(), 'Items:', data.items ? data.items.length : data.total_count);
      if (data.items) {
        data.items.slice(0, 4).forEach(i => console.log('  ->', i.full_name || i.path));
      }
    } catch(e) {
      console.error(e);
    }
  }
}
search();
