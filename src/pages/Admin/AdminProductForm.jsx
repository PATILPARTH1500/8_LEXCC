import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAccountStyles } from '../Account/useAccountStyles';
import { getSizingSystem, getSizesForSystem } from '../../utils/sizing';

const MAX_PRODUCT_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const makeLocalId = () => (
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const makeStorageFilename = (extension) => `${Date.now()}-${makeLocalId()}.${extension}`;

const getOwnedStoragePath = (imageUrl, productId) => {
  if (!imageUrl || !productId) return null;

  try {
    const marker = '/storage/v1/object/public/product-images/';
    const pathname = new URL(imageUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const storagePath = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    return storagePath.startsWith(`products/${productId}/`) ? storagePath : null;
  } catch {
    return null;
  }
};

const AdminProductForm = () => {
  const { productId: routeProductId } = useParams();
  const navigate = useNavigate();
  const styles = useAccountStyles();
  const imageInputRef = useRef(null);
  const blobUrlsRef = useRef(new Set());

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [initialGalleryImages, setInitialGalleryImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_featured: false,
    is_new_arrival: false,
    status: 'active',
  });
  const [variants, setVariants] = useState([{ size: 'OS', color: 'Black', stock: 0 }]);

  useEffect(() => () => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: cats, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        if (categoriesError) throw categoriesError;
        if (!cancelled) setCategories(cats || []);

        if (!routeProductId) return;

        const { data: prod, error: productError } = await supabase
          .from('products')
          .select('*, product_variants(*), product_images(id, image_url, display_order)')
          .eq('id', routeProductId)
          .order('display_order', { referencedTable: 'product_images', ascending: true })
          .single();
        if (productError) throw productError;
        if (cancelled) return;

        const sortedImages = [...(prod.product_images || [])]
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((image) => ({
            localId: image.id,
            id: image.id,
            imageUrl: image.image_url,
            previewUrl: image.image_url,
            file: null,
          }));

        const loadedGallery = sortedImages.length > 0
          ? sortedImages
          : prod.image_url
            ? [{
                localId: `legacy-${prod.id}`,
                id: null,
                imageUrl: prod.image_url,
                previewUrl: prod.image_url,
                file: null,
              }]
            : [];

        setProduct({ ...prod, product_images: prod.product_images || [] });
        setFormData({
          name: prod.name || '',
          description: prod.description || '',
          price: prod.price || '',
          category_id: prod.category_id || '',
          is_featured: prod.is_featured || false,
          is_new_arrival: prod.is_new_arrival || false,
          status: prod.status || 'active',
        });
        setGalleryImages(loadedGallery);
        setInitialGalleryImages(loadedGallery);
        if (prod.product_variants?.length > 0) {
          setVariants(prod.product_variants);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError('Failed to load product data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [routeProductId]);

  const selectedCategory = categories.find((category) => category.id === formData.category_id);
  const system = getSizingSystem(selectedCategory?.slug || '');
  const sizingOptions = getSizesForSystem(system);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    if (galleryImages.length + files.length > MAX_PRODUCT_IMAGES) {
      setError(`You can add up to ${MAX_PRODUCT_IMAGES} product images in total.`);
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      setError(`${invalidType.name} is not supported. Use JPEG, PNG, or WebP.`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setError(`${oversized.name} is larger than 5 MB.`);
      return;
    }

    const selectedImages = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(previewUrl);
      return {
        localId: makeLocalId(),
        id: null,
        imageUrl: null,
        previewUrl,
        file,
      };
    });

    setError(null);
    setGalleryImages((current) => [...current, ...selectedImages]);
  };

  const removeImage = (index) => {
    setGalleryImages((current) => {
      const image = current[index];
      if (image?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(image.previewUrl);
        blobUrlsRef.current.delete(image.previewUrl);
      }
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  const moveImage = (index, direction) => {
    setGalleryImages((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((current) => current.map((variant, variantIndex) => (
      variantIndex === index
        ? { ...variant, [field]: field === 'stock' ? parseInt(value, 10) || 0 : value }
        : variant
    )));
  };

  const addVariant = () => {
    setVariants((current) => [...current, { size: 'OS', color: 'Black', stock: 0 }]);
  };

  const removeVariant = (index) => {
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index));
  };

  const uploadGalleryImages = async (savedProductId, images, uploadedPaths) => {
    const persistedImages = [];

    for (const image of images) {
      if (!image.file) {
        persistedImages.push(image);
        continue;
      }

      const extension = IMAGE_EXTENSIONS[image.file.type];
      const filePath = `products/${savedProductId}/${makeStorageFilename(extension)}`;
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: image.file.type,
        });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
      if (!data?.path) {
        throw new Error('Image upload completed without a valid path.');
      }

      uploadedPaths.push(data.path);
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);
      if (!urlData?.publicUrl) {
        throw new Error('Unable to create a public URL for an uploaded image.');
      }

      persistedImages.push({
        ...image,
        imageUrl: urlData.publicUrl,
        previewUrl: urlData.publicUrl,
        storagePath: data.path,
      });
    }

    return persistedImages;
  };

  const persistGallery = async (savedProductId, images) => {
    const existingRows = images
      .map((image, index) => image.id ? {
        id: image.id,
        product_id: savedProductId,
        image_url: image.imageUrl,
        display_order: index,
      } : null)
      .filter(Boolean);

    const newRows = images
      .map((image, index) => !image.id ? {
        product_id: savedProductId,
        image_url: image.imageUrl,
        display_order: index,
      } : null)
      .filter(Boolean);

    if (existingRows.length > 0) {
      const { error: updateError } = await supabase
        .from('product_images')
        .upsert(existingRows, { onConflict: 'id' });
      if (updateError) throw updateError;
    }

    if (newRows.length > 0) {
      const { error: insertError } = await supabase.from('product_images').insert(newRows);
      if (insertError) throw insertError;
    }

    const retainedIds = new Set(images.map((image) => image.id).filter(Boolean));
    const removedIds = (product?.product_images || [])
      .filter((image) => !retainedIds.has(image.id))
      .map((image) => image.id);

    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .in('id', removedIds);
      if (deleteError) throw deleteError;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setLoadingText('VALIDATING...');
    setError(null);

    let createdProductId = null;
    let savedProductId = product?.id || null;
    let galleryRowsWritten = false;
    const uploadedPaths = [];

    try {
      if (galleryImages.length === 0) {
        throw new Error('Please add at least one product image.');
      }
      if (galleryImages.length > MAX_PRODUCT_IMAGES) {
        throw new Error(`A product can have no more than ${MAX_PRODUCT_IMAGES} images.`);
      }

      const seenVariants = new Set();
      for (const variant of variants) {
        if (!sizingOptions.includes(variant.size)) {
          throw new Error(`Invalid size "${variant.size}" for category type "${system}". Please update it.`);
        }
        const variantKey = `${variant.size.trim().toLowerCase()}-${variant.color.trim().toLowerCase()}`;
        if (seenVariants.has(variantKey)) {
          throw new Error(`Duplicate variant detected: ${variant.size} / ${variant.color}`);
        }
        seenVariants.add(variantKey);
      }

      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const productPayload = { ...formData, slug };

      if (!savedProductId) {
        setLoadingText('CREATING PRODUCT...');
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert([{ ...productPayload, image_url: null }])
          .select()
          .single();
        if (createError) throw createError;
        savedProductId = newProduct.id;
        createdProductId = newProduct.id;
      }

      setLoadingText('UPLOADING IMAGES...');
      const persistedImages = await uploadGalleryImages(savedProductId, galleryImages, uploadedPaths);
      if (persistedImages.some((image) => !image.imageUrl)) {
        throw new Error('One or more images are missing a public URL.');
      }

      setLoadingText('SAVING GALLERY...');
      await persistGallery(savedProductId, persistedImages);
      galleryRowsWritten = true;

      const primaryImageUrl = persistedImages[0].imageUrl;
      const { error: productError } = await supabase
        .from('products')
        .update({ ...productPayload, image_url: primaryImageUrl })
        .eq('id', savedProductId);
      if (productError) throw productError;

      setLoadingText('SAVING INVENTORY...');
      const existingVariantsPayload = [];
      const newVariantsPayload = [];

      variants.forEach((variant) => {
        const variantPayload = {
          product_id: savedProductId,
          size: variant.size,
          color: variant.color,
          stock: Number(variant.stock),
          sku: `${slug}-${variant.size}-${variant.color}`.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        };
        if (variant.id) {
          existingVariantsPayload.push({ ...variantPayload, id: variant.id });
        } else {
          newVariantsPayload.push(variantPayload);
        }
      });

      if (existingVariantsPayload.length > 0) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .upsert(existingVariantsPayload);
        if (variantError) throw variantError;
      }

      if (newVariantsPayload.length > 0) {
        const { error: newVariantError } = await supabase
          .from('product_variants')
          .insert(newVariantsPayload);
        if (newVariantError) throw newVariantError;
      }

      if (product?.id) {
        const removedVariants = (product.product_variants || [])
          .filter((savedVariant) => !variants.some((variant) => variant.id === savedVariant.id));
        if (removedVariants.length > 0) {
          const { error: removedVariantError } = await supabase
            .from('product_variants')
            .update({ stock: 0 })
            .in('id', removedVariants.map((variant) => variant.id));
          if (removedVariantError) throw removedVariantError;
        }
      }

      const retainedUrls = new Set(persistedImages.map((image) => image.imageUrl));
      const removedStoragePaths = initialGalleryImages
        .filter((image) => image.imageUrl && !retainedUrls.has(image.imageUrl))
        .map((image) => getOwnedStoragePath(image.imageUrl, savedProductId))
        .filter(Boolean);
      if (removedStoragePaths.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from('product-images')
          .remove(removedStoragePaths);
        if (storageDeleteError) {
          console.error('Gallery saved, but removed files could not be cleaned up:', storageDeleteError);
        }
      }

      navigate('/account/admin/products');
    } catch (saveError) {
      console.error(saveError);

      if (createdProductId) {
        const { error: rollbackError } = await supabase
          .from('products')
          .delete()
          .eq('id', createdProductId);
        if (rollbackError) console.error('Unable to roll back new product:', rollbackError);
      }

      if (uploadedPaths.length > 0 && (createdProductId || !galleryRowsWritten)) {
        const { error: cleanupError } = await supabase.storage
          .from('product-images')
          .remove(uploadedPaths);
        if (cleanupError) console.error('Unable to clean up uploaded images:', cleanupError);
      }

      setError(saveError.message || 'Save failed. Please try again.');
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
        type="button"
        aria-label="Close product form"
        onClick={() => navigate('/account/admin/products')}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
      >
        &times;
      </button>

      <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, marginBottom: '40px', paddingRight: '35px', color: '#D4AF37' }}>
        {product ? 'Edit Product' : 'Create New Product'}
      </h2>

      {error && <div role="alert" style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.85rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
        <div className={styles.adminFormLayout}>
          <div className={styles.imageUploadContainer}>
            <div className={styles.galleryHeader}>
              <label className={styles.inputLabel} style={{ marginBottom: 0 }}>Product Images</label>
              <span>{galleryImages.length}/{MAX_PRODUCT_IMAGES}</span>
            </div>

            <button
              type="button"
              className={styles.imageUploadTrigger}
              onClick={() => imageInputRef.current?.click()}
              disabled={galleryImages.length >= MAX_PRODUCT_IMAGES || loading}
            >
              + Add Images
            </button>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <p className={styles.imageUploadHelp}>JPEG, PNG, or WebP · 5 MB each · up to 8 images</p>

            <div className={styles.galleryPreviewGrid}>
              {galleryImages.map((image, index) => (
                <article className={styles.galleryPreviewCard} key={image.localId}>
                  <div className={styles.galleryPreviewImage}>
                    <img src={image.previewUrl} alt={`Product preview ${index + 1}`} />
                    {index === 0 && <span className={styles.primaryImageBadge}>Primary</span>}
                  </div>
                  <div className={styles.galleryPreviewActions}>
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0 || loading}
                      aria-label={`Move image ${index + 1} left`}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === galleryImages.length - 1 || loading}
                      aria-label={`Move image ${index + 1} right`}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={() => removeImage(index)}
                      disabled={loading}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label className={styles.inputLabel}>Product Name</label>
              <input type="text" name="name" className={styles.inputField} value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className={styles.formGrid}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <label className={styles.inputLabel}>Price (₹)</label>
                <input type="number" min="0.01" step="0.01" name="price" className={styles.inputField} value={formData.price} onChange={handleInputChange} required />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <label className={styles.inputLabel}>Category</label>
                <CustomSelect name="category_id" className={styles.inputField} value={formData.category_id} onChange={handleInputChange} required>
                  <option value="">Select Category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </CustomSelect>
              </div>
            </div>
            <div>
              <label className={styles.inputLabel}>Description</label>
              <textarea name="description" className={styles.inputField} value={formData.description} onChange={handleInputChange} style={{ minHeight: '80px', resize: 'vertical' }} required />
            </div>

            <div className={styles.productFlags}>
              <label>
                <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} />
                Featured
              </label>
              <label>
                <input type="checkbox" name="is_new_arrival" checked={formData.is_new_arrival} onChange={handleInputChange} />
                New Arrival
              </label>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' }} />

        <div>
          <div className={styles.variantHeader}>
            <label className={styles.inputLabel} style={{ marginBottom: 0 }}>Inventory Variants</label>
            <button type="button" onClick={addVariant} disabled={loading}>+ Add Variant</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {variants.map((variant, index) => (
              <div key={variant.id || index} className={styles.variantRow}>
                <div style={{ flex: 1 }}>
                  <label className={styles.variantLabel}>Size</label>
                  <CustomSelect
                    value={variant.size}
                    onChange={(event) => handleVariantChange(index, 'size', event.target.value)}
                    className={styles.inputField}
                    style={{ padding: '10px' }}
                    required
                  >
                    <option value="">Select Size</option>
                    {sizingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    {variant.size && !sizingOptions.includes(variant.size) && (
                      <option value={variant.size}>{variant.size} (Invalid)</option>
                    )}
                  </CustomSelect>
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.variantLabel}>Color</label>
                  <input type="text" placeholder="e.g. Black" value={variant.color} onChange={(event) => handleVariantChange(index, 'color', event.target.value)} className={styles.inputField} style={{ padding: '10px' }} required />
                </div>
                <div>
                  <label className={styles.variantLabel}>Stock</label>
                  <input type="number" min="0" placeholder="0" value={variant.stock} onChange={(event) => handleVariantChange(index, 'stock', event.target.value)} className={styles.inputField} style={{ padding: '10px', width: '100%' }} required />
                </div>
                <button type="button" aria-label={`Remove variant ${index + 1}`} onClick={() => removeVariant(index)} className={styles.removeVariantBtn}>
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={() => navigate('/account/admin/products')} className={styles.secondaryBtn}>Cancel</button>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? (loadingText || 'Saving...') : 'Save Product'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AdminProductForm;
