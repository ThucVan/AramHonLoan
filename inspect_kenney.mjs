
async function inspect() {
  const res = await fetch('https://api.github.com/repos/Kenney-CCO/Kenney-CCO.glb/contents', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  if (Array.isArray(data)) {
    data.slice(0, 15).forEach(d => console.log(d.name, d.type));
  }
}
inspect();
