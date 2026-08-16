export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initiatePayment = async (orderData, handlers) => {
  const res = await loadRazorpay();

  if (!res) {
    throw new Error('Razorpay checkout could not be loaded. Please check your connection.');
  }

  if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
    throw new Error('Razorpay checkout is not configured.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = async (error) => {
      if (settled) return;
      settled = true;
      try {
        if (handlers.onFailure) await handlers.onFailure(error);
      } finally {
        reject(error instanceof Error ? error : new Error(error?.description || 'Payment was not completed'));
      }
    };

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'LEXCC',
      description: 'Order Checkout',
      order_id: orderData.razorpayOrderId,
      handler: async (response) => {
        if (settled) return;
        try {
          const result = handlers.onSuccess ? await handlers.onSuccess(response) : response;
          settled = true;
          resolve(result);
        } catch (error) {
          await fail(error);
        }
      },
      modal: {
        ondismiss: () => fail(new Error('Payment was cancelled.'))
      },
      prefill: {
        name: orderData.customerName || '',
        email: orderData.customerEmail || '',
        contact: orderData.customerPhone || ''
      },
      notes: {
        address: 'LEXCC Corporate Office'
      },
      theme: {
        color: '#D4AF37'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', (response) => fail(response.error));
    paymentObject.open();
  });
};
