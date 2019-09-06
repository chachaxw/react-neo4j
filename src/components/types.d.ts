export interface Node {
	id?: number | string;
  name: string;
  [key: string]: any;
}

export interface Link {
	id?: number | string;
	source: number | string | object | null;
	target: number | string | object | null;
  relative: string;
  [key: string]: any;
}
