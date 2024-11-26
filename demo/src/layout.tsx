import Header from "@feb/components/localSave/Header";
import { Outlet } from "react-router";
function App() {
	return (
		<div className="text-slate-600 dark:text-slate-100 bg-background">
			<Header />
			<Outlet />
		</div>
	);
}

export default App;
