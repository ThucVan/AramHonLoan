
async function searchRepos() {
  const queries = [
    'league of legends gltf',
    'league of legends threejs',
    'teemo model viewer',
    'league model viewer',
    'sketchfab league of legends',
    'lol 3d model gltf'
  ];
  for (const q of queries) {
    try {
      const res = await fetch('https://api.github.com/search/repositories?q=' + encodeURIComponent(q), {
        headers: { 'User-Agent': 'node-fetch' }
      });
      const data = await res.json();
      console.log('Query:', q, 'count:', data.total_count);
      if (data.items && data.items.length > 0) {
        for (const item of data.items.slice(0, 3)) {
          console.log('  ->', item.full_name);
        }
      }
    } catch(e) {}
  }
}
searchRepos();
