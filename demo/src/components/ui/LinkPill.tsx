import { cx } from "@rinzai/zen";
import { NavLink, NavLinkProps } from "react-router";

const LinkPill = ({ className, ...rest }: NavLinkProps) => {
	return (
		<NavLink
			className={({ isActive }) =>
				cx(
					`rounded-md p-3 text-xl   font-bold transition inline-flex w-full items-center justify-center text-foreground hover:bg-accent hover:text-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-opacity-75  whitespace-nowrap`,
					isActive ? "text-primary" : "text-muted-foreground",
					className,
				)
			}
			viewTransition
			{...rest}
		/>
	);
};

export default LinkPill;
