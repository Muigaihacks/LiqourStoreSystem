interface ReceiptData {
  sale_number: string;
  total_amount: string;
  created_at: string;
  payment_method?: string;
  customer_phone?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: string;
    total_price: string;
  }>;
}

interface ReceiptGeneratorOptions {
  saleData: ReceiptData;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

const createReceiptGenerator = ({ 
  saleData, 
  storeName = "Liquor Store",
  storeAddress = "Juja, Kenya", 
  storePhone = "+254 XXX XXX XXX"
}: ReceiptGeneratorOptions) => {
  
  const generateReceiptHTML = () => {
    console.log('🧾 ReceiptGenerator received data:', saleData);
    console.log('🧾 Items in saleData:', saleData.items);
    console.log('🧾 Payment method:', saleData.payment_method);
    console.log('🧾 Customer phone:', saleData.customer_phone);
    
    const receiptDate = new Date(saleData.created_at).toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Receipt - ${saleData.sale_number}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .store-info {
            font-size: 10px;
            margin-bottom: 2px;
        }
        .receipt-info {
            margin-bottom: 15px;
        }
        .receipt-info div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 15px 0;
        }
        .item {
            margin-bottom: 8px;
        }
        .item-name {
            font-weight: bold;
        }
        .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
        }
        .total-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
        }
        .total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px dashed #000;
            font-size: 10px;
        }
        @media print {
            body { margin: 0; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="store-info">${storeAddress}</div>
        <div class="store-info">Tel: ${storePhone}</div>
    </div>
    
    <div class="receipt-info">
        <div><span>Receipt #:</span><span>${saleData.sale_number}</span></div>
        <div><span>Date:</span><span>${receiptDate}</span></div>
        <div><span>Payment:</span><span>${saleData.payment_method || 'CASH'}</span></div>
        ${saleData.customer_phone ? `<div><span>Customer:</span><span>${saleData.customer_phone}</span></div>` : ''}
    </div>
    
    <div class="items">
        ${saleData.items ? saleData.items.map(item => `
            <div class="item">
                <div class="item-name">${item.product_name}</div>
                <div class="item-details">
                    <span>${item.quantity} x KSh ${parseFloat(item.unit_price).toLocaleString()}</span>
                    <span>KSh ${parseFloat(item.total_price).toLocaleString()}</span>
                </div>
            </div>
        `).join('') : `
            <div class="item">
                <div class="item-name">Sale Items</div>
                <div class="item-details">
                    <span>Total Amount</span>
                    <span>KSh ${parseFloat(saleData.total_amount).toLocaleString()}</span>
                </div>
            </div>
        `}
    </div>
    
    <div class="total-section">
        <div class="total">
            <span>TOTAL:</span>
            <span>KSh ${parseFloat(saleData.total_amount).toLocaleString()}</span>
        </div>
    </div>
    
    <div class="footer">
        <div>Thank you for your business!</div>
        <div>Please come again</div>
        <div style="margin-top: 10px;">Generated: ${new Date().toLocaleString()}</div>
    </div>
</body>
</html>`;
  };

  const printReceipt = () => {
    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(generateReceiptHTML());
      receiptWindow.document.close();
      receiptWindow.focus();
      receiptWindow.print();
    }
  };

  const downloadReceipt = () => {
    const receiptHTML = generateReceiptHTML();
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${saleData.sale_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    printReceipt,
    downloadReceipt,
    generateReceiptHTML
  };
};

export default createReceiptGenerator;
export type { ReceiptData, ReceiptGeneratorOptions };
