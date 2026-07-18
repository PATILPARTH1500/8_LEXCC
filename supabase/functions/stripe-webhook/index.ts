import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  
  if (!signature || !endpointSecret) {
    return new Response('Webhook Secret or Signature missing', { status: 400 });
  }

  try {
    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata;

      if (metadata && metadata.order_number) {
        
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('id, payment_status')
          .eq('order_number', metadata.order_number)
          .single();

        if (fetchError || !order) {
          throw new Error('Order not found');
        }

        if (order.payment_status === 'paid') {
          console.log(`Order ${metadata.order_number} already processed. Acknowledging duplicate webhook.`);
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        // 1. ATOMIC INVENTORY DEDUCTION (Overselling Protection)
        const { data: items } = await supabase
          .from('order_items')
          .select('variant_id, quantity')
          .eq('order_id', order.id);
          
        let allItemsAvailable = true;
        
        if (items) {
          for (const item of items) {
            if (item.variant_id) {
               const { data: success, error: rpcError } = await supabase.rpc('deduct_variant_stock', { 
                 p_variant_id: item.variant_id, 
                 p_quantity: item.quantity 
               });
               
               if (rpcError || !success) {
                 allItemsAvailable = false;
                 console.error(`Oversell detected for variant ${item.variant_id}. Order ${metadata.order_number}`);
                 // In a production system, you would immediately issue a Stripe refund here
                 // await stripe.refunds.create({ payment_intent: paymentIntent.id });
               }
            }
          }
        }

        if (allItemsAvailable) {
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid', 
              status: 'processing',
              stripe_payment_intent_id: paymentIntent.id
            })
            .eq('id', order.id)
            .eq('payment_status', 'pending');
        } else {
          // If oversold, mark as backordered and save intent ID for manual refund/fulfillment
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid_backordered', 
              status: 'exception',
              stripe_payment_intent_id: paymentIntent.id
            })
            .eq('id', order.id);
        }
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;
      
      if (paymentIntentId) {
        // 2. REFUND HANDLING & RESTOCK
        const { data: order } = await supabase
          .from('orders')
          .select('id, payment_status')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();
          
        if (order && order.payment_status !== 'refunded') {
          await supabase
            .from('orders')
            .update({ payment_status: 'refunded', status: 'cancelled' })
            .eq('id', order.id);
            
          const { data: items } = await supabase
            .from('order_items')
            .select('variant_id, quantity')
            .eq('order_id', order.id);
            
          if (items) {
            for (const item of items) {
              if (item.variant_id) {
                 await supabase.rpc('restore_variant_stock', { 
                   p_variant_id: item.variant_id, 
                   p_quantity: item.quantity 
                 });
              }
            }
          }
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
       const metadata = event.data.object.metadata;
       const paymentIntentId = event.data.object.id;
       if (metadata && metadata.order_number) {
         await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            stripe_payment_intent_id: paymentIntentId 
          })
          .eq('order_number', metadata.order_number);
       }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    );
  }
});
