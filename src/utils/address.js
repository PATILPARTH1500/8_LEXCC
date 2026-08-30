// src/utils/address.js

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

/**
 * Validates an Indian PIN Code.
 * Exactly 6 digits.
 */
export const isValidPinCode = (pin) => {
  return /^\d{6}$/.test(pin);
};

/**
 * Validates an Indian Phone Number.
 * Normalizes to handle optional +91, spaces, dashes.
 * Basic check: 10 digits after optional country code.
 */
export const isValidIndianPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'));
};

/**
 * Normalizes an Indian Phone Number to standard 10-digit format (or +91...).
 * We will store just the 10 digits or +91 format if preferred.
 * Let's store just the 10 digits for simplicity and consistency.
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.substring(2);
  }
  return digitsOnly;
};

/**
 * Canonical Address Shape Helper
 * Maps various inputs to the canonical shape expected by the DB and UI.
 */
export const toCanonicalAddress = (input) => {
  return {
    first_name: input.first_name || '',
    last_name: input.last_name || '',
    phone: input.phone || '',
    street: input.street || input.address_line_1 || '',
    address_line_2: input.address_line_2 || '',
    city: input.city || '',
    state: input.state || '',
    postal_code: input.postal_code || input.pincode || '',
    country: input.country || 'India'
  };
};

export const getEmptyAddress = () => ({
  title: 'HOME',
  first_name: '',
  last_name: '',
  phone: '',
  street: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false
});
