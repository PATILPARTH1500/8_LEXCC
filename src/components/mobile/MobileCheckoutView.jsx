import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiCheck, FiLock } from 'react-icons/fi';
import SEO from '../common/SEO';
import { formatINR } from '../../utils/currency';
import styles from './MobileCheckoutView.module.css';
import { INDIAN_STATES } from '../../utils/address';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop';
// Guest fields defined explicitly inline instead of array mapping to support dropdown


const OrderSummary = ({ cartItems, cartTotal }) => (
  <aside className={styles.summary} aria-labelledby="mobile-order-summary-title">
    <h2 id="mobile-order-summary-title">Order summary</h2>
    <div className={styles.summaryItems}>
      {cartItems.map((item) => (
        <article key={item.id}>
          <div className={styles.summaryImage}>
            <img src={item.product.image_url || DEFAULT_IMAGE} alt={item.product.name} />
            <span>{item.quantity}</span>
          </div>
          <div><h3>{item.product.name}</h3><p>{item.variant?.size && `Size ${item.variant.size}`}{item.variant?.color ? ` · ${item.variant.color}` : ''}</p></div>
          <strong>{formatINR(item.product.price * item.quantity)}</strong>
        </article>
      ))}
    </div>
    <dl>
      <div><dt>Subtotal</dt><dd>{formatINR(cartTotal)}</dd></div>
      <div><dt>Shipping</dt><dd>Complimentary</dd></div>
      <div><dt>Estimated tax</dt><dd>{formatINR(0)}</dd></div>
      <div className={styles.summaryTotal}><dt>Total</dt><dd>{formatINR(cartTotal)}</dd></div>
    </dl>
  </aside>
);

const MobileCheckoutView = ({
  addresses,
  cartItems,
  cartTotal,
  checkoutError,
  downloadingOrderId,
  guestAddress,
  internalOrderId,
  isProcessingPayment,
  loadingAddresses,
  onAddressSelect,
  onDownloadInvoice,
  onGuestAddressChange,
  onNext,
  onPayment,
  onStepChange,
  orderId,
  selectedAddressId,
  selectedShippingAddress,
  step,
  user,
}) => {
  const reduceMotion = useReducedMotion();

  if (step === 4) {
    return (
      <main className={styles.confirmation} id="main-content">
        <SEO title="Order Confirmed" />
        <div className={styles.confirmIcon}><FiCheck aria-hidden="true" /></div>
        <p>Payment complete</p>
        <h1>Order confirmed</h1>
        <span>Thank you for your purchase.</span>
        <strong>Order number: {orderId}</strong>
        {checkoutError && <p className={styles.warning} role="status">{checkoutError}</p>}
        <section>
          <h2>Tracking information</h2>
          <p>Your order is processing. Tracking details will be sent when your items ship.</p>
        </section>
        <div className={styles.confirmActions}>
          <Link to="/shop">Continue shopping</Link>
          {user && <Link to="/account/orders">View orders</Link>}
          {internalOrderId && (
            <button type="button" onClick={onDownloadInvoice} disabled={downloadingOrderId === internalOrderId}>
              {downloadingOrderId === internalOrderId ? 'Generating…' : 'Download invoice'}
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page} id="main-content">
      <SEO title="Checkout" />
      <header className={styles.header}>
        <p>LEXCC / Secure checkout</p>
        <h1>Checkout</h1>
      </header>

      <ol className={styles.steps} aria-label="Checkout progress">
        {['Shipping', 'Review', 'Payment'].map((label, index) => (
          <li key={label} className={step === index + 1 ? styles.stepActive : step > index + 1 ? styles.stepDone : ''} aria-current={step === index + 1 ? 'step' : undefined}>
            <span>{step > index + 1 ? <FiCheck /> : index + 1}</span>{label}
          </li>
        ))}
      </ol>

      {checkoutError && <p className={styles.error} role="alert">{checkoutError}</p>}

      <div className={styles.layout}>
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            className={styles.flow}
            initial={reduceMotion ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            {step === 1 && (
              <>
                <div className={styles.sectionTitle}><p>Step 01</p><h2>Shipping address</h2></div>
                {loadingAddresses ? (
                  <div className={styles.loading} aria-live="polite">Loading saved addresses…</div>
                ) : !user ? (
                  <div className={styles.card}>
                    <p className={styles.intro}>Enter your delivery details, or <Link to="/login">log in</Link> to use a saved address.</p>
                    <div className={styles.formGrid}>
                      <label><span>First name</span><input name="first_name" type="text" value={guestAddress.first_name} onChange={onGuestAddressChange} required /></label>
                      <label><span>Last name</span><input name="last_name" type="text" value={guestAddress.last_name} onChange={onGuestAddressChange} required /></label>
                      <label><span>Email address</span><input name="email" type="email" value={guestAddress.email} onChange={onGuestAddressChange} required /></label>
                      <label><span>Phone number</span><input name="phone" type="tel" value={guestAddress.phone} onChange={onGuestAddressChange} required /></label>
                      <label className={styles.fullField}><span>Address Line 1 (Street)</span><input name="street" type="text" value={guestAddress.street} onChange={onGuestAddressChange} maxLength={180} required /></label>
                      <label className={styles.fullField}><span>Address Line 2 (Optional)</span><input name="address_line_2" type="text" value={guestAddress.address_line_2} onChange={onGuestAddressChange} maxLength={180} /></label>
                      <label><span>City</span><input name="city" type="text" value={guestAddress.city} onChange={onGuestAddressChange} required /></label>
                      <label>
                        <span>State</span>
                        <select name="state" value={guestAddress.state} onChange={onGuestAddressChange} required style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                        </select>
                      </label>
                      <label><span>PIN Code</span><input name="postal_code" type="text" value={guestAddress.postal_code} onChange={onGuestAddressChange} maxLength={6} required /></label>
                      <label><span>Country</span><input name="country" type="text" value="India" readOnly /></label>
                    </div>
                    <button type="button" className={styles.primary} onClick={onNext}>Continue as guest</button>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className={styles.card}>
                    <p className={styles.intro}>You do not have a saved shipping address yet.</p>
                    <Link className={styles.secondaryLink} to="/account/addresses">Add an address</Link>
                  </div>
                ) : (
                  <>
                    <div className={styles.addresses} role="radiogroup" aria-label="Choose shipping address">
                      {addresses.map((address) => (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selectedAddressId === address.id}
                          key={address.id}
                          className={selectedAddressId === address.id ? styles.addressActive : styles.address}
                          onClick={() => onAddressSelect(address.id)}
                        >
                          <span>{address.title || 'Address'}</span>
                          <strong>{address.first_name} {address.last_name}</strong>
                          {address.phone && <p>{address.phone}</p>}
                          <p>{address.street}<br />{address.address_line_2 && <>{address.address_line_2}<br /></>}{address.city}, {address.state} {address.postal_code}<br />{address.country}</p>
                        </button>
                      ))}
                    </div>
                    <button type="button" className={styles.primary} onClick={onNext}>Continue to review</button>
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.sectionTitle}><p>Step 02</p><h2>Review order</h2></div>
                <div className={styles.card}>
                  <div className={styles.cardHeading}><h3>Shipping to</h3><button type="button" onClick={() => onStepChange(1)}>Edit</button></div>
                  {selectedShippingAddress ? (
                    <address>
                      <strong>{selectedShippingAddress.first_name} {selectedShippingAddress.last_name}</strong><br />
                      {selectedShippingAddress.phone}<br />
                      {selectedShippingAddress.street}<br />
                      {selectedShippingAddress.address_line_2 && <>{selectedShippingAddress.address_line_2}<br /></>}
                      {selectedShippingAddress.city}, {selectedShippingAddress.state} {selectedShippingAddress.postal_code}<br />
                      {selectedShippingAddress.country}
                      {!user && <><br />{selectedShippingAddress.email}</>}
                    </address>
                  ) : <p>No address selected.</p>}
                </div>
                <div className={styles.card}>
                  <div className={styles.cardHeading}><h3>Shipping method</h3><strong>Complimentary</strong></div>
                  <p className={styles.method}>Standard delivery <span>3–5 business days</span></p>
                </div>
                <div className={styles.buttonRow}>
                  <button type="button" className={styles.primary} onClick={onNext}>Continue to payment</button>
                  <button type="button" className={styles.secondary} onClick={() => onStepChange(1)}>Back</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className={styles.sectionTitle}><p>Step 03</p><h2>Secure payment</h2></div>
                <div className={styles.card}>
                  <FiLock className={styles.lock} aria-hidden="true" />
                  <h3>Protected checkout</h3>
                  <p className={styles.intro}>You will be securely redirected to our payment provider to complete your purchase.</p>
                  <button type="button" className={styles.primary} onClick={onPayment} disabled={isProcessingPayment}>
                    {isProcessingPayment ? 'Processing…' : `Pay ${formatINR(cartTotal)} securely`}
                  </button>
                </div>
                <button type="button" className={styles.secondary} onClick={() => onStepChange(2)} disabled={isProcessingPayment}>Back</button>
              </>
            )}
          </motion.section>
        </AnimatePresence>

        <OrderSummary cartItems={cartItems} cartTotal={cartTotal} />
      </div>
    </main>
  );
};

export default MobileCheckoutView;
