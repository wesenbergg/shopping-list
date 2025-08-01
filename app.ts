import express, { type Request as Req, type Response as Res } from 'express';
import cors from 'cors';
import { dbOperations } from './db';

// Initialize express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and enabling CORS
app.use(express.json());
app.use(cors());

// Serve static files from the React app build directory
app.use('/', express.static('dist/ui'));

app.get('/api/health', (_req: Req, res: Res) => {
  res.json({ status: 'ok' });
});

// GET: Get all shopping list items
app.get('/api/items', (_req: Req, res: Res) => {
  const items = dbOperations.getAllItems();
  res.json(items);
});

// GET: Get a specific shopping list item by ID
app.get('/api/items/:id', (req: Req, res: Res) => {
  const id = parseInt(req.params.id);
  const item = dbOperations.getItemById(id);
  
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  res.json(item);
});

// POST: Add a new item to the shopping list
app.post('/api/items', (req: Req, res: Res) => {
  const { name, quantity, purchased = false } = req.body;
  
  if (!name || quantity === undefined) {
    return res.status(400).json({ message: 'Name and quantity are required' });
  }
  
  const newItem = dbOperations.addItem(name, quantity, purchased);
  res.status(201).json(newItem);
});

// PUT: Update an existing shopping list item
app.put('/api/items/:id', (req: Req, res: Res) => {
  const id = parseInt(req.params.id);
  const { name, quantity, purchased } = req.body;
  
  const updatedItem = dbOperations.updateItem(id, { name, quantity, purchased });
  
  if (!updatedItem) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  res.json(updatedItem);
});

// DELETE: Remove a shopping list item
app.delete('/api/items/:id', (req: Req, res: Res) => {
  const id = parseInt(req.params.id);
  const deletedItem = dbOperations.deleteItem(id);
  
  if (!deletedItem) {
    return res.status(404).json({ message: 'Item not found' });
  }
  
  res.json({ message: 'Item deleted successfully', item: deletedItem });
});

// Serve React app for all other routes
app.use((req: Req, res: Res) => {
  if (req.method === 'GET') {
    return res.sendFile('index.html', { root: 'dist/ui' });
  }
  
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  return res.status(404).json({ message: 'Not Found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
