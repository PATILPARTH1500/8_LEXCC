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
    alert('Razorpay SDK failed to load. Are you online?');
    if (handlers.onError) handlers.onError(new Error('SDK load failed'));
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
    amount: orderData.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: orderData.currency || "INR",
    name: "LEXCC",
    description: "Order Checkout",
    order_id: orderData.razorpayOrderId, // This is a sample Order ID. Pass the `id` obtained in the response of create-razorpay-order
    handler: function (response) {
      if (handlers.onSuccess) {
        handlers.onSuccess(response);
      }
    },
    prefill: {
      name: orderData.customerName || "",
      email: orderData.customerEmail || "",
      contact: orderData.customerPhone || ""
    },
    notes: {
      address: "LEXCC Corporate Office"
    },
    theme: {
      color: "#D4AF37"
    }
  };

  const paymentObject = new window.Razorpay(options);
  
  paymentObject.on('payment.failed', function (response) {
    if (handlers.onFailure) {
      handlers.onFailure(response.error);
    }
  });

  paymentObject.open();
};
