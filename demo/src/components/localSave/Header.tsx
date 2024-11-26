import Logo from "@feb/assets/logo.png";
import LinkPill from "@feb/components/ui/LinkPill";
import ThemeSwitcher from "@feb/components/ui/ThemeSwitcher";
import { Link } from "react-router";

export default function Header() {
	return (
		<div className="flex text-2xl items-center w-full justify-between px-16 h-16 bg-background border-b-2 sticky top-0">
			<Link to="/" className="font-bold">
				<img src={Logo} width={180} alt={"local-save"} />
			</Link>
			<div className="flex items-center gap-4">
				<LinkPill href="/">Demo</LinkPill>
				<ThemeSwitcher />
			</div>
		</div>
	);
}
