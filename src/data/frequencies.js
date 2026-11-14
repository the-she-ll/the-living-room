/**
 * The four "memory frequencies" hidden in the painting.
 *
 * NFC tags / QR codes should point at:  https://<your-domain>/?frequency=<id>
 * (`?unlock=<id>` works too.)
 *
 * Everything marked PLACEHOLDER is draft copy meant to be replaced by the
 * artist's final research, licensed archival images and recorded audio.
 */

export const FREQUENCY_ORDER = ['portraits', 'table', 'turntable', 'phone'];

export const FREQUENCIES = {
  portraits: {
    id: 'portraits',
    band: '88.1',
    title: 'Portraits of Power',
    subtitle: 'Voices That Changed the World',
    color: '#9C6B12',
    stems: ['pad'],
    stemLabel: 'Warm Organ Pad',
    interactive: 'pantheon',
    interactiveLabel: 'Meet the Trailblazers',
    clue:
      'Look up to the cedar wall, where brass frames keep watch. The faces there were hung on purpose: proof, in every room, that greatness lived in the family tree.',
    archive: [
      'In many Black homes of the 1960s and 1970s, the living room wall worked like a private museum. Graduation portraits and wedding photos hung beside framed images of Dr. Martin Luther King Jr., John F. Kennedy and Robert Kennedy. That trio was so common it became a recognizable feature of the era. The wall was curated with as much care as any gallery.',
      'Those walls answered a public culture that rarely showed Black people with dignity. Mainstream newspapers, textbooks and television often left Black achievement out or distorted it. Putting thinkers, artists and leaders next to grandparents and graduates made a claim: this lineage is ours, and it is distinguished.',
      'For children growing up in those rooms, the portrait wall was an early lesson in self-representation. It taught them who was worth remembering, and that they belonged in that company.',
    ],
    photo: 'images/frequencies/portraits.jpg',
    photoCaption: 'A visitor studies a painted gallery of Black leaders at an art exhibition in the 1970s.',
    photoCredit: 'U.S. National Archives, DOCUMERICA project (U.S. Environmental Protection Agency), NAID 556261. Public domain. Sepia tone added.',
    photoSourceUrl: 'https://catalog.archives.gov/id/556261',
    reflection: 'Whose face hung on the wall in your family home, and what did it teach you without saying a word?',
  },

  table: {
    id: 'table',
    band: '97.9',
    title: 'The People’s Press',
    subtitle: 'Black Magazines That Told Our Story',
    color: '#8A3319',
    stems: ['shaker'],
    stemLabel: 'Page-Turn Shaker',
    interactive: 'magazines',
    interactiveLabel: 'Flip the Magazine Stack',
    clue:
      'Low and wide, the table preached on Sundays without saying a word. Glossy covers stacked like hymnals. Read what the morning paper wouldn’t print.',
    archive: [
      'John H. Johnson founded Johnson Publishing Company in Chicago. Ebony launched in 1945 and the pocket-sized weekly Jet followed in 1951. Jet became famous as a source of news that white-owned papers ignored. In 1955 it published photographs of Emmett Till’s open casket, which his mother Mamie Till-Mobley chose to show, and those images pushed millions toward the civil rights movement.',
      'They shared the table with other titles. Ebony (1945) celebrated Black achievement in glossy photo essays. Black Enterprise, founded by Earl G. Graves in 1970, covered Black business, careers and wealth-building. Black World, called Negro Digest until 1970, published the essays, poetry and criticism of the Black Arts Movement until it closed in 1976.',
      'Displayed on the coffee table, these magazines were more than reading material. They were an archive, a conversation starter for guests, and proof of a thriving Black public sphere. Many families kept back issues for decades.',
    ],
    photo: 'images/frequencies/table.jpg',
    photoCaption: 'Vintage issues of Ebony, Jet, Time, Life and more, spread across a table.',
    photoCredit: 'Photo via The Fayetteville Observer, February 18, 2017 (Myron B. Pitts column). Sepia tone added.',
    photoSourceUrl: 'https://www.fayobserver.com/story/opinion/columns/more-voices/2017/02/18/myron-b-pitts-box-old/22085575007/',
    reflection: 'What did your family keep on the coffee table, and what did it say about who you were?',
  },

  turntable: {
    id: 'turntable',
    band: '101.3',
    title: 'The Rhythm & Sanctuary',
    subtitle: 'Parliament-Funkadelic & Soul',
    color: '#1A535C',
    stems: ['bass', 'drums'],
    stemLabel: 'Funk Bass & Drums',
    interactive: 'vinyl',
    interactiveLabel: 'Drop the Needle',
    clue:
      'The console hums along the wall, a wooden altar with a spinning heart. Lift the lid. The sermon here comes in at 33⅓.',
    archive: [
      'The stereo console was often the most expensive piece of furniture in the living room, and the record collection was a family treasure. Saturday cleaning, Sunday dinners and holiday gatherings all ran on records, from gospel and Motown to Stax, Philly soul and jazz.',
      'In the 1970s, George Clinton’s Parliament-Funkadelic built an Afrofuturist world on albums like "Mothership Connection" (1975) and "One Nation Under a Groove" (1978). P-Funk imagined Black people in space, in charge and free, while cities around the country faced disinvestment, redlining and police violence.',
      'Music in the living room was spiritual armor and community therapy. Dancing in your own home, to your own records, with your own people, was a kind of sanctuary that no outside force could take away.',
    ],
    photo: 'images/frequencies/turntable.jpg',
    photoCaption: 'Dancers fill the floor as Erskine Hawkins’s band plays, the same joy families carried home on records.',
    photoCredit: 'Photograph attributed to William P. Gottlieb (William P. Gottlieb Collection, Library of Congress). Via Rosie Lesso, “What Was the Harlem Renaissance?”, TheCollector.com, January 25, 2023. Sepia tone added.',
    photoSourceUrl: 'https://www.thecollector.com/rosielesso/',
    reflection: 'Which record always meant it was Sunday at your house?',
  },

  phone: {
    id: 'phone',
    band: '106.7',
    title: 'The Porch Lifeline',
    subtitle: 'Rotary Telephone',
    color: '#B4502C',
    stems: ['keys'],
    stemLabel: 'Electric Piano',
    interactive: 'rotary',
    interactiveLabel: 'Dial Into My Archive',
    clue:
      'Follow the curly cord to the family’s switchboard. One ring meant news, two rings meant hurry, and the whole block heard before supper.',
    archive: [
      'For many families the telephone lived in a central spot, on a hallway table or the living room wall, with a long cord that stretched toward privacy. Before home phones were everywhere, households shared party lines and borrowed neighbors’ phones. Long-distance calls to relatives down South were planned, timed and treasured.',
      'Phone trees helped communities act. During the 1955–56 Montgomery bus boycott, organizers used phone calls and a dispatch system to run carpools for thousands of riders. Churches, block clubs and family networks relied on the same chains of calls to share news, set up care for the sick and raise money.',
      'The phone also kept oral tradition alive. Elders passed down stories, recipes, warnings and blessings by voice. The "grapevine" could be gossip, but it was also an information network that held communities together.',
    ],
    photo: 'images/frequencies/phone.jpg',
    photoCaption: 'The rotary dial: every call home began with a finger in the hole and a slow spin back.',
    photoCredit: 'Photo by R Sull (Dhscommtech), own work, via Wikimedia Commons (Wikipedia article “Rotary dial”). Sepia tone added.',
    photoSourceUrl: 'https://en.wikipedia.org/wiki/Rotary_dial',
    reflection: 'Whose voice did you always hope was on the other end of the line?',
  },
};

/* ------------------------------------------------------------------ */
/*  Interactive content                                                */
/* ------------------------------------------------------------------ */

/**
 * Portraits of Power: four trailblazers. Shown in the portrait AR overlay
 * (flipping over the painted portrait) and in the web gallery.
 *
 * - `image`: in public/images/pantheon/. Leave '' to show "portrait coming soon".
 * - `audioSrc`: a licensed clip (e.g. 'audio/pantheon/angela-davis.mp3').
 *   Until one is licensed, `listenUrl` opens the archive's own page instead.
 * - Quotes are kept short and cited.
 */
export const PANTHEON = [
  {
    name: 'Angela Davis',
    years: 'b. 1944',
    role: 'Philosopher · Activist · Author',
    quote: 'Radical simply means ‘grasping things at the root.’',
    source: 'Women, Culture & Politics, 1989',
    bio: 'Davis grew up in Birmingham, Alabama, on a street nicknamed “Dynamite Hill” for the bombings aimed at Black families’ homes. Her mother, an activist, welcomed organizers into the family living room, where Davis first heard the conversations that shaped her. Jailed in 1970 and acquitted in 1972 after an international campaign to free her (this poster is from that campaign), she went on to teach for decades and lead the movement to end mass incarceration.',
    image: 'images/pantheon/angela-davis.jpg',
    imageCredit: '“Free Angela Davis Now!” poster, New York Committee to Free Angela Davis, c. 1971. Library of Congress, Prints & Photographs Division, Yanker Poster Collection.',
    imageLicense: { label: 'No known restrictions on publication', url: 'https://www.loc.gov/rr/print/res/250_yank.html' },
    audioSrc: '',
    listenUrl: 'https://folkways.si.edu/angela-davis-speaks/african-american-spoken-american-history/music/album/smithsonian',
    listenLabel: 'Angela Davis Speaks (1971), Smithsonian Folkways',
  },
  {
    name: 'Huey P. Newton',
    years: '1942–1989',
    role: 'Co-founder, Black Panther Party',
    quote: 'We want freedom. We want power to determine the destiny of our Black Community.',
    source: 'Black Panther Party Ten-Point Program, 1966',
    bio: 'In 1966 Newton and Bobby Seale founded the Black Panther Party for Self-Defense in Oakland. The Party built its power in close-knit neighborhood spaces: its Free Breakfast for Children program began in 1969 in the basement of St. Augustine’s Episcopal Church, feeding kids before school, and free health clinics followed. Newton later earned a PhD from UC Santa Cruz.',
    image: 'images/pantheon/huey-p-newton.jpg',
    imageCredit: 'Huey P. Newton poster, photograph attributed to Blair Stapp, c. 1967. Library of Congress, Prints & Photographs Division, Yanker Poster Collection. Scan margins (ruler and color chart) trimmed.',
    imageLicense: { label: 'No known restrictions on publication', url: 'https://www.loc.gov/rr/print/res/250_yank.html' },
    audioSrc: '',
    listenUrl: 'https://americanarchive.org/catalog/cpb-aacip_151-3b5w669n9c',
    listenLabel: 'Interview for Eyes on the Prize, American Archive of Public Broadcasting',
  },
  {
    name: 'Langston Hughes',
    years: '1901–1967',
    role: 'Poet · Novelist · Playwright',
    quote: 'Hold fast to dreams / For if dreams die…',
    source: '“Dreams,” 1923',
    bio: 'A leading voice of the Harlem Renaissance, Hughes found his community in Harlem’s homes. He was a regular at rent parties, where neighbors packed apartments with music and food to cover the rent, and at A’Lelia Walker’s “Dark Tower” salon in her Harlem townhouse, gatherings he later described in his autobiography, The Big Sea. He wrote poems, novels and plays about everyday Black life in the rhythms of jazz and the blues.',
    image: 'images/pantheon/langston-hughes.jpg',
    imageCredit: 'Langston Hughes, c. 1943. Library of Congress, Prints & Photographs Division, FSA/OWI Collection. Cropped.',
    imageLicense: { label: 'No known restrictions', url: 'https://www.loc.gov/rr/print/res/071_fsab.html' },
    audioSrc: '',
    listenUrl: 'https://folkways.si.edu/langston-hughes/the-voice-of/african-american-spoken-poetry/album/smithsonian',
    listenLabel: 'The Voice of Langston Hughes, Smithsonian Folkways',
  },
  {
    name: 'Octavia E. Butler',
    years: '1947–2006',
    role: 'Science Fiction Writer',
    quote: 'All that you touch / You Change.',
    source: 'Parable of the Sower, 1993',
    bio: 'Raised in Pasadena by her mother and grandmother, Butler fell in love with reading at home: her mother, who worked as a housekeeper, brought home books her employers threw away. She went on to put Black women at the center of science fiction with Kindred (1979) and Parable of the Sower (1993), and in 1995 became the first science fiction writer to receive a MacArthur “genius” grant.',
    image: 'images/pantheon/octavia-butler.jpg',
    // CC BY 2.5 requires: author, link to the license, and whether it was changed.
    imageCredit: 'Octavia E. Butler, 2005. Photo by Nikolas Coukouma, via Wikimedia Commons. No changes made.',
    imageLicense: { label: 'CC BY 2.5', url: 'https://creativecommons.org/licenses/by/2.5/' },
    audioSrc: '',
    listenUrl: 'https://kpfa.org/area941/episode/octavia-butler-1983/',
    listenLabel: '1983 interview, KPFA Radio',
  },
];

/**
 * Coffee-table magazine stack: shown in the web flip viewer AND the AR lens.
 * Each cover turns over to reveal that issue's story on the back.
 *
 * To add a real cover:
 *   1. Save the scan as public/images/covers/<file>.jpg (portrait, ~800px wide).
 *   2. Fill in the entry: `image`, `date`, `coverLine`, `story`, `credit`, and
 *      `sourceUrl` (where the scan came from, e.g. its Google Books page).
 * Optional inside page: `insideImage` (one photo cropped from the article,
 * not a full text page), `insideCaption` (your own words) and `insideCredit`
 * (photographer, if printed).
 * Entries without an `image` show a plain "cover coming soon" page, never a
 * drawing. Add as many issues per title as you like (duplicate an entry); 5–10 total
 * keeps the AR flip-through snappy.
 */
export const MAGAZINES = [
  {
    masthead: 'JET',
    date: 'February 10, 1972',
    coverLine: 'Shirley Chisholm Kicks Off Campaign for U.S. President',
    story: 'Congresswoman Shirley Chisholm of Brooklyn made the cover weeks after launching her run for the 1972 Democratic presidential nomination. Already the first Black woman elected to Congress (1968), she became the first Black candidate and the first woman to seek the Democratic nomination for president. On a family’s coffee table, her face made a Black woman in the White House feel possible.',
    image: 'images/covers/jet-1972-02-10.jpg',
    credit: 'Jet, February 10, 1972, Johnson Publishing Company. Cover scan via Google Books',
    sourceUrl: 'https://books.google.com/books?id=xlsDAAAAMBAJ&printsec=frontcover',
    insideImage: 'images/covers/jet-1972-02-10-inside.jpg',
    insideCaption: 'Chisholm on the campaign trail in early 1972, the year she ran for president.',
    insideCredit: 'Jet, February 10, 1972, p. 12',
  },
  {
    masthead: 'EBONY',
    date: 'August 1970',
    coverLine: 'Which Way Black America?',
    story: 'Separation, integration or liberation? This special issue gave the question to writers who disagreed: Roy Wilkins argued for integration, Jesse Jackson and psychiatrist Alvin Poussaint debated separatism, and Lerone Bennett Jr. traced racial division back to colonial America. Publisher John H. Johnson saw “a stronger unity among blacks today than at any other time in history.”',
    image: 'images/covers/ebony-1970-08.jpg',
    credit: 'Ebony, August 1970, Johnson Publishing Company. Cover art by Herbert Temple. Cover scan via Google Books',
    sourceUrl: 'https://books.google.com/books?id=QrBv5xmgHfMC&printsec=frontcover',
    insideImage: 'images/covers/ebony-1970-08-inside.jpg',
    insideCaption: 'Graduates at Howard University’s commencement, some wearing African dress, reflect the issue’s debate over identity and belonging.',
    insideCredit: 'Ebony, August 1970, p. 40',
  },
  {
    masthead: 'BLACK ENTERPRISE',
    date: 'June 1977',
    coverLine: 'The Nation’s Leading Black Businesses',
    story: 'Since 1973, Black Enterprise has ranked the largest Black-owned companies in America, a public scoreboard for Black economic power. This fifth annual list was led by Berry Gordy’s Motown Industries, followed by Johnson Publishing, the company behind Jet and Ebony. Record labels, supermarkets, construction firms and car dealerships filled the list, proof that Black business was building wealth in every corner of the economy.',
    image: 'images/covers/black-enterprise-1977-06.jpg',
    credit: 'Black Enterprise, June 1977, Earl G. Graves Ltd. Cover scan via Google Books',
    sourceUrl: 'https://books.google.com/books?id=LQV8M0QkalAC&pg=PA61',
    insideImage: 'images/covers/black-enterprise-1977-06-inside.jpg',
    insideCaption: 'The illustration that opened the 1977 Top 100 list.',
    insideCredit: 'Black Enterprise, June 1977, p. 63',
  },
  {
    masthead: 'BLACK WORLD',
    date: 'November 1973',
    coverLine: 'Special Issue: Black Music',
    story: 'Black World, the Johnson magazine once called Negro Digest, devoted this special issue to Black music and dedicated it to Duke Ellington. Musicians and scholars wrote the pages themselves, including drummer Max Roach, saxophonists Archie Shepp and Marion Brown, and historian Eileen Southern. Special issues like this one helped readers see Black music as an art form with its own history, thinkers and traditions.',
    image: 'images/covers/black-world-1973-11.jpg',
    credit: 'Black World, November 1973, Johnson Publishing Company. Cover art signed Culverson Blair. Cover scan via Google Books',
    sourceUrl: 'https://books.google.com/books?id=TjoDAAAAMBAJ&printsec=frontcover',
    insideImage: 'images/covers/black-world-1973-11-inside.jpg',
    insideCaption: 'Drawing that opened Marion Brown’s essay on improvisation and the aural tradition in Black music.',
    insideCredit: 'Black World, November 1973, p. 14',
  },
];

/** Liner-notes tracklist for the vinyl interactive (synth stand-ins). */
export const LINER_NOTES = [
  { side: 'A1', title: 'Sunday Pocket', note: 'Synth bassline stand-in. Replace with licensed audio or the exhibition’s commissioned stems.' },
  { side: 'A2', title: 'Mothership Living Room', note: 'A nod to P-Funk’s Afrofuturism: the living room as a launch pad.' },
  { side: 'B1', title: 'Console Altar', note: 'The stereo as furniture, heirloom and pulpit.' },
];

/**
 * The artist's own archive: voice recordings of intimate moments with
 * herself and her friends, one per digit on the rotary dial.
 *
 * For each: put the file in public/audio/archive/ (mp3 or m4a) and set
 * `audioSrc` (e.g. 'audio/archive/recording-1.m4a'), its `title` and the
 * `date` it was recorded. `note` is optional extra words shown while it plays. Only include friends who have
 * agreed to be heard. Slots without audio say "coming soon".
 */
export const VOICEMAILS = [
  { digit: 1, title: '', date: '', note: '', audioSrc: '' },
  { digit: 2, title: '', date: '', note: '', audioSrc: '' },
  { digit: 3, title: '', date: '', note: '', audioSrc: '' },
  { digit: 4, title: 'Navigating New Love: Talks with Friends', date: 'May 28, 2020', note: '', audioSrc: 'audio/archive/04-navigating-new-love-2020-05-28.m4a' },
  { digit: 5, title: 'My Biggest Challenges in an Interview', date: 'September 27, 2018', note: '', audioSrc: 'audio/archive/05-my-biggest-challenges-2018-09-27.m4a' },
];
