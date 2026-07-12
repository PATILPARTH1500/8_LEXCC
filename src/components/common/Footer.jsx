import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';
import styles from './Footer.module.css';

const Footer = () => {
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
              <a href="#" className={styles.socialIcon}><FiInstagram size={20} /></a>
              <a href="#" className={styles.socialIcon}><FiTwitter size={20} /></a>
              <a href="#" className={styles.socialIcon}><FiFacebook size={20} /></a>
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
              <li><Link to="/faq" className={styles.link}>FAQ</Link></li>
              <li><Link to="/shipping" className={styles.link}>Shipping & Returns</Link></li>
              <li><Link to="/track-order" className={styles.link}>Track Order</Link></li>
              <li><Link to="/contact" className={styles.link}>Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.colTitle}>Newsletter</h3>
            <p className={styles.newsletterDesc}>Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className={styles.form}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn}>
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} LEXCC. All rights reserved.
          </p>
          <div className={styles.legalLinks}>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
