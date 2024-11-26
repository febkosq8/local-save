import { cx } from "@rinzai/zen";
import { forwardRef, ReactNode } from "react";
import { Link } from "react-router-dom";

interface PillProps {
	as?: React.ElementType;
	children: ReactNode;
	active?: boolean;
	className?: string;
	href?: string;
	[key: string]: any;
}

const Pill = forwardRef<any, PillProps>(({ as, children, active, className, href, ...props }, ref) => {
	const Tag = as || Link;
	return (
		<Tag
			to={href}
			className={cx(
				`p-3  text-xl  font-bold ${
					active ? "bg-blue-600 text-white" : "text-stone-400"
				} hover:bg-blue-900 hover:text-white`,
				className
			)}
			ref={ref}
			{...props}
			viewTransition
		>
			{children}
		</Tag>
	);
});

export default Pill;
