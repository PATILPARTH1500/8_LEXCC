import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';
import { useNewsletterSubscription } from '../../hooks/useNewsletterSubscription';
import styles from './Footer.module.css';
import MobileFooter from '../mobile/MobileFooter';
import { useResponsive } from '../../contexts/ResponsiveContext';

const Footer = () => {
  const newsletter = useNewsletterSubscription('footer');
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <MobileFooter newsletter={newsletter} />;
  }

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <h2 className={styles.brandName}>LEXCC</h2>
            <p className={styles.brandDesc}>
              Own The Streets. Define The Standard. Premium streetwear crafted for those who dictate the culture.
            </p>
            <div className={styles.socials}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on Instagram" className={styles.socialIcon}><FiInstagram size={20} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on X" className={styles.socialIcon}><FiTwitter size={20} /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="LEXCC on Facebook" className={styles.socialIcon}><FiFacebook size={20} /></a>
            </div>
          </div>
          
          <div>
            <h3 className={styles.colTitle}>Shop</h3>
            <ul className={styles.linkList}>
              <li><Link to="/shop?category=new" className={styles.link}>New Arrivals</Link></li>
              <li><Link to="/shop?category=hoodies" className={styles.link}>Hoodies & Sweatshirts</Link></li>
              <li><Link to="/shop?category=tshirts" className={styles.link}>Oversized Tees</Link></li>
              <li><Link to="/shop?category=bottoms" className={styles.link}>Cargo & Denim</Link></li>
              <li><Link to="/shop?category=sneakers" className={styles.link}>Sneakers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.colTitle}>Support</h3>
            <ul className={styles.linkList}>
              <li><span className={styles.linkPending} title="Support page coming soon">FAQ — Coming soon</span></li>
              <li><span className={styles.linkPending} title="Support page coming soon">Shipping & Returns — Coming soon</span></li>
              <li><Link to="/account/orders" className={styles.link}>Track Order</Link></li>
              <li><span className={styles.linkPending} title="Support page coming soon">Contact Us — Coming soon</span></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.colTitle}>Newsletter</h3>
            <p className={styles.newsletterDesc}>Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className={styles.form} onSubmit={newsletter.subscribe}>
              <label htmlFor="footer-newsletter-email" className={styles.srOnly}>Email address</label>
              <input 
                id="footer-newsletter-email"
                type="email" 
                placeholder="Enter your email address" 
                className={styles.input}
                value={newsletter.email}
                onChange={(event) => newsletter.setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <button type="submit" className={styles.submitBtn} disabled={newsletter.status === 'loading'}>
                {newsletter.status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {newsletter.message && (
              <p className={`${styles.formMessage} ${newsletter.status === 'error' ? styles.formMessageError : ''}`} role={newsletter.status === 'error' ? 'alert' : 'status'}>
                {newsletter.message}
              </p>
            )}
          </div>
        </div>
        
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} LEXCC. All rights reserved.
          </p>
          <div className={styles.legalLinks}>
            <span className={styles.legalPending}>Privacy Policy — Coming soon</span>
            <span className={styles.legalPending}>Terms of Service — Coming soon</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
