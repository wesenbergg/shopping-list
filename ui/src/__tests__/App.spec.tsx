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
import type { RequestInfo, RequestInit } from "node-fetch";

// Define the item type
interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  purchased: boolean;
}

// Helper function to mock fetch for different test scenarios
const mockFetch = (status = 200, responseData: ShoppingItem[] = []) => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: status === 200,
      status,
      json: () => Promise.resolve(responseData),
    });
  });
};

// Helper function to render component with act
const renderWithAct = async (component: ReactElement) => {
  let renderResult: ReturnType<typeof render> | undefined;
  await act(async () => {
    renderResult = render(component);
  });
  return renderResult;
};

describe("App Component", () => {
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

  test("renders the shopping list title", async () => {
    // Mock fetch to return empty array
    (global.fetch as jest.Mock) = mockFetch(200, []);

    await renderWithAct(<App />);
    const titleElement = screen.getByRole("heading", {
      name: /Shopping List/i,
      level: 1,
    });
    expect(titleElement).toBeInTheDocument();
  });

  test("displays loading state initially", async () => {
    // Mock fetch but don't resolve it yet
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await renderWithAct(<App />);
    const loadingElement = screen.getByText(/Loading items/i);
    expect(loadingElement).toBeInTheDocument();
  });

  test("shows error message when API call fails", async () => {
    // Mock fetch to fail
    (global.fetch as jest.Mock) = mockFetch(500);

    await renderWithAct(<App />);

    // Wait for the error message to appear
    await waitFor(() => {
      const errorMessage = screen.getByText(/Failed to fetch shopping items/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  test("renders empty state when there are no items", async () => {
    // Mock fetch to return empty array
    (global.fetch as jest.Mock) = mockFetch(200, []);

    await renderWithAct(<App />);

    // Wait for the loading to complete and empty state to appear
    await waitFor(() => {
      const emptyMessage = screen.getByText(/No items in the shopping list/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  test("renders items when API returns data", async () => {
    const mockItems: ShoppingItem[] = [
      { id: 1, name: "Milk", quantity: 1, purchased: false },
      { id: 2, name: "Bread", quantity: 2, purchased: true },
    ];

    // Mock fetch to return mock items
    (global.fetch as jest.Mock) = mockFetch(200, mockItems);

    await renderWithAct(<App />);

    // Wait for items to appear
    await waitFor(() => {
      expect(screen.getByText("Milk")).toBeInTheDocument();
      expect(screen.getByText("Bread")).toBeInTheDocument();

      // Check that the purchased item has the "purchased" class
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[1]).toHaveClass("purchased");
    });
  });

  test("can add a new item", async () => {
    // Mock initial fetch for empty list
    (global.fetch as jest.Mock) = mockFetch(200, []);

    await renderWithAct(<App />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading items/i)).not.toBeInTheDocument();
    });

    // Mock fetch for the POST request and subsequent GET
    const postMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const items: ShoppingItem[] = [
      { id: 1, name: "Eggs", quantity: 12, purchased: false },
    ];

    const getMock = mockFetch(200, items);

    // Replace the fetch mock with our new implementation
    (global.fetch as jest.Mock).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        if (init && init.method === "POST") {
          return postMock(input, init);
        }
        return getMock(input, init);
      }
    );

    // Fill out the form
    const nameInput = screen.getByPlaceholderText("Item name");
    const quantityInput = screen.getByRole("spinbutton");
    const addItemForm = screen.getByTestId("add-item-form");

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Eggs" } });
      fireEvent.change(quantityInput, { target: { value: "12" } });
      fireEvent.submit(addItemForm);
    });

    // Verify the POST request was made
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith(
        "http://localhost:3000/api/items",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.any(String),
        })
      );
    });

    // Verify the item appears in the UI after the subsequent GET request
    await waitFor(() => {
      expect(screen.getByText("Eggs")).toBeInTheDocument();
      expect(screen.getByText("× 12")).toBeInTheDocument();
    });
  });

  test("can toggle item purchased status", async () => {
    const mockItem: ShoppingItem = {
      id: 1,
      name: "Coffee",
      quantity: 1,
      purchased: false,
    };

    // Initial load with unpurchased item
    (global.fetch as jest.Mock) = mockFetch(200, [mockItem]);

    await renderWithAct(<App />);

    await waitFor(() => {
      expect(screen.getByText("Coffee")).toBeInTheDocument();
    });

    // Mock PUT request for toggling purchased status
    const putMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    // Mock subsequent GET to return the updated item
    const updatedItems: ShoppingItem[] = [{ ...mockItem, purchased: true }];

    const getMock = mockFetch(200, updatedItems);

    // Replace fetch mock
    (global.fetch as jest.Mock).mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        if (init && init.method === "PUT") {
          return putMock(input, init);
        }
        return getMock(input, init);
      }
    );

    // Click the checkbox to toggle purchased status
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });

    // Verify PUT request was made
    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith(
        `http://localhost:3000/api/items/${mockItem.id}`,
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining('"purchased":true'),
        })
      );
    });

    // Verify the item now has the "purchased" class
    await waitFor(() => {
      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("purchased");
    });
  });
});
