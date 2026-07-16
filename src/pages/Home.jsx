import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';
import styles from './Home.module.css';

// React Bits Components
import CurvedLoop from '../components/animations/CurvedLoop';
import ClickSpark from '../components/animations/ClickSpark';

gsap.registerPlugin(ScrollTrigger);

// Muted, cohesive luxury editorial imagery

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
  const lookbookRef = useRef(null);
  const editorialRef = useRef(null);
  const brandStatementRef = useRef(null);
  const [customers, setCustomers] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            image_url
          `)
          .eq('status', 'active')
          .eq('is_featured', true)
          .limit(4);
        
        if (!error && data) {
          setFeaturedProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
      }
    };
    fetchFeatured();
  }, []);

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 120 };
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig);
  
  // Tilt for Craftsmanship BounceCards
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

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

      // Craftsmanship Reveal
      const craftTl = gsap.timeline({
        scrollTrigger: {
          trigger: lookbookRef.current,
          start: "top 60%",
        }
      });

      craftTl.fromTo(".craft-fade", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power2.out" }
      )
      .fromTo(`.${styles.craftBgTextLine}`, 
        { x: -50, opacity: 0 }, 
        { x: 0, opacity: 0.04, duration: 1.2, stagger: 0.1, ease: "power3.out" }, 
        "-=0.8"
      )
      .fromTo(`.${styles.craftSpecsPanel}`, 
        { x: 50, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 1, ease: "power3.out" }, 
        "-=1"
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

      // Editorial Lookbook Animations
      gsap.from(".lookbook-title", {
        opacity: 0,
        y: 60,
        duration: 1,
        scrollTrigger: {
          trigger: ".lookbook-section",
          start: "top 80%",
        }
      });

      gsap.from(".lookbook-left", {
        x: -120,
        opacity: 0,
        scale: 1.1,
        duration: 1.2,
        scrollTrigger: {
          trigger: ".lookbook-section",
          start: "top 75%",
        }
      });

      gsap.from(".lookbook-right", {
        x: 120,
        opacity: 0,
        scale: 1.1,
        duration: 1.2,
        delay: 0.2,
        scrollTrigger: {
          trigger: ".lookbook-section",
          start: "top 75%",
        }
      });

      gsap.fromTo(".lookbook-bg-text", 
        { opacity: 0 },
        { 
          opacity: 0.04, 
          duration: 2, 
          delay: 0.8,
          scrollTrigger: {
            trigger: ".lookbook-section",
            start: "top 70%",
          }
        }
      );

      // Editorial Lookbook Parallax
      const edLeft = editorialRef.current?.querySelector('.lookbook-left');
      const edRight = editorialRef.current?.querySelector('.lookbook-right');
      if (edLeft) {
        gsap.to(edLeft, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: editorialRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        });
      }
      if (edRight) {
        gsap.to(edRight, {
          y: -100,
          ease: "none",
          scrollTrigger: {
            trigger: editorialRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        });
      }
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
      <section ref={collectionsRef} className={styles.collectionsSection} onMouseMove={handleMouseMove}>
        <div className={styles.collectionsBgText}>SIGNATURE</div>
        <div className={styles.collectionsRadialGlow}></div>
        
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>CURATED<br/>SIGNATURES</h2>
            <div className={styles.sectionTitleDivider}></div>
          </div>
          
          <div className={styles.viewAllWrapper}>
            <Link to="/shop" className={styles.viewAll}>
              View All Categories <span className={styles.viewAllIcon}>→</span>
            </Link>
          </div>

          <div className={styles.grid}>
            {[
              {
                cat: 'Outerwear',
                index: '01',
                desc: 'Crafted for colder seasons.',
                img: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop',
                type: 'Side'
              },
              {
                cat: 'Oversized Tees',
                index: '02',
                desc: 'Essential everyday silhouettes.',
                img: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=800&auto=format&fit=crop',
                type: 'Center'
              },
              {
                cat: 'Denim & Cargo',
                index: '03',
                desc: 'Built for movement and durability.',
                img: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=800&auto=format&fit=crop',
                type: 'Side'
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                className={styles.cardWrapper}
                style={{ x: parallaxX, y: parallaxY }}
              >
                <div className={`${styles.card} ${item.type === 'Center' ? styles.cardCenter : styles.cardSide}`}>
                  <ClickSpark sparkColor="#D4AF37" sparkCount={12} sparkRadius={25}>
                    <Link to="/shop" style={{ display: 'block', height: '100%' }}>
                      <img 
                        src={item.img} 
                        alt={item.cat} 
                        className={styles.cardImg}
                      />
                      <div className={styles.cardOverlay}></div>
                      <div className={styles.cardContent}>
                        <span className={styles.cardIndex}>{item.index} / {item.cat}</span>
                        <h3 className={styles.cardTitle}>{item.cat}</h3>
                        <p className={styles.cardSubtitle}>{item.desc}</p>
                        <span className={styles.cardLink}>
                          Explore <span className={styles.arrow}>→</span>
                        </span>
                      </div>
                    </Link>
                  </ClickSpark>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MATERIAL & CRAFTSMANSHIP (BounceCards Redesign) */}
      <section ref={lookbookRef} className={styles.craftsmanshipSection} onMouseMove={handleMouseMove}>
        
        {/* Dust Particles */}
        <div className={styles.dustParticles}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%'
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
            />
          ))}
        </div>

        <div className={styles.craftsmanshipContainer}>
          <div className={styles.craftsmanshipLayout}>
            
            {/* Background Typography (Absolute Behind Everything) */}
            <div className={styles.craftBgText}>
              <div className={styles.craftBgTextLine}>100% COTTON</div>
              <div className={styles.craftBgTextLine}>480 GSM</div>
              <div className={styles.craftBgTextLine}>PREMIUM FLEECE</div>
            </div>

            {/* LEFT COLUMN: Editorial & Specs */}
            <div className={`${styles.craftLeft} craft-fade`}>
              <div className={styles.craftHeader}>
                <h2 className={styles.craftTitle}>Material &<br/><span className={styles.craftTitleAccent}>Craftsmanship</span></h2>
                <p className={styles.craftDesc}>
                  Explore the textures and details that define our latest collection. Sourced globally, crafted flawlessly.
                </p>
              </div>

              {/* Specifications Panel */}
              <div className={styles.craftSpecsPanel}>
                <div className={styles.specItem}>
                  <span className={styles.specTitle}>Construction</span>
                  <span className={styles.specDesc}>Double-Stitched Seams</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specTitle}>Fabric Weight</span>
                  <span className={styles.specDesc}>Heavyweight 480 GSM</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specTitle}>Process</span>
                  <span className={styles.specDesc}>Premium Pigment Dye</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specTitle}>Guarantee</span>
                  <span className={styles.specDesc}>Built For Longevity</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Fashion Collage */}
            <div className={`${styles.craftRight} craft-fade`}>
              <div className={styles.collageGlow}></div>
              <motion.div 
                className={styles.collageWrapper}
                style={{ rotateX: tiltX, rotateY: tiltY }}
              >
                {/* Collage Card 1: Foreground Left */}
                <motion.div 
                  className={`${styles.collageCard} ${styles.card1}`}
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img src="https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=800&auto=format&fit=crop" alt="Premium Apparel" className={styles.collageImg} />
                </motion.div>

                {/* Collage Card 2: Background Left */}
                <motion.div 
                  className={`${styles.collageCard} ${styles.card2}`}
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <img src="https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=800&auto=format&fit=crop" alt="Editorial Fashion" className={styles.collageImg} />
                </motion.div>

                {/* Collage Card 3: Foreground Right */}
                <motion.div 
                  className={`${styles.collageCard} ${styles.card3}`}
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop" alt="Luxury Fit" className={styles.collageImg} />
                </motion.div>

                {/* Collage Card 4: Background Right */}
                <motion.div 
                  className={`${styles.collageCard} ${styles.card4}`}
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                >
                  <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop" alt="Heavyweight Fabric" className={styles.collageImg} />
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CAMPAIGN */}
      <section style={{ padding: '150px 0', backgroundColor: 'var(--primary-color)', position: 'relative', overflow: 'hidden' }} onMouseMove={handleMouseMove}>
        
        {/* Massive Background Text */}
        <motion.div 
          className={styles.campaignBgText}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.04 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
        >
          EXCLUSIVE
        </motion.div>

        <div className="container">
          <div className={styles.campaignContainer}>
            <motion.div 
              className={styles.campaignImageWrapper}
              style={{ rotateX: tiltX, rotateY: tiltY }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className={styles.campaignGlow}></div>
              <div className={styles.campaignImageContainer}>
                <motion.img 
                  initial={{ scale: 1.05 }}
                  whileInView={{ scale: 1.00 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop" 
                  alt="Luxury Campaign"
                  className={styles.campaignImage}
                />
                <div className={styles.campaignGrain}></div>
              </div>
            </motion.div>

            <motion.div 
              className={styles.campaignContent}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            >
              <div className={styles.campaignGlow} style={{ width: '150%', height: '150%', opacity: 0.5, left: '60%' }}></div>
              <div className={styles.campaignLabel}>
                LIMITED DROP
              </div>

              <div className={styles.campaignHeadingWrapper}>
                <div className={styles.campaignAccentLine}></div>
                <h2 className={styles.campaignHeading}>
                  Built For The <br />Ones Who Lead.
                </h2>
              </div>

              <p className={styles.campaignText}>
                LEXCC isn't fashion. LEXCC is identity. Crafted in limited quantities for absolute exclusivity. We don't restock. Once a collection drops, it belongs to the few who secure it.
              </p>
              
              <div>
                <ClickSpark sparkColor="#D4AF37" sparkCount={10} sparkRadius={20} style={{ width: 'auto' }}>
                  <Link to="/shop" className={styles.btnPremium}>
                    <span>Discover Campaign</span>
                    <div className={styles.btnHoverLine}></div>
                  </Link>
                </ClickSpark>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL LOOKBOOK */}
      <section ref={editorialRef} className={`${styles.lookbookSection} lookbook-section`}>
        
        <div className={`${styles.lookbookBgText} lookbook-bg-text`}>
          LOOKBOOK
        </div>

        <div className={styles.lookbookGlow}></div>

        <div className="container">
          <div className={`${styles.lookbookHeader} lookbook-title`}>
            <div className={styles.lookbookHeadingWrapper}>
              <div className={styles.lookbookAccentLine}></div>
              <h2 className={styles.lookbookTitle}>Editorial Lookbook</h2>
              <div className={styles.lookbookAccentLine}></div>
            </div>
            <p className={styles.lookbookSubtitle}>
              A visual exploration of the FW26 collection. Crafted through silhouettes, texture, and movement.
            </p>
          </div>

          <div className={styles.lookbookGrid}>
            
            {/* Left Hero Image */}
            <div className={`${styles.lookbookCard} ${styles.lookbookCardLeft} lookbook-left`}>
              <img 
                src="https://images.unsplash.com/photo-1492288991661-058aa541ff43?q=80&w=1200&auto=format&fit=crop" 
                alt="Outerwear Editorial" 
                className={styles.lookbookImg} 
              />
              <div className={styles.lookbookOverlay}>
                <div className={styles.lookbookLabel}>OUTERWEAR EDITORIAL</div>
                <div className={styles.lookbookLink}>View Story <span>→</span></div>
              </div>
            </div>

            {/* Right Smaller Image */}
            <div className={`${styles.lookbookCard} ${styles.lookbookCardRight} lookbook-right`}>
              <img 
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop" 
                alt="FW26 Campaign" 
                className={styles.lookbookImg} 
              />
              <div className={styles.lookbookOverlay}>
                <div className={styles.lookbookLabel}>FW26 CAMPAIGN</div>
                <div className={styles.lookbookLink}>View Story <span>→</span></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. MOST WANTED */}
      <section className={styles.mostWantedSection}>
        <motion.div 
          className={styles.mostWantedBgText}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.04 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          ESSENTIALS
        </motion.div>
        <div className={styles.mostWantedGlow}></div>

        <div className={`container ${styles.mostWantedContent}`}>
          <motion.div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px' }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 style={{ fontSize: '3rem', textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>Most <span className="text-accent">Wanted</span></h2>
            <Link to="/shop" className="viewAll">
              Explore Collection
            </Link>
          </motion.div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {featuredProducts.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={styles.wantedCard}
              >
                <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className={styles.wantedCardImgWrapper}>
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/800x1200/111/fff?text=No+Image'} 
                      alt={product.name} 
                      className={styles.wantedCardImg} 
                    />
                  </div>
                  <h3 className={styles.wantedCardTitle}>{product.name}</h3>
                  <p className={styles.wantedCardPrice}>${parseFloat(product.price).toFixed(2)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. @LEXCC WORLDWIDE */}
      <section className={styles.worldwideSection}>
        <motion.div 
          className={styles.worldwideBgText}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.04 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          WORLDWIDE
        </motion.div>

        <div className={`container`} style={{ position: 'relative', zIndex: 10 }}>
          <motion.div 
            className={styles.worldwideHeader}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className={styles.worldwideLabel}>Global Community</span>
            <h2 className={styles.worldwideTitle}>@LEXCC<br/><span className="text-accent">WORLDWIDE</span></h2>
          </motion.div>
        </div>

        <div className={styles.worldwideGrid}>
          {instaImages.map((img, i) => (
            <motion.div 
              key={i}
              className={styles.worldwideCard}
              initial={{ opacity: 0, y: i % 2 === 0 ? 40 : 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <img src={img} alt="Editorial" className={styles.worldwideImg} />
              <div className={styles.worldwideOverlay}>
                <div className={styles.instagramIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9. NEWSLETTER / MEMBERSHIP */}
      <section className={styles.newsletterSection}>
        <motion.div 
          className={styles.newsletterBgText}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.03 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          MEMBERSHIP
        </motion.div>
        
        <div className={`container ${styles.newsletterContent}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 className={styles.newsletterTitle}>
              Stay Ahead Of <br/><span className="text-accent">The Drop.</span>
            </h2>
            <p className={styles.newsletterDesc}>
              Sign up to receive exclusive access to new collections, limited releases, and member pricing. Join the movement.
            </p>
          </motion.div>
          
          <motion.form 
            className={styles.newsletterForm}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            onSubmit={(e) => e.preventDefault()}
          >
            <input 
              type="email" 
              placeholder="ENTER YOUR EMAIL" 
              className={styles.newsletterInput}
            />
            <button type="submit" className={styles.newsletterSubmit}>
              Subscribe
            </button>
          </motion.form>
        </div>
      </section>

    </div>
  );
};

export default Home;
