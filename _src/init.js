function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  document.getElementById('sidebar').classList.toggle('hidden', !sidebarVisible);
}

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    selectedColor = dot.dataset.color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
  });
});

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

loadDataXML();
