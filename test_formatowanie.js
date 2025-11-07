// Test formatowania cen
function formatPrice(price) {
  if (price === null || price === undefined) return '0.00';
  return parseFloat(price).toFixed(2);
}

console.log("Test 1:", formatPrice("18.00"), "vs", formatPrice(18.00));
console.log("Test 2:", formatPrice("18.00") === formatPrice(18.00));
console.log("Test 3:", parseFloat("18.00").toFixed(2) === parseFloat(18.00).toFixed(2));