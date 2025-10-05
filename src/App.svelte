<script>
	export let name;
</script>

<div class="app">
  <div class="canvas-wrap">
    <canvas id="canvas"></canvas>
  </div>
  <div class="controls" id="controls">
    <label class="btn btn-large" id="uploadLabel">
      <i class="fas fa-upload"></i>&nbsp;<span style="font-weight:700;">Unggah Gambar</span>
      <input type="file" id="modelInput" accept="image/*">
    </label>
    <button class="btn btn-small" id="infoBtn" title="Panduan">
      <i class="fas fa-info"></i>
    </button>
  </div>
  <div class="small">Tip: {name} untuk memindah, cubit untuk zoom.</div>
</div>

<!-- Info Popup -->
<div class="info-popup" id="infoPopup">
  <div class="info-content">
    <h2><i class="fas fa-info-circle"></i> Panduan Membuat Twibbon</h2>
    <ol>
      <li><i class="fas fa-upload"></i> Klik <b>Unggah Gambar</b> untuk memilih foto Anda.</li>
      <li><i class="fas fa-arrows-alt"></i> Geser dan cubit foto untuk <b>memindah dan memperbesar</b>.</li>
      <li><i class="fas fa-image"></i> Klik ikon <b>gambar</b> untuk mengganti twibbon PNG transparan.</li>
      <li><i class="fas fa-download"></i> Tekan <b>Download</b> untuk menyimpan hasilnya.</li>
      <li><i class="fas fa-share-alt"></i> Bagikan ke media sosial Anda.</li>
    </ol>
    <div style="display:flex; justify-content:flex-end; margin-top:10px;">
      <button id="closeInfoBtn">Tutup</button>
    </div>
  </div>
</div>

<style>
  .spinner-wrap {
    position:relative;
    width:1.5em;
    height:1.5em;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .spinner-wrap .fa-circle-notch.fa-spin {
    font-size:1.5em;
    color:#333;
  }
  .spinner-wrap .fa-square {
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    font-size:0.5em;
    line-height:1;
    color:#222;
  }
  .loading #elapsed {
    font-size:1.2em;
  }
  /* Info Popup */
  .info-popup {
    position: fixed;
    top:0; 
    left:0; 
    width:100%; 
    height:100%; 
    background: rgba(0,0,0,0.5); 
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
  .info-content ul {
    padding-left:18px; 
    margin:10px 0; 
    font-size:14px;
  }
  .info-content ul li {
    margin-bottom:6px;
  }
  .info-content button {
    border:none; 
    background:#333; 
    color:#fff; 
    padding:8px 14px; 
    border-radius:6px; cursor:pointer;
  }
</style>
