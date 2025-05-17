// Format order numbers consistently across the application
export const formatOrderNumber = (orderNumber) => {
  if (!orderNumber) return 'N/A';
  
  // If it's already in the correct format (SH + 9 digits), return as is
  if (/^SH\d{9}$/.test(orderNumber)) {
    return orderNumber.replace(/^(SH\d{6})(\d{3})$/, '$1-$2');
  }
  
  // For any other format, just return the original
  return orderNumber;
};

// Format currency amounts
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
}; 