import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
import styles from './MobileFooter.module.css';

const MobileFooter = ({ newsletter }) => (
  <footer className={styles.footer}>
    <div className={styles.brandBlock}>
      <h2 className={styles.brand}>LEXCC</h2>
      <p className={styles.tagline}>Own The Streets. Define The Standard.</p>
      <div className={styles.socials}>
        <a href="https://www.instagram.com/lexcc.in/" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on Instagram"><FiInstagram /></a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on X"><FiTwitter /></a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on Facebook"><FiFacebook /></a>
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
        <span>FAQ — Coming soon</span>
        <span>Shipping & Returns — Coming soon</span>
        <Link to="/account/orders">Track Order</Link>
        <span>Contact Us — Coming soon</span>
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
      <p>Privacy & Terms — Coming soon</p>
    </div>
  </footer>
);

export default MobileFooter;
