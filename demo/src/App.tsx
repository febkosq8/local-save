import Demo from "@feb/pages/Demo";
import WrongPage from "@feb/pages/WrongPage";
import Header from "@feb/components/localSave/Header";
import { Route, Routes } from "react-router-dom";
if (window.location.hash) {
	const element = document.querySelector(window.location.hash);
	if (element) {
		element.scrollIntoView();
	}
}
function App() {
	return (
		<div className="text-slate-600 dark:text-slate-100 bg-background">
			<Header />
			<Routes>
				<Route path="/" element={<Demo />} />
				<Route path="*" element={<WrongPage />} />
			</Routes>
		</div>
	);
}

export default App;
