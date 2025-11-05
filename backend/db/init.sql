-- Create ingredients table if it doesn't exist
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    stock_quantity DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    is_visible BOOLEAN DEFAULT true
);

-- Create product_ingredients table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id),
    quantity_needed DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);