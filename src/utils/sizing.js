export const getSizingSystem = (categorySlug) => {
  if (!categorySlug) return 'APPAREL';
  const slug = categorySlug.toLowerCase();
  
  if (slug === 'footwear') return 'FOOTWEAR';
  if (slug === 'accessories' || slug === 'collections') return 'ONE_SIZE';
  
  return 'APPAREL'; // Default for Men, Women, Apparel, etc.
};

export const getSizesForSystem = (system) => {
  switch (system) {
    case 'FOOTWEAR':
      return ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];
    case 'ONE_SIZE':
      return ['OS'];
    case 'APPAREL':
    default:
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }
};

export const formatDisplaySize = (sizeStr, system) => {
  if (!sizeStr) return '';
  if (system === 'FOOTWEAR' && sizeStr.startsWith('UK ')) {
    return sizeStr.replace('UK ', '');
  }
  return sizeStr;
};

export const getSizeLabel = (system) => {
  if (system === 'FOOTWEAR') return 'UK SIZE';
  return 'SIZE';
};
