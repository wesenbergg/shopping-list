import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";
import type { ReactElement } from "react";

// Define the item type
interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

// Helper function to render component with act
const renderWithAct = async (component: ReactElement) => {
  let renderResult: ReturnType<typeof render> | undefined;
  await act(async () => {
    renderResult = render(component);
  });
  return renderResult!;
};

describe("App Component - Edit and Delete Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up a default fetch mock
    global.fetch = vi.fn() as unknown as typeof fetch;
    // Mock console.error
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocks
    vi.restoreAllMocks();
  });

  test("can edit an item and update its name and quantity", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };

    // Mock initial fetch to load the item
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    }) as unknown as typeof fetch;

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText("Edit");
    await act(async () => {
      fireEvent.click(editButton);
    });

    // Verify the edit form is displayed
    const nameInput = screen.getByDisplayValue("Test Item");
    // Use a more specific query for the quantity input to avoid ambiguity
    const quantityInputs = screen.getAllByDisplayValue("1");
    const quantityInput = quantityInputs.find(
      (input) => input.getAttribute("type") === "number"
    );
    if (!quantityInput) {
      throw new Error("Quantity input not found");
    }
    expect(nameInput).toBeInTheDocument();
    expect(quantityInput).toBeInTheDocument();

    // Change name and quantity
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Updated Item" } });
      fireEvent.change(quantityInput, { target: { value: "3" } });
    });

    // Ensure the quantity value is properly updated
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();

    // Verify the value change happened
    expect(screen.getByDisplayValue("Updated Item")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();

    // Mock the PUT request for saving and also the subsequent fetch for refreshing the list
    global.fetch = vi
      .fn()
      .mockImplementationOnce((_url, options) => {
        // Capture and verify the body is correct here
        const body = JSON.parse(options.body as string);
        expect(body).toEqual({ name: "Updated Item", quantity: 3 });

        return Promise.resolve({
          ok: true,
          status: 200,
        });
      })
      .mockResolvedValueOnce({
        // Mock for the subsequent GET request in fetchItems
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            { id: 1, name: "Updated Item", quantity: 3, purchased: false },
          ]),
      }) as unknown as typeof fetch;

    // Click save button
    const saveButton = screen.getByText("Save");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify fetch was called at least once for PUT request
    expect(global.fetch).toHaveBeenCalled();
  });

  test("can delete an item from the list", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Item to Delete",
      quantity: 1,
      purchased: false,
    };

    // Mock initial fetch to load the item
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    }) as unknown as typeof fetch;

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Item to Delete")).toBeInTheDocument();
    });

    // Mock DELETE request and subsequent fetch for refreshing the list
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        // Mock for DELETE request
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        // Mock for subsequent GET request in fetchItems
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      }) as unknown as typeof fetch;

    // Click delete button
    const deleteButton = screen.getByText("Delete");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Verify fetch was called with correct method and URL (first call)
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/items/1",
      {
        method: "DELETE",
      }
    );
  });

  test("can cancel editing an item without saving changes", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Original Item",
      quantity: 2,
      purchased: false,
    };

    // Mock initial fetch to load the item
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    }) as unknown as typeof fetch;

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Original Item")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText("Edit");
    await act(async () => {
      fireEvent.click(editButton);
    });

    // Change name and quantity
    const nameInput = screen.getByDisplayValue("Original Item");
    const quantityInputs = screen.getAllByDisplayValue("2");
    const quantityInput = quantityInputs.find(
      (input) => input.getAttribute("type") === "number"
    );
    if (!quantityInput) {
      throw new Error("Quantity input not found");
    }
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Changed Name" } });
      fireEvent.change(quantityInput, { target: { value: "5" } });
    });

    // Click cancel button
    const cancelButton = screen.getByText("Cancel");
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Verify that we're back to view mode with the original name
    expect(screen.getByText("Original Item")).toBeInTheDocument();

    // Check that we're in view mode, not edit mode
    expect(
      screen.queryByRole("textbox", { name: /name/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("spinbutton", { name: /quantity/i })
    ).not.toBeInTheDocument();

    // Verify that fetch was NOT called for saving
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
  });

  test("can toggle purchased status of an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Shopping Item",
      quantity: 1,
      purchased: false,
    };

    // Mock initial fetch to load the item
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    }) as unknown as typeof fetch;

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Shopping Item")).toBeInTheDocument();
    });

    // Mock PUT request for toggling purchased status and subsequent fetch for refreshing the list
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        // Mock for PUT request
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        // Mock for subsequent GET request in fetchItems
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            { id: 1, name: "Shopping Item", quantity: 1, purchased: true },
          ]),
      }) as unknown as typeof fetch;

    // Click checkbox to toggle purchased status
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });

    // Verify fetch was called with correct data (first call)
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/items/1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1,
          name: "Shopping Item",
          quantity: 1,
          purchased: true,
        }),
      }
    );
  });
});
