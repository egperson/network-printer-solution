const fs = require('fs').promises;
const path = require('path');

async function rmDir(dir){
  try{ await fs.rm(dir, { recursive: true, force: true }) }catch(e){}
}

async function copyDir(src, dest){
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for(const entry of entries){
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if(entry.isDirectory()) await copyDir(srcPath, destPath);
    else await fs.copyFile(srcPath, destPath);
  }
}

async function main(){
  const root = path.resolve(__dirname, '..');
  const dist = path.join(root, 'dist');
  const publicDest = path.join(root, '..', 'public');
  try{
    const stat = await fs.stat(dist);
  }catch(e){
    console.error('Dist folder not found. Run `npm run build` first.');
    process.exit(1);
  }
  console.log('Cleaning destination', publicDest);
  await rmDir(publicDest);
  console.log('Copying', dist, '->', publicDest);
  await copyDir(dist, publicDest);
  console.log('Done copying dist to public.');
}

main().catch(e=>{ console.error(e); process.exit(1) })
