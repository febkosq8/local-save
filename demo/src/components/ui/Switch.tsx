import { Switch as SwitchBase } from "@headlessui/react";
import { cva, cx } from "@rinzai/zen";
interface SwitchProps {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	variant?: "primary" | "danger" | "success";
	children?: (checked: boolean) => JSX.Element;
}
const Switch = ({
	checked = false,
	onChange,
	disabled = false,
	variant = "primary",
	children,
	...rest
}: SwitchProps) => {
	return (
		<SwitchBase
			checked={checked}
			disabled={disabled}
			onChange={onChange}
			className={SwitchVariants({ variant, checked, disabled })}
			{...rest}
		>
			{children ? (
				children(checked)
			) : (
				<span
					className={cx(
						"pointer-events-none inline-block h-4 w-4 transform rounded-full ring-1 ring-black/10 transition-transform duration-300 ease-out border border-blue-500",
						checked
							? "bg-blue-600 border-blue-600"
							: disabled
								? "bg-gray-300 dark:bg-gray-400 border-gray-400 dark:border-gray-500 shadow-[0_0_0_2px_rgba(120,120,120,0.3)]"
								: "bg-gray-200 dark:bg-gray-700 border-gray-500 dark:border-gray-300 shadow-[0_0_0_2px_rgba(120,120,120,0.5)]",
						checked ? "translate-x-6" : "translate-x-1",
					)}
				/>
			)}
		</SwitchBase>
	);
};
const SwitchVariants = cva("relative inline-flex h-6 w-11 items-center rounded-full", {
	variants: {
		variant: {
			danger: "",
			success: "",
			primary: "",
		},
		checked: {
			true: "bg-gray-400 dark:bg-gray-200",
			false: "bg-gray-400 dark:bg-gray-200",
		},
		disabled: {
			true: "dark:bg-gray-600 ring-2 ring-slate-900 dark:ring-slate-400",
			false: "",
		},
	},
	compoundVariants: [
		{
			variant: "danger",
			checked: true,
			className: "bg-red-600",
		},
		{
			variant: "primary",
			checked: true,
			className: "bg-blue-600",
		},
		{
			variant: "success",
			checked: true,
			className: "bg-green-600",
		},
	],
});
export { Switch, SwitchVariants };
