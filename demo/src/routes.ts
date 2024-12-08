import type { RouteConfig } from "@react-router/dev/routes";

export default [
	{
		path: "/",
		file: "./layout.tsx",
		children: [
			{
				index: true,
				file: "./pages/Demo.tsx",
			},
			{
				path: "*",
				file: "./pages/WrongPage.tsx",
			},
		],
	},
] satisfies RouteConfig;
