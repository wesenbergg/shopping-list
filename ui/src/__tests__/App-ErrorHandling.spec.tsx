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

describe("App Component - Error Handling Tests", () => {
  // Store original fetch for restoration
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Set up a default fetch mock
    global.fetch = jest.fn() as jest.Mock;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  afterAll(() => {
    // Restore original fetch after all tests
    global.fetch = originalFetch;
  });

  test("handles error when adding a new item", async () => {
    // Mock initial fetch to load the app
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await renderWithAct(<App />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading items/i)).not.toBeInTheDocument();
    });

    // Now mock fetch to fail for the POST request
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to add item")
    );

    // Fill out the form
    const nameInput = screen.getByPlaceholderText("Item name");
    const quantityInput = screen.getByRole("spinbutton");
    const addItemForm = screen.getByTestId("add-item-form");

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Test Item" } });
      fireEvent.change(quantityInput, { target: { value: "3" } });
      fireEvent.submit(addItemForm);
    });

    // Verify error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText("Failed to add item")).toBeInTheDocument();
    });
  });

  test("handles error when deleting an item", async () => {
    // Mock initial fetch to load an item
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Item to Delete",
      quantity: 1,
      purchased: false,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    });

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Item to Delete")).toBeInTheDocument();
    });

    // Mock DELETE request to fail
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    // Click delete button
    const deleteButton = screen.getByText("Delete");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Verify error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText("Failed to delete item")).toBeInTheDocument();
    });
  });

  test("handles error when toggling purchased status", async () => {
    // Mock initial fetch to load an item
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 1,
      purchased: false,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    });

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Mock PUT request to fail
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    // Click checkbox to toggle purchased status
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });

    // Verify error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText("Failed to update item")).toBeInTheDocument();
    });
  });

  test("handles error when saving edited item", async () => {
    // Mock initial fetch to load an item
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Original Name",
      quantity: 1,
      purchased: false,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockItem]),
    });

    await renderWithAct(<App />);

    // Wait for the item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Original Name")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText("Edit");
    await act(async () => {
      fireEvent.click(editButton);
    });

    // Verify the edit form is displayed
    const nameInput = screen.getByDisplayValue("Original Name");
    expect(nameInput).toBeInTheDocument();

    // Change name
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Updated Name" } });
    });

    // Mock PUT request to fail
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    // Click save button
    const saveButton = screen.getByText("Save");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText("Failed to update item")).toBeInTheDocument();
    });
  });

  test("handles empty item name on submit", async () => {
    // Mock initial fetch to load the app
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await renderWithAct(<App />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading items/i)).not.toBeInTheDocument();
    });

    // Mock a spy on fetch to verify it's not called
    const fetchSpy = jest.fn();
    (global.fetch as jest.Mock).mockImplementation(fetchSpy);

    // Submit the form with empty name
    const addItemForm = screen.getByTestId("add-item-form");
    const nameInput = screen.getByPlaceholderText("Item name");

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "   " } }); // Just spaces
      fireEvent.submit(addItemForm);
    });

    // Verify fetch was not called because of empty name validation
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
