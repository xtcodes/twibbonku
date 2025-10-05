function showNotifikasi(pesan, tipe = 'info') {
  const container = document.getElementById('notifikasi-container');

  // Buat elemen notifikasi
  const notif = document.createElement('div');
  notif.className = `notifikasi ${tipe}`;
  notif.textContent = pesan;

  // Tambahkan ke container
  container.appendChild(notif);

  // Hapus otomatis setelah 3 detik
  setTimeout(() => {
    notif.classList.add('hilang');
    notif.addEventListener('animationend', () => notif.remove());
  }, 3000);
}
