const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const dlAllBtn   = document.getElementById('dlAllBtn');
const statusEl   = document.getElementById('status');
const previewEl  = document.getElementById('preview');

let pdfFiles = []; // ahora es un array
let allRenderedPages = []; // todas las páginas de todos los PDFs

// ── Selección de archivos ────────────────────────────────
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => loadPDFs(e.target.files));

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('over');
  const files = [...e.dataTransfer.files].filter(f => f.type === 'application/pdf');
  if (files.length) loadPDFs(files);
});

function loadPDFs(files) {
  pdfFiles = [...files];
  previewEl.innerHTML = '';
  allRenderedPages = [];
  dlAllBtn.style.display = 'none';

  if (pdfFiles.length === 1) {
    statusEl.textContent = `✅ 1 PDF cargado: ${pdfFiles[0].name}`;
  } else {
    statusEl.textContent = `✅ ${pdfFiles.length} PDFs cargados`;
  }
  convertBtn.disabled = false;
}

// ── Convertir todos ──────────────────────────────────────
convertBtn.addEventListener('click', async () => {
  if (!pdfFiles.length) return;

  convertBtn.disabled = true;
  dlAllBtn.style.display = 'none';
  previewEl.innerHTML = '';
  allRenderedPages = [];

  const scale  = parseFloat(document.getElementById('dpi').value);
  const format = document.getElementById('format').value;
  const mime   = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext    = format === 'png' ? 'png' : 'jpg';

  for (let f = 0; f < pdfFiles.length; f++) {
    const file = pdfFiles[f];
    statusEl.textContent = `⏳ Procesando archivo ${f + 1} de ${pdfFiles.length}: ${file.name}`;

    // Sección separada por archivo
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 24px;';
    section.innerHTML = `
      <div style="
        background: #45475a; border-radius: 8px; padding: 8px 12px;
        font-size: 13px; font-weight: bold; margin-bottom: 10px;
        color: #cdd6f4;
      ">
        📄 ${file.name}
      </div>
    `;
    previewEl.appendChild(section);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const total = pdf.numPages;
    const filePages = [];

    for (let i = 1; i <= total; i++) {
      statusEl.textContent = `⏳ Archivo ${f + 1}/${pdfFiles.length} — Página ${i}/${total}: ${file.name}`;

      const page     = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas   = document.createElement('canvas');
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;

      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      const dataUrl = canvas.toDataURL(mime, 1.0);
      const baseName = file.name.replace(/\.pdf$/i, '');
      const filename = `${baseName}_pagina_${i}.${ext}`;

      filePages.push({ dataUrl, filename });
      allRenderedPages.push({ dataUrl, filename });

      // Tarjeta de página
      const card = document.createElement('div');
      card.className = 'page-card';
      card.innerHTML = `
        <span>Página ${i} de ${total}</span>
        <img src="${dataUrl}" alt="Página ${i}">
        <button class="dl-btn">⬇️ Descargar página ${i}</button>
      `;
      card.querySelector('.dl-btn').addEventListener('click', () => {
        downloadImage(dataUrl, filename);
      });
      section.appendChild(card);
    }

    // Botón descargar todas las páginas de este archivo
    if (total > 1) {
      const dlFileBtn = document.createElement('button');
      dlFileBtn.textContent = `⬇️ Descargar todas las páginas de "${file.name}"`;
      dlFileBtn.style.cssText = `
        width: 100%; padding: 8px; background: #89b4fa; color: #1e1e2e;
        font-weight: bold; font-size: 13px; border: none;
        border-radius: 8px; cursor: pointer; margin-top: 8px;
      `;
      dlFileBtn.addEventListener('click', () => {
        filePages.forEach((p, i) => {
          setTimeout(() => downloadImage(p.dataUrl, p.filename), i * 300);
        });
      });
      section.appendChild(dlFileBtn);
    }
  }

  statusEl.textContent = `✅ ${pdfFiles.length} PDF(s) convertido(s) — ${allRenderedPages.length} imagen(es) en total`;
  dlAllBtn.style.display = allRenderedPages.length > 1 ? 'block' : 'none';
  convertBtn.disabled = false;
});

// ── Descargar absolutamente todo ─────────────────────────
dlAllBtn.addEventListener('click', () => {
  allRenderedPages.forEach((p, i) => {
    setTimeout(() => downloadImage(p.dataUrl, p.filename), i * 300);
  });
});

// ── Helper descarga ──────────────────────────────────────
function downloadImage(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
