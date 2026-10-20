
async function check() {
  const res = await fetch('https://raw.githubusercontent.com/Xiaochr/LOLCodexPet/main/examples/Gwen/source/source-manifest.json');
  const text = await res.text();
  console.log(text.slice(0, 1000));
}
check();
