import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAppDispatch, useAppSelector } from "./reduxHooks";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userSlice, { setUsername, setCsrfToken } from "../store/userSlice";

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      user: userSlice,
    },
  });
};

describe("reduxHooks", () => {
  it("useAppSelector returns correct state", () => {
    const store = createTestStore();
    
    // Create a test component that uses the hook
    const TestComponent = () => {
      const username = useAppSelector((state) => state.user.username);
      return <div data-testid="username">{username || "none"}</div>;
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId("username")).toHaveTextContent("none");
  });

  it("useAppDispatch dispatches actions", async () => {
    const store = createTestStore();
    
    // Create a test component that uses the hook
    const TestComponent = () => {
      const dispatch = useAppDispatch();
      const username = useAppSelector((state) => state.user.username);
      
      const handleClick = () => {
        dispatch(setUsername("TestUser"));
      };

      return (
        <div>
          <span data-testid="username">{username || "none"}</span>
          <button onClick={handleClick}>Set Username</button>
        </div>
      );
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId("username")).toHaveTextContent("none");
    
    const button = screen.getByRole("button", { name: /set username/i });
    
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByTestId("username")).toHaveTextContent("TestUser");
  });

  it("useAppDispatch and useAppSelector work together", async () => {
    const store = createTestStore();
    
    const TestComponent = () => {
      const dispatch = useAppDispatch();
      const csrfToken = useAppSelector((state) => state.user.csrf_token);
      
      const handleClick = () => {
        dispatch(setCsrfToken("token123"));
      };

      return (
        <div>
          <span data-testid="token">{csrfToken || "none"}</span>
          <button onClick={handleClick}>Set Token</button>
        </div>
      );
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId("token")).toHaveTextContent("none");
    
    const button = screen.getByRole("button", { name: /set token/i });
    
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByTestId("token")).toHaveTextContent("token123");
  });
});