<script>
	export let name;
</script>

<div class="app">
<div class="app">
  <div class="canvas-wrap">
    <canvas id="canvas"></canvas>
    <button id="editBtn" title="Edit Lagi"><i class="fas fa-pen"></i></button>
  </div>

  <div class="controls" id="controls">
    <label class="btn btn-large" id="uploadLabel">
      <i class="fas fa-upload"></i>&nbsp;<span style="font-weight:700;">Unggah Gambar</span>
      <input type="file" id="modelInput" accept="image/*">
    </label>
    <button class="btn btn-small" id="infoBtn" title="Panduan"><i class="fas fa-info"></i></button>
  </div>
  <div id="notification-container"></div>
  <div class="small">Tip: {name} untuk memindah, cubit untuk zoom.</div>
</div>

<div class="info-popup" id="infoPopup">
  <div class="info-content">
    <h2><i class="fas fa-info-circle"></i> Panduan Membuat Twibbon</h2>
    <ol>
      <li>Klik <b>Unggah Gambar</b> untuk memilih foto Anda.</li>
      <li>Geser dan cubit foto untuk <b>memindah dan memperbesar</b>.</li>
      <li>Klik ikon <b>gambar</b> untuk mengganti twibbon PNG transparan.</li>
      <li>Tekan <b>Download</b> untuk menyimpan hasilnya.</li>
      <li>Gunakan <b>Bagikan</b> untuk membagikan langsung ke media sosial.</li>
    </ol>
    <div style="display:flex; justify-content:flex-end; margin-top:10px;">
      <button id="closeInfoBtn">Tutup</button>
    </div>
  </div>
</div>

<style>
.notification { 
  display:inline-block; 
  background-color:#333; 
  color:#fff; 
  padding:10px 20px; 
  border-radius:6px; 
  margin-top:10px; 
  text-align:right; 
  opacity:0; 
  transform:translateY(20px); 
  animation:fadeIn 0.4s forwards; 
  box-sizing:border-box; 
  pointer-events:all; 
  white-space:nowrap; 
  max-width:90vw; 
}
.notification.success { 
  background-color:#04AA6D; 
}
.notification.error { 
  background-color:#f44336; 
}
@keyframes fadeIn { to{ opacity:1; transform:translateY(0);} }
@keyframes fadeOut { to{ opacity:0; transform:translateY(20px);} }

.info-popup { 
  position:fixed; 
  top:0; 
  left:0; 
  width:100%; 
  height:100%; 
  background:rgba(0,0,0,0.5); 
  display:none; 
  align-items:center; 
  justify-content:center; 
  z-index:1000; 
  padding:10px; 
  box-sizing:border-box; 
}
.info-content { 
  background:#fff; 
  padding:20px; 
  border-radius:8px; 
  max-width:400px; 
  width:100%; 
  max-height:90%; 
  overflow:auto; 
  box-shadow:0 4px 10px rgba(0,0,0,.2);
  display:flex; 
  flex-direction:column; 
}
.info-content h2 { 
  margin-top:0; 
}
.info-content ol { 
  padding-left:18px; 
  margin:10px 0; 
  font-size:14px; 
}
.info-content li { 
  margin-bottom:6px; 
}
.info-content button { 
  border:none; 
  background:#333; 
  color:#fff; 
  padding:8px 14px; 
  border-radius:6px; 
  cursor:pointer; 
}

/* Spinner animasi memutar */
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.spinner-wrapper {
  position: relative;
  width: 16px;
  height: 16px;
}

.spinner-wrapper .spinner {
  width: 100%;
  height: 100%;
  border: 2px solid #333;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-sizing: border-box;
}

.spinner-wrapper .center-square {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: #000;
  transform: translate(-50%, -50%);
  border-radius: 1px;
}
</style>
