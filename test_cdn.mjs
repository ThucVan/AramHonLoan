
async function check() {
  const urls = [
    'https://cdn.modelviewer.lol/tft/models/petchibigwen/68001/model.glb',
    'https://cdn.modelviewer.lol/lol/models/yasuo/157000/model.glb',
    'https://cdn.modelviewer.lol/lol/models/yasuo/model.glb',
    'https://cdn.modelviewer.lol/lol/models/jinx/model.glb',
    'https://cdn.modelviewer.lol/lol/models/zed/model.glb'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      console.log(u, res.status, res.headers.get('content-length'));
    } catch(e) {
      console.log(u, e.message);
    }
  }
}
check();
