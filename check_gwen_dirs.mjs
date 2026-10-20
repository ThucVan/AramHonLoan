
async function check() {
  for (const d of ['package', 'source', 'showcase']) {
    const res = await fetch('https://api.github.com/repos/Xiaochr/LOLCodexPet/contents/examples/Gwen/' + d, {
      headers: { 'User-Agent': 'node-fetch' }
    });
    const data = await res.json();
    console.log(d, ':', data.map(item => item.name + ' (' + item.size + ')'));
  }
}
check();
