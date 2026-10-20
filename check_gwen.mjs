
async function check() {
  const res = await fetch('https://api.github.com/repos/Xiaochr/LOLCodexPet/contents/examples/Gwen', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  console.log(data.map(d => ({ name: d.name, size: d.size, type: d.type })));
}
check();
