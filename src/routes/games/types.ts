export interface Source {
  name: string;
  link: string;
}

export interface GameSource {
  source: string;
  link: string;
}

export interface Game {
  name: string;
  sources: GameSource[];
}
