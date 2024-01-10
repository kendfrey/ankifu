import React from "react";

/** Behaves like a controlled input when not focused, but like an uncontrolled input when focused. */
export default function FriendlyInput(props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>)
{
	const [focusedState, setFocusedState] = React.useState<string | null>(null);
	return <input {...props} value={focusedState ?? props.value}
		onChange={e => { setFocusedState(e.target.value); props.onChange?.(e); }}
		onFocus={e => { setFocusedState(e.target.value); props.onFocus?.(e); }}
		onBlur={e => { setFocusedState(null); props.onBlur?.(e); }} />;
}