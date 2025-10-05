// ===== Notifikasi =====
function showNotification(message, type="info") {
  const container = document.getElementById("notification-container");
  if (!container) return;
  const notif = document.createElement("div");
  notif.classList.add("notification");
  if (type !== "info") notif.classList.add(type);
  notif.textContent = message;
  container.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = "fadeOut 0.5s forwards";
    notif.addEventListener("animationend", () => notif.remove());
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("notification-container");
  if (container) {
    window.alert = function(msg) {
      showNotification(msg, "error");
    };
  }
});

// ===== Canvas & Image Logic =====
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let modelImg = null, twibbonImg = null, twibbonFullRes = null;
let isLocked = false, isCustomTwibbon = false, downloadBtn = null, isEditing = false;
let state = {scale: 1, tx: 0, ty: 0};

const scaleMin = 0.1;
const scaleMax = 10;
function clamp(val, min, max){ return Math.min(Math.max(val,min),max); }

function resizeCanvas(){ 
  const rect = canvas.parentElement.getBoundingClientRect(); 
  canvas.width = Math.round(rect.width); 
  canvas.height = Math.round(rect.height); 
  draw();
}
window.addEventListener('resize', resizeCanvas); 
resizeCanvas();

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if(modelImg){ 
    ctx.save(); 
    ctx.translate(canvas.width/2 + state.tx, canvas.height/2 + state.ty); 
    ctx.scale(state.scale, state.scale); 
    ctx.drawImage(modelImg, -modelImg.width/2, -modelImg.height/2); 
    ctx.restore();
  }

  if(twibbonImg && twibbonImg.naturalWidth>0){ 
    ctx.save(); 
    // Twibbon hanya semi-transparent saat edit aktif, selain itu full
    ctx.globalAlpha = (isEditing && !isLocked) ? 0.5 : 1; 
    ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height); 
    ctx.restore();
  }
}

// ===== Load default twibbon =====
function loadDefaultTwibbon(){ 
  const d = new Image(); 
  d.src = 'twibbon.png'; 
  d.onload = ()=>{ twibbonImg = d; twibbonFullRes = d; draw(); } 
}
loadDefaultTwibbon();

// ===== Upload Model =====
document.getElementById('modelInput').addEventListener('change', e=>{
  const f = e.target.files[0]; 
  if(!f) return;
  const url = URL.createObjectURL(f); 
  const img = new Image();
  img.onload = ()=>{
    modelImg = img;
    state.scale = Math.min(canvas.width/img.width, canvas.height/img.height); 
    state.tx = 0; state.ty = 0;
    draw(); 
    showButtons(); 
    showNotification("Gambar berhasil diunggah!","success");
    if(downloadBtn){
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<i class="fas fa-download"></i><span> Download</span>';
    }
    URL.revokeObjectURL(url);
  }; 
  img.src = url;
});

// ===== Show dynamic buttons =====
function showButtons(){
  const controls = document.getElementById('controls');
  controls.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;">
      <label class="btn btn-small" id="twibbonLabel" title="Unggah Twibbon">
        <i class="fas fa-image"></i>
        <input type="file" id="twibbonInput" accept="image/png">
      </label>
      <button class="btn btn-small" id="shareBtn" title="Bagikan"><i class="fas fa-share-alt"></i></button>
    </div>
    <button class="btn btn-large" id="downloadBtn" title="Unduh">
      <i class="fas fa-download"></i><span> Download</span>
    </button>
  `;
  downloadBtn = document.getElementById('downloadBtn'); 
  downloadBtn.disabled = false;

  // ===== Upload Twibbon =====
  document.getElementById('twibbonInput').addEventListener('change', e => {
    const f = e.target.files[0]; 
    if(!f) return; 
    if(f.type !== "image/png"){ alert("Hanya file PNG yang diizinkan!"); return; }
    const url = URL.createObjectURL(f); 
    const img = new Image();
    img.onload = ()=>{
      const checker = document.createElement('canvas'); 
      checker.width = img.width; checker.height = img.height;
      const cctx = checker.getContext('2d'); 
      cctx.drawImage(img,0,0);
      const pixels = cctx.getImageData(0,0,img.width,img.height).data;
      let hasTransparency=false;
      for(let i=3;i<pixels.length;i+=4){ if(pixels[i]<255){ hasTransparency=true; break; } }
      if(!hasTransparency){ alert("Twibbon tidak valid!"); URL.revokeObjectURL(url); return; }

      // Reset state saat ganti twibbon
      twibbonFullRes = img;
      twibbonImg = img;
      isCustomTwibbon = true;
      isLocked = false;
      isEditing = false;
      state.scale = 1;
      state.tx = 0;
      state.ty = 0;
      canvas.style.pointerEvents="auto"; 
      document.querySelector(".small").textContent="Tip: geser untuk memindah, cubit untuk zoom."; 
      const eb = document.getElementById("editBtn"); 
      if(eb) eb.style.display="none";   
      if(downloadBtn){
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i><span> Download</span>';
      }
      draw(); 
      showNotification("Twibbon berhasil diganti!","success"); 
      URL.revokeObjectURL(url);
    }; 
    img.src = url;
  });

  // ===== Tombol Download =====
  downloadBtn.addEventListener('click', () => {
    if(downloadBtn.disabled) return;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
      <div class="spinner-wrapper">
        <div class="spinner"></div>
        <div class="center-square"></div>
      </div>
      <span class="loading-text" style="margin-left:6px;">0.0s</span>
    `;
    const loadingText = downloadBtn.querySelector('.loading-text');
    const startTime = performance.now();
    function updateTime(){
      loadingText.textContent = ((performance.now()-startTime)/1000).toFixed(1) + 's';
      requestAnimationFrame(updateTime);
    }
    requestAnimationFrame(updateTime);
    const out = generateOutputCanvas();
    out.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'twibbon.png';
      a.click();
      URL.revokeObjectURL(url);
      downloadBtn.innerHTML = '<i class="fas fa-check"></i> Unduhan Selesai';
      downloadBtn.disabled = true;
      isLocked = true;
      isEditing = false;
      canvas.style.pointerEvents = "none";
      document.querySelector(".small").textContent = "Interaksi dinonaktifkan setelah unduh.";
      const eb = document.getElementById("editBtn");
      if(eb) eb.style.display="flex";
      draw();
    });
  });

  // ===== Tombol Share =====
  document.getElementById('shareBtn').addEventListener('click', async ()=>{
    const out=generateOutputCanvas();
    out.toBlob(async blob=>{
      if(navigator.share && navigator.canShare?.({files:[new File([blob],'twibbon.png',{type:'image/png'})]})){
        const file=new File([blob],'twibbon.png',{type:'image/png'});
        try{ 
          await navigator.share({title:'Twibbon Saya',text:'Yuk cek hasil Twibbon saya!',files:[file]}); 
          showNotification("Twibbon berhasil dibagikan!","success"); 
        } catch(err){ 
          showNotification("Berbagi dibatalkan.","error"); 
        }
      } else showNotification("Fitur bagikan tidak didukung di browser ini.","error");
    },'image/png');
  });
}

// ===== Generate Output Canvas Full Resolution =====
function generateOutputCanvas(){
  const out=document.createElement('canvas');
  const w=twibbonFullRes?twibbonFullRes.width:1080;
  const h=twibbonFullRes?twibbonFullRes.height:1080;
  out.width=w; out.height=h;
  const c=out.getContext('2d');
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';

  if(modelImg){ 
    c.save(); 
    const scale=w/canvas.width; 
    c.translate(w/2 + state.tx*scale, h/2 + state.ty*scale); 
    c.scale(state.scale*scale, state.scale*scale); 
    c.drawImage(modelImg, -modelImg.width/2, -modelImg.height/2); 
    c.restore(); 
  }
  if(twibbonFullRes) c.drawImage(twibbonFullRes,0,0,w,h);
  return out;
}

// ===== Mouse drag & zoom (desktop) =====
let isMouseDown = false;
let lastMousePos = {x:0, y:0};

canvas.addEventListener('mousedown', e=>{
  if(isLocked || !modelImg) return;
  e.preventDefault();
  isEditing = true;
  isMouseDown = true;
  lastMousePos = {x: e.clientX, y: e.clientY};
});

canvas.addEventListener('mousemove', e=>{
  if(isLocked || !isMouseDown || !modelImg) return;
  e.preventDefault();
  const dx = e.clientX - lastMousePos.x;
  const dy = e.clientY - lastMousePos.y;
  lastMousePos = {x: e.clientX, y: e.clientY};
  state.tx += dx;
  state.ty += dy;
  draw();
});

canvas.addEventListener('mouseup', e=>{
  if(isLocked) return;
  isMouseDown = false;
  isEditing = false;
  draw();
});

canvas.addEventListener('mouseleave', e=>{
  if(isLocked) return;
  isMouseDown = false;
  isEditing = false;
  draw();
});

// ===== Zoom dengan wheel =====
canvas.addEventListener('wheel', e=>{
  if(isLocked || !modelImg) return;
  e.preventDefault();
  const zoomFactor = Math.pow(1.001, -e.deltaY);
  const oldScale = state.scale;
  const newScale = clamp(state.scale * zoomFactor, scaleMin, scaleMax);

  // Offset dihitung relatif ke CENTER canvas
  const cx = canvas.width/2;
  const cy = canvas.height/2;
  state.tx = cx - ((cx - state.tx) * newScale / oldScale);
  state.ty = cy - ((cy - state.ty) * newScale / oldScale);
  state.scale = newScale;
  draw();
});

// ===== Touch gestures (mobile) =====
let lastTouchDist = 0, lastTouch = null, isTouching = false;

canvas.addEventListener('touchstart', e=>{
  if(isLocked || !modelImg) return;
  e.preventDefault();
  isEditing = true;

  if(e.touches.length === 1){
    isTouching = true;
    const t = e.touches[0];
    lastTouch = {x: t.clientX, y: t.clientY};
  } else if(e.touches.length === 2){
    isTouching = true;
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    lastTouchDist = Math.hypot(dx, dy);
  }
});

canvas.addEventListener('touchmove', e=>{
  if(isLocked || !isTouching || !modelImg) return;
  e.preventDefault();

  if(e.touches.length === 1 && lastTouch){
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.x;
    const dy = t.clientY - lastTouch.y;
    lastTouch = {x: t.clientX, y: t.clientY};
    state.tx += dx;
    state.ty += dy;
    draw();
  } else if(e.touches.length === 2){
    const dx = e.touches[1].clientX - e.touches[0].clientX;
    const dy = e.touches[1].clientY - e.touches[0].clientY;
    const dist = Math.hypot(dx, dy);
    const scaleFactor = dist / lastTouchDist;

    const oldScale = state.scale;
    const newScale = clamp(state.scale * scaleFactor, scaleMin, scaleMax);

    const cx = canvas.width/2;
    const cy = canvas.height/2;
    state.tx = cx - ((cx - state.tx) * newScale / oldScale);
    state.ty = cy - ((cy - state.ty) * newScale / oldScale);
    state.scale = newScale;
    lastTouchDist = dist;
    draw();
  }
});

canvas.addEventListener('touchend', e=>{
  if(e.touches.length === 0){
    isTouching = false;
    lastTouch = null;
    isEditing = false;
    draw();
  }
});

// ===== Tombol Edit =====
document.getElementById('editBtn').addEventListener('click', ()=>{
  isLocked=false; 
  isEditing = false;
  canvas.style.pointerEvents="auto"; 
  document.querySelector(".small").textContent="Tip: geser untuk memindah, cubit untuk zoom."; 
  showNotification("Mode edit diaktifkan kembali","success"); 
  document.getElementById('editBtn').style.display="none"; 
  if(downloadBtn) {
    downloadBtn.disabled=false; 
    downloadBtn.innerHTML='<i class="fas fa-download"></i><span> Download</span>'; 
  }
  draw();
});

// ===== Info popup =====
const infoBtn = document.getElementById('infoBtn'); 
const infoPopup = document.getElementById('infoPopup');
infoBtn.addEventListener('click',()=>infoPopup.style.display='flex');
document.getElementById('closeInfoBtn').addEventListener('click',()=>infoPopup.style.display='none');

// ===== Peringatan sebelum keluar halaman =====
window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  e.returnValue = '';
});
