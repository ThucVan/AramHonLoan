
async function search() {
  const res = await fetch('https://api.github.com/search/repositories?q=kenney+weapon+OR+fantasy+glb', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  if (data.items) {
    data.items.slice(0, 8).forEach(i => console.log(i.full_name));
  }
}
search();
