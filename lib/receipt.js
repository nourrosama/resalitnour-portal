// إيصال استلام مساعدات — printable A4 receipt for one beneficiary (client side).
// printReceipt(data) opens the receipt in a new window and shows the browser's print dialog.

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const ar = n => Number(n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 3 })
const arDate = d => new Date(d).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })
const arTime = d => new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

/**
 * data: {
 *   requestNo, voucherCode, deliveryType, location, deliveredAt,
 *   caseName, caseCode, familyMembers, casePoints,
 *   items: [{ name, unit, quantity }]
 * }
 */
export function buildReceiptHtml(data) {
  const items = data.items || []
  const when = data.deliveredAt || new Date()
  const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
  const rows = items.length
    ? items.map((it, i) => `<tr><td class="num">${ar(i + 1)}</td><td>${esc(it.name)}</td><td>${esc(it.unit || '—')}</td><td class="num">${ar(it.quantity)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">لم يستلم المستفيد أصنافًا في هذا التسليم</td></tr>'
  const receiptNo = [data.requestNo, data.voucherCode].filter(Boolean).join(' / ')

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>إيصال استلام — ${esc(data.caseName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --blue: #0369a1; --blue-dark: #0c4a6e; --line: #cbd5e1; --soft: #f1f5f9; --text: #0f172a; --muted: #64748b; }
  * { box-sizing: border-box; font-family: 'Cairo', sans-serif; }
  body { margin: 0; background: #e2e8f0; color: var(--text); }
  .toolbar { max-width: 210mm; margin: 16px auto 0; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .toolbar p { margin: 0; font-size: 13px; color: var(--muted); }
  .toolbar button { background: var(--blue); color: #fff; border: 0; border-radius: 8px; padding: 8px 18px; font-weight: 700; cursor: pointer; font-size: 14px; }
  .sheet { width: 210mm; min-height: 297mm; margin: 12px auto 24px; background: #fff; padding: 16mm 16mm 12mm;
           box-shadow: 0 6px 24px rgba(15, 23, 42, .15); display: flex; flex-direction: column; }
  .head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 5mm; border-bottom: 2px solid var(--blue); }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 18mm; height: 18mm; border-radius: 50%; background: linear-gradient(180deg, #0284c7, #075985);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo svg { width: 9mm; height: 9mm; color: #fff; }
  .brand h1 { margin: 0; font-size: 22px; font-weight: 800; color: var(--blue-dark); }
  .doc { text-align: left; }
  .doc .title { font-size: 19px; font-weight: 800; color: var(--blue); margin: 0; }
  .doc .no { font-size: 13px; color: var(--muted); margin: 2px 0 0; }
  .doc .no b { font-family: monospace; color: var(--text); letter-spacing: .5px; }
  .info { display: grid; grid-template-columns: 1fr 1fr; margin-top: 6mm; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
  .info div { display: flex; justify-content: space-between; gap: 8px; padding: 3mm 4mm; font-size: 14px; border-bottom: 1px solid var(--line); }
  .info div:nth-child(odd) { border-left: 1px solid var(--line); }
  .info div:nth-last-child(-n+2) { border-bottom: 0; }
  .info span { color: var(--muted); }
  .info b { font-weight: 700; }
  h2 { font-size: 16px; margin: 7mm 0 2.5mm; color: var(--blue-dark); }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  thead th { background: var(--blue); color: #fff; font-weight: 700; padding: 3mm; text-align: center; }
  thead th:nth-child(2) { text-align: right; }
  tbody td { padding: 2.6mm 3mm; border-bottom: 1px solid var(--line); text-align: center; }
  tbody td:nth-child(2) { text-align: right; font-weight: 600; }
  tbody tr:nth-child(even) td { background: var(--soft); }
  tbody td.empty { text-align: center; color: var(--muted); padding: 6mm; }
  tfoot td { padding: 3mm; font-weight: 800; text-align: center; border-top: 2px solid var(--blue); }
  tfoot td:first-child { text-align: right; }
  .foot { margin-top: auto; padding-top: 3mm; border-top: 1px solid var(--line); display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    .sheet { margin: 0; box-shadow: none; }
    thead th, tbody tr:nth-child(even) td, .logo { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <p>إيصال استلام — ${esc(data.caseName)}</p>
    <button onclick="window.print()">طباعة</button>
  </div>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <div class="logo"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></div>
        <h1>جمعية رسالة نور للتنمية</h1>
      </div>
      <div class="doc">
        <p class="title">إيصال استلام مساعدات</p>
        ${receiptNo ? `<p class="no">رقم الإيصال: <b>${esc(receiptNo)}</b></p>` : ''}
      </div>
    </div>
    <div class="info">
      <div><span>اسم الحالة</span><b>${esc(data.caseName || '—')}</b></div>
      <div><span>كود الحالة</span><b>${esc(data.caseCode || '—')}</b></div>
      <div><span>عدد أفراد الأسرة</span><b>${data.familyMembers ? ar(data.familyMembers) : '—'}</b></div>
      <div><span>نقاط الحالة</span><b>${ar(data.casePoints)}</b></div>
      <div><span>تاريخ التسليم</span><b>${arDate(when)}</b></div>
      <div><span>اسم الطلب</span><b>${esc(data.deliveryType || '—')}</b></div>
      <div><span>رقم الطلب</span><b>${esc(data.requestNo || '—')}</b></div>
      <div><span>مكان التسليم</span><b>${esc(data.location || '—')}</b></div>
    </div>
    <h2>الأصناف المستلمة</h2>
    <table>
      <thead><tr><th style="width:14mm">م</th><th>اسم الصنف</th><th style="width:30mm">النوع</th><th style="width:26mm">الكمية</th></tr></thead>
      <tbody>${rows}</tbody>
      ${items.length ? `<tfoot><tr><td colspan="3">إجمالي عدد الأصناف: ${ar(items.length)}</td><td class="num">${ar(totalQty)}</td></tr></tfoot>` : ''}
    </table>
    <div class="foot">
      <span>تم إصدار هذا الإيصال من بوابة جمعية رسالة نور للتنمية</span>
      <span>${arDate(new Date())} — ${arTime(new Date())}</span>
    </div>
  </div>
  <script>
    // print once the Arabic font has loaded so the paper looks like the preview
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(function () { window.print() }, 250) })
  </script>
</body>
</html>`
}

export function printReceipt(data) {
  const html = buildReceiptHtml(data)
  const w = window.open('', '_blank')
  if (w) {
    w.document.open()
    w.document.write(html)
    w.document.close()
    return true
  }
  // pop-up blocked: print from a hidden frame instead
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'
  document.body.appendChild(frame)
  frame.contentDocument.open()
  frame.contentDocument.write(html.replace(/<script>[\s\S]*?<\/script>/, ''))
  frame.contentDocument.close()
  setTimeout(() => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 2000) }, 600)
  return false
}
