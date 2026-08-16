import { useState } from 'react';
import { supabase } from '../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useNewsletterSubscription = (source = 'website') => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const subscribe = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setMessage('');
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const { data, error } = await supabase.rpc('subscribe_to_newsletter', {
        p_email: normalizedEmail,
        p_source: source
      });

      if (error) throw error;
      if (data !== true) throw new Error('Subscription was not stored');

      setStatus('success');
      setMessage('You are subscribed.');
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      setStatus('error');
      setMessage('Subscription failed. Please try again.');
    }
  };

  return {
    email,
    setEmail,
    status,
    message,
    subscribe
  };
};
