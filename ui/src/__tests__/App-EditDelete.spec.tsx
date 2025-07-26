import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// Define the item type
interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

// Helper function to render component with act
const renderWithAct = async (component: React.ReactElement) => {
  let renderResult: any;
  await act(async () => {
    renderResult = render(component);
  });
  return renderResult;
};

describe("App Component - Edit and Delete Tests", () => {
  // Store original fetch for restoration
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Set up a default fetch mock
    global.fetch = jest.fn() as jest.Mock;
  });

  afterAll(() => {
    // Restore original fetch after all tests
    global.fetch = originalFetch;
  });

  test("can edit an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Original Item",
      quantity: 1,
      purchased: false,
    };

    // Initial load with one item
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([mockItem]),
      });
    });

    await renderWithAct(<App />);

    // Wait for item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Original Item")).toBeInTheDocument();
    });

    // Click the edit button
    const editButton = screen.getByText("Edit");
    await act(async () => {
      fireEvent.click(editButton);
    });

    // Verify the edit form is displayed
    const nameInput = screen.getByDisplayValue("Original Item");
    const quantityInputs = screen.getAllByRole("spinbutton");
    const editFormQuantityInput = quantityInputs.find(
      (input) => input.closest(".edit-form") !== null
    );
    const saveButton = screen.getByText("Save");
    const cancelButton = screen.getByText("Cancel");

    expect(nameInput).toBeInTheDocument();
    expect(editFormQuantityInput).toBeDefined();
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Change the values in the form
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Updated Item" } });
      if (editFormQuantityInput) {
        fireEvent.change(editFormQuantityInput, { target: { value: "5" } });
      }
    });

    // Setup mocks for update
    const putMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const updatedItem = { ...mockItem, name: "Updated Item", quantity: 5 };
    const getMock = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([updatedItem]),
      });
    });

    // Replace fetch mock
    (global.fetch as jest.Mock).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        if (init && init.method === "PUT") {
          return putMock(input, init);
        }
        return getMock(input, init);
      }
    );

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify the PUT request was made with correct data
    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/items/1",
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining('"name":"Updated Item"'),
        })
      );
    });

    // Verify updated item is displayed
    await waitFor(() => {
      expect(screen.getByText("Updated Item")).toBeInTheDocument();
      expect(screen.getByText("× 5")).toBeInTheDocument();
    });
  });

  test("can delete an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Item to Delete",
      quantity: 1,
      purchased: false,
    };

    // Initial load with one item
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([mockItem]),
      });
    });

    await renderWithAct(<App />);

    // Wait for item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Item to Delete")).toBeInTheDocument();
    });

    // Mock DELETE request
    const deleteMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    // Mock GET request after delete (empty list)
    const getMock = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
    });

    // Replace fetch mock
    (global.fetch as jest.Mock).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        if (init && init.method === "DELETE") {
          return deleteMock(input, init);
        }
        return getMock(input, init);
      }
    );

    // Click the delete button
    const deleteButton = screen.getByText("Delete");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Verify the DELETE request was made
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/items/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    // Verify the item was removed
    await waitFor(() => {
      expect(screen.queryByText("Item to Delete")).not.toBeInTheDocument();
      expect(
        screen.getByText("No items in the shopping list")
      ).toBeInTheDocument();
    });
  });

  test("can cancel editing an item", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Test Item",
      quantity: 2,
      purchased: false,
    };

    // Initial load with one item
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([mockItem]),
      });
    });

    await renderWithAct(<App />);

    // Wait for item to be displayed
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    // Click the edit button
    const editButton = screen.getByText("Edit");
    await act(async () => {
      fireEvent.click(editButton);
    });

    // Verify the edit form is displayed
    const nameInput = screen.getByDisplayValue("Test Item");
    expect(nameInput).toBeInTheDocument();

    // Change the values in the form
    await act(async () => {
      fireEvent.change(nameInput, {
        target: { value: "Changed but not saved" },
      });
    });

    // Click the cancel button
    const cancelButton = screen.getByText("Cancel");
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Verify the item wasn't changed and edit mode is exited
    expect(screen.getByText("Test Item")).toBeInTheDocument();
    // Check that we're no longer in edit mode
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });
});
