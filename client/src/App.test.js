import React from "react"
import { render } from "@testing-library/react"
import App from "./App"

test("renders TurnipsToday", () => {
	const { getByText } = render(<App />)
	const linkElement = getByText(/TurnipsToday/i)
	expect(linkElement).toBeInTheDocument()
})
