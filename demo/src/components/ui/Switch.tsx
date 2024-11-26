import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Switch as SwitchBase } from "@headlessui/react";
import { cva, cx } from "@rinzai/zen";
interface SwitchProps {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	variant?: "primary" | "danger" | "success";
	children: (checked: boolean) => JSX.Element;
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
				<div className="relative w-full h-full">
					<FontAwesomeIcon
						icon={faCircle}
						className={cx(
							`absolute top-1/2 transform -translate-y-1/2 `,
							checked ? "left-6 text-gray-400 dark:text-gray-200" : "left-1 text-blue-600",
							disabled && "text-gray-400 dark:text-gray-200",
							`inline-block h-4 w-4 rounded-full border border-blue-500 [transition:_all_0.5s_cubic-bezier(1,0,0,1)]`
						)}
					/>
				</div>
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
			true: "",
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
