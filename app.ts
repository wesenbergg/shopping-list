import express, { Request, Response } from 'express';
import cors from 'cors';
import { dbOperations, ShoppingItem } from './db';

// Initialize express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and enabling CORS
app.use(express.json());
app.use(cors());

// GET: Get all shopping list items
app.get('/api/items', (req: Request, res: Response) => {
  const items = dbOperations.getAllItems();
  res.json(items);
});

// GET: Get a specific shopping list item by ID
app.get('/api/items/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const item = dbOperations.getItemById(id);
  
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  res.json(item);
});

// POST: Add a new item to the shopping list
app.post('/api/items', (req: Request, res: Response) => {
  const { name, quantity, purchased = false } = req.body;
  
  if (!name || quantity === undefined) {
    return res.status(400).json({ message: 'Name and quantity are required' });
  }
  
  const newItem = dbOperations.addItem(name, quantity, purchased);
  res.status(201).json(newItem);
});

// PUT: Update an existing shopping list item
app.put('/api/items/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, quantity, purchased } = req.body;
  
  const updatedItem = dbOperations.updateItem(id, { name, quantity, purchased });
  
  if (!updatedItem) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  res.json(updatedItem);
});

// DELETE: Remove a shopping list item
app.delete('/api/items/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const deletedItem = dbOperations.deleteItem(id);
  
  if (!deletedItem) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  res.json({ message: 'Item deleted successfully', item: deletedItem });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
