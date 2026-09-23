import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const authUserIdRef = useRef(null);

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    setProfile(data || null);
    return data;
  }, []);

  const fetchWishlist = useCallback(async (uid) => {
    if (!uid) {
      setWishlistItems([]);
      return [];
    }

    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', uid)
      .maybeSingle();

    if (wishlistError) throw wishlistError;
    if (!wishlist) {
      setWishlistItems([]);
      return [];
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        product_id,
        products (
          id,
          name,
          slug,
          price,
          image_url,
          variants:product_variants (
            id,
            size,
            color,
            stock
          )
        )
      `)
      .eq('wishlist_id', wishlist.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setWishlistItems(data || []);
    return data || [];
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession) => {
      if (!mounted) return;
      if (nextSession?.user?.id !== authUserIdRef.current) {
        setProfileLoading(Boolean(nextSession?.user));
        authUserIdRef.current = nextSession?.user?.id ?? null;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setWishlistItems([]);
      }
    };

    const initializeSession = async () => {
      try {
        const { data: { session: activeSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        applySession(activeSession);
      } catch (error) {
        console.error('Error restoring authentication session:', error.message);
        applySession(null);
      } finally {
        if (mounted) setAuthInitialized(true);
      }
    };

    initializeSession();

    // Keep the auth callback synchronous. Profile and wishlist hydration happens below.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authInitialized) return undefined;

    let active = true;

    const hydrateAuthenticatedUser = async () => {
      if (!user) {
        setProfile(null);
        setWishlistItems([]);
        setLoading(false);
        setProfileLoading(false);
        return;
      }

      setLoading(true);
      setProfileLoading(true);
      const results = await Promise.allSettled([
        fetchProfile(user.id),
        fetchWishlist(user.id)
      ]);

      if (!active) return;

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const resource = index === 0 ? 'profile' : 'wishlist';
          console.error(`Error fetching ${resource}:`, result.reason?.message || result.reason);
        }
      });
      setLoading(false);
      setProfileLoading(false);
    };

    hydrateAuthenticatedUser();
    return () => {
      active = false;
    };
  }, [authInitialized, user?.id, fetchProfile, fetchWishlist]);

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
      password
    });

    if (error) {
      throw error;
    }

    if (!data?.session || !data?.user) {
      throw new Error('Unable to establish an authenticated session.');
    }

    setSession(data.session);
    setProfileLoading(true);
    setUser(data.user);

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

  const changePassword = async (currentPassword, newPassword) => {
    if (!user?.email) throw new Error('No password-based account is available');

    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (verificationError) {
      throw new Error('The current password is incorrect');
    }

    return resetPassword(newPassword);
  };

  const verifyTurnstileToken = async (token) => {
    const { data, error } = await supabase.functions.invoke('verify-turnstile', {
      body: { token }
    });
    if (error) throw error;
    if (!data.success) throw new Error("Security check failed. Please try again.");
    return true;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No active user');

    const allowedFields = new Set([
      'first_name',
      'last_name',
      'phone',
      'avatar_url',
      'dob',
      'gender',
      'language',
      'currency'
    ]);
    const safeUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(([key]) => allowedFields.has(key))
    );

    if (Object.keys(safeUpdates).length === 0) {
      throw new Error('No editable profile fields were provided');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
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
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    // Path must be {userId}/{fileName} so storage.foldername(name)[1] = auth.uid()
    // which is required by the avatars bucket INSERT RLS policy.
    const filePath = `${user.id}/${fileName}`;

    // Upload image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw {
        message: uploadError.message,
        statusCode: uploadError.statusCode || 'N/A',
        error: uploadError.error || 'N/A',
        name: uploadError.name,
        original: uploadError
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
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
  const addToWishlist = async (productId) => {
    if (!user) throw new Error('Please log in to save items to your wishlist');

    let { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (wishlistError) throw wishlistError;

    if (!wishlist) {
      const { data: createdWishlist, error: createError } = await supabase
        .from('wishlists')
        .insert([{ user_id: user.id }])
        .select('id')
        .single();

      if (createError) throw createError;
      wishlist = createdWishlist;
    }

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([{ wishlist_id: wishlist.id, product_id: productId }])
      .select(`
        id,
        product_id,
        products (
          id,
          name,
          slug,
          price,
          image_url,
          variants:product_variants (
            id,
            size,
            color,
            stock
          )
        )
      `)
      .single();
      
    if (error?.code === '23505') {
      await fetchWishlist(user.id);
      return null;
    }
    if (error) throw error;
    
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
      .from('wishlist_items')
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
    profileLoading,
    authInitialized,
    signUp,
    signIn,
    verifyEmail,
    sendOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    uploadAvatar,
    verifyTurnstileToken,
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
      {authInitialized && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
