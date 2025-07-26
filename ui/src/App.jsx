
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

const App = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', quantity: 1 });

  // Fetch all items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shopping items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load items when component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  // Add a new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.name.trim()) {
      return;
    }
    
    try {
      await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newItem.name,
          quantity: Number(newItem.quantity),
          purchased: false
        })
      });
      
      setNewItem({ name: '', quantity: 1 });
      fetchItems();
    } catch (err) {
      setError('Failed to add item');
      console.error(err);
    }
  };

  // Delete an item
  const handleDeleteItem = async (id) => {
    try {
      await fetch(`${API_URL}/items/${id}`, {
        method: 'DELETE'
      });
      fetchItems();
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  // Toggle purchased status
  const togglePurchased = async (item) => {
    try {
      await fetch(`${API_URL}/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...item,
          purchased: !item.purchased
        })
      });
      fetchItems();
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
    }
  };

  // Start editing an item
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      quantity: item.quantity
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
  };

  // Save edited item
  const saveEdit = async (id) => {
    try {
      await fetch(`${API_URL}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editFormData.name,
          quantity: Number(editFormData.quantity)
        })
      });
      setEditingId(null);
      fetchItems();
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
    }
  };

  return (
    <main className="container">
      <h1>Shopping List</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add new item form */}
      <form onSubmit={handleAddItem} className="add-item-form">
        <h2>Add New Item</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />
          <input
            type="number"
            min="1"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            required
          />
          <button type="submit">Add Item</button>
        </div>
      </form>
      
      {/* Shopping list */}
      <div className="shopping-list">
        <h2>Items</h2>
        
        {loading ? (
          <p>Loading items...</p>
        ) : items.length === 0 ? (
          <p>No items in the shopping list</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className={item.purchased ? 'purchased' : ''}>
                {editingId === item.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                    <input
                      type="number"
                      min="1"
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    />
                    <div className="edit-buttons">
                      <button onClick={() => saveEdit(item.id)}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="item-info">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={() => togglePurchased(item)}
                      />
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => startEdit(item)}>Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default App;
