import { cx } from "@rinzai/zen";
import React, { ComponentPropsWithoutRef, useRef, useState, useEffect, useCallback } from "react";

type InputProps = ComponentPropsWithoutRef<"input"> & {
	debounceThresholdMs?: number;
	onDebouncedChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, onChange, onDebouncedChange, value, debounceThresholdMs, ...rest }, ref) => {
		const [internalValue, setInternalValue] = useState(value ?? "");
		const timeoutRef = useRef<NodeJS.Timeout | null>(null);
		const isControlled = value !== undefined;

		useEffect(() => {
			if (isControlled) setInternalValue(value as string);
		}, [value, isControlled]);

		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const newValue = e.target.value;
				if (!isControlled) setInternalValue(newValue);
				if (onChange) onChange(e);
				if (onDebouncedChange) {
					if (timeoutRef.current) clearTimeout(timeoutRef.current);
					if (debounceThresholdMs && debounceThresholdMs > 0) {
						timeoutRef.current = setTimeout(() => {
							onDebouncedChange(e);
						}, debounceThresholdMs);
					} else {
						onDebouncedChange(e);
					}
				}
			},
			[onChange, onDebouncedChange, debounceThresholdMs, isControlled],
		);

		useEffect(() => {
			return () => {
				if (timeoutRef.current) clearTimeout(timeoutRef.current);
			};
		}, []);

		return (
			<input
				{...rest}
				ref={ref}
				autoComplete="off"
				className={cx(
					className,
					"h-10",
					"placeholder:gray-800 rounded border border-border bg-input pl-5 text-foreground",
					"focus:border-transparent focus:outline-hidden focus:ring-2 focus:ring-ring",
					"disabled:cursor-not-allowed disabled:border-muted",
					"whitespace-pre-wrap",
				)}
				value={isControlled ? value : internalValue}
				onChange={handleChange}
			/>
		);
	},
);

Input.displayName = "Input";

export default Input;
