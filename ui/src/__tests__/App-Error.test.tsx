import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// Define the item type
interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

describe("App Component - Error Handling Tests", () => {
  // Store original fetch and console.error
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.resetAllMocks();
    // Set up a default fetch mock
    global.fetch = vi.fn() as unknown as typeof fetch;
    // Mock console.error
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore fetch and console.error after each test
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it("handles error when adding a new item", async () => {
    global.fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error("Network error"))
      ) as unknown as typeof fetch;

    render(<App />);

    const input = screen.getByPlaceholderText(/Item name/i);
    fireEvent.change(input, { target: { value: "New Item" } });

    const addButton = screen.getByText(/Add Item/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to add item/i)).toBeInTheDocument();
    });
  });

  it("handles error when deleting an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    // First call succeeds (loading items), second fails (delete)
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockItem]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      ) as unknown as typeof fetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to delete item/i)).toBeInTheDocument();
    });
  });

  it("handles error when toggling purchased status", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    // First call succeeds (loading items), second fails (toggle)
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockItem]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      ) as unknown as typeof fetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole("checkbox");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update item/i)).toBeInTheDocument();
    });
  });

  it("handles error when saving edited item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    // First call succeeds (loading items), second fails (save edit)
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockItem]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      ) as unknown as typeof fetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    const input = screen.getByDisplayValue("Test Item");
    fireEvent.change(input, { target: { value: "Updated Item" } });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update item/i)).toBeInTheDocument();
    });
  });

  it("handles empty item name on submit", async () => {
    // Mock fetch to load items
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch;

    render(<App />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading items/i)).not.toBeInTheDocument();
    });

    // Reset mock to verify it's not called
    vi.resetAllMocks();

    const addButton = screen.getByText(/Add Item/i);
    fireEvent.click(addButton);

    // Now we should see the error message
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
