import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import styles from '../Account/Account.module.css';

const AdminProductForm = ({ onClose, onSuccess, product = null, categories = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category_id: product?.category_id || '',
    is_featured: product?.is_featured || false,
    is_new_arrival: product?.is_new_arrival || false,
    status: product?.status || 'active'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || null);

  // Variants State
  const [variants, setVariants] = useState(
    product?.product_variants || [{ size: 'OS', color: 'Black', stock: 0 }]
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = field === 'stock' ? parseInt(value) || 0 : value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: 'OS', color: 'Black', stock: 0 }]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const uploadImage = async () => {
    if (!imageFile) return product?.image_url;
    
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Upload Image (if new file selected)
      const imageUrl = await uploadImage();

      // 2. Generate slug
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // 3. Upsert Product
      const productPayload = {
        ...formData,
        slug,
        image_url: imageUrl,
      };

      let productId = product?.id;

      if (productId) {
        // Update
        const { error: prodErr } = await supabase.from('products').update(productPayload).eq('id', productId);
        if (prodErr) throw prodErr;
      } else {
        // Insert
        const { data: newProd, error: prodErr } = await supabase.from('products').insert([productPayload]).select().single();
        if (prodErr) throw prodErr;
        productId = newProd.id;
      }

      // 4. Upsert Variants
      // Simple approach: delete existing variants and insert new ones
      if (product?.id) {
        await supabase.from('product_variants').delete().eq('product_id', productId);
      }

      const variantsPayload = variants.map(v => ({
        product_id: productId,
        size: v.size,
        color: v.color,
        stock: v.stock,
        sku: `${slug}-${v.size}-${v.color}`.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      }));

      if (variantsPayload.length > 0) {
        const { error: varErr } = await supabase.from('product_variants').insert(variantsPayload);
        if (varErr) throw varErr;
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(`Save failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className={styles.card}
        style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          &times;
        </button>
        
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, marginBottom: '30px' }}>
          {product ? 'Edit Product' : 'Create New Product'}
        </h2>

        {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Image Upload Area */}
            <div style={{ flex: '0 0 200px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>PRODUCT IMAGE</label>
              <div 
                style={{ 
                  width: '200px', height: '250px', 
                  border: '1px dashed rgba(255,255,255,0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
                onClick={() => document.getElementById('imageUpload').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>+ Upload Image</span>
                )}
                <input 
                  type="file" 
                  id="imageUpload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Core Details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className={styles.inputLabel}>Product Name</label>
                <input type="text" name="name" className={styles.inputField} value={formData.name} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.inputLabel}>Price ($)</label>
                  <input type="number" step="0.01" name="price" className={styles.inputField} value={formData.price} onChange={handleInputChange} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.inputLabel}>Category</label>
                  <select name="category_id" className={styles.inputField} value={formData.category_id} onChange={handleInputChange} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={styles.inputLabel}>Description</label>
                <textarea name="description" className={styles.inputField} value={formData.description} onChange={handleInputChange} style={{ minHeight: '80px', resize: 'vertical' }} required />
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} />
                  Featured Product
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_new_arrival" checked={formData.is_new_arrival} onChange={handleInputChange} />
                  New Arrival
                </label>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }} />

          {/* Variants */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label className={styles.inputLabel} style={{ marginBottom: 0 }}>Inventory Variants</label>
              <button type="button" onClick={addVariant} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>+ ADD VARIANT</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {variants.map((v, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <input type="text" placeholder="Size (e.g. M)" value={v.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} className={styles.inputField} style={{ padding: '8px' }} required />
                  <input type="text" placeholder="Color (e.g. Black)" value={v.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} className={styles.inputField} style={{ padding: '8px' }} required />
                  <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} className={styles.inputField} style={{ padding: '8px', width: '100px' }} required />
                  <button type="button" onClick={() => removeVariant(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>&times;</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className={styles.secondaryBtn}>CANCEL</button>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE PRODUCT'}
            </button>
          </div>

        </form>
      </motion.div>
    </motion.div>
  );
};

export default AdminProductForm;
