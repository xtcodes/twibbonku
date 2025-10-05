/* ===== Global State ===== */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let modelImg = null;
let twibbonImg = null;
let twibbonFullRes = null;
let state = { scale:1, tx:0, ty:0 };
let isEditing = false;
let isLocked = false;

/* Resize canvas */
function resizeCanvas(){
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  draw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* Load default twibbon */
function loadDefaultTwibbon(){
  twibbonImg = new Image();
  twibbonImg.src = 'twibbon.png';
  twibbonFullRes = twibbonImg;
  twibbonImg.onload = ()=> draw();
}
loadDefaultTwibbon();

/* Draw */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(modelImg){
    ctx.save();
    ctx.translate(canvas.width/2 + state.tx, canvas.height/2 + state.ty);
    ctx.scale(state.scale,state.scale);
    ctx.drawImage(modelImg,-modelImg.width/2,-modelImg.height/2);
    ctx.restore();
  }
  if(twibbonImg && twibbonImg.naturalWidth>0){
    ctx.save();
    ctx.globalAlpha = (isEditing && !isLocked)?0.5:1.0;
    ctx.drawImage(twibbonImg,0,0,canvas.width,canvas.height);
    ctx.restore();
  }
}

/* ===== Gestures (drag/zoom) ===== */
let pointers = new Map();
let initialPinchDistance = 0;
let pinchStart = {scale:1, tx:0, ty:0};
function clientToCanvas(clientX, clientY){
  const rect = canvas.getBoundingClientRect();
  return { x:(clientX-rect.left)*canvas.width/rect.width, y:(clientY-rect.top)*canvas.height/rect.height };
}
function getDistance(p1,p2){ return Math.hypot(p2.x-p1.x, p2.y-p1.y); }
function getCenter(p1,p2){ return {x:(p1.x+p2.x)/2, y:(p1.y+p2.y)/2}; }

canvas.addEventListener("pointerdown", e=>{
  if(!modelImg || isLocked) return;
  isEditing = true; draw();
  pointers.set(e.pointerId, clientToCanvas(e.clientX,e.clientY));
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", e=>{
  if(!modelImg || isLocked || !pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const pt = clientToCanvas(e.clientX,e.clientY);
  pointers.set(e.pointerId, pt);
  if(pointers.size===1){
    state.tx += pt.x-prev.x; state.ty += pt.y-prev.y; draw();
  } else if(pointers.size===2){
    const [p1,p2] = Array.from(pointers.values());
    const dist = getDistance(p1,p2); const center = getCenter(p1,p2);
    if(initialPinchDistance===0){ initialPinchDistance=dist; pinchStart={...state}; }
    const factor = dist/initialPinchDistance;
    let newScale = pinchStart.scale*factor;
    const minScale = Math.min(canvas.width/modelImg.width, canvas.height/modelImg.height)*0.25;
    const maxScale = 8;
    newScale = Math.max(minScale, Math.min(maxScale,newScale));
    const ratio = newScale/state.scale;
    const cx=canvas.width/2, cy=canvas.height/2;
    const px=center.x-cx, py=center.y-cy;
    state.tx = state.tx*ratio + px*(1-ratio);
    state.ty = state.ty*ratio + py*(1-ratio);
    state.scale=newScale; draw();
  }
});
canvas.addEventListener("pointerup", e=>{
  pointers.delete(e.pointerId);
  if(pointers.size<2) initialPinchDistance=0;
  if(pointers.size===0){ isEditing=false; draw(); }
  canvas.releasePointerCapture(e.pointerId);
});
canvas.addEventListener("pointercancel", e=>{
  pointers.delete(e.pointerId);
  if(pointers.size<2) initialPinchDistance=0;
  if(pointers.size===0){ isEditing=false; draw(); }
});
canvas.addEventListener("wheel", e=>{
  if(!modelImg || isLocked) return;
  e.preventDefault(); isEditing=true; draw();
  const rect=canvas.getBoundingClientRect();
  const p={x:(e.clientX-rect.left)*canvas.width/rect.width, y:(e.clientY-rect.top)*canvas.height/rect.height};
  const px=p.x-canvas.width/2, py=p.y-canvas.height/2;
  const factor=e.deltaY<0?1.12:0.88;
  let newScale=state.scale*factor;
  const minScale=Math.min(canvas.width/modelImg.width,canvas.height/modelImg.height)*0.25;
  const maxScale=8; newScale=Math.max(minScale, Math.min(maxScale,newScale));
  const ratio=newScale/state.scale;
  state.tx = state.tx*ratio + px*(1-ratio); state.ty = state.ty*ratio + py*(1-ratio); state.scale=newScale;
  draw();
  clearTimeout(canvas._wheelTimeout);
  canvas._wheelTimeout = setTimeout(()=>{ isEditing=false; draw(); },300);
},{passive:false});

/* ===== Upload Model Image ===== */
document.getElementById('modelInput').addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const url=URL.createObjectURL(f); const img=new Image();
  img.onload=()=>{
    modelImg=img; state.scale=Math.min(canvas.width/img.width,canvas.height/img.height);
    state.tx=0; state.ty=0; draw(); showButtons();
    showNotifikasi("Gambar berhasil diunggah!","success");
    URL.revokeObjectURL(url);
  };
  img.src=url;
});

/* ===== Info Button ===== */
const infoBtn = document.getElementById('infoBtn');
const infoPopup = document.getElementById('infoPopup');
infoBtn.addEventListener('click', ()=> infoPopup.style.display='flex');
document.getElementById('closeInfoBtn').addEventListener('click', ()=> infoPopup.style.display='none');

/* ===== Reset Download Button ===== */
function resetDownloadButton(){
  const btn = document.getElementById('downloadBtn');
  if(!btn) return;
  btn.innerHTML = `<i class="fas fa-download"></i><span>Download</span>`;
  btn.disabled = false;
  btn.style.background = "";
  btn.style.borderColor = "";
  btn.style.color = "";
  btn.style.cursor = "pointer";
}

/* ===== Show Buttons ===== */
function showButtons(){
  const controls=document.getElementById('controls');
  controls.innerHTML=`
    <div style="display:flex;gap:8px;flex:0 0 auto;align-items:center;">
      <label class="btn btn-small" id="twibbonLabel" title="Unggah Twibbon">
        <i class="fas fa-image"></i>
        <input type="file" id="twibbonInput" accept="image/png">
      </label>
      <button class="btn btn-small" id="shareBtn" title="Bagikan"><i class="fas fa-share-alt"></i></button>
    </div>
    <button class="btn btn-large" id="downloadBtn" title="Unduh">
      <i class="fas fa-download"></i><span>Download</span>
    </button>
  `;

  /* Upload Twibbon */
  document.getElementById('twibbonInput').addEventListener('change', e=>{
    const f=e.target.files[0]; if(!f) return; 
    if(f.type!=="image/png"){ showNotifikasi("Terjadi kesalahan!", "error"); return; }

    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = ()=>{
      const tempCanvas=document.createElement("canvas");
      tempCanvas.width=img.width; tempCanvas.height=img.height;
      const tctx=tempCanvas.getContext("2d"); tctx.drawImage(img,0,0);
      const pixels=tctx.getImageData(0,0,img.width,img.height).data;
      let hasTransparency=false;
      for(let i=3;i<pixels.length;i+=4){ if(pixels[i]<255){ hasTransparency=true; break; } }
      if(!hasTransparency){ showNotifikasi("Twibbon harus transparan!", "error"); URL.revokeObjectURL(url); return; }

      // Simpan twibbon
      twibbonFullRes=img;
      const size=512;
      const previewCanvas=document.createElement("canvas"); previewCanvas.width=size; previewCanvas.height=size;
      const pctx=previewCanvas.getContext("2d"); pctx.drawImage(img,0,0,size,size);
      const previewImg=new Image(); previewImg.src=previewCanvas.toDataURL("image/png");
      previewImg.onload=()=>{ twibbonImg=previewImg; unlockEditing(); draw(); resetDownloadButton(); };
      URL.revokeObjectURL(url);
    };
    img.src=url;
  });

  /* Download Button */
  document.getElementById('downloadBtn').addEventListener('click', ()=>{
    const btn=document.getElementById('downloadBtn');
    let downlink=5; if(navigator.connection && navigator.connection.downlink) downlink=navigator.connection.downlink;
    const fileSizeMB=2; let duration=(fileSizeMB/downlink)*1000;
    if(duration<1000) duration=1000; if(duration>5000) duration=5000;
    const start=performance.now(); let finished=false; let blobForDownload=null;
    const outCanvas=generateOutputCanvas(); outCanvas.toBlob(blob=>{ blobForDownload=blob; },'image/png');
    btn.innerHTML=`<div class="loading"><div class="spinner-wrap"><i class="fas fa-circle-notch fa-spin"></i><i class="fas fa-square"></i></div><span id="elapsed">0.0s</span></div>`;
    btn.disabled=true;
    function step(timestamp){
      const elapsedMs=timestamp-start;
      const elapsedSec=(elapsedMs/1000).toFixed(1);
      const el=btn.querySelector('#elapsed'); if(el) el.textContent=elapsedSec+'s';
      if(elapsedMs<duration) requestAnimationFrame(step); else doFinish();
    }
    function doFinish(){
      if(finished) return; finished=true;
      if(!blobForDownload){ const dataUrl=generateOutputCanvas().toDataURL('image/png'); const a=document.createElement('a'); a.href=dataUrl; a.download='twibbon.png'; a.click(); showNotification("Gambar berhasil diunduh!","success"); }
      else{ const url=URL.createObjectURL(blobForDownload); const a=document.createElement('a'); a.href=url; a.download='twibbon.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); }
      btn.innerHTML=`<i class="fas fa-check"></i><span> Sudah diunduh</span>`;
      btn.disabled=true; btn.style.background="#bbb"; btn.style.borderColor="#bbb"; btn.style.color="#555"; btn.style.cursor="not-allowed";
      lockEditing();
    }
    requestAnimationFrame(step);
  });

  /* Share Button */
  document.getElementById('shareBtn').addEventListener('click', ()=>{
    const out=generateOutputCanvas();
    out.toBlob(async blob=>{
      const file=new File([blob],'twibbon.png',{type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:'TwibbonKu', text:'Lihat twibbon saya!', url:'https://twibbonku.netlify.app/'}); return; }catch(e){} }
      window.open(URL.createObjectURL(blob));
    });
  });
}

/* ===== Output Canvas ===== */
function generateOutputCanvas(){
  const out=document.createElement('canvas');
  let w=twibbonFullRes?twibbonFullRes.width:1080;
  let h=twibbonFullRes?twibbonFullRes.height:1080;
  const maxSize=1500; if(w>maxSize || h>maxSize){ const ratio=Math.min(maxSize/w,maxSize/h); w=Math.round(w*ratio); h=Math.round(h*ratio); }
  out.width=w; out.height=h;
  const c=out.getContext('2d');
  if(modelImg){ c.save(); const scaleFactor=w/canvas.width; c.translate(w/2+state.tx*scaleFactor,h/2+state.ty*scaleFactor); c.scale(state.scale*scaleFactor,state.scale*scaleFactor); c.drawImage(modelImg,-modelImg.width/2,-modelImg.height/2); c.restore(); }
  if(twibbonFullRes && twibbonFullRes.naturalWidth>0) c.drawImage(twibbonFullRes,0,0,w,h);
  return out;
}

/* ===== Lock/Unlock Editing ===== */
function lockEditing(){ isLocked=true; isEditing=false; draw(); }
function unlockEditing(){ isLocked=false; isEditing=false; draw(); }
