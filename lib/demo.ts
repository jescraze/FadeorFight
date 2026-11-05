// Sample data shown until Supabase is connected. Fighters and events are made up.
import type { AnalystPick, EventRow, Fight, Person } from "./types";

const hours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

export const demoAnalysts: Person[] = [
  { id: "welly", username: "welly", display_name: "Welly", bio: "Grappling nerd. Watches every prelim twice." },
  { id: "gordon", username: "gordon", display_name: "Gordon", bio: "Strikers, line movement and the occasional dog with a puncher's chance." },
];

export const demoEvents: EventRow[] = [
  { id: 2, slug: "fight-night-okafor-vs-lindqvist", name: "UFC Fight Night: Okafor vs. Lindqvist", venue: "Apex, Las Vegas", starts_at: hours(70) },
  { id: 1, slug: "fight-night-duarte-vs-kemp", name: "UFC Fight Night: Duarte vs. Kemp", venue: "Rogers Place, Edmonton", starts_at: hours(-150) },
];

let id = 100;
const f = (
  event_id: number,
  segment: Fight["segment"],
  position: number,
  fighter_a: string,
  fighter_b: string,
  weight_class: string,
  rounds = 3,
  winner: Fight["winner"] = null,
  result_method: string | null = null,
): Fight => ({ id: ++id, event_id, segment, position, fighter_a, fighter_b, weight_class, rounds, winner, result_method });

export const demoFights: Fight[] = [
  // Upcoming card
  f(2, "main", 1, "Tobi Okafor", "Erik Lindqvist", "Light heavyweight", 5),
  f(2, "main", 2, "Rafael Duarte", "Sung-min Park", "Lightweight"),
  f(2, "main", 3, "Keira Walsh", "Amanda Roche", "Women's flyweight"),
  f(2, "main", 4, "Dmitri Volkov", "Jalen Hayes", "Heavyweight"),
  f(2, "prelims", 1, "Marco Bellini", "Tyrese Grant", "Welterweight"),
  f(2, "prelims", 2, "Hana Mori", "Lucia Ferreira", "Women's strawweight"),
  f(2, "prelims", 3, "Owen Pritchard", "Ali Kassem", "Featherweight"),
  f(2, "early_prelims", 1, "Diego Santos", "Callum Reid", "Bantamweight"),
  f(2, "early_prelims", 2, "Nikola Petrov", "Sam Whitfield", "Middleweight"),
  // Past card, graded
  f(1, "main", 1, "Rafael Duarte", "Connor Kemp", "Lightweight", 5, "a", "Unanimous decision"),
  f(1, "main", 2, "Asante Boateng", "Luc Moreau", "Middleweight", 3, "b", "KO R1"),
  f(1, "main", 3, "Priya Nair", "Jess Calloway", "Women's bantamweight", 3, "a", "Submission R2"),
  f(1, "prelims", 1, "Viktor Hale", "Ramon Ortiz", "Welterweight", 3, "draw", "Split draw"),
  f(1, "prelims", 2, "Kai Tanaka", "Brent Mills", "Flyweight", 3, "b", "TKO R3"),
];

const p = (
  fightIndex: number,
  analyst: "welly" | "gordon",
  pick: "a" | "b",
  method: string,
  odds: number | null,
  write_up: string | null = null,
): AnalystPick => ({ fight_id: demoFights[fightIndex].id, analyst_id: analyst, pick, method, odds, write_up });

export const demoPicks: AnalystPick[] = [
  p(0, "welly", "a", "by decision", 175, "Lindqvist has faded after round two in every five-round fight. Okafor just has to survive the first ten minutes and wrestle late."),
  p(0, "gordon", "b", "by KO", 210, "Okafor drops his right hand when he shoots. Lindqvist has the counter left to make him pay for it."),
  p(1, "welly", "a", "by submission", -130, "Park's takedown defence has slipped two fights in a row."),
  p(1, "gordon", "a", "by decision", -150, null),
  p(2, "welly", "b", "by decision", 120, "Roche's cardio wins this if it goes fifteen minutes."),
  p(2, "gordon", "a", "by TKO", -140, "Walsh hits harder and Roche walks straight in."),
  p(3, "welly", "a", "by KO", -200, null),
  p(3, "gordon", "a", "by KO", -200, "Hayes has been dropped in three of his last four."),
  p(4, "welly", "a", "by decision", -115, "Bellini's jab controls range all night."),
  p(4, "gordon", "b", "by KO", 105, "Grant is the bigger puncher and Bellini's chin is a question."),
  p(5, "welly", "a", "by submission", 140, null),
  p(5, "gordon", "a", "by decision", 140, null),
  p(6, "welly", "b", "by decision", -110, null),
  p(6, "gordon", "b", "by TKO", -110, null),
  p(7, "welly", "a", "by submission", -180, null),
  p(7, "gordon", "a", "by decision", -180, null),
  p(8, "welly", "b", "by decision", 155, null),
  p(8, "gordon", "a", "by KO", -175, null),
  // Graded card
  p(9, "welly", "a", "by decision", -160, "Duarte's pace breaks Kemp after round three."),
  p(9, "gordon", "a", "by KO", -160, null),
  p(10, "welly", "a", "by decision", -120, null),
  p(10, "gordon", "b", "by KO", 100, "Moreau's left hook is the best punch on the card."),
  p(11, "welly", "a", "by submission", 130, "Calloway gives up her back on every scramble."),
  p(11, "gordon", "b", "by decision", -150, null),
  p(12, "welly", "a", "by decision", -105, null),
  p(12, "gordon", "b", "by decision", -115, null),
  p(13, "welly", "a", "by submission", -125, null),
  p(13, "gordon", "b", "by TKO", 105, null),
];

export const demoSplit: Record<number, { a: number; b: number }> = Object.fromEntries(
  demoFights.map((fight, i) => [fight.id, { a: 18 + ((i * 37) % 41), b: 12 + ((i * 23) % 37) }]),
);

export const demoLeaders = [
  { username: "southpaw_steve", display_name: "Southpaw Steve", wins: 41, losses: 19 },
  { username: "mariaw", display_name: "Maria W.", wins: 38, losses: 22 },
  { username: "cagesider", display_name: "Cagesider", wins: 35, losses: 25 },
  { username: "jl_picks", display_name: "JL", wins: 30, losses: 24 },
  { username: "nate_k", display_name: "Nate K.", wins: 27, losses: 27 },
];

export const demoRecaps = [
  {
    id: 1,
    event_id: 1,
    author_id: "welly",
    went_well:
      "Duarte's pace did exactly what I thought. Kemp was flat-footed by round three and the decision was never in doubt. Nair's submission was the best read I had all night: Calloway gave up her back on the first scramble.",
    went_wrong:
      "I underrated Moreau's power. I was so focused on Boateng's wrestling that I ignored how often he gets hit coming in. Tanaka's cardio also let me down in round three.",
    video_url: null,
    created_at: hours(-140),
  },
  {
    id: 2,
    event_id: 1,
    author_id: "gordon",
    went_well: "Moreau's left hook at even money was the pick of the card. One punch, one minute.",
    went_wrong:
      "Faded Nair and paid for it. Calloway's takedown defence looked fine on tape but not against someone who chains attempts. Lesson: grapplers who chain beat grapplers who defend one at a time.",
    video_url: null,
    created_at: hours(-138),
  },
];
