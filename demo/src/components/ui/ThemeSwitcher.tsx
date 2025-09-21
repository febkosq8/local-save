import { faLaptop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu } from "@feb/components/ui/Menu";
import Pill from "@feb/components/ui/Pill";
import { useEffect, useState } from "react";
type Color = "light" | "dark" | "system";

export default function ThemeSwitcher() {
	const colorModeIcon = { light: faSun, dark: faMoon, system: faLaptop };
	const localStorageString = `theme`;
	useEffect(() => {
		if (typeof window !== "undefined" && !(localStorageString in localStorage)) {
			localStorage.setItem(localStorageString, "system");
		}
	}, []);
	const [colorMode, setColorMode] = useState<Color>(
		typeof window !== "undefined" ? ((localStorage.getItem(localStorageString) as Color) ?? "system") : "system",
	);
	useEffect(() => {
		if (["light", "dark"].includes(colorMode)) {
			if (colorMode === "dark") {
				document.documentElement.classList.add("dark");
				setColorMode("dark");
			} else if (colorMode === "light") {
				document.documentElement.classList.remove("dark");
				setColorMode("light");
			}
			localStorage.setItem(localStorageString, colorMode);
		} else {
			const isSystemThemeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (isSystemThemeDark) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			localStorage.setItem(localStorageString, "system");
		}
	}, [colorMode]);
	return (
		<Menu buttonText={<FontAwesomeIcon icon={colorModeIcon[colorMode] ?? faLaptop} />}>
			<>
				<Menu.Item className="focus-visible:outline-hidden">
					<Pill
						active={colorMode === "system"}
						title="System Theme"
						onClick={() => {
							setColorMode("system");
						}}
						className="flex w-full whitespace-nowrap p-6 rounded-t-sm rounded-b-none"
					>
						<FontAwesomeIcon icon={faLaptop} className={"size-4"} />
					</Pill>
				</Menu.Item>
				<Menu.Item className="focus-visible:outline-hidden">
					<Pill
						active={colorMode === "light"}
						title="Light Theme"
						onClick={() => {
							setColorMode("light");
						}}
						className="flex w-full whitespace-nowrap p-6 rounded-none"
					>
						<FontAwesomeIcon icon={faSun} className={"size-4"} />
					</Pill>
				</Menu.Item>
				<Menu.Item className="focus-visible:outline-hidden">
					<Pill
						active={colorMode === "dark"}
						title="Dark Theme"
						onClick={() => {
							setColorMode("dark");
						}}
						className="flex w-full whitespace-nowrap p-6 rounded-b-sm rounded-t-none"
					>
						<FontAwesomeIcon icon={faMoon} className={"size-4"} />
					</Pill>
				</Menu.Item>
			</>
		</Menu>
	);
}
