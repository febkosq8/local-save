import "@rinzai/zen/dist/style.css";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./index.css";

export function meta() {
	return [
		{ title: "local-save | Playground" },
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
			href: "/assets/favicon.png",
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
			<body className="bg-background text-foreground min-w-[345px]">
				{children}
				<ScrollRestoration />
				<Scripts />
				<script async src={`https://www.googletagmanager.com/gtag/id=$G-TCE9JK5E3Z`} />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							window.dataLayer = window.dataLayer || [];
							function gtag() {
								dataLayer.push(arguments);
							}
							gtag("js", new Date());

							gtag("config", "G-TCE9JK5E3Z");`,
					}}
				/>
			</body>
		</html>
	);
}
export function HydrateFallback() {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
				width: "100vw",
				backgroundColor: "hsl(var(--background))",
				color: "hsl(var(--foreground))",
			}}
		>
			Loading...
		</div>
	);
}
export default function Root() {
	return <Outlet />;
}
