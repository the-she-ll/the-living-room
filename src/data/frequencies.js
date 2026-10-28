/**
 * The five "memory frequencies" hidden in the painting.
 *
 * NFC tags / QR codes should point at:  https://<your-domain>/?frequency=<id>
 * (`?unlock=<id>` works too.)
 *
 * Everything marked PLACEHOLDER is draft copy meant to be replaced by the
 * artist's final research, licensed archival images and recorded audio.
 */

export const FREQUENCY_ORDER = ['portraits', 'chair', 'table', 'turntable', 'phone'];

export const FREQUENCIES = {
  portraits: {
    id: 'portraits',
    band: '88.1',
    title: 'The Living Pantheon',
    subtitle: 'Notable Figures',
    color: '#9C6B12',
    stem: 'pad',
    stemLabel: 'Warm Organ Pad',
    interactive: 'pantheon',
    interactiveLabel: 'Flip Through the Pantheon',
    clue:
      'Look up to the cedar wall, where brass frames keep watch. The faces there were hung on purpose: proof, in every room, that greatness lived in the family tree.',
    archive: [
      'In many Black homes of the 1960s and 1970s, the living room wall worked like a private museum. Graduation portraits and wedding photos hung beside framed images of Dr. Martin Luther King Jr., John F. Kennedy and Robert Kennedy. That trio was so common it became a recognizable feature of the era. The wall was curated with as much care as any gallery.',
      'Those walls answered a public culture that rarely showed Black people with dignity. Mainstream newspapers, textbooks and television often left Black achievement out or distorted it. Putting thinkers, artists and leaders next to grandparents and graduates made a claim: this lineage is ours, and it is distinguished.',
      'For children growing up in those rooms, the portrait wall was an early lesson in self-representation. It taught them who was worth remembering, and that they belonged in that company.',
    ],
    photoCaption: 'Portrait wall, family collection (archival image placeholder)',
    reflection: 'Whose face hung on the wall in your family home, and what did it teach you without saying a word?',
  },

  chair: {
    id: 'chair',
    band: '93.5',
    title: 'The Front Room Strategy',
    subtitle: 'Domestic Gatherings',
    color: '#4F5D2F',
    stem: 'drums',
    stemLabel: 'Pocket Drums',
    interactive: 'frontroom',
    interactiveLabel: 'Open the Meeting Notes',
    clue:
      'Find the seat that was too good to sit on and too important to leave empty. Plastic on velvet, gold shag underfoot: plans were made here before they were made public.',
    archive: [
      'The front room was often the best-kept room in the house, saved for company, holidays and serious business. Behind closed doors it also became a working space. Church committees, civic clubs, sororities and neighborhood associations met on living room sofas, and many local campaigns of the civil rights era were planned in private homes before they became public actions.',
      'Hospitality was a strategy in itself. Hosts fed organizers, gave traveling activists a place to sleep, and offered a safe place to talk when public buildings were closed to them or under watch. Earlier traditions carried on too. Rent parties, which began in the 1920s, let neighbors pool money with music and food, and salon-style evenings let writers, artists and students argue over ideas.',
      'Plastic slipcovers, polished tables and shag rugs said something too. They showed that a family took care of what it had worked hard to own. In a society that denied Black families housing, credit and respect, a well-kept front room was pride you could see, and a sanctuary where people could rest and plan.',
    ],
    photoCaption: 'Living room gathering (archival image placeholder)',
    reflection: 'What conversations happened in your family’s front room that never made it outside?',
  },

  table: {
    id: 'table',
    band: '97.9',
    title: 'The Coffee Table Pulpit',
    subtitle: 'Jet & Essence',
    color: '#8A3319',
    stem: 'shaker',
    stemLabel: 'Page-Turn Shaker',
    interactive: 'magazines',
    interactiveLabel: 'Flip the Magazine Stack',
    clue:
      'Low and wide, the table preached on Sundays without saying a word. Glossy covers stacked like hymnals. Read what the morning paper wouldn’t print.',
    archive: [
      'John H. Johnson founded Johnson Publishing Company in Chicago. Ebony launched in 1945 and the pocket-sized weekly Jet followed in 1951. Jet became famous as a source of news that white-owned papers ignored. In 1955 it published photographs of Emmett Till’s open casket, which his mother Mamie Till-Mobley chose to show, and those images pushed millions toward the civil rights movement.',
      'Essence launched in May 1970 as a magazine for Black women. It covered beauty, fashion, careers, politics and family life with Black women at the center, years before mainstream fashion magazines regularly featured them.',
      'Displayed on the coffee table, these magazines were more than reading material. They were an archive, a conversation starter for guests, and proof of a thriving Black public sphere. Many families kept back issues for decades.',
    ],
    photoCaption: 'Coffee table still life (archival image placeholder)',
    reflection: 'What did your family keep on the coffee table, and what did it say about who you were?',
  },

  turntable: {
    id: 'turntable',
    band: '101.3',
    title: 'The Rhythm & Sanctuary',
    subtitle: 'Parliament-Funkadelic & Soul',
    color: '#1A535C',
    stem: 'bass',
    stemLabel: 'Funk Bassline',
    interactive: 'vinyl',
    interactiveLabel: 'Drop the Needle',
    clue:
      'The console hums along the wall, a wooden altar with a spinning heart. Lift the lid. The sermon here comes in at 33⅓.',
    archive: [
      'The stereo console was often the most expensive piece of furniture in the living room, and the record collection was a family treasure. Saturday cleaning, Sunday dinners and holiday gatherings all ran on records, from gospel and Motown to Stax, Philly soul and jazz.',
      'In the 1970s, George Clinton’s Parliament-Funkadelic built an Afrofuturist world on albums like "Mothership Connection" (1975) and "One Nation Under a Groove" (1978). P-Funk imagined Black people in space, in charge and free, while cities around the country faced disinvestment, redlining and police violence.',
      'Music in the living room was spiritual armor and community therapy. Dancing in your own home, to your own records, with your own people, was a kind of sanctuary that no outside force could take away.',
    ],
    photoCaption: 'Console stereo & record crate (archival image placeholder)',
    reflection: 'Which record always meant it was Sunday at your house?',
  },

  phone: {
    id: 'phone',
    band: '106.7',
    title: 'The Porch Lifeline',
    subtitle: 'Rotary Telephone',
    color: '#B4502C',
    stem: 'keys',
    stemLabel: 'Electric Piano',
    interactive: 'rotary',
    interactiveLabel: 'Dial an Oral History',
    clue:
      'Follow the curly cord to the family’s switchboard. One ring meant news, two rings meant hurry, and the whole block heard before supper.',
    archive: [
      'For many families the telephone lived in a central spot, on a hallway table or the living room wall, with a long cord that stretched toward privacy. Before home phones were everywhere, households shared party lines and borrowed neighbors’ phones. Long-distance calls to relatives down South were planned, timed and treasured.',
      'Phone trees helped communities act. During the 1955–56 Montgomery bus boycott, organizers used phone calls and a dispatch system to run carpools for thousands of riders. Churches, block clubs and family networks relied on the same chains of calls to share news, set up care for the sick and raise money.',
      'The phone also kept oral tradition alive. Elders passed down stories, recipes, warnings and blessings by voice. The "grapevine" could be gossip, but it was also an information network that held communities together.',
    ],
    photoCaption: 'Rotary telephone on side table (archival image placeholder)',
    reflection: 'Whose voice did you always hope was on the other end of the line?',
  },
};

/* ------------------------------------------------------------------ */
/*  Interactive content                                                */
/* ------------------------------------------------------------------ */

/**
 * PLACEHOLDER pantheon. The artist will finalize this list. Quotes below are
 * well-documented public statements; `audioSrc` is empty until licensed
 * speech recordings are added to /public/audio/pantheon/.
 */
export const PANTHEON = [
  {
    name: 'James Baldwin',
    years: '1924–1987',
    role: 'Novelist · Essayist · Witness',
    quote:
      'Not everything that is faced can be changed, but nothing can be changed until it is faced.',
    source: 'The New York Times Book Review, 1962',
    bio: 'Baldwin’s essays, including The Fire Next Time (1963), turned private grief and public injustice into prose that still reads like prophecy.',
    audioSrc: '',
  },
  {
    name: 'Nina Simone',
    years: '1933–2003',
    role: 'Pianist · Singer · Activist',
    quote: 'An artist’s duty, as far as I’m concerned, is to reflect the times.',
    source: 'Interview, c. 1969',
    bio: 'A classically trained pianist, Simone wrote protest anthems like "Mississippi Goddam" and "To Be Young, Gifted and Black."',
    audioSrc: '',
  },
  {
    name: 'Fannie Lou Hamer',
    years: '1917–1977',
    role: 'Organizer · Voting Rights Leader',
    quote: 'I’m sick and tired of being sick and tired.',
    source: 'Speech, 1964',
    bio: 'A sharecropper turned organizer, Hamer co-founded the Mississippi Freedom Democratic Party and testified before the 1964 Democratic National Convention.',
    audioSrc: '',
  },
  {
    name: 'Shirley Chisholm',
    years: '1924–2005',
    role: 'Congresswoman · Presidential Candidate',
    quote: 'Unbought and Unbossed.',
    source: 'Campaign slogan, 1968',
    bio: 'In 1968 she became the first Black woman elected to the U.S. Congress. In 1972 she became the first Black candidate to seek a major party’s presidential nomination.',
    audioSrc: '',
  },
];

/** PLACEHOLDER meeting notes. Swap in documented gatherings & archival photos. */
export const FRONT_ROOM_NOTES = [
  {
    kind: 'Strategy Meeting',
    when: 'Weeknight, after supper',
    note: 'Folding chairs brought in from the church basement. Coffee on the stove. Agenda: voter registration drive, who drives, who watches the kids.',
    tag: 'Civil Rights',
  },
  {
    kind: 'Rent Party',
    when: 'Saturday, late',
    note: 'A quarter at the door, fried fish in the kitchen, records stacked on the console. By morning, the rent is covered and nobody is ashamed.',
    tag: 'Mutual Aid',
  },
  {
    kind: 'Sunday Salon',
    when: 'After service',
    note: 'The college kids home for the weekend argue with the deacons about Black Power. Grandmother listens from the good chair and says the last word.',
    tag: 'Ideas',
  },
  {
    kind: 'Care Circle',
    when: 'Whenever needed',
    note: 'A list on the back of an envelope: who brings meals to Sister Ruth, who sits with her Thursdays, who calls the doctor. Nobody is forgotten.',
    tag: 'Community Care',
  },
];

/**
 * Illustrative magazine recreations. These are NOT reproductions of real
 * covers. Add licensed scans via `image` (e.g. 'images/covers/jet-1971.jpg').
 */
export const MAGAZINES = [
  { masthead: 'JET', issue: 'Weekly · 1971', headline: 'The News Our Papers Wouldn’t Print', bg: '#8A3319', accent: '#F2E6CC', image: '' },
  { masthead: 'ESSENCE', issue: 'Monthly · 1972', headline: 'Beauty on Our Own Terms', bg: '#1A535C', accent: '#D49B24', image: '' },
  { masthead: 'JET', issue: 'Weekly · 1974', headline: 'Hometown Graduates Make History', bg: '#D49B24', accent: '#2E1C14', image: '' },
  { masthead: 'ESSENCE', issue: 'Monthly · 1976', headline: 'Sisters Building Business', bg: '#4F5D2F', accent: '#F2E6CC', image: '' },
];

/** Liner-notes tracklist for the vinyl interactive (synth stand-ins). */
export const LINER_NOTES = [
  { side: 'A1', title: 'Sunday Pocket', note: 'Synth bassline stand-in. Replace with licensed audio or the exhibition’s commissioned stems.' },
  { side: 'A2', title: 'Mothership Living Room', note: 'A nod to P-Funk’s Afrofuturism: the living room as a launch pad.' },
  { side: 'B1', title: 'Console Altar', note: 'The stereo as furniture, heirloom and pulpit.' },
];

/**
 * PLACEHOLDER oral-history "voicemails". These are illustrative composites,
 * not recorded testimony. Replace with oral histories collected for the
 * exhibition (with consent) and set `audioSrc`.
 */
export const VOICEMAILS = [
  { digit: 1, caller: 'Aunt on the long-distance line', duration: '0:42', transcript: '“Baby, tell your mama the bus gets in Tuesday. I’m bringing the pound cake. Don’t let your daddy eat it before I get there.”', audioSrc: '' },
  { digit: 2, caller: 'Church phone tree', duration: '0:31', transcript: '“Sister Johnson’s back in the hospital. Pass it down the list: meals Monday through Thursday, and prayer circle at seven.”', audioSrc: '' },
  { digit: 3, caller: 'Neighbor across the street', duration: '0:19', transcript: '“Your boy’s out here after the streetlights, and I already called his grandmother, so he knows.”', audioSrc: '' },
  { digit: 4, caller: 'Grandfather, Sunday evening', duration: '0:55', transcript: '“When I came up from Alabama I had one suitcase and a phone number on a scrap of paper. That number was family before I ever met them.”', audioSrc: '' },
  { digit: 5, caller: 'Block club captain', duration: '0:27', transcript: '“Meeting moved to the Wilsons’ front room. Bring a folding chair. And tell everybody: we register voters Saturday.”', audioSrc: '' },
];
