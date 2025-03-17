export const formatNumber = (value: number): string => {
  if (isNaN(value)) return 'N/A';
  
  // For percentages or small numbers, show 1 decimal place
  if (value < 100) {
    return value.toFixed(1);
  }
  
  // For larger numbers, show whole numbers with commas
  return value.toLocaleString('en-US');
}; 