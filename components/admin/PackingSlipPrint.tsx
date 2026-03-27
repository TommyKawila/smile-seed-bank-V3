"use client";

interface OrderDetail {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  items: { productName: string; unitLabel: string; breederName: string | null; imageUrl?: string | null; quantity: number }[];
}

interface StoreSettings {
  storeName: string;
  contactEmail: string | null;
  supportPhone: string | null;
  address: string | null;
}

export function openPackingSlipPrint(order: OrderDetail, store: StoreSettings) {
  const itemsRows = order.items
    .map(
      (item) =>
        `<tr>
          <td class="border-b border-gray-300 py-1 text-sm">${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="" style="width:24px;height:24px;object-fit:cover;border-radius:2px;vertical-align:middle;margin-right:4px;margin-bottom:1px;">` : ""}${escapeHtml(item.productName)} (${escapeHtml(item.unitLabel)})${item.breederName ? ` - ${escapeHtml(item.breederName)}` : ""}</td>
          <td class="border-b border-gray-300 py-1 text-center text-sm">× ${item.quantity}</td>
        </tr>`
    )
    .join("");

  const recipientName = order.customerName || "—";
  const recipientPhone = order.customerPhone || "—";
  const recipientAddr = (order.shippingAddress || "—").replace(/\n/g, "<br>");

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(`#${order.orderNumber}`)}`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบปะหน้า #${order.orderNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Prompt', 'Sarabun', sans-serif;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 8mm;
      width: 100mm;
      min-height: 148mm;
    }
    @media print {
      body {
        width: 100mm !important;
        min-height: 148mm !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page { size: 100mm 150mm; margin: 0; }
    }
    .sender {
      font-size: 10px;
      color: #444;
      margin-bottom: 6mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid #ccc;
    }
    .recipient {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.5;
      margin-bottom: 6mm;
    }
    .recipient .name { font-size: 16px; margin-bottom: 2mm; }
    table { width: 100%; border-collapse: collapse; margin-top: 4mm; }
    th { text-align: left; font-size: 10px; color: #666; padding-bottom: 2mm; }
    .footer {
      margin-top: 6mm;
      padding-top: 4mm;
      border-top: 1px solid #ccc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #666;
    }
    .order-id { font-weight: 600; font-size: 12px; color: #000; }
  </style>
</head>
<body>
  <div class="sender">
    <strong>${escapeHtml(store.storeName)}</strong><br>
    ${store.supportPhone ? `โทร: ${escapeHtml(store.supportPhone)}` : ""}
    ${store.contactEmail ? `<br>${escapeHtml(store.contactEmail)}` : ""}
    ${store.address ? `<br>${escapeHtml(store.address)}` : ""}
  </div>
  <div class="recipient">
    <div class="name">${escapeHtml(recipientName)}</div>
    <div>โทร: ${escapeHtml(recipientPhone)}</div>
    <div>${recipientAddr}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>รายการสินค้า</th>
        <th style="width: 24px; text-align: center;">จำนวน</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <div class="footer">
    <span class="order-id">#${order.orderNumber}</span>
    <img src="${qrUrl}" alt="QR" width="48" height="48">
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
