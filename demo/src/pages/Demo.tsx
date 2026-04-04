import { Button } from "@feb/components/ui/Button";
import Input from "@feb/components/ui/Input";
import { Switch } from "@feb/components/ui/Switch";
import TextArea from "@feb/components/ui/TextArea";
import LocalSave, { type Config } from "@febkosq8/local-save";
import { cx, Dropdown } from "@rinzai/zen";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { formatDurationFromMs } from "@feb/utils/formatDurationFromMs";

type DemoLocalSaveConfig = Omit<Required<Config>, "encryptionKey"> & {
	encryptionKey: string | undefined;
};

export default function Demo() {
	const [localSaveConfig, setLocalSaveConfig] = useState<DemoLocalSaveConfig>({
		dbName: "LocalSave",
		encryptionKey: undefined,
		categories: ["userData", "userSettings"],
		expiryThreshold: 24 * 60 * 60 * 1000,
		blockedTimeoutThreshold: 10000,
		clearOnDecryptError: false,
		printLogs: false,
	});
	const localSave = useMemo(() => new LocalSave(localSaveConfig), [localSaveConfig]);
	const [category, setCategory] = useState("userData");
	const [itemKey, setItemKey] = useState("test");
	const [userData, setUserData] = useState<string>();
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const encryptionKeyLength = localSaveConfig.encryptionKey?.length ?? 0;
	const hasEncryptionKey = encryptionKeyLength > 0;
	const hasValidEncryptionKeyLength = [16, 24, 32].includes(encryptionKeyLength);
	const expiryThresholdReadable = formatDurationFromMs(localSaveConfig.expiryThreshold);
	const blockedTimeoutReadable = formatDurationFromMs(localSaveConfig.blockedTimeoutThreshold);

	return (
		<div className="flex flex-col  w-full p-5 gap-4">
			<div className="flex flex-col p-6 border border-border rounded grow">
				<h3>Configuration</h3>
				<div className="mt-6 flex-col flex gap-4">
					<div className="grid md:grid-cols-2 grid-cols-1 gap-4 items-start">
						<label>
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
						<label>
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
						<label>
							Expiry threshold (ms)
							<span className="block text-xs text-muted-foreground">~ {expiryThresholdReadable}</span>
							<Input
								type="number"
								className="w-full"
								value={localSaveConfig.expiryThreshold ?? ""}
								min={1}
								placeholder={"Expiry threshold in milliseconds"}
								onChange={(e) => {
									const nextValue = Number(e.target.value);
									setLocalSaveConfig((curr) => {
										curr.expiryThreshold = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1;
										return structuredClone(curr);
									});
								}}
							/>
						</label>
						<label>
							Blocked timeout threshold (ms)
							<span className="block text-xs text-muted-foreground">~ {blockedTimeoutReadable}</span>
							<Input
								type="number"
								className="w-full"
								value={localSaveConfig.blockedTimeoutThreshold ?? ""}
								min={1}
								placeholder={"Blocked timeout threshold in milliseconds"}
								onChange={(e) => {
									const nextValue = Number(e.target.value);
									setLocalSaveConfig((curr) => {
										curr.blockedTimeoutThreshold = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 10000;
										return structuredClone(curr);
									});
								}}
							/>
						</label>
					</div>

					<div className="grid md:grid-cols-2 grid-cols-1 gap-4">
						<label
							className={cx(hasEncryptionKey ? (hasValidEncryptionKeyLength ? "text-green-500" : "text-red-800") : "")}
						>
							{`Encryption key (${encryptionKeyLength} length)`}

							<div className="grid md:grid-cols-2 grid-cols-1 gap-4">
								<Input
									type="text"
									className={cx(
										hasEncryptionKey ? (hasValidEncryptionKeyLength ? "border-green-500" : "border-red-800") : "",
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
								<div className="gap-2 flex flex-col md:flex-row ">
									<Button
										onClick={() => {
											setLocalSaveConfig((curr) => {
												curr.encryptionKey = Array.from({ length: 32 }, () =>
													Math.floor(Math.random() * 36).toString(36),
												)
													.join("")
													.toUpperCase();
												return structuredClone(curr);
											});
										}}
									>
										Generate Random
									</Button>
									{hasEncryptionKey && (
										<>
											<Button
												onClick={() => {
													setLocalSaveConfig((curr) => {
														curr.encryptionKey = "";
														return structuredClone(curr);
													});
												}}
												variant={"destructive"}
											>
												Clear
											</Button>
											<Button
												onClick={async () => {
													await navigator.clipboard.writeText(localSaveConfig.encryptionKey ?? "");
												}}
												variant={"secondary"}
											>
												Copy
											</Button>
										</>
									)}
								</div>
							</div>
						</label>
						<label>
							Category
							<Dropdown
								className={cx(
									"w-full!",
									"h-10",
									"placeholder:gray-800 rounded border border-border bg-input pl-5 text-foreground",
									"focus:border-transparent focus:outline-hidden focus:ring-2 focus:ring-ring",
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
						<label className="inline-flex flex-row items-center justify-start w-fit">
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
						<label className="inline-flex flex-row items-center justify-start w-fit">
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
				</div>
			</div>
			<div className="flex flex-col p-6 border border-border rounded grow">
				<h3>Testing & Data Management</h3>
				<div className="mt-6 flex-col flex gap-4">
					<TextArea
						className="w-full text-base"
						required
						value={userData ?? ""}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
							setUserData((curr) => {
								curr = e.target.value;
								return structuredClone(curr);
							});
							if (timeoutRef.current) clearTimeout(timeoutRef.current);
							timeoutRef.current = setTimeout(() => {
								if (e.target.value.length > 0) {
									toast.info("Save this data using the button below", { duration: 3500, closeButton: true });
								}
							}, 1500);
						}}
						placeholder={
							"Step 1: Type some data in here\nStep 2: Save that data using the button below\nStep 3: Reload the page to reset to default state\nStep 4: Pull your saved data using the button below"
						}
					/>
					<div className="flex gap-2 flex-col md:flex-row">
						<Button
							onClick={() => {
								toast.promise(localSave.set(category, itemKey, userData), {
									loading: `Saving data under '${itemKey}' to '${category}'`,
									success: `Saved data under '${itemKey}' to '${category}'`,
									error: `Failed to save data under '${itemKey}' to '${category}'`,
									duration: 3500,
									closeButton: true,
								});
							}}
						>
							Save to LocalSave
						</Button>
						<Button
							onClick={() => {
								window.location.reload();
							}}
							variant={"secondary"}
						>
							Reload this Page
						</Button>
						<Button
							onClick={() => {
								toast.promise(localSave.listKeys(category), {
									loading: `Listing item keys in ${category}`,
									success: (keys) => {
										if (keys.length === 0) return `No item keys found in ${category}`;
										return `A total of '${keys.length}' item keys are in '${category}'\n${keys.map((k, index) => `${index + 1}: '${k}'`).join("\n")}`;
									},
									error: `Failed to list keys in ${category}`,
								});
							}}
							variant={"secondary"}
						>
							List all item keys in current category
						</Button>
						<Button
							onClick={() => {
								toast.promise(localSave.get(category, itemKey), {
									loading: `Fetching data under '${itemKey}' from ${category}`,
									success: (data) => {
										if (!data) {
											setUserData("");
											return `No data found with key '${itemKey}' in '${category}'`;
										}

										if (typeof data.data === "string") {
											setUserData(data.data);
										} else {
											setUserData(JSON.stringify(data.data, null, 2));
										}

										return `Data recovered from '${new Date(data.timestamp).toUTCString()}'`;
									},
									error: (error) => {
										console.log({ error });
										if (error.message === "Data decryption failed") {
											return `Decryption failed for data under '${itemKey}' in '${category}' due to an incorrect/missing encryption key."}`;
										}
										setUserData("");
										return `Failed to fetch data under '${itemKey}' from '${category}'`;
									},
								});
							}}
						>
							Pull from LocalSave
						</Button>
						<Button
							onClick={() => {
								toast.promise(localSave.remove(category, itemKey), {
									loading: `Removing data under '${itemKey}' from '${category}'`,
									success: `Removed data under '${itemKey}' from '${category}'`,
									error: `Failed to remove data under '${itemKey}' from '${category}'`,
								});
							}}
							variant={"destructive"}
						>
							Delete data under key from category
						</Button>
						<Button
							onClick={() => {
								toast.promise(localSave.clear(category), {
									loading: `Clearing ${category}`,
									success: `Cleared ${category}`,
									error: `Failed to clear ${category}`,
								});
							}}
							variant={"destructive"}
						>
							Delete all data from category
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
							Delete all data from database
						</Button>
						<Button
							onClick={() => {
								toast.promise(localSave.expire(localSaveConfig.expiryThreshold), {
									loading: `Expiring data older than ${expiryThresholdReadable} (${localSaveConfig.expiryThreshold} ms)`,
									success: `Expired data older than ${expiryThresholdReadable} (${localSaveConfig.expiryThreshold} ms)`,
									error: `Failed to expire data older than ${expiryThresholdReadable} (${localSaveConfig.expiryThreshold} ms)`,
								});
							}}
							variant={"destructive"}
						>
							{`Expire data older than ${expiryThresholdReadable}`}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
