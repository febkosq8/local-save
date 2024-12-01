import { Button } from "@feb/components/ui/Button";
import Input from "@feb/components/ui/Input";
import { Switch } from "@feb/components/ui/Switch";
import TextArea from "@feb/components/ui/TextArea";
import LocalSave from "@febkosq8/local-save";
import { cx, Dropdown } from "@rinzai/zen";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
export default function Demo() {
	const [localSaveConfig, setLocalSaveConfig] = useState({
		dbName: "LocalSave",
		encryptionKey: "",
		categories: ["userData", "userSettings"],
		expiryThreshold: 1,
		clearOnDecryptError: false,
		printLogs: false,
	});
	const localSave = useMemo(() => new LocalSave(localSaveConfig), [localSaveConfig]);
	const [category, setCategory] = useState("userData");
	const [itemKey, setItemKey] = useState("test");
	const [userData, setUserData] = useState<string>();
	useEffect(() => {
		if (!userData) return;
		const timeout = setTimeout(() => {
			toast.promise(localSave.set(category, itemKey, userData), {
				loading: `Saving ${itemKey} to ${category}`,
				success: `Saved ${itemKey} to ${category}`,
				error: `Failed to save ${itemKey} to ${category}`,
			});
		}, 1000);
		return () => {
			clearTimeout(timeout);
		};
	}, [userData]);
	return (
		<div className="flex flex-col items-center w-full p-5 gap-4">
			<div className="flex flex-col justify-start gap-2 px-2 border border-border rounded ">
				<h4 className="text-center">Config</h4>
				<div className="flex gap-2 w-full">
					<label className="w-full">
						Database name
						<Input
							type="text"
							className="w-full"
							value={localSaveConfig?.dbName ?? ""}
							placeholder={"Database Name"}
							onChange={(e) => {
								setLocalSaveConfig((curr) => {
									curr.dbName = e.target.value;
									return structuredClone(curr);
								});
							}}
						/>
					</label>
					<label className="w-full">
						Category
						<Dropdown
							className={cx(
								"!w-full",
								"h-10",
								"placeholder:gray-800 rounded border border-border bg-input pl-5 text-foreground",
								"focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring",
								"disabled:cursor-not-allowed disabled:border-muted",
								"whitespace-pre-wrap",
							)}
							selected={{ text: category, key: category }}
							items={localSaveConfig.categories.map((category) => ({ text: category, key: category }))}
							onChange={(e) => {
								setCategory(e.key);
							}}
						/>
					</label>
				</div>
				<div className="flex gap-2 w-full">
					<label className="w-full">
						Item key
						<Input
							type="text"
							className="w-full"
							value={itemKey ?? ""}
							placeholder={"Item key"}
							onChange={(e) => {
								setItemKey(e.target.value);
							}}
						/>
					</label>
					<label className="w-full">
						Expiry threshold
						<Input
							type="number"
							className="w-full"
							value={localSaveConfig.expiryThreshold ?? ""}
							min={0}
							placeholder={"Item key"}
							onChange={(e) => {
								setLocalSaveConfig((curr) => {
									curr.expiryThreshold = +e.target.value;
									return structuredClone(curr);
								});
							}}
						/>
					</label>
				</div>
				<label
					className={cx(
						"w-full",
						localSaveConfig.encryptionKey?.length > 0
							? [16, 24, 32].includes(localSaveConfig.encryptionKey?.length)
								? "text-green-500"
								: "text-red-800"
							: "",
					)}
				>
					{`Encryption key (${localSaveConfig.encryptionKey?.length ?? 0} length)`}
					<Input
						type="text"
						className={cx(
							"w-full",
							localSaveConfig.encryptionKey?.length > 0
								? [16, 24, 32].includes(localSaveConfig.encryptionKey?.length)
									? "border-green-500"
									: "border-red-800"
								: "",
						)}
						value={localSaveConfig?.encryptionKey ?? ""}
						placeholder={"Encryption key"}
						onChange={(e) => {
							setLocalSaveConfig((curr) => {
								curr.encryptionKey = e.target.value;
								return structuredClone(curr);
							});
						}}
					/>
				</label>
				<div className="flex justify-between gap-2 w-full">
					<Button
						onClick={() => {
							setLocalSaveConfig((curr) => {
								curr.encryptionKey = "undefined";
								return structuredClone(curr);
							});
						}}
						variant={"destructive"}
					>
						Clear current key
					</Button>
					<Button
						onClick={() => {
							setLocalSaveConfig((curr) => {
								curr.encryptionKey = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36))
									.join("")
									.toUpperCase();
								return structuredClone(curr);
							});
						}}
					>
						Generate random 32 char key
					</Button>
					<Button
						onClick={async () => {
							await navigator.clipboard.writeText(localSaveConfig.encryptionKey);
						}}
						variant={"secondary"}
					>
						Copy key to clipboard
					</Button>
				</div>
				<label className="inline-flex flex-row items-center justify-start">
					Print logs
					<Switch
						checked={localSaveConfig.printLogs}
						onChange={(e) => {
							setLocalSaveConfig((curr) => {
								curr.printLogs = e;
								return structuredClone(curr);
							});
						}}
					/>
				</label>
				<label className="inline-flex flex-row items-center justify-start">
					Clear storage on decrypt error
					<Switch
						checked={localSaveConfig.clearOnDecryptError}
						onChange={(e) => {
							setLocalSaveConfig((curr) => {
								curr.clearOnDecryptError = e;
								return structuredClone(curr);
							});
						}}
					/>
				</label>
			</div>
			<div className="flex flex-col justify-start gap-2 px-2 border border-border rounded ">
				<h4 className="font-bold text-center w-full">
					Type some text below
					<TextArea
						className="w-full"
						required
						value={userData ?? ""}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
							setUserData((curr) => {
								curr = e.target.value;
								return structuredClone(curr);
							});
						}}
						placeholder={"Type some text into here"}
					/>
				</h4>
			</div>
			<div className="flex flex-col gap-2 items-center justify-start ">
				<label className="font-bold text-xl text-center">Actions</label>
				<div className="flex gap-2 items-center">
					<Button
						onClick={() => {
							toast.promise(localSave.get(category, itemKey), {
								loading: `Fetching ${itemKey} from ${category}`,
								success: (data) => {
									setUserData(data?.data as string);
									return `Data recovered from '${new Date(data?.timestamp ?? "").toUTCString()}`;
								},
								error: () => {
									setUserData("");
									return "No data found in current LocalSave category with that key";
								},
							});
						}}
					>
						Pull from LocalSave
					</Button>
					<Button
						onClick={() => {
							toast.promise(localSave.remove(category, itemKey), {
								loading: `Removing ${itemKey} from ${category}`,
								success: `Removed ${itemKey} from ${category}`,
								error: `Failed to remove ${itemKey} from ${category}`,
							});
						}}
					>
						Remove Current Key from Category
					</Button>
					<Button
						onClick={() => {
							toast.promise(localSave.clear(category), {
								loading: `Clearing ${category}`,
								success: `Cleared ${category}`,
								error: `Failed to clear ${category}`,
							});
						}}
					>
						Clear the category
					</Button>
					<Button
						onClick={() => {
							toast.promise(localSave.destroy(), {
								loading: "Destroying LocalSave",
								success: "Destroyed LocalSave",
								error: "Failed to destroy LocalSave",
							});
						}}
						variant={"destructive"}
					>
						Destroy
					</Button>
					<Button
						onClick={() => {
							toast.promise(localSave.expire(localSaveConfig.expiryThreshold), {
								loading: `Expiring data older than ${localSaveConfig.expiryThreshold} days`,
								success: `Expired data older than ${localSaveConfig.expiryThreshold} days`,
								error: `Failed to expire data older than ${localSaveConfig.expiryThreshold} days`,
							});
						}}
						variant={"destructive"}
					>
						{`Expire data older than ${localSaveConfig.expiryThreshold} days`}
					</Button>
				</div>
			</div>
		</div>
	);
}
