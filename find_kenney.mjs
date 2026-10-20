
async function searchKenney() {
  const res = await fetch('https://api.github.com/search/repositories?q=user:KenneyNL+gltf+OR+glb', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  if (data.items) {
    data.items.slice(0, 8).forEach(i => console.log(i.full_name, i.html_url));
  }
}
searchKenney();
