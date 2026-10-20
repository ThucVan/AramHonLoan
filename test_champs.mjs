
async function check() {
  const champs = [
    { name: 'yasuo', id: '157000' },
    { name: 'jinx', id: '222000' },
    { name: 'zed', id: '238000' },
    { name: 'ashe', id: '22000' },
    { name: 'ahri', id: '103000' },
    { name: 'darius', id: '122000' },
    { name: 'lux', id: '99000' },
    { name: 'garen', id: '86000' }
  ];

  for (const c of champs) {
    const url = 'https://cdn.modelviewer.lol/lol/models/' + c.name + '/' + c.id + '/model.glb';
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(c.name, res.status, res.headers.get('content-length'));
    } catch(e) {
      console.error(c.name, e.message);
    }
  }
}
check();
