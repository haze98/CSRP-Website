/**
 * CSRP City Rulebook — original rules written for Chandra Surya Roleplay.
 * Edit freely: numbers and anchors (#rule-3-2) are generated from order.
 *
 * Punishment levels (shown as an indicator; staff may escalate for repeat
 * or deliberate offences and de-escalate for genuine mistakes):
 *   1 — Verbal warning / coaching
 *   2 — Formal warning, kick or short timeout
 *   3 — Temporary ban
 *   4 — Permanent ban
 */
export type PunishmentLevel = 1 | 2 | 3 | 4;

export const punishmentLevels: Record<PunishmentLevel, { label: string; short: string }> = {
  1: { label: "Verbal warning", short: "L1" },
  2: { label: "Warning / kick", short: "L2" },
  3: { label: "Temporary ban", short: "L3" },
  4: { label: "Permanent ban", short: "L4" },
};

export interface Rule {
  title: string;
  /** Short term players use, e.g. "RDM". Shown as a chip and searchable. */
  term?: string;
  text: string;
  example?: string;
  level?: PunishmentLevel;
}

export interface RuleCategory {
  slug: string;
  title: string;
  summary: string;
  rules: Rule[];
}

export const ruleCategories: RuleCategory[] = [
  {
    slug: "general",
    title: "General Rules",
    summary: "The basics every resident agrees to when they enter the city.",
    rules: [
      { title: "Respect everyone", text: "Treat players and staff with respect out of character. Harassment, hate speech, discrimination or targeted abuse based on religion, caste, ethnicity, gender, sexuality or nationality is never acceptable — in game, in voice or on Discord.", level: 4 },
      { title: "Staff decisions are final in the moment", text: "If a staff member stops a scene or gives an instruction, follow it. If you disagree, finish the scene and open a ticket or ban appeal on the website afterwards — never argue it out in city.", level: 2 },
      { title: "One account, one person", text: "Each player may use one Discord account and one FiveM license. Sharing, selling or lending accounts is not allowed, and ban evasion results in a permanent ban on every linked account.", level: 4 },
      { title: "Exploiting", term: "Exploiting", text: "Using mods, menus, macros, injectors or any third-party software that gives an advantage is forbidden. This includes changing game files to see through walls, remove foliage or alter weapon behaviour.", example: "Running a menu to spawn cash or using a modified texture pack that removes smoke.", level: 4 },
      { title: "Bug abuse", term: "Bug Abuse", text: "If you find a bug — duplication, falling through the map, an inventory glitch — stop and report it with a Bug Report. Knowingly repeating or profiting from a bug is treated like exploiting.", example: "Duplicating items through a storage glitch and selling them.", level: 3 },
      { title: "Trolling", term: "Trolling", text: "Joining the city to annoy, disrupt or provoke people instead of roleplaying is not tolerated. If your goal is to ruin other people's scenes, CSRP isn't the right place for you.", level: 3 },
    ],
  },
  {
    slug: "roleplay",
    title: "Roleplay Rules",
    summary: "How we keep stories believable, fair and fun for both sides.",
    rules: [
      { title: "Stay in character", text: "While in the city you are your character. Out-of-character (OOC) talk should be kept to an absolute minimum and only used when it's genuinely necessary, such as a technical problem.", level: 1 },
      { title: "Meta gaming", term: "Meta Gaming", text: "Using information your character hasn't learned in the city — from streams, Discord, a friend on a call or a previous character — is not allowed. Your character only knows what they have seen, heard or been told in character.", example: "Driving to a robbery location because you saw it on someone's stream.", level: 3 },
      { title: "Power gaming", term: "Power Gaming", text: "Forcing an outcome on another player without giving them a fair chance to respond, or doing things that would be impossible in reality, is power gaming. Give people room to react.", example: "Typing \"/me knocks him out instantly and takes everything\" with no chance to respond.", level: 2 },
      { title: "Fail RP", term: "Fail RP", text: "Actions your character would never realistically do break immersion for everyone. Act as a real person would in the situation, including the injuries, fear and consequences that come with it.", example: "Jumping off a tall building to escape police and running away uninjured.", level: 2 },
      { title: "Fear RP", term: "Fear RP", text: "Value your character's life. If you are outnumbered or have a weapon pointed at you, act afraid and comply where a real person would. Being brave is fine — being suicidal is not.", example: "Pulling a weapon on three armed people who already have you at gunpoint.", level: 2 },
      { title: "OOC abuse", term: "OOC Abuse", text: "Using OOC chat, /report or Discord to insult players, argue about a scene, or pass information in character is not allowed. OOC channels exist for genuine OOC needs only.", level: 2 },
    ],
  },
  {
    slug: "character",
    title: "Character Rules",
    summary: "Who your character is and how they live in the city.",
    rules: [
      { title: "Realistic names", text: "Character names must be believable first and last names. Celebrity names, joke names and names of real public figures are not allowed.", example: "Arjun Thapa is fine; \"Big Boss 420\" is not.", level: 1 },
      { title: "Character age", text: "Characters must be at least 18 years old. Child characters are not allowed under any circumstances.", level: 4 },
      { title: "Backstory and growth", text: "Give your character a background and let it shape their choices. Characters can change over time, but sudden personality swaps without a story reason break immersion.", level: 1 },
      { title: "Multiple characters", text: "If you have more than one character, they must never share money, items, information or relationships. Treat them as complete strangers.", level: 3 },
      { title: "Character death (CK)", text: "Permanent character death requires the owner's consent or staff approval through a ticket. A character may also choose to end their own story.", level: 3 },
    ],
  },
  {
    slug: "criminal",
    title: "Criminal Roleplay",
    summary: "Crime is part of the city — done with purpose and consequences.",
    rules: [
      { title: "Crime needs a story", text: "Criminal activity should have a reason and build roleplay for others. Random crime with no interaction, back-to-back robberies or crime purely for money farming is not allowed.", level: 2 },
      { title: "Minimum police for heists", text: "Robberies and heists need the minimum number of on-duty police shown in game. Do not start a heist when police can't respond.", level: 2 },
      { title: "Hostages", text: "Hostages must be real hostages — friends or members of your own crew can't pose as hostages. Treat them as people, not shields.", level: 2 },
      { title: "Robbing players", text: "You may rob players in character with a valid reason and proper interaction. You can take cash and items but not take items obtained from donor perks or force bank transfers.", level: 2 },
      { title: "Cop baiting", term: "Cop Baiting", text: "Deliberately provoking police for a chase with no story purpose — driving circles around them, crashing into patrol cars, insulting them to start a pursuit — is cop baiting.", example: "Doing donuts in front of the station until someone chases you.", level: 2 },
      { title: "Scamming limits", text: "In-character scams are allowed within reason. Scamming people of real money, account items or anything outside the city is a permanent ban.", level: 4 },
    ],
  },
  {
    slug: "gangs",
    title: "Gang Rules",
    summary: "Organisations bring structure — and responsibility.",
    rules: [
      { title: "Registered gangs", text: "Gangs must be registered with staff through a ticket before claiming territory. Each gang has a member cap set by staff to keep conflicts fair.", level: 1 },
      { title: "Group size in conflicts", text: "No more than the gang member cap may take part in a single conflict or turf scene. Calling in friends from other groups to win a fight is not allowed.", level: 2 },
      { title: "Wars need approval", text: "Large-scale gang wars must be requested through staff. Approved wars have rules, a time frame and clear win/lose conditions.", level: 2 },
      { title: "Territory and civilians", text: "Territory gives you influence, not ownership of the public. Civilians who pass through are not automatic targets.", level: 2 },
    ],
  },
  {
    slug: "lspd-ems",
    title: "LSPD / EMS Interaction",
    summary: "Respect the people who keep the city running.",
    rules: [
      { title: "EMS are neutral", text: "Medics are not to be robbed, kidnapped or targeted while on duty unless a staff-approved storyline allows it. Let them do their job.", level: 2 },
      { title: "No targeting off-duty", text: "You can't target police or medics outside work just because of their job. Personal conflicts with their characters must be roleplayed like any other.", level: 2 },
      { title: "Respect the arrest", text: "Once you are cuffed and in custody, play it out: interviews, charges, jail time. Leaving, refusing to engage or teleporting out is Fail RP.", level: 2 },
      { title: "Police conduct", text: "Officers must follow the LSPD handbook: use force proportionately, read rights where appropriate and never abuse the badge for personal gain.", level: 3 },
    ],
  },
  {
    slug: "vehicles",
    title: "Vehicle Rules",
    summary: "Drive like the city is real — because for your character, it is.",
    rules: [
      { title: "Vehicle deathmatch", term: "VDM", text: "Using a vehicle as a weapon to injure or kill people without proper roleplay or reason is VDM. Vehicles are for transport and chases, not ramming.", example: "Driving into a group of people at a garage because you were bored.", level: 3 },
      { title: "Realistic driving", text: "Drive within your car's limits. Supercars don't belong off-road, and jumps that would wreck a real vehicle should be roleplayed as damage.", level: 1 },
      { title: "Chases", text: "During a police chase, crashes have consequences. If you wreck your car, roleplay injuries and vehicle damage before continuing on foot.", level: 2 },
      { title: "Aircraft and boats", text: "Aircraft and boats require the right licence in game and a story reason to use them. Don't use helicopters to avoid normal roleplay.", level: 2 },
    ],
  },
  {
    slug: "communication",
    title: "Communication Rules",
    summary: "Voice, radios and phones — use them in character.",
    rules: [
      { title: "Voice chat required", text: "A working microphone is required. Typing-only roleplay is allowed only for characters with a staff-approved reason such as being mute.", level: 1 },
      { title: "Radio and phone only in character", text: "Communicate with other characters using in-game radio and phones. Using Discord calls to share in-character information during a scene is meta gaming.", level: 3 },
      { title: "Language", text: "Nepali, English and Hindi are welcome. Keep it understandable for the people in your scene, and avoid excessive slurs or OOC insults.", level: 1 },
      { title: "Mic spam", text: "Playing music, soundboards or loud noise through your microphone is not allowed unless it's part of a staff-approved event.", level: 1 },
    ],
  },
  {
    slug: "safe-zones",
    title: "Safe Zones",
    summary: "Places where nobody starts conflict.",
    rules: [
      { title: "Listed safe zones", text: "Hospitals, the city hall, the main police station lobby and the job centre are safe zones. No crimes, threats or hostile actions may start inside them.", level: 2 },
      { title: "No hiding in safe zones", text: "You can't run into a safe zone to escape an ongoing scene. Conflicts that began outside continue when you leave, and police may still arrest you inside.", level: 2 },
      { title: "Respect events", text: "Staff events (festivals, races, community gatherings) are temporary safe zones unless the event says otherwise.", level: 1 },
    ],
  },
  {
    slug: "new-life",
    title: "New Life Rule",
    summary: "What happens after your character goes down.",
    rules: [
      { title: "New life rule", term: "New Life Rule", text: "If you are downed and respawn at the hospital (not revived by EMS), your character forgets the events leading to their death. You cannot seek revenge or return to the scene for that situation.", example: "You're shot during a deal, respawn, then drive back to fight the same people — that breaks NLR.", level: 2 },
      { title: "Return timer", text: "After a respawn you may not return to the area of your death for at least 15 minutes, even for unrelated reasons.", level: 2 },
      { title: "Revived by EMS", text: "If EMS revive you, you remember what happened up to the moment you were downed, but you're injured — roleplay it.", level: 1 },
    ],
  },
  {
    slug: "combat",
    title: "Combat Rules",
    summary: "Violence must start from roleplay — never instead of it.",
    rules: [
      { title: "Random deathmatch", term: "RDM", text: "Attacking or killing another player without a valid in-character reason and clear interaction first is RDM. There must be a build-up the other person could respond to.", example: "Shooting someone at the gas station because they looked at you.", level: 3 },
      { title: "Clear initiation", text: "Before violence, make your intentions clear with voice: a demand, a threat, or an obvious hostile escalation. A single word isn't enough — give people a fair chance to comply.", level: 2 },
      { title: "Combat logging", term: "Combat Logging", text: "Leaving the server, going AFK or reconnecting to escape a scene, arrest or death is combat logging. If you crash, rejoin and tell the people involved immediately.", level: 3 },
      { title: "No third-partying", text: "Joining a fight you weren't part of, with no link to either side, is not allowed. Find your own story instead of crashing someone else's.", level: 2 },
      { title: "Revenge killing", text: "Once a situation has ended, you can't kill someone just to get even. Escalate through roleplay instead.", level: 2 },
    ],
  },
  {
    slug: "streaming",
    title: "Streaming Rules",
    summary: "Creators are welcome — fairness comes first.",
    rules: [
      { title: "Stream sniping", term: "Stream Sniping", text: "Watching a live stream to find, follow or interfere with a player in the city is forbidden and treated as severe meta gaming.", level: 4 },
      { title: "Stream delay for heists", text: "Creators streaming criminal activity are encouraged to use a stream delay of at least two minutes to protect their own scenes.", level: 1 },
      { title: "Represent the city", text: "Clips and streams should not misrepresent CSRP or its players. Don't stage rule breaks for content.", level: 2 },
      { title: "No OOC drama on stream", text: "Arguing with staff, exposing tickets or naming players OOC to your audience is not allowed. Use the Support Center instead.", level: 2 },
    ],
  },
];

/** Flat list with generated numbers + anchors. */
export const allRules = ruleCategories.flatMap((c, ci) =>
  c.rules.map((r, ri) => ({ ...r, number: `${ci + 1}.${ri + 1}`, anchor: `rule-${ci + 1}-${ri + 1}`, category: c.slug, categoryTitle: c.title })),
);

export type NumberedRule = (typeof allRules)[number];
