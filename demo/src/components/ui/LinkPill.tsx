import { clsx } from "clsx";
import { NavLink } from "react-router";
interface LinkPillProps extends React.ComponentPropsWithoutRef<"a"> {
	href: string;
	active?: boolean;
}

const LinkPill = ({ href, className, children }: LinkPillProps) => {
	return (
		<NavLink
			to={href}
			className={({ isActive }) =>
				clsx(
					`rounded-md p-3 text-xl  font-bold transition inline-flex w-full items-center justify-center text-foreground hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-opacity-75  whitespace-nowrap`,
					isActive ? "text-primary" : "text-foreground",
					className,
				)
			}
		>
			{children}
		</NavLink>
	);
};

export default LinkPill;
