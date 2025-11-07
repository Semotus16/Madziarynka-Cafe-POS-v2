// Test specyficznego przypadku z oryginalnego raportu
const https = require('http');

// Funkcja pomocnicza do wykonywania żądań HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSpecificCase() {
  console.log('=== TEST SPECYFICZNEGO PRZYPADKU Z RAPORTU ===\n');
  console.log('Cel: Zmiana nazwy produktu który ma już składniki (bez zmiany składników)\n');
  
  try {
    // 1. Pobierz produkty
    const getProducts = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/menu',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (getProducts.statusCode === 200) {
      // Znajdź produkt który ma składniki
      for (const product of getProducts.data) {
        const getIngredients = await makeRequest({
          hostname: 'localhost',
          port: 3001,
          path: `/api/menu/${product.id}/ingredients`,
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (getIngredients.statusCode === 200 && getIngredients.data.length > 0) {
          console.log(`✅ Znaleziono produkt z składnikami:`);
          console.log(`   Produkt: ${product.name}`);
          console.log(`   Składniki: ${getIngredients.data.length}`);
          console.log(`   Składniki: ${getIngredients.data.map(ing => `${ing.ingredient_name}`).join(', ')}`);
          
          // 2. Zaloguj się
          const login = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, {
            userId: 1,
            pin: '1234'
          });
          
          if (login.statusCode === 200) {
            const token = login.data.token;
            
            // 3. Aktualizuj tylko nazwę (składniki bez zmian)
            const updateData = {
              name: product.name + ' - TEST POPRAWEK',
              price: product.price,
              group: product.group,
              ingredients: getIngredients.data.map(ing => ({
                ingredient_id: ing.ingredient_id,
                quantity_needed: ing.quantity_needed
              }))
            };
            
            console.log(`\n🔄 Aktualizuję tylko nazwę (składniki bez zmian)...`);
            
            const updateProduct = await makeRequest({
              hostname: 'localhost',
              port: 3001,
              path: `/api/menu/${product.id}`,
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }, updateData);
            
            if (updateProduct.statusCode === 200) {
              console.log(`✅ Produkt zaktualizowany pomyślnie`);
              
              // 4. Sprawdź logi
              const getLogs = await makeRequest({
                hostname: 'localhost',
                port: 3001,
                path: '/api/logs?limit=3',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (getLogs.statusCode === 200) {
                const latestLog = getLogs.data[0];
                console.log('\n📋 Ostatni log:');
                console.log(`   Akcja: ${latestLog.action}`);
                console.log(`   Szczegóły: ${latestLog.details}`);
                
                // Analiza wyniku
                if (latestLog.details.includes('(brak zmian)')) {
                  console.log('\n✅ PERFEKCYJNY WYNIK! - System poprawnie wykrył brak zmian');
                } else if (latestLog.details.includes('składniki:')) {
                  const match = latestLog.details.match(/składniki: (\d+) → (\d+)/);
                  if (match && match[1] === match[2]) {
                    console.log('\n⚠️ CZĘŚCIOWY SUKCES - System wykrył zmianę składników ale liczby są identyczne');
                  } else {
                    console.log('\n❌ BŁĄD - System błędnie wykrył zmianę składników');
                    console.log('   Oczekiwane: (brak zmian) lub (zmiany: nazwa...)');
                  }
                } else if (latestLog.details.includes('zmiany:')) {
                  console.log('\n✅ SUKCES - System poprawnie zidentyfikował tylko zmianę nazwy');
                }
              }
              break; // Zakończ pętlę po pierwszym znalezionym produkcie ze składnikami
            } else {
              console.log('❌ Błąd aktualizacji:', updateProduct.data);
            }
          } else {
            console.log('❌ Błąd logowania:', login.data);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Błąd testu:', error.message);
  }
}

testSpecificCase();