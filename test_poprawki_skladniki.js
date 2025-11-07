// Test poprawek dla składników i polskiej gramatyki
const formatPolishNumber = function(count, singular, pluralGenitive) {
  if (count === 1) return singular;
  if (count >= 2 && count <= 4) return 'składniki'; // Hardcoded for proper Polish grammar
  return pluralGenitive; // "składników" dla 5+
};

function formatIngredientsCount(count) {
  return formatPolishNumber(count, 'składnik', 'składników');
}

console.log('=== TEST POLSKIEJ GRAMATYKI ===');
console.log('Test 1 (1):', formatIngredientsCount(1)); // Oczekiwane: "składnik"
console.log('Test 2 (2):', formatIngredientsCount(2)); // Oczekiwane: "składniki"
console.log('Test 3 (3):', formatIngredientsCount(3)); // Oczekiwane: "składniki"
console.log('Test 4 (4):', formatIngredientsCount(4)); // Oczekiwane: "składniki"
console.log('Test 5 (5):', formatIngredientsCount(5)); // Oczekiwane: "składników"
console.log('Test 6 (10):', formatIngredientsCount(10)); // Oczekiwane: "składników"

console.log('\n=== TEST PORÓWNYWANIA SKŁADNIKÓW ===');

// Symulacja porównywania składników
function testIngredientComparison(oldCount, newCount, expectedChange) {
  const oldSorted = Array(oldCount).fill(0).map((_, i) => ({ ingredient_id: i + 1, quantity_needed: 1 }));
  const newSorted = Array(newCount).fill(0).map((_, i) => ({ ingredient_id: i + 1, quantity_needed: 1 }));
  
  let ingredientsChanged = false;
  
  if (newSorted.length !== oldSorted.length) {
    ingredientsChanged = true;
  } else {
    for (let i = 0; i < newSorted.length; i++) {
      if (newSorted[i].ingredient_id !== oldSorted[i].ingredient_id ||
          parseFloat(newSorted[i].quantity_needed) !== parseFloat(oldSorted[i].quantity_needed)) {
        ingredientsChanged = true;
        break;
      }
    }
  }
  
  console.log(`Stary: ${oldCount}, Nowy: ${newCount}, Zmienione: ${ingredientsChanged}, Oczekiwane: ${expectedChange}`);
  
  if (ingredientsChanged && oldCount !== newCount) {
    console.log(`  → Komunikat: "składniki: ${oldCount} → ${newCount} ${formatIngredientsCount(newCount)}"`);
  } else if (ingredientsChanged) {
    console.log(`  → Komunikat: "składniki: zaktualizowano ${formatIngredientsCount(newCount)}"`);
  } else {
    console.log('  → Brak komunikatu o składnikach');
  }
}

// Test cases from the original test report
testIngredientComparison(0, 2, true);  // 0 → 2 składniki (dodanie)
testIngredientComparison(2, 3, true);  // 2 → 3 składniki (dodanie)
testIngredientComparison(3, 1, true);  // 3 → 1 składnik (usunięcie)
testIngredientComparison(1, 2, true);  // 1 → 2 składniki (dodanie)
testIngredientComparison(2, 2, false); // Brak zmiany (tylko aktualizacja ilości)

console.log('\n=== TEST KOMUNIKATÓW KOŃCOWYCH ===');

// Symulacja pełnej logiki z backend
function formatProductUpdateDetails(oldProduct, newProduct, oldIngredientsSorted, newIngredients, ingredientsChanged) {
  const changes = [];
  
  // Sprawdź zmiany nazwy
  if (oldProduct.name !== newProduct.name) {
    changes.push(`nazwa: "${oldProduct.name}" → "${newProduct.name}"`);
  }
  
  // Sprawdź zmiany ceny
  if (oldProduct.price && newProduct.price && 
      parseFloat(oldProduct.price).toFixed(2) !== parseFloat(newProduct.price).toFixed(2)) {
    changes.push(`cena: ${parseFloat(oldProduct.price).toFixed(2)} zł → ${parseFloat(newProduct.price).toFixed(2)} zł`);
  }
  
  // Sprawdź zmiany grupy
  if (oldProduct.group !== newProduct.group) {
    changes.push(`grupa: "${oldProduct.group}" → "${newProduct.group}"`);
  }
  
  // Sprawdź zmiany składników tylko jeśli rzeczywiście się zmieniły
  if (ingredientsChanged) {
    if (oldIngredientsSorted.length > 0 || (newIngredients && newIngredients.length > 0)) {
      const oldCount = oldIngredientsSorted.length;
      const newCount = newIngredients ? newIngredients.length : 0;
      if (oldCount !== newCount) {
        changes.push(`składniki: ${oldCount} → ${newCount} ${formatIngredientsCount(newCount)}`);
      } else {
        changes.push(`składniki: zaktualizowano ${formatIngredientsCount(newIngredients.length)}`);
      }
    }
  }
  
  const changesText = changes.length > 0 ? ` (zmiany: ${changes.join(', ')})` : ' (brak zmian)';
  return `Zaktualizowano produkt: ${newProduct.name}${changesText}`;
}

// Test case 1: Zmiana tylko nazwy (składniki bez zmian)
const oldProduct1 = { name: "Zmodyfikowana Kawa", price: 18.50, group: "Kawy" };
const newProduct1 = { name: "Zmodyfikowana Kawa v2", price: 18.50, group: "Kawy" };
const oldIngredients1 = [ {ingredient_id: 1, quantity_needed: 2}, {ingredient_id: 2, quantity_needed: 1} ];
const newIngredients1 = [ {ingredient_id: 1, quantity_needed: 2}, {ingredient_id: 2, quantity_needed: 1} ];
const result1 = formatProductUpdateDetails(oldProduct1, newProduct1, oldIngredients1, newIngredients1, false);
console.log('\nTest 1 (tylko nazwa):', result1);

// Test case 2: Zmiana składników (2 → 3)
const oldProduct2 = { name: "Zmodyfikowana Kawa", price: 18.50, group: "Kawy" };
const newProduct2 = { name: "Zmodyfikowana Kawa", price: 18.50, group: "Kawy" };
const oldIngredients2 = [ {ingredient_id: 1, quantity_needed: 2}, {ingredient_id: 2, quantity_needed: 1} ];
const newIngredients2 = [ {ingredient_id: 1, quantity_needed: 2}, {ingredient_id: 2, quantity_needed: 1}, {ingredient_id: 3, quantity_needed: 0.5} ];
const result2 = formatProductUpdateDetails(oldProduct2, newProduct2, oldIngredients2, newIngredients2, true);
console.log('Test 2 (dodanie składnika):', result2);

// Test case 3: Zmiana ceny i składników (3 → 1)
const oldProduct3 = { name: "Zmodyfikowana Kawa", price: 20.00, group: "Kawy" };
const newProduct3 = { name: "Zmodyfikowana Kawa", price: 25.00, group: "Kawy" };
const oldIngredients3 = [ {ingredient_id: 1, quantity_needed: 2}, {ingredient_id: 2, quantity_needed: 1}, {ingredient_id: 3, quantity_needed: 0.5} ];
const newIngredients3 = [ {ingredient_id: 1, quantity_needed: 1} ];
const result3 = formatProductUpdateDetails(oldProduct3, newProduct3, oldIngredients3, newIngredients3, true);
console.log('Test 3 (cena + składniki):', result3);

console.log('\n=== PODSUMOWANIE ===');
console.log('✅ Test polskiej gramatyki - sprawdź czy wyniki są poprawne');
console.log('✅ Test porównywania składników - powinien pokazywać tylko przy realnych zmianach');
console.log('✅ Test komunikatów - powinien zawierać poprawne gramatycznie komunikaty');