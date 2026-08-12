import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const { type, order, customerName, email, trackingNumber, carrier, items, totalAmount, shippingAddress, orderDate } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured")
    }

    if (type !== 'order_shipped' && type !== 'order_confirmed') {
       return new Response(JSON.stringify({ error: 'Unsupported email type' }), {
         headers: { ...headers, 'Content-Type': 'application/json' },
         status: 400,
       })
    }

    const trackingLink = trackingNumber ? (
      carrier?.toLowerCase().includes('blue dart') || carrier?.toLowerCase().includes('bluedart')
        ? `https://www.bluedart.com/tracking?track=${trackingNumber}`
        : `https://www.google.com/search?q=${trackingNumber}+tracking`
    ) : '#'

    let emailSubject = '';
    let emailHtml = '';

    if (type === 'order_shipped') {
      emailSubject = 'Your LEXCC Order Has Been Shipped';
      emailHtml = `
        <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; text-align: center;">
          <h1 style="color: #D4AF37; text-transform: uppercase; letter-spacing: 2px;">LEXCC</h1>
          <p style="font-size: 16px; margin-top: 20px;">Dear ${customerName},</p>
          <p style="font-size: 16px; color: #ccc;">Your luxury order <strong>#${order}</strong> has been shipped.</p>
          
          <div style="margin: 30px 0; padding: 20px; border: 1px solid #333; display: inline-block; text-align: left;">
            <p style="margin: 5px 0; color: #ccc;"><strong>Carrier:</strong> <span style="color: #fff;">${carrier}</span></p>
            <p style="margin: 5px 0; color: #ccc;"><strong>Tracking Number:</strong> <span style="color: #fff;">${trackingNumber}</span></p>
          </div>
          
          <br/>
          <a href="${trackingLink}" style="background-color: #D4AF37; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-top: 20px;">Track Shipment</a>
          
          <p style="margin-top: 60px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Own The Streets. Define The Standard.</p>
        </div>
      `;
    } else if (type === 'order_confirmed') {
      
      const itemsHtml = items && Array.isArray(items) ? items.map((item: any) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #333;">
          <div>
            <p style="margin: 0; color: #fff;">${item.name || 'Product'}</p>
            <p style="margin: 0; font-size: 12px; color: #888;">Qty: ${item.quantity}</p>
          </div>
        </div>
      `).join('') : '<p>Order items details</p>';

      emailSubject = 'Order Confirmation - LEXCC';
      emailHtml = `
        <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; text-align: center;">
          <h1 style="color: #D4AF37; text-transform: uppercase; letter-spacing: 2px;">LEXCC</h1>
          <p style="font-size: 16px; margin-top: 20px;">Dear ${customerName},</p>
          <p style="font-size: 16px; color: #ccc;">Thank you for your purchase. Your luxury order <strong>#${order}</strong> has been confirmed.</p>
          
          <div style="margin: 30px auto; padding: 20px; border: 1px solid #333; display: block; text-align: left; max-width: 500px;">
            <p style="margin: 5px 0; color: #ccc;"><strong>Order Date:</strong> <span style="color: #fff;">${orderDate ? new Date(orderDate).toLocaleDateString() : 'N/A'}</span></p>
            <p style="margin: 5px 0; color: #ccc;"><strong>Total Amount:</strong> <span style="color: #D4AF37;">₹${totalAmount}</span></p>
            
            <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
              <h3 style="color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
              ${itemsHtml}
            </div>

            <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
              <h3 style="color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Shipping To</h3>
              <p style="margin: 5px 0; color: #ccc; font-size: 14px;">${shippingAddress || 'Address on file'}</p>
            </div>
          </div>
          
          <p style="margin-top: 40px; font-size: 14px; color: #ccc;">You will receive another email when your order has been shipped.</p>
          
          <p style="margin-top: 60px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Own The Streets. Define The Standard.</p>
        </div>
      `;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LEXCC <orders@lexcc.com>',
        to: email,
        subject: emailSubject,
        html: emailHtml
      })
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
