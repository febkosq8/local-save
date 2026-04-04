export function formatDurationFromMs(milliseconds: number): string {
	if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0 ms";

	const units = [
		{ label: "day", value: 24 * 60 * 60 * 1000 },
		{ label: "hour", value: 60 * 60 * 1000 },
		{ label: "minute", value: 60 * 1000 },
		{ label: "second", value: 1000 },
		{ label: "ms", value: 1 },
	] as const;

	const unit = units.find((curr) => milliseconds >= curr.value) ?? units[units.length - 1];
	if (unit.label === "ms") return `${Math.round(milliseconds)} ms`;

	const converted = milliseconds / unit.value;
	const rounded = converted >= 10 ? Math.round(converted) : Math.round(converted * 10) / 10;
	const suffix = rounded === 1 ? unit.label : `${unit.label}s`;

	return `${rounded} ${suffix}`;
}
