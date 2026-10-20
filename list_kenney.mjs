
async function list() {
  const res = await fetch('https://api.github.com/repos/Kenney-CCO/Kenney-CCO.glb/contents', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  if (Array.isArray(data)) {
    const glbs = data.filter(d => d.name.endsWith('.glb')).map(d => d.name);
    console.log('Total GLBs:', glbs.length);
    console.log(glbs.join(', '));
  }
}
list();
