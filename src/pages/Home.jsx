import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Home.module.css';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const collectionsRef = useRef(null);

  useEffect(() => {
    gsap.to(heroRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    if (textRef.current) {
      gsap.fromTo(textRef.current.children, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          stagger: 0.2, 
          ease: "power3.out",
          delay: 0.2
        }
      );
    }

    gsap.fromTo(`.${styles.card}`,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: collectionsRef.current,
          start: "top 80%",
        }
      }
    );
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div ref={heroRef} className={styles.heroBg}>
          <img 
            src="https://images.unsplash.com/photo-1574607383476-f517f260d30b?q=80&w=2000&auto=format&fit=crop" 
            alt="Luxury Streetwear Model" 
            className={styles.heroImg}
          />
          <div className={styles.heroOverlay}></div>
        </div>

        <div className={styles.heroContent} ref={textRef}>
          <h2 className={styles.heroSubtitle}>New Collection Vol. 4</h2>
          <h1 className={styles.heroTitle}>
            Define The<br />Standard.
          </h1>
          <p className={styles.heroDesc}>
            Luxury streetwear crafted for the culture. Precision cut, premium materials, unmistakable presence.
          </p>
          <Link to="/shop" className="btn-primary inline-block">
            Shop Collection
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section ref={collectionsRef} className={styles.collectionsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Curated<br/>Signatures</h2>
            <Link to="/shop" className={styles.viewAll}>
              View All
            </Link>
          </div>

          <div className={styles.grid}>
            {/* Category 1 */}
            <Link to="/shop?category=outerwear" className={styles.card}>
              <img 
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop" 
                alt="Outerwear" 
                className={styles.cardImg}
              />
              <div className={styles.cardOverlay}></div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Outerwear</h3>
                <span className={styles.cardLink}>
                  Explore <span className={styles.arrow}>→</span>
                </span>
              </div>
            </Link>

            {/* Category 2 */}
            <Link to="/shop?category=tees" className={styles.card}>
              <img 
                src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop" 
                alt="Oversized Tees" 
                className={styles.cardImg}
              />
              <div className={styles.cardOverlay}></div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Oversized Tees</h3>
                <span className={styles.cardLink}>
                  Explore <span className={styles.arrow}>→</span>
                </span>
              </div>
            </Link>

            {/* Category 3 */}
            <Link to="/shop?category=denim" className={styles.card}>
              <img 
                src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop" 
                alt="Denim" 
                className={styles.cardImg}
              />
              <div className={styles.cardOverlay}></div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Denim & Cargo</h3>
                <span className={styles.cardLink}>
                  Explore <span className={styles.arrow}>→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className={styles.marqueeContainer}>
        <motion.div 
          animate={{ x: [0, -1036] }} 
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className={styles.marqueeContent}
        >
          <span>Free Worldwide Shipping on orders over $250</span>
          <span>•</span>
          <span>Lexcc Members get early access</span>
          <span>•</span>
          <span>New Drop Every Friday</span>
          <span>•</span>
          <span>Free Worldwide Shipping on orders over $250</span>
          <span>•</span>
          <span>Lexcc Members get early access</span>
          <span>•</span>
          <span>New Drop Every Friday</span>
          <span>•</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
