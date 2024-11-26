import LinkPill from "@feb/components/ui/LinkPill";
import ThemeSwitcher from "@feb/components/ui/ThemeSwitcher";
import { useEffect, useState } from "react";
import Logo from "@feb/assets/logo.png";

export default function Header() {
	const [currHref, setCurrHref] = useState(window.location.hash);
	useEffect(() => {
		window.addEventListener("hashchange", () => {
			setCurrHref(window.location.hash);
		});
	}, []);
	return (
		<div className="flex text-2xl items-center w-full justify-between px-16 h-16 bg-background border-b-2 sticky top-0">
			<a href="/" className="font-bold">
				<img src={Logo} width={180} alt={"local-save"} />
			</a>
			<div className="flex items-center gap-4">
				<LinkPill active={currHref === "#about"} href="#about">
					About
				</LinkPill>
				<LinkPill active={currHref === "#demo"} href="#demo">
					Demo
				</LinkPill>

				<ThemeSwitcher />
			</div>
		</div>
	);
}
