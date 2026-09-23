import { Link } from 'react-router-dom';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '../../config/support';
import styles from './SupportPage.module.css';

const Contact = () => <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp {SUPPORT_PHONE}</a>;
const Assistance = () => <p>For eligibility and assistance, contact LEXCC support. <Contact /></p>;

const pages = {
  faq: {
    title: 'FAQ',
    intro: 'Help with your order, delivery, and finding the right fit.',
    sections: [
      { title: 'How long does delivery take?', body: <p>Delivery timing depends on your destination and the items ordered. Contact support for an estimate for your order. <Contact /></p> },
      { title: 'Do you offer Cash on Delivery?', body: <p>Cash on Delivery is available as a checkout payment option. Check the options shown for your order before confirming it.</p> },
      { title: 'How can I track my order?', body: <p>Sign in to <Link to="/account/orders">My Orders</Link> to view your order status and any available carrier and tracking details. For help locating an order, <Contact />.</p> },
      { title: 'Can I cancel my order?', body: <p>Cancellation depends on the payment method and current order status. Contact support with your order number to check whether cancellation is possible. <Contact /></p> },
      { title: 'How do returns/exchanges work?', body: <p>Visit <Link to="/shipping-returns">Shipping & Returns</Link>. For eligibility and assistance, contact LEXCC support before sending an item back. <Contact /></p> },
      { title: 'How do I choose the correct size?', body: <p>Use the size options and any sizing guidance on the product page. Footwear sizes are labelled in UK sizes. If you are unsure, contact support with the product name and your usual size. <Contact /></p> },
      { title: 'How can I contact LEXCC?', body: <p>Message us on <Contact />. Include your order number or the product name so we can help. Never share your password, OTP, or full payment details.</p> },
    ],
  },
  shipping: {
    title: 'Shipping & Returns',
    intro: 'Information to help you manage your delivery or request assistance.',
    sections: [
      { title: 'Shipping', body: <p>Delivery availability and timing depend on your location and the items ordered. Review the information available at checkout, or contact support for help with your destination.</p> },
      { title: 'Order Processing', body: <p>After placing an order, check its status in your account. Contact support with your order number if you need an update or want to request a change before dispatch.</p> },
      { title: 'Order Tracking', body: <p>Visit <Link to="/account/orders">My Orders</Link> after signing in. Carrier and tracking details appear there when available.</p> },
      { title: 'Returns / Exchanges', body: <><p>Contact support with your order number and the reason for your request before sending an item back. Support can confirm the applicable eligibility and next steps.</p><Assistance /></> },
      { title: 'Damaged / Incorrect Orders', body: <p>If your order arrives damaged or contains an incorrect item, contact support with your order number and photos of the item and packaging. Keep the packaging while support reviews your request.</p> },
      { title: 'Contact Support', body: <Assistance /> },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'How information is used when you shop with LEXCC or contact support.',
    sections: [
      { title: 'Information you provide', body: <p>Account, order, and support features use information you provide, such as your name, contact details, delivery address, and order information. Newsletter signup uses the email address you submit.</p> },
      { title: 'How information is used', body: <p>Information is used to operate your account, process and fulfil orders, respond to support requests, and send newsletter updates when you subscribe.</p> },
      { title: 'Service providers', body: <p>The store uses services for account and order storage, payments, and delivery. Information needed for these services may be processed by the relevant providers. Online payments are handled through the payment provider shown at checkout.</p> },
      { title: 'Browser storage and external links', body: <p>The website uses browser storage for features such as your sign-in session and cart. Links to WhatsApp and Instagram open external services, which have their own privacy policies.</p> },
      { title: 'Privacy questions', body: <p>For questions about your information, or requests relating to your account data or newsletter subscription, contact <Contact />. Do not send passwords, OTPs, or full payment details.</p> },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'General information about using the LEXCC store and placing an order.',
    sections: [
      { title: 'Using the store', body: <p>Provide accurate contact and delivery details when ordering. Keep your account credentials private and contact support if you need help with an account or order.</p> },
      { title: 'Products and orders', body: <p>Review the product description, selected size, colour, quantity, and price before confirming your order. Availability is checked during checkout. Contact support if you notice an error in your order details.</p> },
      { title: 'Payments', body: <p>Use a payment option offered at checkout and review the order total before confirming. Check your order status in your account and contact support if a payment or order confirmation needs clarification.</p> },
      { title: 'Delivery, cancellation, and returns', body: <><p>See <Link to="/shipping-returns">Shipping & Returns</Link> for assistance. Cancellation and return requests need to be checked against the current order status and applicable eligibility.</p><Assistance /></> },
      { title: 'Support', body: <p>For questions about these terms or your order, contact <Contact />.</p> },
    ],
  },
};

export default function SupportPage({ page }) {
  const content = pages[page];
  return (
    <article className={styles.page}>
      <Link to="/" className={styles.back}>Back to LEXCC</Link>
      <h1>{content.title}</h1>
      <p className={styles.intro}>{content.intro}</p>
      {content.sections.map(({ title, body }) => (
        <section className={styles.section} key={title}>
          <h2>{title}</h2>
          {body}
        </section>
      ))}
    </article>
  );
}
