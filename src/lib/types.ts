export type Metrics = {
  water: number;
  trust: number;
  diplomacy: number;
  infrastructure: number;
};

export type Impact = Partial<Metrics>;

export type Option = {
  text: string;
  category: string;
  apCost: number;
  impact: Impact;
  feedback: string;
};

export type Round = {
  situation: string;
  locationName: string;
  location: [number, number];
  mapZoom: number;
  deepIntel: string;
  options: Option[];
};

export type NewsItem = { text: string; time: string };

export type SessionRow = {
  id: string;
  session_id: string;
  status: "LOBBY" | "PLAYING" | "EVALUATION";
  game_mode: "MULTI" | "SOLO_PLAYER" | "SOLO_WHITE_CELL";
  threat: string;
  metrics: Metrics;
  history: Option[];
  news_feed: NewsItem[];
  current_round: Round | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Role = "PLAYER" | "WHITE_CELL";
