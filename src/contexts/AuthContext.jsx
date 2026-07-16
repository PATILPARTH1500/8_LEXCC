import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchWishlist(session.user.id);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchWishlist(session.user.id);
      } else {
        setProfile(null);
        setWishlistItems([]);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    }
  };

  const signUp = async ({ email, password, firstName, lastName, phone }) => {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone
        }
      }
    });
    
    if (error) throw error;
    
    // Check for duplicate account attempt when email confirmations are ON
    // Supabase returns an empty identities array to prevent email enumeration
    if (data.user && data.user.identities && data.user.identities.length === 0) {
       throw new Error("An account already exists with this email. Please sign in using your existing authentication method.");
    }
    
    // Note: Database triggers automatically create the profile row
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const googleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/account'
      }
    });
    if (error) throw error;
    return data;
  };

  const verifyEmail = async (token) => {
    // Typically handled automatically via URL clicks to the site from Supabase emails
    // Or implemented via verifyOtp if using OTP codes for email verification
  };

  const sendOTP = async (phone) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) throw error;
    return data;
  };

  const verifyOTP = async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  };

  const forgotPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No active user');
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const uploadAvatar = async (file) => {
    if (!user) throw new Error('No active user');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    // Update profile
    const profileData = await updateProfile({ avatar_url: publicUrlData.publicUrl });
    
    return profileData;
  };

  // Address Management
  const fetchAddresses = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  };

  const addAddress = async (address) => {
    if (!user) throw new Error('No active user');
    
    if (address.is_default) {
      // Unset previous default
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id).eq('is_default', true);
    }
    
    const { data, error } = await supabase
      .from('addresses')
      .insert([{ ...address, user_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  };

  const updateAddress = async (id, updates) => {
    if (!user) throw new Error('No active user');
    
    if (updates.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id).eq('is_default', true);
    }
    
    const { data, error } = await supabase
      .from('addresses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  };

  const deleteAddress = async (id) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
  };

  // Wishlist Management
  const fetchWishlist = async (uid = user?.id) => {
    if (!uid) return [];

    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        product_id,
        products (
          id,
          name,
          slug,
          price,
          image_url
        )
      `)
      .eq('user_id', uid);
      
    if (error) throw error;
    setWishlistItems(data || []);
    return data;
  };

  const addToWishlist = async (productId) => {
    if (!user) throw new Error('Please log in to save items to your wishlist');

    const { data, error } = await supabase
      .from('wishlist')
      .insert([{ user_id: user.id, product_id: productId }])
      .select(`
        id,
        product_id,
        products (
          id,
          name,
          slug,
          price,
          image_url
        )
      `)
      .single();
      
    // Ignore duplicate insert errors
    if (error && error.code !== '23505') throw error;
    
    if (data) {
      setWishlistItems(prev => {
        if (prev.some(item => item.product_id === productId)) return prev;
        return [...prev, data];
      });
    }
    return data;
  };

  const removeFromWishlist = async (itemId) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', itemId);
      
    if (error) throw error;
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear potentially cached items
    localStorage.removeItem('lexcc_cart');
    setUser(null);
    setSession(null);
    setProfile(null);
    setWishlistItems([]);
  };

  const logoutAllDevices = async () => {
    // Logs out all sessions associated with the user by updating the password
    // Wait, typically this uses the globalSignOut API, not exposed directly in supabase-js V2
    // A standard approach is invalidating refresh tokens
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    googleSignIn,
    verifyEmail,
    sendOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
    updateProfile,
    uploadAvatar,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    wishlistItems,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    logout,
    logoutAllDevices
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
