
async function searchRepos() {
  const champions = ['yasuo', 'jinx', 'lux', 'zed', 'darius', 'ashe', 'garen', 'riven', 'thresh'];
  for (const c of champions) {
    try {
      const res = await fetch('https://api.github.com/search/repositories?q=' + c + '+glb', {
        headers: { 'User-Agent': 'node-fetch' }
      });
      const data = await res.json();
      console.log('Query:', c, 'count:', data.total_count);
      if (data.items && data.items.length > 0) {
        for (const item of data.items.slice(0, 3)) {
          console.log('  ->', item.full_name, item.html_url);
        }
      }
    } catch(e) {
      console.error(c, e.message);
    }
  }
}
searchRepos();
