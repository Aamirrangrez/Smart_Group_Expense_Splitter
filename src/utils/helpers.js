// Format currency with locale support
export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `₹${num.toFixed(2)}`;
  }
};

// Format date relative or absolute
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 2) return 'just now';
      return `${diffMins}m ago`;
    }
    return `${diffHrs}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined });
};

// Get initials from a name (up to 2 chars)
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
};

// Category emoji icons
export const getCategoryIcon = (category = 'general') => {
  const icons = {
    food: '🍽️',
    transport: '🚗',
    entertainment: '🎬',
    utilities: '⚡',
    shopping: '🛍️',
    health: '💊',
    travel: '✈️',
    general: '📌',
  };
  return icons[category?.toLowerCase()] || icons.general;
};

// Truncate long strings
export const truncate = (str, max = 40) => {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}…` : str;
};

// Debounce function
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Calculate percentage
export const percentage = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

// Group array of objects by key
export const groupBy = (arr, key) => {
  return arr.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};
