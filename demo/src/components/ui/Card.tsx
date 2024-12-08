import { clsx } from "clsx";
interface CardProps extends React.ComponentPropsWithoutRef<"div"> {}
const Card = (props: CardProps) => {
	const { className, ...rest } = props;
	return <div className={clsx("card p-4 rounded-lg border shadow-sm", className)} {...rest} />;
};

const Header = (props: CardProps) => {
	const { className, ...rest } = props;
	return <h2 className={clsx("card-header flex flex-col typography-heading-2", className)} {...rest} />;
};
const Content = (props: CardProps) => {
	const { className, ...rest } = props;
	return (
		<div
			className={clsx("card-content typography-heading-4 justify-between whitespace-pre-wrap py-2", className)}
			{...rest}
		/>
	);
};
const Footer = (props: CardProps) => {
	const { className, ...rest } = props;
	return (
		<div className="border-t flex justify-start items-center pt-2">
			<h2 className={clsx("card-footer text-2xl", className)} {...rest} />
		</div>
	);
};
Card.Header = Header;
Card.Content = Content;
Card.Footer = Footer;
export default Card;
