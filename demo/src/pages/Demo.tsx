import { Button } from "@feb/components/ui/Button";
import Input from "@feb/components/ui/Input";
import { Switch } from "@feb/components/ui/Switch";
import TextArea from "@feb/components/ui/TextArea";
import LocalSave from "@febkosq8/local-save";
import { cx, Dropdown } from "@rinzai/zen";
import { useState } from "react";
export default function Demo() {
	const [localSaveConfig, setLocalSaveConfig] = useState({
		dbName: "LocalSave",
		encryptionKey: "",
		categories: ["userData", "userSettings"],
		expiryThreshold: 1,
		clearOnDecryptError: false,
		printLogs: false,
	});
	const localSave = new LocalSave(localSaveConfig);
	const [category, setCategory] = useState("userData");
	const [itemKey, setItemKey] = useState("test");
	const [userData, setUserData] = useState<string>();
	const [timestamp, setTimestamp] = useState<string>();
	const [error, setError] = useState<string>();
	async function saveData(data: string) {
		try {
			const saveSuccess = await localSave.set(category, itemKey, data);
			console.log({ saveSuccess });
		} catch (error) {
			console.log("Failed saveData", { error });
		}
	}
	async function getTestData() {
		try {
			const storedDataFetch = await localSave.get(category, itemKey);
			console.log({ storedDataFetch });
			if (storedDataFetch) {
				setError(undefined);
				setUserData(storedDataFetch.data as string);
				setTimestamp(`Date recovered from '${new Date(storedDataFetch.timestamp).toUTCString()}'`);
			} else {
				setError("No data found in current LocalSave category with that key");
				setUserData("");
				setTimestamp(undefined);
			}
		} catch (e) {
			setError("Data is encrypted, please provide the correct key");
			setUserData("");
			setTimestamp(undefined);
			console.error(e);
		}
	}
	return (
		<div className="flex w-full p-5">
			<div className="flex flex-col items-center justify-start w-4/12 gap-2 px-2">
				<label className="font-bold text-xl text-center underline underline-offset-2">Config</label>
				<div className="flex gap-2 w-full">
					<div className="flex flex-col gap-1 items-start justify-center w-full">
						<label className="text-xl">Database name</label>
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
					</div>
					<div className="flex flex-col gap-1 items-start justify-center w-full">
						<label className="text-xl">Category</label>
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
					</div>
				</div>
				<div className="flex gap-2 w-full">
					<div className="flex flex-col gap-1 items-start justify-center w-full">
						<label className="text-xl">Item key</label>
						<Input
							type="text"
							className="w-full"
							value={itemKey ?? ""}
							placeholder={"Item key"}
							onChange={(e) => {
								setItemKey(e.target.value);
							}}
						/>
					</div>
					<div className="flex flex-col gap-1 items-start justify-center w-full">
						<label className="text-xl">Expiry threshold</label>
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
					</div>
				</div>
				<div className="flex flex-col gap-1 items-start justify-center w-full">
					<label
						className={cx(
							"text-xl",
							localSaveConfig.encryptionKey?.length > 0
								? [16, 24, 32].includes(localSaveConfig.encryptionKey?.length)
									? "text-green-500"
									: "text-red-800"
								: "",
						)}
					>{`Encryption key (${localSaveConfig.encryptionKey?.length ?? 0} length)`}</label>
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
					<div className="flex justify-center gap-2 w-full">
						<Button
							className="w-fit"
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
							className="w-fit"
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
							className="w-fit"
							onClick={async () => {
								await navigator.clipboard.writeText(localSaveConfig.encryptionKey);
							}}
							variant={"secondary"}
						>
							Copy key to clipboard
						</Button>
					</div>
				</div>
				<div className="flex gap-1 items-center justify-items-end w-full">
					<label className="text-xl">Print logs</label>
					<Switch
						checked={localSaveConfig.printLogs}
						onChange={(e) => {
							setLocalSaveConfig((curr) => {
								curr.printLogs = e;
								return structuredClone(curr);
							});
						}}
					/>
				</div>
				<div className="flex gap-1 items-center justify-items-end w-full">
					<label className="text-xl">Clear storage on decrypt error</label>
					<Switch
						checked={localSaveConfig.clearOnDecryptError}
						onChange={(e) => {
							setLocalSaveConfig((curr) => {
								curr.clearOnDecryptError = e;
								return structuredClone(curr);
							});
						}}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-2 items-center justify-start w-5/12">
				<label className="font-bold text-xl text-center underline underline-offset-2">Type some text below</label>
				<div className="flex flex-col items-center justify-center w-full px-2">
					<label className="text-xl text-red-500">{error}</label>
					<label className="text-xl text-green-500">{timestamp}</label>
					<TextArea
						className="w-full"
						required
						value={userData ?? ""}
						onChange={async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
							setUserData((curr) => {
								curr = e.target.value;
								return structuredClone(curr);
							});
							await saveData(e.target.value);
						}}
						placeholder={"Type some text into here"}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-2 items-center justify-start w-3/12">
				<label className="font-bold text-xl text-center underline underline-offset-2">Actions</label>
				<Button
					className="w-3/4"
					onClick={async () => {
						await getTestData();
					}}
				>
					Pull from LocalSave
				</Button>
				<Button
					className="w-3/4"
					onClick={async () => {
						const action = await localSave.remove(category, itemKey);
						console.log({ action });
					}}
				>
					Remove Current Key from Category
				</Button>
				<Button
					className="w-3/4"
					onClick={async () => {
						const action = await localSave.clear(category);
						console.log({ action });
					}}
				>
					Clear the category
				</Button>
				<Button
					className="w-3/4"
					onClick={async () => {
						const action = await localSave.destroy();
						console.log({ action });
					}}
					variant={"destructive"}
				>
					Destroy
				</Button>
				<Button
					className="w-3/4"
					onClick={async () => {
						const action = await localSave.expire(localSaveConfig.expiryThreshold);
						console.log({ action });
					}}
					variant={"destructive"}
				>
					{`Expire data older than ${localSaveConfig.expiryThreshold} days`}
				</Button>
			</div>
		</div>
	);
}
