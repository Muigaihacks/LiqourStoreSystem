import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ShoppingCartIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from './BarcodeScanner';
import createReceiptGenerator from './ReceiptGenerator';
import { apiService } from '../services/api';

// Helper function to match Kenyan phone numbers in different formats
const phoneNumbersMatch = (storedPhone: string, searchPhone: string): boolean => {
  // Clean both numbers
  const cleanStored = storedPhone.replace(/[\s\-()+]/g, '');
  const cleanSearch = searchPhone.replace(/[\s\-()+]/g, '');
  
  // Generate variations for both numbers
  const getVariations = (phone: string): string[] => {
    const variations = new Set<string>();
    
    // Remove country code and leading zero
    let basePhone = phone;
    if (basePhone.startsWith('254')) {
      basePhone = basePhone.substring(3);
    }
    if (basePhone.startsWith('0')) {
      basePhone = basePhone.substring(1);
    }
    
    // Add all possible formats
    variations.add(basePhone);           // 712345678
    variations.add(`0${basePhone}`);     // 0712345678
    variations.add(`254${basePhone}`);   // 254712345678
    variations.add(`+254${basePhone}`);  // +254712345678
    
    return Array.from(variations);
  };
  
  const storedVariations = getVariations(cleanStored);
  const searchVariations = getVariations(cleanSearch);
  
  // Check if any variation matches
  return storedVariations.some(stored => 
    searchVariations.some(search => stored === search)
  );
};

interface ScannedProduct {
  id: number;
  name: string;
  barcode: string;
  price: string;
  category_name: string;
  brand: string;
  available_quantity: number;
  quantity: number; // Quantity to sell
}

const QuickSale: React.FC = () => {
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [customerContact, setCustomerContact] = useState('');

  const handleBarcodeScanned = async (barcode: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await apiService.lookupBarcode(barcode);
      const product = response.data;

      // Check if product already exists in cart
      const existingIndex = scannedProducts.findIndex(p => p.id === product.id);
      
      if (existingIndex >= 0) {
        // Increase quantity of existing product
        const updatedProducts = [...scannedProducts];
        updatedProducts[existingIndex].quantity += 1;
        setScannedProducts(updatedProducts);
        setMessage({ type: 'success', text: `Increased quantity for ${product.name}` });
      } else {
        // Add new product to cart
        const newProduct: ScannedProduct = {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          category_name: product.category_name,
          brand: product.brand,
          available_quantity: 100, // This should come from inventory API
          quantity: 1
        };
        setScannedProducts([...scannedProducts, newProduct]);
        setMessage({ type: 'success', text: `Added ${product.name} to cart` });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Product not found';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }

    setScannedProducts(products =>
      products.map(p =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const removeProduct = (productId: number) => {
    setScannedProducts(products => products.filter(p => p.id !== productId));
  };

  const calculateTotal = () => {
    return scannedProducts.reduce((total, product) => {
      return total + (parseFloat(product.price) * product.quantity);
    }, 0);
  };

  const processSale = async () => {
    if (scannedProducts.length === 0) {
      setMessage({ type: 'error', text: 'No products in cart' });
      return;
    }

    // Validate loyalty points payment
    if (paymentMethod === 'LOYALTY_POINTS') {
      if (!customerContact.trim()) {
        setMessage({ type: 'error', text: 'Customer phone number is required for loyalty points payment' });
        return;
      }
      
      // Check if customer exists and has enough points
      try {
        const customersResponse = await apiService.getCustomers();
        const customers = customersResponse.data.results;
        const customer = customers.find((c: any) => 
          phoneNumbersMatch(c.phone_number, customerContact.trim())
        );
        
        if (!customer) {
          setMessage({ type: 'error', text: 'Customer not found. Please register customer first using Customer Lookup.' });
          return;
        }
        
        const totalAmount = calculateTotal();
        const pointsRequired = Math.ceil(totalAmount); // 1 point = KSh 1 value
        
        if (customer.available_points < pointsRequired) {
          setMessage({ 
            type: 'error', 
            text: `Insufficient points. Required: ${pointsRequired} points, Available: ${customer.available_points} points` 
          });
          return;
        }
        
        setMessage({ 
          type: 'success', 
          text: `Using ${pointsRequired} loyalty points (KSh ${totalAmount}) from ${customer.name}` 
        });
        
      } catch (error) {
        console.error('Error checking customer points:', error);
        setMessage({ type: 'error', text: 'Error checking customer points. Please try again.' });
        return;
      }
    }

    setIsProcessingSale(true);
    try {
      // Create sale items data (match Django serializer format)
      const saleItems = scannedProducts.map(product => ({
        product: product.id,
        quantity: product.quantity,
        unit_price: parseFloat(product.price)
      }));

      // Create the sale
      const saleData = {
        items: saleItems,
        payment_method: paymentMethod,
        customer_name: '',
        customer_phone: customerContact,
        notes: paymentMethod === 'LOYALTY_POINTS' ? 'Payment made using loyalty points' : ''
      };

      const response = await apiService.createSale(saleData);
      
      // Store the sale data for receipt generation
      const saleData_receipt = {
        sale_number: response.data.sale_number,
        total_amount: calculateTotal().toString(),
        created_at: new Date().toISOString(),
        payment_method: paymentMethod,
        customer_phone: customerContact,
        items: scannedProducts.map(product => ({
          product_name: product.name,
          quantity: product.quantity,
          unit_price: product.price,
          total_price: (parseFloat(product.price) * product.quantity).toString()
        }))
      };
      
      console.log('🧾 Receipt data being stored:', saleData_receipt);
      setLastSale(saleData_receipt);
      
      // Handle loyalty points redemption
      if (paymentMethod === 'LOYALTY_POINTS' && customerContact.trim()) {
        try {
          const totalAmount = calculateTotal();
          const pointsToRedeem = Math.ceil(totalAmount); // 1 point = KSh 1 value
          
          // Create a negative points transaction to redeem points
          await apiService.awardPoints({
            phone_number: customerContact.trim(),
            sale_amount: -totalAmount, // Negative amount for redemption
            sale_id: response.data.id,
            points_to_redeem: pointsToRedeem
          });
          
          setMessage({ 
            type: 'success', 
            text: `Sale completed! ${pointsToRedeem} loyalty points redeemed (KSh ${totalAmount.toLocaleString()})` 
          });
        } catch (pointsError) {
          console.error('Error redeeming points:', pointsError);
          setMessage({ 
            type: 'success', 
            text: `Sale completed but failed to redeem points. Please manually adjust customer points.` 
          });
        }
      } else {
        setMessage({ type: 'success', text: `Sale completed! Total: KSh ${calculateTotal().toLocaleString()}` });
      }
      
      setScannedProducts([]); // Clear cart
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to process sale';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsProcessingSale(false);
    }
  };

  const clearCart = () => {
    setScannedProducts([]);
    setMessage(null);
    setLastSale(null);
    setPaymentMethod('MPESA');
    setCustomerContact('');
  };

  const handlePrintReceipt = () => {
    if (lastSale) {
      console.log('🖨️ Printing receipt with data:', lastSale);
      console.log('🖨️ Items array:', lastSale.items);
      console.log('🖨️ Payment method:', lastSale.payment_method);
      console.log('🖨️ Customer phone:', lastSale.customer_phone);
      const receiptGenerator = createReceiptGenerator({ saleData: lastSale });
      receiptGenerator.printReceipt();
    } else {
      console.log('❌ No lastSale data available for printing');
    }
  };

  const handleDownloadReceipt = () => {
    if (lastSale) {
      console.log('📥 Downloading receipt with data:', lastSale);
      console.log('📥 Items array:', lastSale.items);
      console.log('📥 Payment method:', lastSale.payment_method);
      console.log('📥 Customer phone:', lastSale.customer_phone);
      const receiptGenerator = createReceiptGenerator({ saleData: lastSale });
      receiptGenerator.downloadReceipt();
    } else {
      console.log('❌ No lastSale data available for downloading');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quick Sale</h2>
        <p className="text-gray-600">Scan products to add them to the sale</p>
      </div>

      {/* Barcode Scanner */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Product</h3>
        <BarcodeScanner 
          onScan={handleBarcodeScanned}
          disabled={isLoading}
          placeholder="Scan barcode to add product..."
        />
        
        {isLoading && (
          <div className="mt-4 flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Looking up product...
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <XCircleIcon className="h-5 w-5 mr-2" />
              )}
              <span>{message.text}</span>
            </div>
            {message.type === 'success' && lastSale && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Print Receipt
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shopping Cart */}
      {scannedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                <ShoppingCartIcon className="inline h-5 w-5 mr-2" />
                Cart ({scannedProducts.length} items)
              </h3>
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Cart
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {scannedProducts.map((product) => (
              <div key={product.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.brand} • {product.category_name}</p>
                    <p className="text-sm text-gray-500">Barcode: {product.barcode}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => updateQuantity(product.id, product.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                        min="0"
                      />
                      <button
                        onClick={() => updateQuantity(product.id, product.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      KSh {parseFloat(product.price).toLocaleString()} each
                    </p>
                    <p className="font-semibold text-gray-900">
                      KSh {(parseFloat(product.price) * product.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-xs text-red-600 hover:text-red-800 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sale Details and Process Sale */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-gray-900">
                KSh {calculateTotal().toLocaleString()}
              </span>
            </div>
            
            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MPESA">M-Pesa</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="LOYALTY_POINTS">Loyalty Points</option>
              </select>
            </div>

            {/* Customer Contact */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Contact (Optional)
              </label>
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="Phone number or email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={processSale}
              disabled={isProcessingSale}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isProcessingSale ? 'Processing Sale...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSale;
