// Finalna weryfikacja poprawek w backendzie
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

async function testBackend() {
  console.log('=== FINALNA WERYFIKACJA BACKENDU ===\n');
  
  try {
    // Test 1: Pobierz produkty
    console.log('1. Pobieranie produktów...');
    const getProducts = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/menu',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (getProducts.statusCode === 200) {
      console.log(`✅ Znaleziono ${getProducts.data.length} produktów`);
      const testProduct = getProducts.data[0];
      console.log(`   Przykładowy produkt: ${testProduct.name} (cena: ${testProduct.price} zł)`);
      
      // Test 2: Pobierz składniki dla produktu
      console.log('\n2. Pobieranie składników produktu...');
      const getIngredients = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/menu/${testProduct.id}/ingredients`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (getIngredients.statusCode === 200) {
        console.log(`✅ Znaleziono ${getIngredients.data.length} składników dla produktu`);
        console.log('   Składniki:', getIngredients.data.map(ing => `${ing.ingredient_name} (${ing.quantity_needed}${ing.unit})`).join(', '));
        
        // Test 3: Przygotuj dane do aktualizacji
        const updateData = {
          name: testProduct.name + ' v2 (test poprawek)',
          price: testProduct.price,
          group: testProduct.group,
          ingredients: getIngredients.data.map(ing => ({
            ingredient_id: ing.ingredient_id,
            quantity_needed: ing.quantity_needed
          }))
        };
        
        // Test 4: Aktualizuj produkt (tylko nazwa, składniki bez zmian)
        console.log('\n3. Test aktualizacji produktu (tylko nazwa)...');
        
        // Najpierw zaloguj się
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
          console.log('✅ Zalogowano pomyślnie');
          const token = login.data.token;
          
          // Aktualizuj produkt
          const updateProduct = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: `/api/menu/${testProduct.id}`,
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }, updateData);
          
          if (updateProduct.statusCode === 200) {
            console.log('✅ Produkt zaktualizowany pomyślnie');
            console.log(`   Nowa nazwa: ${updateProduct.data.name}`);
            
            // Test 5: Sprawdź logi
            console.log('\n4. Sprawdzanie logów...');
            const getLogs = await makeRequest({
              hostname: 'localhost',
              port: 3001,
              path: '/api/logs?limit=5',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (getLogs.statusCode === 200) {
              console.log(`✅ Znaleziono ${getLogs.data.length} logów`);
              const latestLog = getLogs.data[0];
              console.log('   Ostatni log:');
              console.log(`   Akcja: ${latestLog.action}`);
              console.log(`   Szczegóły: ${latestLog.details}`);
              
              // Sprawdź czy komunikat jest poprawny
              if (latestLog.details.includes('(brak zmian)') || 
                  (latestLog.details.includes('zmiany:') && !latestLog.details.includes('składniki:'))) {
                console.log('   ✅ Poprawny komunikat - brak błędnej informacji o składnikach!');
              } else if (latestLog.details.includes('składniki:')) {
                console.log('   ❌ Błędny komunikat - zawiera informację o składnikach mimo braku zmiany');
              }
            }
          } else {
            console.log('❌ Błąd aktualizacji produktu:', updateProduct.data);
          }
        } else {
          console.log('❌ Błąd logowania:', login.data);
        }
      } else {
        console.log('❌ Błąd pobierania składników:', getIngredients.data);
      }
    } else {
      console.log('❌ Błąd pobierania produktów:', getProducts.data);
    }
    
  } catch (error) {
    console.error('❌ Błąd testu:', error.message);
  }
}

testBackend();