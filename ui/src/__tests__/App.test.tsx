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

describe("App Component", () => {
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

  it("renders the shopping list title", () => {
    render(<App />);
    expect(screen.getByText(/Shopping List/i)).toBeInTheDocument();
  });

  it("displays loading state initially", () => {
    global.fetch = mockFetch(200, []) as unknown as typeof fetch;
    render(<App />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error message when API call fails", async () => {
    global.fetch = mockFetch(500) as unknown as typeof fetch;
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to fetch shopping items/i)
      ).toBeInTheDocument();
    });
  });

  it("renders empty state when there are no items", async () => {
    global.fetch = mockFetch(200, []) as unknown as typeof fetch;
    render(<App />);
    await waitFor(() => {
      expect(
        screen.getByText(/No items in the shopping list/i)
      ).toBeInTheDocument();
    });
  });

  it("renders items when API returns data", async () => {
    const mockItems: ShoppingItem[] = [
      { id: 1, name: "Apples", quantity: 5, purchased: false },
      { id: 2, name: "Bananas", quantity: 3, purchased: true },
    ];

    global.fetch = mockFetch(200, mockItems) as unknown as typeof fetch;
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Apples")).toBeInTheDocument();
      expect(screen.getByText("Bananas")).toBeInTheDocument();
    });
  });

  it("can add a new item", async () => {
    global.fetch = mockFetch(200, []) as unknown as typeof fetch;
    render(<App />);

    // Wait for the initial load
    await waitFor(() => {
      expect(
        screen.getByText(/No items in the shopping list/i)
      ).toBeInTheDocument();
    });

    // Type in the new item name
    const input = screen.getByPlaceholderText(/Item name/i);
    fireEvent.change(input, { target: { value: "New Item" } });

    // Submit the form
    const addButton = screen.getByText(/Add Item/i);
    fireEvent.click(addButton);

    // Verify fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/items",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Item",
          quantity: 1,
          purchased: false,
        }),
      }
    );
  });

  it("can toggle item purchased status", async () => {
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

    // Click the toggle button
    const toggleButton = screen.getByRole("checkbox");
    fireEvent.click(toggleButton);

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/items/1",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: 1,
            name: "Test Item",
            quantity: 1,
            purchased: true,
          }),
        }
      );
    });
  });
});
