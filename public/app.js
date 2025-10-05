function showNotification(message,type="info"){
  const container=document.getElementById("notification-container");
  const notif=document.createElement("div");
  notif.classList.add("notification");
  if(type!=="info") notif.classList.add(type);
  notif.textContent=message;
  container.appendChild(notif);
  setTimeout(()=>{ notif.style.animation="fadeOut 0.5s forwards"; notif.addEventListener("animationend",()=>notif.remove()); },3000);
}
window.alert=function(msg){ showNotification(msg,"error"); };

const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
let modelImg=null, twibbonImg=null, twibbonFullRes=null;
let isLocked=false, isCustomTwibbon=false, downloadBtn=null, isEditing=false;
let state={scale:1,tx:0,ty:0};

function resizeCanvas(){ const rect=canvas.parentElement.getBoundingClientRect(); canvas.width=Math.round(rect.width); canvas.height=Math.round(rect.height); draw();}
window.addEventListener('resize',resizeCanvas); resizeCanvas();

function loadDefaultTwibbon(){ const d=new Image(); d.src='twibbon.png'; d.onload=()=>{ twibbonImg=d; twibbonFullRes=d; draw(); } }
loadDefaultTwibbon();

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(modelImg){ ctx.save(); ctx.translate(canvas.width/2+state.tx,canvas.height/2+state.ty); ctx.scale(state.scale,state.scale); ctx.drawImage(modelImg,-modelImg.width/2,-modelImg.height/2); ctx.restore();}
  if(twibbonImg && twibbonImg.naturalWidth>0){ ctx.save(); ctx.globalAlpha=(isEditing&&!isLocked)?0.5:1; ctx.drawImage(twibbonImg,0,0,canvas.width,canvas.height); ctx.restore();}
}

document.getElementById('modelInput').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const url=URL.createObjectURL(f); const img=new Image();
  img.onload=()=>{
    modelImg=img;
    state.scale=Math.min(canvas.width/img.width,canvas.height/img.height); state.tx=0; state.ty=0;
    draw(); showButtons(); showNotification("Gambar berhasil diunggah!","success");
      // Reset tombol download
  if(downloadBtn){
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<i class="fas fa-download"></i><span> Download</span>';
  }
    URL.revokeObjectURL(url);
  }; img.src=url;
});

const infoBtn=document.getElementById('infoBtn'); const infoPopup=document.getElementById('infoPopup');
infoBtn.addEventListener('click',()=>infoPopup.style.display='flex');
document.getElementById('closeInfoBtn').addEventListener('click',()=>infoPopup.style.display='none');

function showButtons(){
  const controls=document.getElementById('controls');
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
  downloadBtn=document.getElementById('downloadBtn'); downloadBtn.disabled=false;

  document.getElementById('twibbonInput').addEventListener('change', e => {
    const f=e.target.files[0]; if(!f) return;
    if(f.type!=="image/png"){ alert("Hanya file PNG yang diizinkan!"); return; }
    const url=URL.createObjectURL(f); const img=new Image();
    img.onload=()=>{
      const checker=document.createElement('canvas'); checker.width=img.width; checker.height=img.height;
      const cctx=checker.getContext('2d'); cctx.drawImage(img,0,0);
      const pixels=cctx.getImageData(0,0,img.width,img.height).data;
      let hasTransparency=false;
      for(let i=3;i<pixels.length;i+=4){ if(pixels[i]<255){ hasTransparency=true; break; } }
      if(!hasTransparency){ alert("Twibbon tidak valid!"); URL.revokeObjectURL(url); return; }
      twibbonFullRes=img;
      const prev=document.createElement('canvas'); prev.width=512; prev.height=512; prev.getContext('2d').drawImage(img,0,0,512,512);
      const preview=new Image(); preview.onload=()=>{ twibbonImg=preview; isCustomTwibbon=true; isLocked=false; canvas.style.pointerEvents="auto"; document.querySelector(".small").textContent="Tip: geser untuk memindah, cubit untuk zoom."; const eb=document.getElementById("editBtn"); if(eb) eb.style.display="none";   // Reset tombol download
  if(downloadBtn){
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<i class="fas fa-download"></i><span> Download</span>';
  } draw(); showNotification("Twibbon berhasil diganti!","success"); };
      preview.src=prev.toDataURL("image/png"); URL.revokeObjectURL(url);
    }; img.src=url;
  });

  // ===== Tombol download final =====
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

      // Setelah unduh selesai, tampilkan ceklis dan disable permanen
      downloadBtn.innerHTML = '<i class="fas fa-check"></i> Unduhan Selesai';
      downloadBtn.disabled = true;

      isLocked = true;
      canvas.style.pointerEvents = "none";
      document.querySelector(".small").textContent = "Interaksi dinonaktifkan setelah unduh.";
      const eb = document.getElementById("editBtn");
      if(eb) eb.style.display = "flex";
      draw();
    });
  });

  document.getElementById('shareBtn').addEventListener('click', async ()=>{
    const out=generateOutputCanvas();
    out.toBlob(async blob=>{
      if(navigator.share && navigator.canShare?.({files:[new File([blob],'twibbon.png',{type:'image/png'})]})){
        const file=new File([blob],'twibbon.png',{type:'image/png'});
        try{ await navigator.share({title:'Twibbon Saya',text:'Yuk cek hasil Twibbon saya!',files:[file]}); showNotification("Twibbon berhasil dibagikan!","success"); }
        catch(err){ showNotification("Berbagi dibatalkan.","error"); }
      } else showNotification("Fitur bagikan tidak didukung di browser ini.","error");
    },'image/png');
  });
}

function generateOutputCanvas(){
  const out=document.createElement('canvas');
  const w=twibbonFullRes?twibbonFullRes.width:1080;
  const h=twibbonFullRes?twibbonFullRes.height:1080;
  out.width=w; out.height=h;
  const c=out.getContext('2d');
  if(modelImg){ c.save(); const scale=w/canvas.width; c.translate(w/2+state.tx*scale,h/2+state.ty*scale); c.scale(state.scale*scale,state.scale*scale); c.drawImage(modelImg,-modelImg.width/2,-modelImg.height/2); c.restore(); }
  if(twibbonFullRes) c.drawImage(twibbonFullRes,0,0,w,h);
  return out;
}

/* ===== Gestur ===== */
let lastTouchDist=0,lastTouch=null,isTouching=false;
canvas.addEventListener('touchstart',e=>{
  if(isLocked||!modelImg) return;
  e.preventDefault(); isEditing=true; draw();
  if(e.touches.length===1){ isTouching=true; const t=e.touches[0]; lastTouch={x:t.clientX,y:t.clientY}; }
  else if(e.touches.length===2){ isTouching=true; lastTouchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); }
});
canvas.addEventListener('touchmove',e=>{
  if(isLocked||!isTouching||!modelImg) return;
  e.preventDefault();
  if(e.touches.length===1&&lastTouch){ const t=e.touches[0]; const dx=t.clientX-lastTouch.x; const dy=t.clientY-lastTouch.y; lastTouch={x:t.clientX,y:t.clientY}; state.tx+=dx; state.ty+=dy; draw(); }
  else if(e.touches.length===2){ const dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); const scaleChange=dist/lastTouchDist; lastTouchDist=dist; state.scale*=scaleChange; state.scale=Math.max(0.2,Math.min(state.scale,5)); draw(); }
});
canvas.addEventListener('touchend',e=>{ if(e.touches.length===0){ isTouching=false; lastTouch=null; isEditing=false; draw(); } });

document.getElementById('editBtn').addEventListener('click',()=>{
  isLocked=false; canvas.style.pointerEvents="auto"; document.querySelector(".small").textContent="Tip: geser untuk memindah, cubit untuk zoom."; showNotification("Mode edit diaktifkan kembali","success"); document.getElementById('editBtn').style.display="none"; if(downloadBtn) downloadBtn.disabled=false; downloadBtn.innerHTML = '<i class="fas fa-download"></i><span> Download</span>'; draw();
});
