import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const CartContext = createContext({});
const CART_STORAGE_KEY = 'lexcc_cart';
const CART_MERGE_ID_KEY = 'lexcc_cart_merge_id';

const readLocalCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Unable to read the local cart:', error);
    return [];
  }
};

const writeLocalCart = (items) => {
  if (items.length === 0) {
    localStorage.removeItem(CART_STORAGE_KEY);
    return;
  }
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [cartError, setCartError] = useState('');
  const [cartInitialized, setCartInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeCart = async () => {
      setCartInitialized(false);
      const localCart = readLocalCart();
      let pendingLocalCart = [...localCart];

      if (!user) {
        setCartId(null);
        setCartItems(localCart);
        setCartError('');
        setCartInitialized(true);
        return;
      }

      try {
        let { data: cart, error: cartLookupError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cartLookupError) throw cartLookupError;

        if (!cart) {
          const { data: createdCart, error: createCartError } = await supabase
            .from('carts')
            .insert([{ user_id: user.id }])
            .select('id')
            .single();

          if (createCartError) throw createCartError;
          cart = createdCart;
        }

        if (cancelled) return;
        setCartId(cart.id);

        if (localCart.length > 0) {
          const mergeItems = localCart.map((item) => {
            const quantity = Number(item.quantity);
            if (!item.product?.id || !Number.isInteger(quantity) || quantity < 1) {
              throw new Error('The guest cart contains an invalid item');
            }

            return {
              product_id: item.product.id,
              variant_id: item.variant?.id || null,
              size: item.variant?.size || 'default',
              color: item.variant?.color || 'default',
              quantity
            };
          });

          let mergeId = localStorage.getItem(CART_MERGE_ID_KEY);
          if (!mergeId) {
            mergeId = crypto.randomUUID();
            localStorage.setItem(CART_MERGE_ID_KEY, mergeId);
          }

          const { error: mergeError } = await supabase.rpc('merge_guest_cart', {
            p_merge_id: mergeId,
            p_items: mergeItems
          });
          if (mergeError) throw mergeError;

          pendingLocalCart = [];
          writeLocalCart([]);
          localStorage.removeItem(CART_MERGE_ID_KEY);
        } else {
          localStorage.removeItem(CART_MERGE_ID_KEY);
        }

        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            size,
            color,
            variant_id,
            product_id,
            products (
              id, name, price, slug, image_url
            )
          `)
          .eq('cart_id', cart.id)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;
        if (cancelled) return;

        setCartItems((items || []).map((dbItem) => ({
          id: dbItem.id,
          product: { ...dbItem.products },
          variant: {
            id: dbItem.variant_id,
            size: dbItem.size !== 'default' ? dbItem.size : null,
            color: dbItem.color !== 'default' ? dbItem.color : null
          },
          quantity: dbItem.quantity
        })));
        setCartError('');
        localStorage.removeItem(CART_STORAGE_KEY);
        setCartInitialized(true);
      } catch (error) {
        console.error('Cart initialization failed:', error);
        if (cancelled) return;

        setCartId(null);
        setCartItems(pendingLocalCart);
        writeLocalCart(pendingLocalCart);
        setCartError('Your saved cart is temporarily unavailable. Changes will stay on this device.');
        setCartInitialized(true);
      }
    };

    initializeCart();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Guests and authenticated users in fallback mode both retain their cart locally.
  useEffect(() => {
    if (cartInitialized && (!user || !cartId)) writeLocalCart(cartItems);
  }, [cartItems, user, cartId, cartInitialized]);

  const addToCart = async (product, variant = null, quantity = 1) => {
    const normalizedQuantity = Number(quantity);
    if (!product?.id || !Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
      throw new Error('A valid product and quantity are required');
    }

    const size = variant?.size || 'default';
    const color = variant?.color || 'default';

    if (user && cartId) {
      try {
        const { data: existing, error: existingError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .match({ cart_id: cartId, product_id: product.id, size, color })
          .maybeSingle();

        if (existingError) throw existingError;

        if (existing) {
          const nextQuantity = existing.quantity + normalizedQuantity;
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: nextQuantity, variant_id: variant?.id || null })
            .eq('id', existing.id)
            .eq('cart_id', cartId);

          if (updateError) throw updateError;
          setCartItems((current) => current.map((item) => (
            item.id === existing.id ? { ...item, quantity: nextQuantity, variant } : item
          )));
        } else {
          const { data: newItem, error: insertError } = await supabase
            .from('cart_items')
            .insert([{
              cart_id: cartId,
              product_id: product.id,
              variant_id: variant?.id || null,
              size,
              color,
              quantity: normalizedQuantity
            }])
            .select('id')
            .single();

          if (insertError) throw insertError;
          setCartItems((current) => [...current, {
            id: newItem.id,
            product,
            variant,
            quantity: normalizedQuantity
          }]);
        }
        setCartError('');
      } catch (error) {
        setCartError(error.message || 'Unable to add this item to your saved cart.');
        setIsCartOpen(true);
        throw error;
      }
    } else {
      setCartItems((current) => {
        const existingIndex = current.findIndex((item) => (
          item.product.id === product.id
          && item.variant?.id === variant?.id
          && item.variant?.size === variant?.size
          && item.variant?.color === variant?.color
        ));

        if (existingIndex < 0) {
          return [...current, {
            id: `${product.id}-${variant?.id || size}-${color}`,
            product,
            variant,
            quantity: normalizedQuantity
          }];
        }

        return current.map((item, index) => (
          index === existingIndex
            ? { ...item, quantity: item.quantity + normalizedQuantity }
            : item
        ));
      });
    }

    setIsCartOpen(true);
  };

  const removeFromCart = async (itemId) => {
    if (user && cartId) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('cart_id', cartId);

      if (error) {
        setCartError(error.message || 'Unable to remove this item.');
        throw error;
      }
    }

    setCartItems((current) => current.filter((item) => item.id !== itemId));
    setCartError('');
  };

  const updateQuantity = async (itemId, newQuantity) => {
    const normalizedQuantity = Number(newQuantity);
    if (!Number.isInteger(normalizedQuantity)) throw new Error('Quantity must be a whole number');
    if (normalizedQuantity < 1) return removeFromCart(itemId);

    if (user && cartId) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: normalizedQuantity })
        .eq('id', itemId)
        .eq('cart_id', cartId);

      if (error) {
        setCartError(error.message || 'Unable to update the quantity.');
        throw error;
      }
    }

    setCartItems((current) => current.map((item) => (
      item.id === itemId ? { ...item, quantity: normalizedQuantity } : item
    )));
    setCartError('');
    return undefined;
  };

  const clearCart = async () => {
    if (user && cartId) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        setCartError(error.message || 'Unable to clear your saved cart.');
        throw error;
      }
    }

    setCartItems([]);
    setCartError('');
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + ((item.product?.price || 0) * item.quantity),
    0
  );
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      cartError,
      clearCartError: () => setCartError('')
    }}>
      {children}
    </CartContext.Provider>
  );
};
