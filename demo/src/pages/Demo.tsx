import { Button } from "@feb/components/ui/Button";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LocalSave from "@febkosq8/local-save";
import Input from "@feb/components/ui/Input";
import { useState } from "react";
const categories = ["userData", "userSettings"];
export default function Demo() {
	const [category, setCategory] = useState();
	const [userData, setUserData] = useState("");
	const localSave = new LocalSave({
		categories,
	});
	return (
		<div className="febkos flex flex-col justify-center items-center">
			<h2 className="typography-heading-2 flex mb-10" id="aboutMeTitle">
				Demo <FontAwesomeIcon icon={faWandMagicSparkles} className="h-10 w-10 ml-2" />
			</h2>
			<div className="flex border w-full p-5">
				<div className="flex items-center justify-center w-1/3 border">1</div>
				<div className="flex items-center justify-center w-1/3 border">
					2
					<TextArea
						className="w-full"
						required
						as="textarea"
						value={userData ?? ""}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
							setUserData((curr) => {
								curr = e.target.value;
								return structuredClone(curr);
							});
						}}
						placeholder={"Type some text into here"}
					/>
				</div>
				<div className="flex items-center justify-center w-1/3 border">3</div>
			</div>
		</div>
	);
}
