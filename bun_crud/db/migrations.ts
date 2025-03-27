import { Database } from "bun:sqlite";

// Initialize the database
let db: Database | null = new Database("vehicles.db");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA busy_timeout = 3000;"); // 3 second timeout

process.on("exit", () => {
  if (db) {
    db.close();
    db = null;
  }
});

function getDB(): Database {
  if (db) {
    db = new Database("vehicles.db");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA busy_timeout = 3000;"); // 3 second timeout
  }

return db
}

export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

// Function to initialize the database schema
export function initializeDatabase() {
    const db = getDB()
  // Enable foreign key constraints
  // Create tables if they don't exist
  db.exec(`
        -- Brands table (now for all vehicle types)
        CREATE TABLE IF NOT EXISTS brands (
            brand_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            founded_year INTEGER,
            country TEXT,
            website_url TEXT,
            logo_url TEXT,
            vehicle_type TEXT CHECK(vehicle_type IN ('bicycle', 'motorcycle', 'both')) DEFAULT 'bicycle',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Categories table (for both bicycles and motorcycles)
        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            parent_category_id INTEGER,
            image_url TEXT,
            vehicle_type TEXT CHECK(vehicle_type IN ('bicycle', 'motorcycle', 'both')) DEFAULT 'bicycle',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
        );

        -- Models table (for all vehicle types)
        CREATE TABLE IF NOT EXISTS models (
            model_id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            year INTEGER,
            base_price REAL,
            image_url TEXT,
            vehicle_type TEXT CHECK(vehicle_type IN ('bicycle', 'motorcycle')) DEFAULT 'bicycle',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
            UNIQUE(brand_id, name, year)
        );

        -- Bicycle specifications table
        CREATE TABLE IF NOT EXISTS bicycle_specifications (
            spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            bike_type TEXT CHECK(bike_type IN ('road', 'mountain', 'hybrid', 'electric', 'bmx', 'kids', 'cruiser', 'gravel')),
            frame_material TEXT,
            wheel_size TEXT,
            gears TEXT,
            brakes TEXT,
            suspension TEXT,
            weight_kg REAL,
            rider_height TEXT,
            color_options TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (model_id) REFERENCES models(model_id),
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        );

        -- Motorcycle specifications table
        CREATE TABLE IF NOT EXISTS motorcycle_specifications (
            spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            motorcycle_type TEXT CHECK(motorcycle_type IN ('sport', 'cruiser', 'touring', 'off-road', 'scooter', 'naked', 'adventure')),
            engine_cc INTEGER,
            engine_type TEXT CHECK(engine_type IN ('single-cylinder', 'parallel-twin', 'v-twin', 'inline-four', 'boxer')),
            power_hp INTEGER,
            torque_nm REAL,
            transmission TEXT,
            fuel_capacity_liters REAL,
            seat_height_mm INTEGER,
            weight_kg REAL,
            color_options TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (model_id) REFERENCES models(model_id),
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        );
    `);

  console.log("Database schema initialized successfully");
}

// Function to insert sample data
export function insertSampleData() {
    const db = getDB();

  const brandCount = db.query("SELECT COUNT(*) as count FROM brands").get();
  if (brandCount && brandCount.count > 0) {
    console.log("Sample data already exists");
    return;
  }

  // Insert sample brands (both bicycle and motorcycle)
  db.exec(`
        INSERT INTO brands (name, description, founded_year, country, vehicle_type) VALUES
        ('Trek', 'American bicycle manufacturer', 1976, 'USA', 'bicycle'),
        ('Specialized', 'High-performance bicycles', 1974, 'USA', 'bicycle'),
        ('Giant', 'World''s largest bicycle manufacturer', 1972, 'Taiwan', 'bicycle'),
        ('Honda', 'Japanese motorcycle manufacturer', 1948, 'Japan', 'motorcycle'),
        ('Harley-Davidson', 'American motorcycle manufacturer', 1903, 'USA', 'motorcycle'),
        ('Yamaha', 'Japanese motorcycle and engine manufacturer', 1955, 'Japan', 'both');
    `);

  // Insert sample categories
  db.exec(`
        INSERT INTO categories (name, description, vehicle_type) VALUES
        ('Road Bikes', 'Built for speed on paved roads', 'bicycle'),
        ('Mountain Bikes', 'Designed for off-road cycling', 'bicycle'),
        ('Hybrid Bikes', 'Combination of road and mountain bikes', 'bicycle'),
        ('Sport Bikes', 'High-performance motorcycles', 'motorcycle'),
        ('Cruisers', 'Comfort-oriented motorcycles', 'motorcycle'),
        ('Adventure Bikes', 'Dual-sport motorcycles', 'motorcycle');
    `);

  // Insert sample models
  db.exec(`
        INSERT INTO models (brand_id, name, year, base_price, vehicle_type) VALUES
        -- Bicycles
        (1, 'Domane SL 5', 2023, 2499.99, 'bicycle'),
        (1, 'Fuel EX 5', 2023, 2299.99, 'bicycle'),
        (2, 'Allez Sprint', 2023, 1800.00, 'bicycle'),
        (3, 'Defy Advanced 2', 2023, 2200.00, 'bicycle'),
        -- Motorcycles
        (4, 'CBR1000RR-R', 2023, 16999.00, 'motorcycle'),
        (4, 'CRF300L', 2023, 5299.00, 'motorcycle'),
        (5, 'Sportster S', 2023, 14999.00, 'motorcycle'),
        (6, 'MT-07', 2023, 7699.00, 'motorcycle'),
        (6, 'YZF-R7', 2023, 8999.00, 'motorcycle');
    `);

  // Insert bicycle specifications
  db.exec(`
        INSERT INTO bicycle_specifications (model_id, category_id, bike_type, frame_material, wheel_size, gears) VALUES
        (1, 1, 'road', 'carbon', '700c', '2x11'),
        (2, 2, 'mountain', 'aluminum', '29"', '1x12'),
        (3, 1, 'road', 'aluminum', '700c', '2x10'),
        (4, 1, 'road', 'carbon', '700c', '2x11');
    `);

  // Insert motorcycle specifications
  db.exec(`
        INSERT INTO motorcycle_specifications (
            model_id, category_id, motorcycle_type, engine_cc, engine_type, 
            power_hp, torque_nm, transmission, fuel_capacity_liters, seat_height_mm, weight_kg
        ) VALUES
        (5, 4, 'sport', 999, 'inline-four', 217, 113, '6-speed', 16.1, 830, 201),
        (6, 6, 'adventure', 286, 'single-cylinder', 27, 26.6, '6-speed', 7.8, 880, 142),
        (7, 5, 'cruiser', 1252, 'v-twin', 121, 94, '6-speed', 11.8, 755, 228),
        (8, 4, 'naked', 689, 'parallel-twin', 74, 68, '6-speed', 14, 805, 184),
        (9, 4, 'sport', 689, 'parallel-twin', 72, 67, '6-speed', 13, 835, 188);
    `);

  console.log("Sample data inserted successfully");
}

// Export the database connection
export default {
getDB,
closeDatabase,
initializeDatabase,
insertSampleData
};
