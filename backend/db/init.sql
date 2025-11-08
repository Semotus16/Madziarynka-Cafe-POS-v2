-- Usunięcie starych tabel w odpowiedniej kolejności, aby uniknąć błędów zależności
DROP TABLE IF EXISTS product_ingredients;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS logs;

-- Tabela Użytkowników (Pracowników)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(255) NOT NULL, -- W wersji produkcyjnej to powinien być HASH
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
    is_active BOOLEAN DEFAULT true
);

-- Tabela Składników (Magazyn)
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50),
    stock_quantity DECIMAL(10, 2) DEFAULT 0,
    nominal_stock DECIMAL(10, 2) DEFAULT 1000.00 NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Tabela Produktów (Menu)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    "group" VARCHAR(100), -- "group" jest słowem kluczowym, stąd cudzysłów
    is_visible BOOLEAN DEFAULT true
);

-- Tabela łącząca Produkty i Składniki (BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE RESTRICT, -- RESTRICT, by nie usunąć składnika używanego w produkcie
    quantity_needed DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);

-- Tabela Zamówień
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Pozycji w Zamówieniu
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_per_item DECIMAL(10, 2) NOT NULL
);

-- Tabela Grafiku Pracy
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    break_duration INTEGER, -- w minutach
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50) -- np. 'daily', 'weekly', 'monthly'
);

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_end_time ON shifts(end_time);
CREATE INDEX IF NOT EXISTS idx_shifts_date_range ON shifts(DATE(start_time), DATE(end_time));

-- Tabela Logów Systemowych
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Migracja: Dodanie kolumny nominal_stock do istniejących tabel
ALTER TABLE IF EXISTS ingredients
ADD COLUMN IF NOT EXISTS nominal_stock DECIMAL(10, 2) DEFAULT 1000.00 NOT NULL;

-- Wstawienie przykładowych danych
INSERT INTO users (id, name, pin, role) VALUES
(1, 'Admin', '1234', 'admin'),
(2, 'Pracownik1', '1234', 'employee'),
(3, 'Pracownik2', '1234', 'employee'),
(4, 'Pracownik3', '1234', 'employee');

INSERT INTO ingredients (name, unit, stock_quantity) VALUES
('Kawa ziarnista', 'g', 10000),
('Mleko', 'ml', 20000),
('Croissant mrożony', 'szt', 50),
('Cukier', 'g', 5000),
('Woda', 'ml', 50000),
('Mąka', 'g', 20000),
('Drożdże', 'g', 500);

INSERT INTO products (name, price, "group") VALUES
('Espresso', 8.00, 'Kawa'),
('Cappuccino', 12.00, 'Kawa'),
('Croissant', 6.00, 'Wypieki');

INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES
((SELECT id from products WHERE name = 'Espresso'), (SELECT id from ingredients WHERE name = 'Kawa ziarnista'), 7),
((SELECT id from products WHERE name = 'Espresso'), (SELECT id from ingredients WHERE name = 'Woda'), 30),
((SELECT id from products WHERE name = 'Cappuccino'), (SELECT id from ingredients WHERE name = 'Kawa ziarnista'), 7),
((SELECT id from products WHERE name = 'Cappuccino'), (SELECT id from ingredients WHERE name = 'Mleko'), 150),
((SELECT id from products WHERE name = 'Croissant'), (SELECT id from ingredients WHERE name = 'Croissant mrożony'), 1);