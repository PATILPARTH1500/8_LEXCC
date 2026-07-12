import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Home.module.css';

// React Bits Components
import SplitText from '../components/animations/SplitText';
import Spotlight from '../components/animations/Spotlight';
import CurvedLoop from '../components/animations/CurvedLoop';
import TextReveal from '../components/animations/TextReveal';
import ClickSpark from '../components/animations/ClickSpark';
import BounceCards from '../components/animations/BounceCards';
import DomeGallery from '../components/animations/DomeGallery';

gsap.registerPlugin(ScrollTrigger);

// Muted, cohesive luxury editorial imagery
const dummyProducts = [
  { id: 1, name: "Signature Oversized Hoodie", price: "$240", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop" },
  { id: 2, name: "Heavyweight Box Tee", price: "$120", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop" },
  { id: 3, name: "Washed Cargo Denim", price: "$350", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Mohair Cardigan", price: "$480", img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop" },
];

const bounceImages = [
  { src: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400&auto=format&fit=crop", label: "Cotton" },
  { src: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400&auto=format&fit=crop", label: "Fleece" },
  { src: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400&auto=format&fit=crop", label: "Denim" },
  { src: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=400&auto=format&fit=crop", label: "Mohair" },
  { src: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=400&auto=format&fit=crop", label: "Nylon" },
];

const domeImages = [
  "https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1475179515904-946777b7cc8b?q=80&w=1600&auto=format&fit=crop",
];

const instaImages = [
  "https://images.unsplash.com/photo-1529139574466-a303027c028b?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618886487325-f66503261dd2?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=600&auto=format&fit=crop",
];

const Home = () => {
  const heroRef = useRef(null);
  const collectionsRef = useRef(null);
  const brandStatementRef = useRef(null);
  const [customers, setCustomers] = useState(0);

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 100, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-15, 15]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mouseX.set(e.clientX / innerWidth - 0.5);
    mouseY.set(e.clientY / innerHeight - 0.5);
  };

  useEffect(() => {
    // Simple animated counter for metrics
    let startTimestamp = null;
    const duration = 2000;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCustomers(Math.floor(progress * 15));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Smooth Parallax Hero Img (Scroll)
      const heroImageContainer = heroRef.current?.querySelector('.hero-parallax-container');
      if (heroImageContainer) {
        gsap.to(heroImageContainer, {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          }
        });
      }

      // Categories Subtle Reveal
      gsap.fromTo(`.${styles.card}`,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: collectionsRef.current,
            start: "top 80%",
          }
        }
      );
      
      // Brand Statement Typography Reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: brandStatementRef.current,
          start: "top 60%",
        }
      });

      tl.fromTo(".manifestoLine1", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
      )
      .fromTo(".manifestoLine2", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }, 
        "-=0.9"
      )
      .to(`.${styles.manifestoDivider}`, 
        { scaleX: 1, duration: 1.2, ease: "power4.out" }, 
        "-=0.8"
      )
      .fromTo(".manifestoRightContent", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, ease: "power2.out" }, 
        "-=1"
      );
    });

    return () => ctx.revert();
  }, []);

  const titleLines = ["DEFINE", "THE", "STANDARD"];
  const titleContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };
  const titleItemVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div style={{ backgroundColor: 'var(--primary-color)' }}>
      {/* 1. HERO SECTION - SPLIT SCREEN EDITORIAL */}
      <section className={styles.hero} ref={heroRef} onMouseMove={handleMouseMove}>
        <div className={styles.heroLeft}>
          <div className={styles.giantBgText}>LEXCC</div>
          <div className={styles.verticalSeasonTag}>COLLECTION 04<span>FW26</span></div>
          <div className={styles.heroLoopBg}>
            <CurvedLoop text="LUXURY • STREETWEAR • LEXCC • " />
          </div>
          <div className={styles.heroOrb}></div>
          
          <div className={styles.heroContentWrapper}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className={styles.heroSubtitle}>FALL/WINTER '26</h2>
            </motion.div>
            
            <motion.div 
              className={styles.heroTitle}
              variants={titleContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {titleLines.map((line, index) => (
                <div key={index} style={{ overflow: 'hidden' }}>
                  <motion.div variants={titleItemVariants}>{line}</motion.div>
                </div>
              ))}
            </motion.div>
            
            <motion.p 
              className={styles.heroDesc}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
            >
              A new perspective on modern luxury. Uncompromising proportions, crafted for the culture.
            </motion.p>
            
            <motion.div 
              className={styles.heroButtons}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            >
              <ClickSpark sparkColor="#D4AF37" sparkCount={10} sparkRadius={20} style={{ width: 'auto' }}>
                <Link to="/shop" className={styles.btnLuxuryPrimary}>
                  Shop Collection
                </Link>
              </ClickSpark>
              <ClickSpark sparkColor="#D4AF37" sparkCount={10} sparkRadius={20} style={{ width: 'auto' }}>
                <Link to="/shop" className={styles.btnLuxurySecondary}>
                  Explore Lookbook
                </Link>
              </ClickSpark>
            </motion.div>

            <motion.div 
              className={styles.heroMetrics}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.2 }}
            >
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>{customers}K+</span>
                <span className={styles.metricLabel}>Global Customers</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>50+</span>
                <span className={styles.metricLabel}>Countries</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>Weekly</span>
                <span className={styles.metricLabel}>Limited Drops</span>
              </div>
            </motion.div>
          </div>
          
          <div className={styles.scrollIndicator} onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})}>
            <span className={styles.scrollText}>SCROLL</span>
            <span className={styles.scrollArrow}>↓</span>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroRightOverlay}></div>
          <div className={styles.filmGrain}></div>
          <motion.div 
            className={styles.floatingTag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className={styles.tagTop}>LIMITED DROP</span>
            <span className={styles.tagBottom}>FW26</span>
          </motion.div>
          
          <div className="hero-parallax-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <motion.img 
              initial={{ opacity: 0, scale: 1.1, y: '5%' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              src="https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=2000&auto=format&fit=crop" 
              alt="Luxury Streetwear Campaign" 
              className={styles.heroImg}
            />
          </div>
        </div>
      </section>

      {/* 2. BRAND STATEMENT (MANIFESTO) */}
      <section ref={brandStatementRef} className={styles.manifestoSection}>
        <div className={styles.manifestoBgText}>CRAFT</div>
        
        <div className={styles.manifestoContainer}>
          <div className={styles.manifestoLeft}>
            <h2 className={styles.manifestoHeading}>
              <span className={`manifestoLine1 ${styles.manifestoLine1}`}>NOT TRENDS.</span>
              <span className={`manifestoLine2 ${styles.manifestoLine2}`}>LEGACY.</span>
            </h2>
          </div>
          
          <div className={styles.manifestoRight}>
            <div className={styles.manifestoDivider}></div>
            <div className="manifestoRightContent">
              <p className={styles.manifestoCopy}>
                We don't chase the culture. We craft it. Every piece is an investment in uncompromising quality and timeless design. Built for those who demand the standard.
              </p>
              
              <div className={styles.manifestoMeta}>
                <div className={styles.metaItem}>EST. 2026</div>
                <div className={styles.metaItem}>GLOBAL STREETWEAR</div>
                <div className={styles.metaItem}>LIMITED DROPS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COLLECTIONS */}
      <section ref={collectionsRef} className={styles.collectionsSection} style={{ paddingTop: '150px', paddingBottom: '150px' }}>
        <div className="container">
          <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1.1 }}>Curated<br/><span className="text-accent">Signatures</span></h2>
            <Link to="/shop" className="viewAll">
              View All Categories
            </Link>
          </div>

          <div className={styles.grid}>
            {['Outerwear', 'Oversized Tees', 'Denim & Cargo'].map((cat, i) => (
              <ClickSpark key={i} sparkColor="#D4AF37" sparkCount={12} sparkRadius={25}>
                <div className={styles.card}>
                  <Link to="/shop" style={{ display: 'block', height: '100%' }}>
                    <img 
                      src={[
                        "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop"
                      ][i]} 
                      alt={cat} 
                      className={styles.cardImg}
                    />
                    <div className={styles.cardOverlay}></div>
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{cat}</h3>
                      <span className={styles.cardLink}>
                        Explore <span className={styles.arrow}>→</span>
                      </span>
                    </div>
                  </Link>
                </div>
              </ClickSpark>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CRAFTSMANSHIP (Essentials via BounceCards) */}
      <section style={{ padding: '150px 0', backgroundColor: 'var(--surface-color)', overflow: 'hidden' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '24px' }}>Uncompromising <span className="text-accent">Materials</span></h2>
          <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
            The foundation of every wardrobe. Sourced globally, crafted flawlessly. Only the highest grade heavyweights make the cut.
          </p>
        </div>
        <BounceCards images={bounceImages} />
      </section>

      {/* 5. CAMPAIGN */}
      <section style={{ padding: '150px 0', backgroundColor: 'var(--primary-color)' }}>
        <div className="container">
          <div className="campaign-container">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="campaign-image-wrapper"
            >
              <img 
                src="https://images.unsplash.com/photo-1613588718956-c2e80305bf61?q=80&w=1200&auto=format&fit=crop" 
                alt="Campaign"
                className="campaign-image"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              style={{ paddingLeft: '40px' }}
            >
              <h2 style={{ fontSize: '3rem', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: '32px' }}>
                Built For The <br />Ones Who Lead.
              </h2>
              <p className="text-muted" style={{ fontSize: '1.2rem', marginBottom: '48px', lineHeight: 1.8 }}>
                LEXCC isn't fashion. LEXCC is identity. Crafted in limited quantities for absolute exclusivity. We don't restock. Once a collection drops, it belongs to the few who secure it.
              </p>
              <ClickSpark sparkColor="#D4AF37" sparkCount={10} sparkRadius={20} style={{ width: 'auto' }}>
                <Link to="/shop" className="btn-outline">
                  Discover Campaign
                </Link>
              </ClickSpark>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. LOOKBOOK (Dome Gallery Experience) */}
      <section style={{ padding: '150px 0', backgroundColor: 'var(--surface-color)', overflow: 'hidden' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase' }}>Editorial <span className="text-accent">Lookbook</span></h2>
        </div>
        <DomeGallery images={domeImages} />
      </section>

      {/* 7. BEST SELLERS */}
      <section style={{ padding: '150px 0', backgroundColor: 'var(--primary-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase' }}>Most <span className="text-accent">Wanted</span></h2>
            <Link to="/shop" className="viewAll">
              Shop All
            </Link>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {dummyProducts.map((product, i) => (
              <ClickSpark key={product.id} sparkColor="#D4AF37" sparkCount={10} sparkRadius={20}>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: (i % 4) * 0.1, ease: "easeOut" }}
                  className="product-card"
                >
                  <div className="product-card-image-wrapper">
                    <img src={product.img} alt={product.name} className="product-card-image" />
                    <div className="product-card-overlay">
                      <span className="btn-outline" style={{ padding: '12px 24px', fontSize: '0.8rem', pointerEvents: 'auto' }}>QUICK VIEW</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{product.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>{product.price}</p>
                </motion.div>
              </ClickSpark>
            ))}
          </div>
        </div>
      </section>

      {/* 8. COMMUNITY / INSTAGRAM */}
      <section style={{ padding: '150px 0', backgroundColor: 'var(--surface-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1.1 }}>@LEXCC<br/><span className="text-accent">WORLDWIDE</span></h2>
            <a href="#" className="viewAll" style={{ letterSpacing: '0.1em' }}>Follow The Movement</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', backgroundColor: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
            {instaImages.map((img, i) => (
              <div 
                key={i}
                className="insta-card"
                style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--primary-color)' }}
              >
                <img src={img} alt="Editorial" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease', opacity: 0.8 }} className="insta-img" />
                <div 
                  className="insta-overlay"
                  style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.4s ease' }}
                >
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em' }}>INSTAGRAM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. NEWSLETTER / MEMBERSHIP */}
      <section style={{ padding: '150px 0', backgroundColor: '#000', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '700px' }}>
          <CurvedLoop text="JOIN THE CLUB • EXCLUSIVE DROPS • EARLY ACCESS • " className="mb-12" />
          
          <TextReveal style={{ fontSize: '3rem', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '24px', marginTop: '40px' }}>
            Stay Ahead Of <br/><span className="text-accent">The Drop.</span>
          </TextReveal>
          
          <p className="text-muted" style={{ marginBottom: '60px', fontSize: '1.1rem' }}>Sign up to receive exclusive access to new collections, limited releases, and member pricing.</p>
          
          <form style={{ display: 'flex', borderBottom: '1px solid var(--text-color)', paddingBottom: '12px', width: '100%', maxWidth: '500px' }} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="ENTER YOUR EMAIL" 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} 
            />
            <ClickSpark sparkColor="#D4AF37" sparkCount={10} sparkRadius={20} style={{ width: 'auto' }}>
              <button type="submit" style={{ color: 'var(--accent-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                Subscribe
              </button>
            </ClickSpark>
          </form>
        </div>
      </section>

    </div>
  );
};

export default Home;
