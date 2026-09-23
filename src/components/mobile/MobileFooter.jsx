import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram } from 'react-icons/fi';
import { SUPPORT_PHONE, SUPPORT_PHONE_URL, SUPPORT_WHATSAPP_URL } from '../../config/support';
import styles from './MobileFooter.module.css';

const MobileFooter = ({ newsletter }) => (
  <footer className={styles.footer}>
    <div className={styles.brandBlock}>
      <h2 className={styles.brand}>LEXCC</h2>
      <p className={styles.tagline}>Own The Streets. Define The Standard.</p>
      <div className={styles.socials}>
        <a href="https://www.instagram.com/lexcc.in/" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on Instagram"><FiInstagram /></a>
      </div>
    </div>

    <details className={styles.group} open>
      <summary>Shop</summary>
      <div className={styles.links}>
        <Link to="/shop?filter=new">New Arrivals</Link>
        <Link to="/shop?category=hoodies">Hoodies & Sweatshirts</Link>
        <Link to="/shop?category=tshirts">Oversized Tees</Link>
        <Link to="/shop?category=bottoms">Cargo & Denim</Link>
        <Link to="/shop?category=sneakers">Sneakers</Link>
      </div>
    </details>

    <details className={styles.group}>
      <summary>Support</summary>
      <div className={styles.links}>
        <Link to="/faq">FAQ</Link>
        <Link to="/shipping-returns">Shipping & Returns</Link>
        <Link to="/account/orders">Track Order</Link>
        <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Contact Us</a>
        <a href={SUPPORT_PHONE_URL}>{SUPPORT_PHONE}</a>
      </div>
    </details>

    <div className={styles.newsletter}>
      <h3>Private Access</h3>
      <p>Receive drop updates and members-only releases.</p>
      <form onSubmit={newsletter.subscribe}>
        <label htmlFor="mobile-footer-email" className={styles.srOnly}>Email address</label>
        <input
          id="mobile-footer-email"
          type="email"
          value={newsletter.email}
          onChange={(event) => newsletter.setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          required
        />
        <button type="submit" disabled={newsletter.status === 'loading'}>
          {newsletter.status === 'loading' ? 'Joining…' : 'Join'}
        </button>
      </form>
      {newsletter.message && (
        <p className={`${styles.message} ${newsletter.status === 'error' ? styles.error : ''}`} role={newsletter.status === 'error' ? 'alert' : 'status'}>
          {newsletter.message}
        </p>
      )}
    </div>

    <div className={styles.bottom}>
      <p>&copy; {new Date().getFullYear()} LEXCC</p>
      <div className={styles.legalLinks}>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms">Terms & Conditions</Link>
      </div>
    </div>
  </footer>
);

export default MobileFooter;
