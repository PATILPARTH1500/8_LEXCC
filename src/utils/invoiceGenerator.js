import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { formatINR } from './currency';

export const generateInvoice = async (orderId, guestAccessToken = null) => {
  try {
    // Fetch through an authorization-aware Edge Function so guest access does not
    // require weakening order RLS.
    const { data, error } = await supabase.functions.invoke('get-order-invoice', {
      body: { orderId, guestAccessToken }
    });

    if (error) throw error;
    const order = data?.order;
    if (!order) throw new Error('Order not found');

    // 2. Initialize PDF Document
    const doc = new jsPDF();
    
    // Formatting variables
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    let currentY = 20;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0); // Black for LEXCC
    doc.text('LEXCC', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('www.lexcc.in', margin, currentY + 6);
    
    // Invoice Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55); // Accent Gold
    const invoiceText = 'INVOICE';
    const invoiceTextWidth = doc.getTextWidth(invoiceText);
    doc.text(invoiceText, pageWidth - margin - invoiceTextWidth, currentY);
    
    currentY += 25;

    // --- Order Details ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const invoiceDate = new Date().toLocaleDateString();
    const orderDate = new Date(order.created_at).toLocaleDateString();
    const invoiceNo = `INV-${order.order_number}`;
    
    // Left column: Order Info
    doc.text(`Invoice No: ${invoiceNo}`, margin, currentY);
    doc.text(`Order No: ${order.order_number}`, margin, currentY + 6);
    doc.text(`Order Date: ${orderDate}`, margin, currentY + 12);
    doc.text(`Invoice Date: ${invoiceDate}`, margin, currentY + 18);
    
    // Right column: Customer Info
    const customerX = pageWidth / 2 + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', customerX, currentY);
    doc.setFont('helvetica', 'normal');
    
    const customer = Array.isArray(order.user) ? order.user[0] : order.user;
    const customerName = customer
      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
      : `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || 'Guest Customer';
    const customerEmail = customer?.email || order.shipping_address?.email || 'N/A';
    doc.text(customerName, customerX, currentY + 6);
    doc.text(customerEmail, customerX, currentY + 12);

    // Shipping Address
    let addrLines = [];
    if (order.shipping_address) {
      const s = order.shipping_address;
      if (s.street) addrLines.push(s.street);
      if (s.address_line_2) addrLines.push(s.address_line_2);
      if (s.city || s.state || s.postal_code) {
        addrLines.push(`${s.city || ''} ${s.state || ''} ${s.postal_code || ''}`.trim());
      }
      if (s.country) addrLines.push(s.country);
      if (s.phone) addrLines.push(`Phone: ${s.phone}`);
    }

    if (addrLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Shipping Address:', customerX, currentY + 22);
      doc.setFont('helvetica', 'normal');
      let addrY = currentY + 28;
      addrLines.forEach(line => {
        doc.text(line, customerX, addrY);
        addrY += 6;
      });
    }

    currentY += Math.max(40, 22 + (addrLines.length * 6) + 10);

    // --- Table of Items ---
    const tableColumn = ["Product", "Variant", "Quantity", "Unit Price", "Total"];
    const tableRows = [];

    order.items?.forEach(item => {
      const product = Array.isArray(item.product) ? item.product[0] : item.product;
      const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant;
      const productName = product?.name || 'Unknown Product';
      let variantStr = '-';
      if (variant) {
        variantStr = `${variant.size || ''} / ${variant.color || ''}`.replace(/^\s*\/\s*|\s*\/\s*$/g, '');
      }
      const quantity = item.quantity.toString();
      const unitPrice = formatINR(item.price_at_time);
      const total = formatINR(item.price_at_time * item.quantity);
      
      tableRows.push([productName, variantStr, quantity, unitPrice, total]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 6,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [10, 10, 10], // Dark header
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // --- Totals ---
    const summaryX = pageWidth - margin - 60;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, currentY);
    doc.text(formatINR(order.total_amount), pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 8;
    
    // Since there's no dedicated discount/tax/shipping fields in the schema currently, 
    // we'll assume total_amount is final. If added later, expand here.
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', summaryX, currentY);
    doc.text(formatINR(order.total_amount), pageWidth - margin, currentY, { align: 'right' });

    currentY += 20;

    // --- Payment Info ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment Status:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    // uppercase status
    const pStatus = (order.payment_status || 'Pending').toUpperCase();
    doc.text(pStatus, margin + 35, currentY);
    
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    const pMethod = order.razorpay_payment_id ? 'Razorpay (Card/UPI/NetBanking)' : 'Online Payment';
    doc.text(pMethod, margin + 35, currentY);

    if (order.razorpay_payment_id) {
      currentY += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction ID:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(order.razorpay_payment_id, margin + 35, currentY);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const footerText = 'Thank you for shopping with LEXCC. This is a computer generated invoice.';
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Save PDF
    doc.save(`${invoiceNo}.pdf`);
    
    return true;
  } catch (err) {
    console.error('Invoice generation failed:', err);
    throw err;
  }
};
