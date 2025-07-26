import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create the database connection
const dbPath = path.join(dataDir, 'shopping-list.db');
const db = new Database(dbPath);

// Define Shopping Item interface
export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

// Initialize the database by creating tables if they don't exist
function initializeDb() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      purchased INTEGER NOT NULL DEFAULT 0
    )
  `;
  
  db.exec(createTableQuery);
  
  // Add initial items if the table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM shopping_items').get() as { count: number };
  
  if (count.count === 0) {
    const insertStmt = db.prepare(
      'INSERT INTO shopping_items (name, quantity, purchased) VALUES (?, ?, ?)'
    );
    
    // Insert initial items
    insertStmt.run('Milk', 1, 0);
    insertStmt.run('Bread', 2, 0);
  }
}

// Initialize the database
initializeDb();

// Database operations
export const dbOperations = {
  // Get all items
  getAllItems: (): ShoppingItem[] => {
    const stmt = db.prepare('SELECT * FROM shopping_items');
    const rows = stmt.all() as Array<{ id: number; name: string; quantity: number; purchased: number }>;
    const items = rows.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      purchased: !!item.purchased // Convert integer to boolean
    }));
    return items;
  },
  
  // Get item by ID
  getItemById: (id: number): ShoppingItem | undefined => {
    const stmt = db.prepare('SELECT * FROM shopping_items WHERE id = ?');
    const item = stmt.get(id) as { id: number; name: string; quantity: number; purchased: number } | undefined;
    
    if (!item) return undefined;
    
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      purchased: !!item.purchased // Convert integer to boolean
    };
  },
  
  // Add a new item
  addItem: (name: string, quantity: number, purchased: boolean = false): ShoppingItem => {
    const stmt = db.prepare(
      'INSERT INTO shopping_items (name, quantity, purchased) VALUES (?, ?, ?)'
    );
    
    const result = stmt.run(name, quantity, purchased ? 1 : 0);
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      name,
      quantity,
      purchased
    };
  },
  
  // Update an item
  updateItem: (id: number, updates: Partial<ShoppingItem>): ShoppingItem | undefined => {
    // First check if the item exists
    const item = dbOperations.getItemById(id);
    
    if (!item) return undefined;
    
    // Prepare the update query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    if (updates.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(updates.quantity);
    }
    
    if (updates.purchased !== undefined) {
      fields.push('purchased = ?');
      values.push(updates.purchased ? 1 : 0);
    }
    
    if (fields.length === 0) return item; // Nothing to update
    
    // Add the ID to values array
    values.push(id);
    
    const updateQuery = `UPDATE shopping_items SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(updateQuery);
    stmt.run(...values);
    
    // Return the updated item
    return dbOperations.getItemById(id);
  },
  
  // Delete an item
  deleteItem: (id: number): ShoppingItem | undefined => {
    // First check if the item exists
    const item = dbOperations.getItemById(id);
    
    if (!item) return undefined;
    
    const stmt = db.prepare('DELETE FROM shopping_items WHERE id = ?');
    stmt.run(id);
    
    return item;
  }
};

// Close database connection when the application exits
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
