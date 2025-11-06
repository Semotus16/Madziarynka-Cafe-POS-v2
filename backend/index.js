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
  const client = transactionClient || db; // Use transaction client if available, otherwise use the general pool
  if (!userId) {
    console.error('LogAction Error: No userId provided for action:', action);
    return;
  }
  try {
    await client.query(
      'INSERT INTO logs (user_id, action, module, details) VALUES ($1, $2, $3, $4)',
      [userId, action, module, details]
    );
  } catch (error) {
    console.error(`Failed to log action [${action}]:`, error);
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
    await logAction(db, user.id, 'USER_LOGIN', 'Auth', 'User logged in');
    
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
      await logAction(null, req.user.id, 'CREATE_INGREDIENT', 'Warehouse', `User created ingredient: ${newIngredient.name}`);
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
    const { rows } = await db.query(
      'UPDATE ingredients SET name = $1, stock_quantity = $2, unit = $3, is_active = $4, nominal_stock = $5 WHERE id = $6 RETURNING *',
      [name, stock_quantity, unit, is_active, nominal_stock, id]
    );
    
    console.log('PUT /api/ingredients/:id - Database result:', rows[0]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    if (req.user && req.user.id) {
      await logAction(null, req.user.id, 'UPDATE_INGREDIENT', 'Warehouse', `User updated ingredient #${id}`);
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
      await logAction(db, req.user.id, 'DEACTIVATE_INGREDIENT', 'Warehouse', `Deactivated ingredient #${id}: ${ingredient.name}`);
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
        await logAction(client, req.user.id, 'CREATE_PRODUCT', 'Menu', `Created product: ${product.name}`);
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
      
      // Dodaj nowe składniki
      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await client.query(
            'INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES ($1, $2, $3)',
            [id, ingredient.ingredient_id, ingredient.quantity_needed]
          );
        }
      }
      
      // Log the product update
      if (req.user && req.user.id) {
        await logAction(client, req.user.id, 'UPDATE_PRODUCT', 'Menu', `Updated product #${id}: ${name}`);
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
      await logAction(db, req.user.id, 'DEACTIVATE_PRODUCT', 'Menu', `Deactivated product #${id}: ${product.name}`);
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
      
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_per_item) VALUES ($1, $2, $3, $4)',
          [orderId, item.id, item.quantity, item.price]
        );
      }
      
      // Log the order creation
      await logAction(client, req.user.id, 'CREATE_ORDER', 'Orders', `Created order #${orderId}`);
      
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
      await logAction(client, req.user.id, 'COMPLETE_ORDER', 'Orders', `Completed order #${id}`);
      
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
      await logAction(client, req.user.id, 'UPDATE_ORDER', 'Orders', `Updated order #${id}`);
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
    const { limit = 100, offset = 0 } = req.query;
    const { rows } = await db.query(`
      SELECT l.*, u.name as user_name 
      FROM logs l 
      LEFT JOIN users u ON l.user_id = u.id 
      ORDER BY l.created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
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