import "server-only";
import { serverConfig } from "@/config/server.config";

/**
 * Whitelist rule-quiz pool — SERVER ONLY.
 *
 * `correct` is the index of the right option. This module is marked
 * `server-only`, so importing it from a client component fails the build;
 * the browser only ever receives question text, option text and random
 * per-attempt option tokens (see WhitelistService.startQuiz).
 */
export interface WhitelistQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export const QUIZ_SIZE = serverConfig.whitelist.questionsPerAttempt;
export const QUIZ_PASS_MARK = serverConfig.whitelist.passScore;

export const whitelistQuestions: WhitelistQuestion[] = [
  { id: "q01", text: "What does RDM mean?", options: ["Randomly killing someone without proper RP reason", "Refusing to surrender during a robbery", "Using a car during a fight", "Returning after death"], correct: 0 },
  { id: "q02", text: "You are stopped by police and have illegal items in your vehicle. What should you do?", options: ["Disconnect before they search", "Continue the traffic stop normally", "Tell them OOC they cannot search", "Delete the items"], correct: 1 },
  { id: "q03", text: "What is Metagaming?", options: ["Using information your character learned in RP", "Using OOC information for an in-character advantage", "Talking to another player in-game", "Changing your character clothes"], correct: 1 },
  { id: "q04", text: "Your friend tells you on Discord that police are waiting outside your gang house. What should you do?", options: ["Warn your gang immediately", "Leave through another exit", "Ignore the information unless your character learns it in RP", "Set up an ambush"], correct: 2 },
  { id: "q05", text: "What is Powergaming?", options: ["Using unrealistic actions or forcing outcomes on other players", "Driving a fast vehicle", "Having more weapons than another player", "Winning multiple fights"], correct: 0 },
  { id: "q06", text: "You crash your vehicle at high speed during a chase. What is the best response?", options: ["Continue if the car still moves", "Roleplay the impact and injuries appropriately", "Spawn another vehicle", "Leave the server"], correct: 1 },
  { id: "q07", text: "What does NLR usually stand for?", options: ["New Life Rule", "No Loot Rule", "New Location Reset", "Normal Life Roleplay"], correct: 0 },
  { id: "q08", text: "You are killed during a gang fight and respawn. What should you avoid?", options: ["Going to a clothing store", "Returning immediately to continue the same fight", "Calling EMS later", "Buying another vehicle"], correct: 1 },
  { id: "q09", text: "What is FailRP?", options: ["Losing a roleplay situation", "Acting unrealistically or ignoring roleplay expectations", "Failing a driving test", "Being arrested"], correct: 1 },
  { id: "q10", text: "A robber has a gun aimed at you from close range. What should you normally do?", options: ["Rush them immediately", "Value your life and react realistically", "Disconnect", "Ignore them"], correct: 1 },
  { id: "q11", text: "What is Combat Logging?", options: ["Logging in during a fight", "Disconnecting to avoid RP consequences", "Using a gun after respawning", "Leaving a gang"], correct: 1 },
  { id: "q12", text: "Police are arresting you and you leave the server. What is this?", options: ["Metagaming", "Combat Logging", "NLR", "VDM"], correct: 1 },
  { id: "q13", text: "What is VDM?", options: ["Using a vehicle as a weapon without proper RP reason", "Driving above the speed limit", "Stealing a vehicle", "Crashing accidentally"], correct: 0 },
  { id: "q14", text: "Someone insults your character during an argument. What should you do?", options: ["Take it personally OOC", "Respond in character unless rules are broken", "Immediately report them", "Disconnect"], correct: 1 },
  { id: "q15", text: "What is FearRP?", options: ["Being scared of another player", "Acting as if your character values their life in dangerous situations", "Avoiding criminal RP", "Leaving when police arrive"], correct: 1 },
  { id: "q16", text: "You are surrounded by three armed gang members while alone. What is the most realistic action?", options: ["Pull a gun immediately", "Assess the situation and avoid unnecessary risk", "Start insulting them", "Run directly at them"], correct: 1 },
  { id: "q17", text: "What is Cop Baiting?", options: ["Talking to police", "Intentionally provoking police just to create a chase or reaction", "Reporting a crime", "Asking police for help"], correct: 1 },
  { id: "q18", text: "You repeatedly do burnouts in front of police to make them chase you. What could this be considered?", options: ["FearRP", "Cop Baiting", "NLR", "Metagaming"], correct: 1 },
  { id: "q19", text: "What is the purpose of /me?", options: ["To describe an action your character performs", "To talk globally", "To contact staff", "To revive yourself"], correct: 0 },
  { id: "q20", text: "Which /me is most appropriate?", options: ["/me instantly knocks him unconscious", "/me slowly reaches toward his jacket pocket", "/me wins the fight", "/me forces him to surrender"], correct: 1 },
  { id: "q21", text: "You know someone's character name because you saw it on their stream. Your character has never met them. What should you do?", options: ["Call them by name", "Pretend your character does not know them", "Follow them secretly", "Ask others OOC who they are"], correct: 1 },
  { id: "q22", text: "What is stream sniping in RP?", options: ["Watching someone's stream after leaving the server", "Using their live stream to gain information or locate them in-game", "Watching RP clips", "Streaming your own gameplay"], correct: 1 },
  { id: "q23", text: "Your vehicle flips during a chase. What should you do?", options: ["Instantly flip it using unrealistic movement", "Treat the crash realistically and continue only if reasonable", "Spawn a new vehicle", "Teleport away"], correct: 1 },
  { id: "q24", text: "What is the best description of good RP?", options: ["Winning every situation", "Creating believable interactions while giving others a fair chance to respond", "Avoiding police at all costs", "Getting rich quickly"], correct: 1 },
  { id: "q25", text: "You think another player broke a rule during an active scene. What should you normally do?", options: ["Stop RP and argue OOC", "Continue the scene if possible and report it afterward", "Kill them", "Spam chat"], correct: 1 },
  { id: "q26", text: "You are handcuffed with your hands behind your back. Which action is unrealistic?", options: ["Talking", "Walking slowly", "Pulling out a rifle and shooting", "Complaining to police"], correct: 2 },
  { id: "q27", text: "What does IC mean?", options: ["In Character", "In Combat", "Internal Chat", "In City"], correct: 0 },
  { id: "q28", text: "You hear information in Discord about a bank robbery happening in-game. Your character has no connection to it. What should you do?", options: ["Go to the bank", "Tell police", "Ignore the information", "Tell your friends in-game"], correct: 2 },
  { id: "q29", text: "What does OOC mean?", options: ["Out of Character", "Out of City", "Officer on Call", "Open Character Communication"], correct: 0 },
  { id: "q30", text: "You are being robbed, but the robber becomes distracted and moves far enough away that escape might realistically be possible. What should you do?", options: ["Always stay still no matter what", "Decide based on whether escape is realistically possible", "Shoot instantly", "Disconnect"], correct: 1 },
];

export const questionById = (id: string) => whitelistQuestions.find((q) => q.id === id);
