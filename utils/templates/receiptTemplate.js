export function generateReceiptHTML(order) {
  const formatType = (type) => {
    switch (type) {
      case 'pickup': return 'استلام من المحل';
      case 'hall': return 'من داخل الصالة';
      case 'external': return 'توصيل خارجي';
      default: return 'غير معروف';
    }
  };

    const tableNumber = order.tableNumber || order.table_number;
const tableRow = order.type === 'hall' && tableNumber
  ? `<div class="info">رقم الطاولة: ${tableNumber}</div>` : '';


  const noteRow = order.note
    ? `<div class="info">ملاحظة: ${order.note}</div>` : '';

  const itemsArray = Array.isArray(order.items) ? order.items : [];
  const items = itemsArray.length
    ? itemsArray.map(item => `
        <div class="item-row">
          <div>${item.qty} × ${item.name}</div>
          <div>${item.price.toFixed(0)} د.ع</div>
        </div>
      `).join('')
    : `<div class="info">لا توجد عناصر</div>`;

  // Calculate total from items
  const total = itemsArray.reduce((sum, item) => sum + item.price * item.qty, 0);

  return `
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
          body {
            font-family: 'Tajawal', sans-serif;
            width: 600px;
            padding: 50px;
            font-size: 30px;
            direction: rtl;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            font-weight: bold;
            font-size: 60px;
            margin-bottom: 5px;
          }
          .subheader {
            text-align: center;
            font-size: 40px;
            margin-bottom: 10px;
          }
          .line {
            border-top: 4px dashed #000;
            margin: 40px 0;
          }
          .info {
            margin-bottom: 10px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .total {
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header">NOVO REST&CAFE</div>
        <div class="subheader">PHONE::07712826262</div>
        <div class="line"></div>
        ${tableRow}
        <div class="info">نوع الطلب: ${formatType(order.type)}</div>
        <div class="info">رقم الطلب: ${order.id}</div>
        ${noteRow}
        <div class="line"></div>
        ${items}
        <div class="line"></div>
        <div class="total">
          <div>المجموع:</div>
          <div>${total.toFixed(0)} د.ع</div>
        </div>
        <div class="footer">${new Date().toLocaleString('ar-IQ')}</div>
      </body>
    </html>
  `;
}
