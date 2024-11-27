import { clsx } from "clsx";
import { ComponentPropsWithoutRef } from "react";

const TextArea = ({ className, ...rest }: ComponentPropsWithoutRef<"textarea">) => {
	return (
		<textarea
			{...rest}
			autoComplete="off"
			className={clsx(
				className,
				"min-h-[300px] max-h-96 !overflow-auto",
				"placeholder:gray-800 rounded border border-border bg-input pl-5 text-foreground",
				"focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring",
				"disabled:cursor-not-allowed disabled:border-muted",
				"whitespace-pre-wrap",
			)}
		/>
	);
};

export default TextArea;
