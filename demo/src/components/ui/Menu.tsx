import Pill from "@feb/components/ui/Pill";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as DropdownBaseMenu from "@radix-ui/react-dropdown-menu";
import { cx } from "@rinzai/zen";
import { ReactNode } from "react";

interface MenuProps {
	className?: string;
	active?: boolean;
	buttonText: string | ReactNode;
	children: ReactNode;
}

interface MenuComponent extends React.FC<MenuProps> {
	Item: typeof DropdownBaseMenu.Item;
}

const MenuComponent: React.FC<MenuProps> = ({ className, active, buttonText, children }) => {
	return (
		<DropdownBaseMenu.Root>
			<DropdownBaseMenu.Trigger
				className={cx(
					`w-fit rounded-md p-3 text-xl font-bold inline-flex items-center justify-center  text-stone-400 hover:bg-blue-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`,
					active ? "bg-blue-600 text-white" : "",
					className
				)}
			>
				{buttonText}
				<FontAwesomeIcon icon={faChevronDown} className="-mr-1 ml-2 h-4 w-4" aria-hidden="true" />
			</DropdownBaseMenu.Trigger>
			<DropdownBaseMenu.Portal>
				<DropdownBaseMenu.Content
					loop={true}
					sideOffset={2}
					className="w-fit origin-top-right divide-y border-2 border-gray-600 divide-gray-100 rounded-md bg-neutral-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
				>
					{children}
				</DropdownBaseMenu.Content>
			</DropdownBaseMenu.Portal>
		</DropdownBaseMenu.Root>
	);
};

const Menu: MenuComponent = Object.assign(MenuComponent, {
	Item: DropdownBaseMenu.Item,
});

interface MenuSubProps {
	active?: boolean;
	buttonText: string;
	children: ReactNode;
}

const MenuSub = ({ active, buttonText, children }: MenuSubProps) => {
	return (
		<DropdownBaseMenu.Sub>
			<DropdownBaseMenu.SubTrigger asChild>
				<Pill as={"div"} active={active} className="flex w-full items-center justify-between whitespace-nowrap">
					{buttonText}
					<FontAwesomeIcon icon={faChevronRight} className="-mr-1 ml-2 h-4 w-4" aria-hidden="true" />
				</Pill>
			</DropdownBaseMenu.SubTrigger>
			<DropdownBaseMenu.Portal>
				<DropdownBaseMenu.SubContent
					loop={true}
					sideOffset={2}
					arrowPadding={2}
					className="w-fit origin-top-right divide-y border-2 border-gray-600 divide-gray-100 rounded-md bg-neutral-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
				>
					{children}
					<DropdownBaseMenu.Arrow className="fill-black dark:fill-stone-200 size-2" />
				</DropdownBaseMenu.SubContent>
			</DropdownBaseMenu.Portal>
		</DropdownBaseMenu.Sub>
	);
};

Object.assign(Menu, {
	Item: DropdownBaseMenu.Item,
});

export { Menu, MenuSub };
