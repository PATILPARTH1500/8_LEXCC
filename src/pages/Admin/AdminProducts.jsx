import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from '../Account/Account.module.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: cats } = await supabase.from('categories').select('*');
      if (cats) setCategories(cats);

      // Fetch products with variants
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select(`
          *,
          product_variants ( id, size, color, sku, stock ),
          categories ( name )
        `)
        .order('created_at', { ascending: false });
        
      if (prodErr) throw prodErr;
      setProducts(prods || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load catalog data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    
    // Optimistic Update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    
    // DB Update
    try {
      await supabase.from('products').update({ status: newStatus }).eq('id', id);
    } catch (err) {
      console.error('Failed to update status', err);
      // Revert on fail
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: currentStatus } : p));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}>
          Loading Catalog...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, color: '#fff', marginBottom: '10px' }}>Product Catalog</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Manage your entire inventory and variants.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <button className={styles.primaryBtn} style={{ padding: '12px 24px', fontSize: '0.75rem' }}>+ NEW PRODUCT</button>
        </motion.div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

      <motion.div variants={itemVariants} className={styles.card} style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Product</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Category</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Price</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Stock</th>
                <th style={{ padding: '20px 30px', fontWeight: 400 }}>Status</th>
                <th style={{ padding: '20px 30px', fontWeight: 400, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No products found in the catalog.</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const totalStock = product.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                    
                    return (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}
                      >
                        <td style={{ padding: '20px 30px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                              <img src={product.image_url || 'https://via.placeholder.com/40'} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                              <p style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '4px' }}>{product.name}</p>
                              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>{product.product_variants?.length || 0} VARIANTS</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 30px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                          {product.categories?.name || 'Uncategorized'}
                        </td>
                        <td style={{ padding: '20px 30px', color: '#fff', fontSize: '0.85rem' }}>
                          ${product.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '20px 30px' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '4px 10px', 
                            borderRadius: '20px',
                            background: totalStock > 10 ? 'rgba(34, 197, 94, 0.1)' : totalStock > 0 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: totalStock > 10 ? '#22c55e' : totalStock > 0 ? '#eab308' : '#ef4444'
                          }}>
                            {totalStock} IN STOCK
                          </span>
                        </td>
                        <td style={{ padding: '20px 30px' }}>
                          <button 
                            onClick={() => toggleStatus(product.id, product.status)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: 0
                            }}
                          >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: product.status === 'active' ? '#22c55e' : '#ef4444' }} />
                            <span style={{ color: product.status === 'active' ? '#22c55e' : '#ef4444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              {product.status}
                            </span>
                          </button>
                        </td>
                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-color, #D4AF37)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                            Edit
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminProducts;
