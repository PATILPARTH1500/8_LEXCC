import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowDown, FiArrowRight } from 'react-icons/fi';
import { formatINR } from '../../utils/currency';
import styles from './MobileHome.module.css';

const collections = [
  {
    name: 'Outerwear',
    description: 'Crafted for colder seasons.',
    image: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Oversized Tees',
    description: 'Essential everyday silhouettes.',
    image: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Denim & Cargo',
    description: 'Built for movement and durability.',
    image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=900&auto=format&fit=crop',
  },
];

const reveal = (reduceMotion, delay = 0) => ({
  initial: reduceMotion ? false : { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: reduceMotion ? 0 : 0.5, delay, ease: [0.16, 1, 0.3, 1] },
});

const MobileHome = ({ customers, featuredProducts, instaImages, newsletter }) => {
  const reduceMotion = useReducedMotion();

  const scrollPastHero = () => {
    document.getElementById('mobile-manifesto')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img
          className={styles.heroImage}
          src="https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=1400&auto=format&fit=crop"
          alt="LEXCC Fall Winter 2026 streetwear campaign"
        />
        <div className={styles.heroScrim} />
        <div className={styles.heroContent}>
          <motion.p {...reveal(reduceMotion)} className={styles.eyebrow}>Fall/Winter '26 · Collection 04</motion.p>
          <motion.h1 {...reveal(reduceMotion, 0.06)} className={styles.heroTitle}>
            Define<br />The Standard
          </motion.h1>
          <motion.p {...reveal(reduceMotion, 0.12)} className={styles.heroCopy}>
            A new perspective on modern luxury. Uncompromising proportions, crafted for the culture.
          </motion.p>
          <motion.div {...reveal(reduceMotion, 0.18)} className={styles.heroActions}>
            <Link to="/shop" className={styles.primaryAction}>Shop Collection</Link>
            <button type="button" className={styles.secondaryAction} onClick={() => document.getElementById('mobile-lookbook')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })}>
              Explore Lookbook
            </button>
          </motion.div>
          <motion.div {...reveal(reduceMotion, 0.24)} className={styles.metrics}>
            <div><strong>{customers}K+</strong><span>Global Customers</span></div>
            <div><strong>50+</strong><span>Countries</span></div>
            <div><strong>Weekly</strong><span>Limited Drops</span></div>
          </motion.div>
        </div>
        <button type="button" className={styles.scrollButton} onClick={scrollPastHero} aria-label="Scroll to the next section">
          <span>Scroll</span><FiArrowDown aria-hidden="true" />
        </button>
      </section>

      <section id="mobile-manifesto" className={styles.manifesto}>
        <motion.div {...reveal(reduceMotion)}>
          <p className={styles.sectionEyebrow}>The LEXCC Manifesto</p>
          <h2>Luxury is not about being noticed. It is about being remembered.</h2>
          <p>We build modern streetwear through deliberate silhouettes, premium construction and limited releases.</p>
          <div className={styles.metaRow}><span>Est. 2026</span><span>Global Streetwear</span><span>Limited Drops</span></div>
        </motion.div>
      </section>

      <section className={styles.section}>
        <motion.header {...reveal(reduceMotion)} className={styles.sectionHeader}>
          <div><p className={styles.sectionEyebrow}>Shop by identity</p><h2>Curated Signatures</h2></div>
          <Link to="/shop" className={styles.textLink}>View all <FiArrowRight aria-hidden="true" /></Link>
        </motion.header>
        <div className={styles.collectionRail}>
          {collections.map((item, index) => (
            <motion.article key={item.name} {...reveal(reduceMotion, index * 0.04)} className={styles.collectionCard}>
              <Link to="/shop">
                <img src={item.image} alt={item.name} />
                <div className={styles.cardScrim} />
                <div className={styles.cardContent}>
                  <span>0{index + 1}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.craft}`}>
        <motion.div {...reveal(reduceMotion)} className={styles.craftImage}>
          <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop" alt="LEXCC premium fabric and construction" />
        </motion.div>
        <motion.div {...reveal(reduceMotion, 0.06)} className={styles.craftContent}>
          <p className={styles.sectionEyebrow}>Material & Craftsmanship</p>
          <h2>Built with intention.</h2>
          <p>Heavyweight fabrics and precise finishing give every piece lasting structure and comfort.</p>
          <dl className={styles.specs}>
            <div><dt>Construction</dt><dd>Double-Stitched Seams</dd></div>
            <div><dt>Fabric Weight</dt><dd>Heavyweight 480 GSM</dd></div>
            <div><dt>Process</dt><dd>Premium Pigment Dye</dd></div>
            <div><dt>Guarantee</dt><dd>Built For Longevity</dd></div>
          </dl>
        </motion.div>
      </section>

      <section className={styles.campaign}>
        <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop" alt="LEXCC limited campaign" />
        <div className={styles.campaignScrim} />
        <motion.div {...reveal(reduceMotion)} className={styles.campaignContent}>
          <p className={styles.sectionEyebrow}>Limited Drop</p>
          <h2>Built for the ones who lead.</h2>
          <p>Crafted in limited quantities for absolute exclusivity. Once a collection drops, it belongs to the few who secure it.</p>
          <Link to="/shop" className={styles.primaryAction}>Discover Campaign</Link>
        </motion.div>
      </section>

      <section id="mobile-lookbook" className={styles.section}>
        <motion.header {...reveal(reduceMotion)} className={styles.sectionHeader}>
          <div><p className={styles.sectionEyebrow}>FW26 Visual Study</p><h2>Editorial Lookbook</h2></div>
        </motion.header>
        <div className={styles.lookbookGrid}>
          <motion.figure {...reveal(reduceMotion)}>
            <img src="https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=1200&auto=format&fit=crop" alt="Outerwear editorial" />
            <figcaption>Outerwear Editorial</figcaption>
          </motion.figure>
          <motion.figure {...reveal(reduceMotion, 0.05)}>
            <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop" alt="FW26 campaign" />
            <figcaption>FW26 Campaign</figcaption>
          </motion.figure>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className={styles.section}>
          <motion.header {...reveal(reduceMotion)} className={styles.sectionHeader}>
            <div><p className={styles.sectionEyebrow}>Current Selection</p><h2>Most Wanted</h2></div>
            <Link to="/shop" className={styles.textLink}>Shop all <FiArrowRight aria-hidden="true" /></Link>
          </motion.header>
          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className={styles.productCard}>
                <img src={product.image_url} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{formatINR(product.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <motion.header {...reveal(reduceMotion)} className={styles.sectionHeader}>
          <div><p className={styles.sectionEyebrow}>Global Community</p><h2>@LEXCC Worldwide</h2></div>
        </motion.header>
        <div className={styles.communityGrid}>
          {instaImages.map((image, index) => <img key={image} src={image} alt={`LEXCC community editorial ${index + 1}`} />)}
        </div>
      </section>

      <section className={styles.membership}>
        <motion.div {...reveal(reduceMotion)}>
          <p className={styles.sectionEyebrow}>Members First</p>
          <h2>Private access starts here.</h2>
          <p>Join the list for early access, limited releases and studio notes.</p>
          <form onSubmit={newsletter.subscribe} className={styles.membershipForm}>
            <label htmlFor="mobile-home-email" className={styles.srOnly}>Email address</label>
            <input id="mobile-home-email" type="email" value={newsletter.email} onChange={(event) => newsletter.setEmail(event.target.value)} placeholder="Email address" autoComplete="email" required />
            <button type="submit" disabled={newsletter.status === 'loading'}>{newsletter.status === 'loading' ? 'Joining…' : 'Join'}</button>
          </form>
          {newsletter.message && <p className={`${styles.formMessage} ${newsletter.status === 'error' ? styles.formError : ''}`} role={newsletter.status === 'error' ? 'alert' : 'status'}>{newsletter.message}</p>}
        </motion.div>
      </section>
    </div>
  );
};

export default MobileHome;
