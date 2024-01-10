import React from "react";

/** Requires the user to click the button twice to confirm. */
export default function DangerButton(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>)
{
	const [confirmTime, setConfirmTime] = React.useState<number | null>(null);

	React.useEffect(() =>
	{
		const timer = setTimeout(() => setConfirmTime(null), 3000);
		return () => clearTimeout(timer);
	});

	return <button {...props} onClick={onClick} className={confirmTime !== null ? "danger" : ""}>
		{confirmTime === null ? props.children : [props.children, "?"]}
	</button>;

	function onClick(e: React.MouseEvent<HTMLButtonElement>)
	{
		if (confirmTime === null)
		{
			setConfirmTime(Date.now() + 500);
		}
		else if (Date.now() > confirmTime)
		{
			setConfirmTime(null);
			props.onClick?.(e);
		}
	}
}