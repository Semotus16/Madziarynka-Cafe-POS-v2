const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importuj połączenie z bazą

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
// === AUTHENTICATION MIDDLEWARE ===
// Simple authentication middleware that extracts user ID from JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Extract user ID from mock JWT token format: "mock-jwt-for-{userId}"
    const userIdMatch = token.match(/^mock-jwt-for-(\d+)$/);
    if (userIdMatch) {
      req.user = { id: parseInt(userIdMatch[1], 10) };
      return next();
    }
    
    // Fallback: try to decode as JSON
    const decoded = JSON.parse(token);
    if (decoded.id) {
      req.user = { id: decoded.id };
      return next();
    }
    
    return res.status(403).json({ message: 'Invalid token format' });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Helper function to get database client with transaction support

// Helper function to get database client with transaction support
const getClient = async () => {
  return await db.pool.connect();
};

// Helper function to log actions
const logAction = async (transactionClient, userId, action, module, details) => {
  if (!userId) {
    console.error('LogAction Błąd: Brak userId dla akcji:', action);
    return;
  }
  
  try {
    let client;
    let shouldRelease = false;
    
    if (transactionClient) {
      // Using provided transaction client
      client = transactionClient;
    } else {
      // Get new client from pool
      client = await getClient();
      shouldRelease = true;
    }
    
    await client.query(
      'INSERT INTO logs (user_id, action, module, details) VALUES ($1, $2, $3, $4)',
      [userId, action, module, details]
    );
    
    console.log(`Pomyślnie zalogowano akcję: ${action} przez użytkownika ${userId}`);
    
    if (shouldRelease) {
      client.release();
    }
  } catch (error) {
    console.error(`Nie udało się zalogować akcji [${action}] dla użytkownika ${userId}:`, error);
    
    // If we're in a transaction and logging fails, we should not throw
    // because the main operation should still succeed
    if (!transactionClient) {
      // For standalone operations, you might want to throw
      // but for logging, we typically don't want to fail the main operation
    }
  }
};

// === AUTHENTICATION ===
// ZMIEŃ: Pobierz użytkowników z bazy, a nie z MOCK_USERS
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, role FROM users WHERE is_active = true');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ZMIEŃ: Weryfikuj PIN z bazą danych
app.post('/auth/login', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user || user.pin !== pin) { // W produkcji użyj bcrypt.compare!
      return res.status(401).json({ message: 'Nieprawidłowy użytkownik lub PIN' });
    }
    const token = `mock-jwt-for-${user.id}`;
    const { pin: _, ...userToReturn } = user;
    
    // Log the login action
    await logAction(null, user.id, 'LOGOWANIE_UŻYTKOWNIKA', 'Autoryzacja', 'Użytkownik zalogował się do systemu');
    
    res.json({ user: userToReturn, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user endpoint
app.get('/auth/me', async (req, res) => {
  try {
    res.status(200).json({ id: '1', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === INGREDIENTS (WAREHOUSE) ===
// GET /api/ingredients - Pobierz wszystkie składniki
app.get('/api/ingredients', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, unit, stock_quantity, nominal_stock, is_active, created_at FROM ingredients WHERE is_active = true ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ message: 'Error fetching ingredients' });
  }
});

// POST /api/ingredients - Stwórz nowy składnik
app.post('/api/ingredients', authenticateToken, async (req, res) => {
  const { name, stock_quantity, unit, nominal_stock } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO ingredients (name, stock_quantity, unit, nominal_stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, stock_quantity, unit, nominal_stock]
    );
    const newIngredient = rows[0];
    if (req.user && req.user.id) {
      await logAction(null, req.user.id, 'UTWORZENIE_SKŁADNIKA', 'Magazyn', `Utworzono nowy składnik: ${newIngredient.name} (ilość: ${newIngredient.stock_quantity} ${newIngredient.unit}, stan nominalny: ${newIngredient.nominal_stock} ${newIngredient.unit})`);
    }
    res.status(201).json(newIngredient);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ message: 'Error creating ingredient' });
  }
});

// PUT /api/ingredients/:id - Zaktualizuj składnik (szczególnie stock_quantity)
app.put('/api/ingredients/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, stock_quantity, unit, is_active, nominal_stock } = req.body;
  
  // Debug logging to identify the issue
  console.log('PUT /api/ingredients/:id - Request body:', {
    id,
    name,
    stock_quantity,
    unit,
    is_active,
    nominal_stock,
    nominal_stock_type: typeof nominal_stock
  });
  
  try {
    // Pobierz poprzednie wartości składnika przed aktualizacją
    const { rows: oldRows } = await db.query(
      'SELECT * FROM ingredients WHERE id = $1',
      [id]
    );
    
    if (oldRows.length === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    
    const oldIngredient = oldRows[0];
    
    const { rows } = await db.query(
      'UPDATE ingredients SET name = $1, stock_quantity = $2, unit = $3, is_active = $4, nominal_stock = $5 WHERE id = $6 RETURNING *',
      [name, stock_quantity, unit, is_active, nominal_stock, id]
    );
    
    console.log('PUT /api/ingredients/:id - Database result:', rows[0]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    if (req.user && req.user.id) {
      // Szczegółowe porównanie wartości przed i po zmianie
      const changes = [];
      if (oldIngredient.name !== name) changes.push(`nazwa: "${oldIngredient.name}" → "${name}"`);
      if (oldIngredient.stock_quantity !== stock_quantity) changes.push(`ilość w magazynie: ${oldIngredient.stock_quantity} ${oldIngredient.unit} → ${stock_quantity} ${oldIngredient.unit}`);
      if (oldIngredient.nominal_stock !== nominal_stock) changes.push(`stan nominalny: ${oldIngredient.nominal_stock} ${oldIngredient.unit} → ${nominal_stock} ${oldIngredient.unit}`);
      if (oldIngredient.unit !== unit) changes.push(`jednostka: "${oldIngredient.unit}" → "${unit}"`);
      if (oldIngredient.is_active !== is_active) changes.push(`status: ${oldIngredient.is_active ? 'aktywny' : 'nieaktywny'} → ${is_active ? 'aktywny' : 'nieaktywny'}`);
      
      const changesText = changes.length > 0 ? ` (zmiany: ${changes.join(', ')})` : ' (brak zmian)';
      await logAction(null, req.user.id, 'AKTUALIZACJA_SKŁADNIKA', 'Magazyn', `Zaktualizowano składnik: ${name}${changesText}`);
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ message: 'Error updating ingredient' });
  }
});

// DELETE /api/ingredients/:id - Usuń składnik (soft delete)
app.delete('/api/ingredients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'UPDATE ingredients SET is_active = false WHERE id = $1 RETURNING id, name, unit, stock_quantity, nominal_stock, is_active, created_at',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    const ingredient = rows[0];
    
    // Log the ingredient deactivation
    if (req.user && req.user.id) {
      await logAction(null, req.user.id, 'DEZAKTYWACJA_SKŁADNIKA', 'Magazyn', `Dezaktywowano składnik: ${ingredient.name} (poprzednia ilość: ${ingredient.stock_quantity} ${ingredient.unit})`);
    }
    
    res.json({ message: 'Ingredient deactivated successfully', ingredient });
  } catch (error) {
    console.error('Error deactivating ingredient:', error);
    res.status(500).json({ message: 'Error deactivating ingredient' });
  }
});

// === MENU (PRODUCTS) ===
// GET /api/menu - Pobierz wszystkie produkty
app.get('/api/menu', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products WHERE is_visible = true ORDER BY "group", name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ message: 'Error fetching menu' });
  }
});

// POST /api/menu - Stwórz nowy produkt
app.post('/api/menu', authenticateToken, async (req, res) => {
  try {
    const { name, price, group, ingredients } = req.body;
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const { rows: productRows } = await client.query(
        'INSERT INTO products (name, price, "group") VALUES ($1, $2, $3) RETURNING *',
        [name, price, group]
      );
      const product = productRows[0];
      
      // Jeśli podano składniki, dodaj je do product_ingredients
      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await client.query(
            'INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES ($1, $2, $3)',
            [product.id, ingredient.ingredient_id, ingredient.quantity_needed]
          );
        }
      }
      
      // Log the product creation
      if (req.user && req.user.id) {
        await logAction(client, req.user.id, 'UTWORZENIE_PRODUKTU', 'Menu', `Utworzono nowy produkt: ${product.name} (cena: ${product.price} zł, grupa: ${product.group})`);
      }
      
      await client.query('COMMIT');
      res.status(201).json(product);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// PUT /api/menu/:id - Zaktualizuj produkt
app.put('/api/menu/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, group, ingredients } = req.body;
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Pobierz poprzednie wartości produktu przed aktualizacją
      const { rows: oldProductRows } = await client.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );
      
      if (oldProductRows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const oldProduct = oldProductRows[0];
      
      // Aktualizuj produkt
      const { rows: productRows } = await client.query(
        'UPDATE products SET name = $1, price = $2, "group" = $3 WHERE id = $4 RETURNING *',
        [name, price, group, id]
      );
      
      if (productRows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Usuń stare składniki
      await client.query('DELETE FROM product_ingredients WHERE product_id = $1', [id]);
      
      // Pobierz poprzednie składniki przed usunięciem
      const { rows: oldIngredients } = await client.query(
        'SELECT ingredient_id, quantity_needed FROM product_ingredients WHERE product_id = $1 ORDER BY ingredient_id',
        [id]
      );
      
      // Dodaj nowe składniki
      let ingredientsChanged = false;
      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await client.query(
            'INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES ($1, $2, $3)',
            [id, ingredient.ingredient_id, ingredient.quantity_needed]
          );
        }
      }
      
      // Sprawdź czy składniki się zmieniły
      const newIngredients = ingredients ? [...ingredients].sort((a, b) => a.ingredient_id - b.ingredient_id) : [];
      const oldIngredientsSorted = [...oldIngredients].sort((a, b) => a.ingredient_id - b.ingredient_id);
      
      if (newIngredients.length !== oldIngredientsSorted.length) {
        ingredientsChanged = true;
      } else {
        for (let i = 0; i < newIngredients.length; i++) {
          if (newIngredients[i].ingredient_id !== oldIngredientsSorted[i].ingredient_id ||
              newIngredients[i].quantity_needed !== oldIngredientsSorted[i].quantity_needed) {
            ingredientsChanged = true;
            break;
          }
        }
      }
      
      // Log the product update
      if (req.user && req.user.id) {
        // Szczegółowe porównanie wartości przed i po zmianie
        const changes = [];
        if (oldProduct.name !== name) changes.push(`nazwa: "${oldProduct.name}" → "${name}"`);
        if (oldProduct.price !== price) changes.push(`cena: ${oldProduct.price} zł → ${price} zł`);
        if (oldProduct.group !== group) changes.push(`grupa: "${oldProduct.group}" → "${group}"`);
        
        if (ingredientsChanged) {
          const ingredientCount = ingredients ? ingredients.length : 0;
          changes.push(`składniki: zaktualizowano ${ingredientCount} składników`);
        }
        
        const changesText = changes.length > 0 ? ` (zmiany: ${changes.join(', ')})` : ' (brak zmian)';
        await logAction(client, req.user.id, 'AKTUALIZACJA_PRODUKTU', 'Menu', `Zaktualizowano produkt: ${name}${changesText}`);
      }
      
      await client.query('COMMIT');
      res.json(productRows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE /api/menu/:id - Usuń produkt
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'UPDATE products SET is_visible = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = rows[0];
    
    // Log the product deactivation
    if (req.user && req.user.id) {
      await logAction(null, req.user.id, 'DEZAKTYWACJA_PRODUKTU', 'Menu', `Dezaktywowano produkt: ${product.name} (poprzednia cena: ${product.price} zł)`);
    }
    
    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating product:', error);
    res.status(500).json({ message: 'Error deactivating product' });
  }
});

// GET /api/menu/:id/ingredients - Pobierz składniki dla produktu
app.get('/api/menu/:id/ingredients', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT pi.ingredient_id, pi.quantity_needed, i.name as ingredient_name, i.unit
      FROM product_ingredients pi
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE pi.product_id = $1
      ORDER BY i.name
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching product ingredients:', error);
    res.status(500).json({ message: 'Error fetching product ingredients' });
  }
});

// === ORDERS ===
// GET /api/orders - Pobierz otwarte zamówienia
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM orders';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params = [status];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// POST /api/orders - Stwórz nowe zamówienie
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, total } = req.body;
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const orderRes = await client.query(
        'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING id',
        [req.user.id, total, 'open']
      );
      const orderId = orderRes.rows[0].id;
      
      // Zbierz nazwy produktów dla szczegółowego logowania
      const productNames = [];
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_per_item) VALUES ($1, $2, $3, $4)',
          [orderId, item.id, item.quantity, item.price]
        );
        
        // Pobierz nazwę produktu dla logowania
        const { rows: productRows } = await client.query(
          'SELECT name FROM products WHERE id = $1',
          [item.id]
        );
        if (productRows.length > 0) {
          productNames.push(`${productRows[0].name} x ${item.quantity} szt.`);
        }
      }
      
      // Log the order creation with detailed item information
      const itemsText = productNames.join(', ');
      await logAction(client, req.user.id, 'UTWORZENIE_ZAMÓWIENIA', 'Zamówienia', `Utworzono nowe zamówienie #${orderId} o łącznej wartości ${total} zł. Pozycje: ${itemsText}`);
      
      await client.query('COMMIT');
      res.status(201).json({ id: orderId, message: 'Order created' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// POST /api/orders/:id/complete - Zrealizuj zamówienie i zaktualizuj magazyn (NAJWAŻNIEJSZA LOGIKA)
app.post('/api/orders/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // 1. Pobierz wszystkie pozycje dla tego zamówienia (order_items)
      const { rows: items } = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      
      if (items.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Order not found or has no items' });
      }
      
      // 2. Dla każdej pozycji, pobierz jej składniki (BOM) z product_ingredients
      for (const item of items) {
        const { rows: ingredients } = await client.query(
          'SELECT ingredient_id, quantity_needed FROM product_ingredients WHERE product_id = $1',
          [item.product_id]
        );
        
        // 3. Dla każdego składnika, zaktualizuj jego stan w magazynie
        for (const ingredient of ingredients) {
          const totalNeeded = item.quantity * ingredient.quantity_needed;
          const { rows: updateResult } = await client.query(
            'UPDATE ingredients SET stock_quantity = stock_quantity - $1 WHERE id = $2 RETURNING stock_quantity',
            [totalNeeded, ingredient.ingredient_id]
          );
          
          if (updateResult.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Ingredient ${ingredient.ingredient_id} not found` });
          }
          
          // Removed: Check for negative stock quantity - now allowing negative values
        }
      }
      
      // 4. Zmień status zamówienia na 'completed'
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['completed', id]);
      
      // Log the order completion
      await logAction(client, req.user.id, 'ZAKOŃCZENIE_ZAMÓWIENIA', 'Zamówienia', `Zrealizowano zamówienie #${id} i zaktualizowano stan magazynu`);
      
      await client.query('COMMIT');
      
      res.status(200).json({ message: 'Order completed and stock updated successfully' });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Failed to complete order:', e);
      res.status(500).json({ message: 'Failed to complete order' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: 'Error completing order' });
  }
});

// PUT /api/orders/:id - Zaktualizuj otwarte zamówienie
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { items, total_price } = req.body;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Zaktualizuj cenę w głównym zamówieniu
    await client.query('UPDATE orders SET total_price = $1 WHERE id = $2', [total_price, id]);

    // 2. Usuń stare pozycje zamówienia
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // 3. Wstaw nowe pozycje zamówienia
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_per_item) VALUES ($1, $2, $3, $4)',
        [id, item.id, item.quantity, item.price]
      );
    }
    
    // Log the order update using authenticated user
    if (req.user && req.user.id) {
      await logAction(client, req.user.id, 'AKTUALIZACJA_ZAMÓWIENIA', 'Zamówienia', `Zaktualizowano zamówienie #${id} (nowa wartość: ${total_price} zł, ${items.length} pozycji)`);
    }

    await client.query('COMMIT');
    res.status(200).json({ id, message: 'Order updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  } finally {
    client.release();
  }
});
  
// === ADDITIONAL ENDPOINTS FOR FRONTEND ===

// Get order with items
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: orderRows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orderRows[0];
    const { rows: itemRows } = await db.query(`
      SELECT oi.*, p.name as product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = $1
    `, [id]);
    
    order.items = itemRows;
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Log system actions
app.post('/api/logs', async (req, res) => {
  try {
    const { user_id, action, module, details } = req.body;
    const { rows } = await db.query(
      'INSERT INTO logs (user_id, action, module, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, action, module, details]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ message: 'Error creating log' });
  }
});

// Get logs
app.get('/api/logs', async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      user_id,
      action,
      module,
      date_from,
      date_to
    } = req.query;
    
    // Build WHERE clause with safe SQL injection protection
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // Add filtering conditions
    if (user_id && user_id !== 'all') {
      conditions.push(`l.user_id = $${paramIndex}`);
      params.push(parseInt(user_id));
      paramIndex++;
    }
    
    if (action && action !== 'all') {
      conditions.push(`l.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }
    
    if (module && module !== 'all') {
      conditions.push(`l.module = $${paramIndex}`);
      params.push(module);
      paramIndex++;
    }
    
    if (date_from) {
      conditions.push(`DATE(l.created_at) >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      conditions.push(`DATE(l.created_at) <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }
    
    // Add pagination parameters
    params.push(parseInt(limit));
    params.push(parseInt(offset));
    
    // Build the full query
    let query = `
      SELECT l.*, u.name as user_name
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
    `;
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

app.get('/api/logs/filters', async (req, res) => {
  try {
    // Get unique combinations of module and action from logs
    const { rows } = await db.query(`
      SELECT DISTINCT module, action
      FROM logs
      ORDER BY module, action
    `);
    
    // Group actions by module
    const modulesMap = new Map();
    rows.forEach(row => {
      if (!modulesMap.has(row.module)) {
        modulesMap.set(row.module, []);
      }
      modulesMap.get(row.module).push(row.action);
    });
    
    // Convert to the expected format
    const modules = Array.from(modulesMap.entries()).map(([name, actions]) => ({
      name,
      actions: actions.sort() // Sort actions alphabetically
    }));
    
    // Sort modules by name
    modules.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({ modules });
  } catch (error) {
    console.error('Error fetching log filters:', error);
    res.status(500).json({ message: 'Error fetching log filters' });
  }
});

// === SHIFTS (SCHEDULE) ===
// GET /api/shifts - Pobierz wszystkie zmiany
app.get('/api/shifts', async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT s.*, u.name as user_name 
      FROM shifts s 
      LEFT JOIN users u ON s.user_id = u.id
    `;
    let params = [];
    
    if (date) {
      query += ' WHERE DATE(s.start_time) = $1';
      params = [date];
    }
    
    query += ' ORDER BY s.start_time';
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ message: 'Error fetching shifts' });
  }
});

// POST /api/shifts - Stwórz nową zmianę
app.post('/api/shifts', async (req, res) => {
  try {
    const { user_id, start_time, end_time } = req.body;
    const { rows } = await db.query(
      'INSERT INTO shifts (user_id, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
      [user_id, start_time, end_time]
    );
    
    // Log the shift creation
    const newShift = rows[0];
    await logAction(null, user_id, 'UTWORZENIE_ZMIANY', 'Zmiana', `Utworzono nową zmianę dla użytkownika ${user_id} (start: ${start_time}, koniec: ${end_time})`);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ message: 'Error creating shift' });
  }
});

// === REPORTS ===
// GET /api/reports/daily - Raport dzienny
app.get('/api/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    
    // Get orders for the date
    const { rows: orders } = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_order_value
      FROM orders 
      WHERE DATE(created_at) = $1 AND status = 'completed'
    `, [date]);
    
    // Get top products
    const { rows: topProducts } = await db.query(`
      SELECT 
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price_per_item) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = $1 AND o.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `, [date]);
    
    res.json({
      summary: orders[0],
      topProducts
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

app.get('/', (req, res) => {
  res.send('Serwer Madziarynki wstał!');
});

app.listen(port, () => {
  console.log(`Serwer nasłuchuje na porcie ${port}`);
});