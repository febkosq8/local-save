import Header from "@feb/components/localSave/Header";
import { Outlet } from "react-router";
import { Toaster } from "sonner";
function App() {
	return (
		<div className="text-slate-600 dark:text-slate-100 bg-background">
			<Header />
			<Outlet />
			<Toaster
				richColors
				className="flex"
				toastOptions={{
					classNames: {
						title: "whitespace-pre-wrap",
						description: "whitespace-pre-wrap",
					},
				}}
			/>
		</div>
	);
}

export default App;
