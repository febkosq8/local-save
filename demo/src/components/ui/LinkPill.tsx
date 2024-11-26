import { clsx } from "clsx";
interface LinkPillProps extends React.ComponentPropsWithoutRef<"a"> {
	href: string;
	active?: boolean;
}

const LinkPill = ({ href, active, className, children }: LinkPillProps) => {
	return (
		<a
			href={href}
			className={clsx(
				`rounded-md p-3 text-xl  font-bold transition inline-flex w-full items-center justify-center text-foreground hover:bg-accent hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-opacity-75  whitespace-nowrap`,
				active ? "text-primary" : "text-foreground",
				className
			)}
		>
			{children}
		</a>
	);
};

export default LinkPill;
