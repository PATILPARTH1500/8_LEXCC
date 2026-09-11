import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAccountStyles } from '../Account/useAccountStyles';
import { getSizingSystem, getSizesForSystem } from '../../utils/sizing';

const AdminProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const styles = useAccountStyles();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);
  const imageInputRef = useRef(null);
  
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_featured: false,
    is_new_arrival: false,
    status: 'active'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Variants State
  const [variants, setVariants] = useState([{ size: 'OS', color: 'Black', stock: 0 }]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: cats } = await supabase.from('categories').select('*');
        if (cats) setCategories(cats);

        if (productId) {
          const { data: prod, error: prodErr } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('id', productId)
            .single();
          
          if (prodErr) throw prodErr;
          
          setProduct(prod);
          setFormData({
            name: prod.name || '',
            description: prod.description || '',
            price: prod.price || '',
            category_id: prod.category_id || '',
            is_featured: prod.is_featured || false,
            is_new_arrival: prod.is_new_arrival || false,
            status: prod.status || 'active'
          });
          setImagePreview(prod.image_url || null);
          if (prod.product_variants && prod.product_variants.length > 0) {
            setVariants(prod.product_variants);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [productId]);

  // Categories logic for sizing
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const categorySlug = selectedCategory?.slug || '';
  
  const system = getSizingSystem(categorySlug);
  const sizingOptions = getSizesForSystem(system);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      e.target.value = '';
      return;
    }

    setError(null);
    setImageFile(file);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
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
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type
      });

    if (uploadError) {
      console.error('Product image upload failed:', uploadError);
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    if (!data?.path) {
      throw new Error('Image upload completed without a valid file path.');
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);
      
    if (!urlData?.publicUrl) {
      throw new Error('Failed to retrieve public URL for uploaded image.');
    }
    
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText('UPLOADING IMAGE...');
    setError(null);

    try {
      if (!product && !imageFile) {
        throw new Error('Please select a product image.');
      }

      // Validate sizes based on category
      for (const v of variants) {
        if (!sizingOptions.includes(v.size)) {
          throw new Error(`Invalid size "${v.size}" for category type "${system}". Please update it.`);
        }
      }

      // 1. Upload Image (if new file selected)
      const imageUrl = await uploadImage();
      
      if (!imageUrl) {
        throw new Error('Image URL is missing after upload attempt.');
      }
      
      setLoadingText('SAVING...');

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
      const variantsToUpsert = variants.map(v => {
        const base = {
          product_id: productId,
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: `${slug}-${v.size}-${v.color}`.toUpperCase().replace(/[^A-Z0-9-]/g, '')
        };
        if (v.id) base.id = v.id;
        return base;
      });

      if (variantsToUpsert.length > 0) {
        const { error: varErr } = await supabase.from('product_variants').upsert(variantsToUpsert);
        if (varErr) throw varErr;
      }
      
      // Preserve history: Instead of deleting removed variants, set stock to 0
      if (product?.id) {
        const removedVariants = (product.product_variants || []).filter(
          pv => !variants.find(v => v.id === pv.id)
        );
        
        if (removedVariants.length > 0) {
          const { error: delErr } = await supabase.from('product_variants')
            .update({ stock: 0 })
            .in('id', removedVariants.map(v => v.id));
            
          if (delErr) throw delErr;
        }
      }

      navigate('/account/admin/products');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Save failed: Unknown error');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={styles.card}
      style={{ position: 'relative' }}
    >
      <button 
        onClick={() => navigate('/account/admin/products')}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
      >
        &times;
      </button>
        
        <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, marginBottom: '40px', color: '#D4AF37' }}>
          {product ? 'Edit Product' : 'Create New Product'}
        </h2>

        {error && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className={styles.adminFormLayout}>
            {/* Image Upload Area */}
            <div className={styles.imageUploadContainer}>
              <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '15px' }}>Product Image</label>
              <div 
                style={{ 
                  width: '100%', maxWidth: '250px', height: '320px', 
                  border: '1px solid rgba(212, 175, 55, 0.3)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.border = '1px solid rgba(212, 175, 55, 0.3)'}
                onClick={() => imageInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>+ Upload Image</span>
                )}
                <input 
                  ref={imageInputRef}
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
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
              <div className={styles.formGrid}>
                <div style={{ flex: 1 }}>
                  <label className={styles.inputLabel}>Price (₹)</label>
                  <input type="number" step="0.01" name="price" className={styles.inputField} value={formData.price} onChange={handleInputChange} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.inputLabel}>Category</label>
                  <CustomSelect name="category_id" className={styles.inputField} value={formData.category_id} onChange={handleInputChange} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </CustomSelect>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {variants.map((v, index) => (
                <div key={index} className={styles.variantRow}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Size</label>
                    <CustomSelect 
                      value={v.size} 
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)} 
                      className={styles.inputField} 
                      style={{ padding: '10px' }} 
                      required
                    >
                      <option value="">Select Size</option>
                      {sizingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      {v.size && !sizingOptions.includes(v.size) && (
                        <option value={v.size}>{v.size} (Invalid)</option>
                      )}
                    </CustomSelect>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Color</label>
                    <input type="text" placeholder="e.g. Black" value={v.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} className={styles.inputField} style={{ padding: '10px' }} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>Stock</label>
                    <input type="number" placeholder="0" value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} className={styles.inputField} style={{ padding: '10px', width: '100%' }} required />
                  </div>
                  <button type="button" onClick={() => removeVariant(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>&times;</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={() => navigate('/account/admin/products')} className={styles.secondaryBtn}>CANCEL</button>
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? (loadingText || 'SAVING...') : 'SAVE PRODUCT'}
            </button>
          </div>

        </form>
    </motion.div>
  );
};

export default AdminProductForm;
