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
  const savingRef = useRef(false);
  const blobUrlsRef = useRef(new Set());

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
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
  const [variants, setVariants] = useState([{ clientId: makeLocalId(), size: '', color: 'Black', stock: 0 }]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => () => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setInitialLoading(true);
      setLoadError(null);
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
          setVariants(prod.product_variants.map((variant) => ({ ...variant, clientId: variant.id })));
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setLoadError('Failed to load product data.');
      } finally {
        if (!cancelled) setInitialLoading(false);
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
    if (name === 'category_id') {
      const nextCategory = categories.find((category) => category.id === value);
      const nextSizes = getSizesForSystem(getSizingSystem(nextCategory?.slug || ''));
      setVariants((current) => current.map((variant) => (
        !variant.id && variant.size && !nextSizes.includes(variant.size)
          ? { ...variant, size: '' }
          : variant
      )));
    }
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
        ? { ...variant, [field]: value }
        : variant
    )));
  };

  const addVariant = () => {
    setVariants((current) => [...current, { clientId: makeLocalId(), size: '', color: 'Black', stock: 0 }]);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setLoading(true);
    setLoadingText('VALIDATING...');
    setError(null);
    setFieldErrors({});

    const savedProductId = product?.id || makeLocalId();
    const uploadedPaths = [];

    try {
      const errors = {};
      if (!formData.name.trim()) errors.name = 'Enter a product name.';
      if (!formData.description.trim()) errors.description = 'Enter a description.';
      if (!Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0) errors.price = 'Enter a price greater than zero.';
      if (!formData.category_id) errors.category_id = 'Select a category.';
      if (galleryImages.length === 0) {
        errors.images = 'Please add at least one product image.';
      }
      if (galleryImages.length > MAX_PRODUCT_IMAGES) {
        errors.images = `A product can have no more than ${MAX_PRODUCT_IMAGES} images.`;
      }
      if (variants.length === 0) errors.variants = 'Add at least one variant.';
      const seenVariants = new Set();
      variants.forEach((variant, index) => {
        if (!variant.size) errors[`size-${index}`] = `Select a size for variant ${index + 1}.`;
        else if (!sizingOptions.includes(variant.size)) errors[`size-${index}`] = system === 'FOOTWEAR' ? 'UK/Footwear size is invalid.' : `Size is invalid for this category.`;
        if (!variant.color?.trim()) errors[`color-${index}`] = `Enter a color for variant ${index + 1}.`;
        if (variant.stock === '' || !Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0) errors[`stock-${index}`] = 'Stock must be zero or greater.';
        const variantKey = `${variant.size?.trim().toLowerCase()}\u001f${variant.color?.trim().toLowerCase()}`;
        if (seenVariants.has(variantKey)) {
          errors[`size-${index}`] = `Duplicate size/color: ${variant.size} / ${variant.color}.`;
        }
        seenVariants.add(variantKey);
      });
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error(Object.values(errors)[0]);
      }

      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (!slug) throw new Error('Enter a product name containing letters or numbers.');
      const { data: slugMatch, error: slugError } = await supabase.from('products').select('id').eq('slug', slug).neq('id', savedProductId).limit(1);
      if (slugError) throw slugError;
      if (slugMatch?.length) throw new Error('A product with this name already exists.');

      setLoadingText('UPLOADING IMAGES...');
      const persistedImages = await uploadGalleryImages(savedProductId, galleryImages, uploadedPaths);
      if (persistedImages.some((image) => !image.imageUrl)) {
        throw new Error('One or more images are missing a public URL.');
      }

      setLoadingText('SAVING PRODUCT & VARIANTS...');
      const { error: saveError } = await supabase.rpc('save_admin_product_atomic', {
        p_product_id: savedProductId,
        p_product: { ...formData, slug, name: formData.name.trim(), description: formData.description.trim(), price: Number(formData.price) },
        p_variants: variants.map((variant) => ({ id: variant.id || null, size: variant.size, color: variant.color.trim(), stock: Number(variant.stock) })),
        p_images: persistedImages.map((image) => ({ id: image.id || null, image_url: image.imageUrl })),
      });
      if (saveError) throw saveError;

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

      navigate('/account/admin/products', { state: { notice: 'Product saved successfully.' } });
    } catch (saveError) {
      console.error(saveError);
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from('product-images')
          .remove(uploadedPaths);
        if (cleanupError) console.error('Unable to clean up uploaded images:', cleanupError);
      }

      const message = saveError.code === '23505'
        ? saveError.message?.includes('products_slug_key') ? 'A product with this name already exists.' : 'A conflicting product variant already exists.'
        : saveError.message || 'Save failed. Please try again.';
      setError(message);
    } finally {
      savingRef.current = false;
      setLoading(false);
      setLoadingText('');
    }
  };

  if (initialLoading) return <div role="status" style={{ color: '#fff', padding: '32px' }}>Loading product editor...</div>;
  if (loadError) return <div role="alert" style={{ color: '#ef4444', padding: '32px' }}>{loadError} <button type="button" onClick={() => window.location.reload()}>Retry</button></div>;

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

      <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
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
            {fieldErrors.images && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors.images}</p>}

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
              <input type="text" name="name" className={styles.inputField} value={formData.name} onChange={handleInputChange} />
              {fieldErrors.name && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors.name}</p>}
            </div>
            <div className={styles.formGrid}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <label className={styles.inputLabel}>Price (₹)</label>
                <input type="number" min="0.01" step="0.01" name="price" className={styles.inputField} value={formData.price} onChange={handleInputChange} />
                {fieldErrors.price && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors.price}</p>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <label className={styles.inputLabel}>Category</label>
                <CustomSelect name="category_id" className={styles.inputField} value={formData.category_id} onChange={handleInputChange}>
                  <option value="">Select Category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </CustomSelect>
                {fieldErrors.category_id && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors.category_id}</p>}
              </div>
            </div>
            <div>
              <label className={styles.inputLabel}>Description</label>
              <textarea name="description" className={styles.inputField} value={formData.description} onChange={handleInputChange} style={{ minHeight: '80px', resize: 'vertical' }} />
              {fieldErrors.description && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors.description}</p>}
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
          {variants.some((variant) => variant.id && !sizingOptions.includes(variant.size)) && (
            <p role="alert" style={{ color: '#eab308', marginBottom: '12px' }}>
              Existing variant sizes do not match this category. They were not changed automatically; select valid sizes or restore the previous category before saving.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {variants.map((variant, index) => (
              <div key={variant.id || variant.clientId} className={styles.variantRow}>
                <div style={{ flex: 1 }}>
                  <label className={styles.variantLabel}>Size</label>
                  <CustomSelect
                    value={variant.size}
                    onChange={(event) => handleVariantChange(index, 'size', event.target.value)}
                    className={styles.inputField}
                    style={{ padding: '10px' }}
                  >
                    <option value="">Select Size</option>
                    {sizingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    {variant.size && !sizingOptions.includes(variant.size) && (
                      <option value={variant.size}>{variant.size} (Invalid)</option>
                    )}
                  </CustomSelect>
                  {fieldErrors[`size-${index}`] && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors[`size-${index}`]}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.variantLabel}>Color</label>
                  <input type="text" placeholder="e.g. Black" value={variant.color} onChange={(event) => handleVariantChange(index, 'color', event.target.value)} className={styles.inputField} style={{ padding: '10px' }} />
                  {fieldErrors[`color-${index}`] && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors[`color-${index}`]}</p>}
                </div>
                <div>
                  <label className={styles.variantLabel}>Stock</label>
                  <input type="number" min="0" placeholder="0" value={variant.stock} onChange={(event) => handleVariantChange(index, 'stock', event.target.value)} className={styles.inputField} style={{ padding: '10px', width: '100%' }} />
                  {fieldErrors[`stock-${index}`] && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors[`stock-${index}`]}</p>}
                </div>
                <button type="button" aria-label={`Remove variant ${index + 1}`} onClick={() => removeVariant(index)} className={styles.removeVariantBtn}>
                  &times;
                </button>
              </div>
            ))}
          </div>
          {fieldErrors.variants && <p role="alert" style={{ color: '#ef4444' }}>{fieldErrors.variants}</p>}
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
