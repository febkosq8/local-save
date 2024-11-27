import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./index.css";
import "@rinzai/zen/dist/style.css";

export function meta() {
	return [
		{ title: "local-save | Demo" },
		{
			name: "description",
			content: "Lightweight wrapper around IndexedDB for secure and structured client-side data storage",
		},
	];
}
export function links() {
	return [
		{
			rel: "icon",
			href: "/src/assets/favicon.png",
			type: "image/png",
		},
	];
}
export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
export default function Root() {
	return <Outlet />;
}
