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

// Helper function to mock fetch for different test scenarios
const mockFetch = (status = 200, responseData: ShoppingItem[] = []) => {
  return vi.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: status === 200,
      status,
      json: () => Promise.resolve(responseData),
    });
  });
};

describe("App Component - Edit and Delete Tests", () => {
  // Store original fetch for restoration
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    // Set up a default fetch mock
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    // Restore fetch after each test
    global.fetch = originalFetch;
  });

  it("can edit an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    global.fetch = mockFetch(200, [mockItem]) as unknown as typeof fetch;
    render(<App />);

    // Wait for the item to be rendered
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    // Find the input and type new name
    const input = screen.getByDisplayValue("Test Item");
    fireEvent.change(input, { target: { value: "Updated Item" } });

    // Click save button
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    // Verify fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/items/1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Item", quantity: 1 }),
      }
    );
  });

  it("can delete an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    global.fetch = mockFetch(200, [mockItem]) as unknown as typeof fetch;
    render(<App />);

    // Wait for the item to be rendered
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    // Verify fetch was called with correct method
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/items/1",
      {
        method: "DELETE",
      }
    );
  });

  it("can cancel editing an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    global.fetch = mockFetch(200, [mockItem]) as unknown as typeof fetch;
    render(<App />);

    // Wait for the item to be rendered
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    // Find the input and verify it shows the current name
    expect(screen.getByDisplayValue("Test Item")).toBeInTheDocument();

    // Click cancel button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Verify we're back to view mode
    expect(
      screen.queryByRole("button", { name: /save/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });
});
