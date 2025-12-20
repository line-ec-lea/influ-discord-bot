import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
export default function App() {
	const [count, setCount] = useState(0);

	return (
		<div>
			<button type="button" onClick={() => setCount(count + 1)}>
				Click me
			</button>
			<p>Count: {count}</p>
		</div>
	);
}

const root = document.getElementById("root");
if (root) {
	render(<App />, root);
}
