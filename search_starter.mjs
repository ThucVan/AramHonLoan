
async function search() {
  const res = await fetch('https://api.github.com/search/repositories?q=starter-kit+kenney+glb', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  if (data.items) {
    data.items.slice(0, 6).forEach(i => console.log(i.full_name));
  }
}
search();
