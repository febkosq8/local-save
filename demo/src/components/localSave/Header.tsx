import Logo from "@feb/assets/logo.png";
import ThemeSwitcher from "@feb/components/ui/ThemeSwitcher";
import { Link } from "react-router";

import { faGithub, faNpm } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LinkPill from "../ui/LinkPill";

export default function Header() {
	return (
		<div className="flex text-2xl items-center w-full justify-between px-8 h-16 bg-background border-b border-border sticky top-0">
			<Link to="/" className="font-bold">
				<img src={Logo} width={180} alt={"local-save"} />
			</Link>

			<div className="flex items-center gap-4">
				<LinkPill to="https://github.com/febkosq8/local-save">
					<FontAwesomeIcon icon={faNpm} className="size-5" />
				</LinkPill>
				<LinkPill to="https://github.com/febkosq8/local-save">
					<FontAwesomeIcon icon={faGithub} className="size-5" />
				</LinkPill>
				<ThemeSwitcher />
			</div>
		</div>
	);
}
