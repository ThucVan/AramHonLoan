
async function check() {
  const res = await fetch('https://api.github.com/repos/Xiaochr/LOLCodexPet/contents', {
    headers: { 'User-Agent': 'node-fetch' }
  });
  const data = await res.json();
  console.log(data.map(d => d.name + ' (' + d.type + ')'));
}
check();
