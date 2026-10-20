
async function check() {
  for (const repo of ['skillman1337/moba-threejs', 'TenseiV/lol-game-threejs']) {
    console.log('=== Checking', repo, '===');
    try {
      const res = await fetch('https://api.github.com/repos/' + repo + '/contents', {
        headers: { 'User-Agent': 'node-fetch' }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        console.log(data.map(d => d.name + ' (' + d.type + ')'));
      } else {
        console.log(data);
      }
    } catch(e) {
      console.error(e);
    }
  }
}
check();
