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
    const { type, order, customerName, email, trackingNumber, carrier } = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured")
    }

    if (type !== 'order_shipped') {
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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LEXCC <orders@lexcc.com>',
        to: email,
        subject: 'Your LEXCC Order Has Been Shipped',
        html: `
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
        `
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
