
async function search() {
  const repoRes = await fetch('https://api.github.com/search/repositories?q=threejs+moba+OR+rpg+glb', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await repoRes.json();
  if (data.items) {
    for (const item of data.items.slice(0, 8)) {
      console.log('REPO:', item.full_name);
    }
  }
}
search();
