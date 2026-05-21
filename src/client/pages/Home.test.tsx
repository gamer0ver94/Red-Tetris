import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";

import Home from "./Home";
import { store } from "../store/store";

test("renders Home page content", () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByText("About Us")).toBeTruthy();
  expect(screen.getByText("About Project")).toBeTruthy();

});



