export type Role = "member" | "analyst" | "admin";
export type Segment = "main" | "prelims" | "early_prelims";
export type Corner = "a" | "b";
export type Outcome = Corner | "draw" | "nc";

export const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "main", label: "Main card" },
  { key: "prelims", label: "Prelims" },
  { key: "early_prelims", label: "Early prelims" },
];

export type Person = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
};

export type EventRow = {
  id: number;
  slug: string;
  name: string;
  venue: string | null;
  starts_at: string;
};

export type Fight = {
  id: number;
  event_id: number;
  segment: Segment;
  position: number;
  fighter_a: string;
  fighter_b: string;
  weight_class: string | null;
  rounds: number;
  winner: Outcome | null;
  result_method: string | null;
};

export type AnalystPick = {
  fight_id: number;
  analyst_id: string;
  pick: Corner;
  method: string | null;
  odds: number | null;
  write_up: string | null;
};

export type EventCard = EventRow & {
  fights: Fight[];
  /** Only the picks this viewer is allowed to see. */
  picks: AnalystPick[];
  /** Crowd split per fight id. */
  split: Record<number, { a: number; b: number }>;
  /** The viewer's own community picks per fight id. */
  mine: Record<number, Corner>;
};

export type AnalystRecord = Person & { wins: number; losses: number; pushes: number };

export type AnalystPickWithFight = AnalystPick & { fight: Fight; event: EventRow };

export type Leader = { username: string; display_name: string | null; wins: number; losses: number };

export type Viewer = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  role: Role;
  subscribed: boolean;
} | null;

export type Recap = {
  id: number;
  event_id: number;
  author_id: string;
  went_well: string | null;
  went_wrong: string | null;
  video_url: string | null;
  created_at: string;
  event: EventRow;
  author: Person;
};

export type LiveSettings = {
  live_url: string | null;
  live_title: string | null;
  is_live: boolean;
};
