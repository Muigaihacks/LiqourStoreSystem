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
    console.log('🖨️ Print receipt clicked');
    
    try {
      // Create a new window with specific properties
      const receiptWindow = window.open('', 'receipt_print', 
        'width=400,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,status=no');
      
      if (receiptWindow && receiptWindow.document) {
        console.log('🖨️ New window opened successfully');
        
        // Write the HTML content
        const htmlContent = generateReceiptHTML();
        receiptWindow.document.open();
        receiptWindow.document.write(htmlContent);
        receiptWindow.document.close();
        
        // Use a more reliable method to wait for content to load
        const printWhenReady = () => {
          if (receiptWindow.document.readyState === 'complete') {
            console.log('🖨️ Document ready, printing...');
            receiptWindow.focus();
            
            // Add a small delay to ensure rendering is complete
            setTimeout(() => {
              receiptWindow.print();
              
              // Auto-close after printing (optional)
              receiptWindow.addEventListener('afterprint', () => {
                receiptWindow.close();
              });
              
              // Fallback close after 3 seconds
              setTimeout(() => {
                if (!receiptWindow.closed) {
                  receiptWindow.close();
                }
              }, 3000);
            }, 100);
          } else {
            // If not ready, try again in 100ms
            setTimeout(printWhenReady, 100);
          }
        };
        
        // Start checking if document is ready
        printWhenReady();
        
      } else {
        console.log('🚫 Popup blocked or failed to open, trying iframe method');
        printWithIframe();
      }
    } catch (error) {
      console.error('🚫 Print error:', error);
      printWithIframe();
    }
  };

  const printWithIframe = () => {
    console.log('🖨️ Using iframe print method');
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '400px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      const htmlContent = generateReceiptHTML();
      
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
      
      // Wait for content to load
      iframe.onload = () => {
        try {
          console.log('🖨️ Iframe content loaded, attempting to print');
          
          // Wait a bit more to ensure everything is rendered
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              
              // Clean up after printing
              setTimeout(() => {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
              }, 1000);
            }
          }, 200);
          
        } catch (error) {
          console.error('🚫 Iframe print error:', error);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          alert('Print failed. Your browser may be blocking printing. Please:\n1. Allow popups for this site, or\n2. Use the Download button instead');
        }
      };
      
      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (error) {
            console.error('🚫 Fallback iframe print error:', error);
          }
        }
      }, 1000);
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
