declare module "@sabaki/sgf"
{
	export interface NodeObject
	{
		children: NodeObject[];
		data: { [key: string]: string[] };
	}
	export function parse(sgf: string): NodeObject[];
}