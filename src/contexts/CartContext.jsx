import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartId, setCartId] = useState(null);

  // 1. Init Cart (Merge local to DB on login, or just load)
  useEffect(() => {
    const initCart = async () => {
      let localCart = [];
      const saved = localStorage.getItem('lexcc_cart');
      if (saved) {
        try { localCart = JSON.parse(saved); } catch (e) { console.error(e); }
      }

      if (user) {
        try {
          // Get or create cart for user
          let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();
          if (!cart) {
            const { data: newCart } = await supabase.from('carts').insert([{ user_id: user.id }]).select('id').single();
            cart = newCart;
          }
          setCartId(cart?.id);

          // If there's a local cart, merge it into DB
          if (localCart.length > 0 && cart?.id) {
            for (const item of localCart) {
              const sizeStr = item.variant?.size || 'default';
              const colorStr = item.variant?.color || 'default';
              
              const { data: existing } = await supabase.from('cart_items')
                .select('id, quantity')
                .match({ cart_id: cart.id, product_id: item.product.id, size: sizeStr, color: colorStr })
                .single();

              if (existing) {
                await supabase.from('cart_items').update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id);
              } else {
                await supabase.from('cart_items').insert([{
                  cart_id: cart.id,
                  product_id: item.product.id,
                  size: sizeStr,
                  color: colorStr,
                  quantity: item.quantity
                }]);
              }
            }
            localStorage.removeItem('lexcc_cart');
          }

          // Fetch fresh DB cart
          if (cart?.id) {
            const { data: items } = await supabase.from('cart_items')
              .select(`
                id,
                quantity,
                size,
                color,
                product_id,
                products (
                  id, name, price, slug, image_url
                )
              `)
              .eq('cart_id', cart.id);

            if (items) {
              const formattedItems = items.map(dbItem => ({
                id: dbItem.id, // DB item ID
                product: {
                  ...dbItem.products
                },
                variant: { size: dbItem.size !== 'default' ? dbItem.size : null, color: dbItem.color !== 'default' ? dbItem.color : null },
                quantity: dbItem.quantity
              }));
              setCartItems(formattedItems);
            }
          }
        } catch (err) {
          console.error("Cart Init Error:", err);
        }
      } else {
        // Guest user
        setCartId(null);
        setCartItems(localCart);
      }
    };

    initCart();
  }, [user]);

  // Sync to localStorage only if guest
  useEffect(() => {
    if (!user) {
      localStorage.setItem('lexcc_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = async (product, variant = null, quantity = 1) => {
    const sizeStr = variant?.size || 'default';
    const colorStr = variant?.color || 'default';

    if (user && cartId) {
      try {
        const { data: existing } = await supabase.from('cart_items')
          .select('id, quantity')
          .match({ cart_id: cartId, product_id: product.id, size: sizeStr, color: colorStr })
          .single();

        if (existing) {
          await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
          setCartItems(prev => prev.map(item => item.id === existing.id ? { ...item, quantity: existing.quantity + quantity } : item));
        } else {
          const { data: newItem } = await supabase.from('cart_items').insert([{
            cart_id: cartId,
            product_id: product.id,
            size: sizeStr,
            color: colorStr,
            quantity
          }]).select('id').single();

          if (newItem) {
            setCartItems(prev => [...prev, { id: newItem.id, product, variant, quantity }]);
          }
        }
      } catch (err) { console.error("Error adding to DB cart:", err); }
    } else {
      // Guest logic
      setCartItems(prev => {
        const existingIndex = prev.findIndex(item => item.product.id === product.id && item.variant?.size === variant?.size && item.variant?.color === variant?.color);
        if (existingIndex >= 0) {
          const newCart = [...prev];
          newCart[existingIndex].quantity += quantity;
          return newCart;
        } else {
          return [...prev, { id: `${product.id}-${sizeStr}-${colorStr}`, product, variant, quantity }];
        }
      });
    }
    setIsCartOpen(true);
  };

  const removeFromCart = async (itemId) => {
    if (user) {
      await supabase.from('cart_items').delete().eq('id', itemId);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    if (user) {
      await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', itemId);
      setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    } else {
      setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const clearCart = async () => {
    if (user && cartId) {
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
    }
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + ((item.product?.price || 0) * item.quantity), 0);
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
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
