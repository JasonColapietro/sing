/**
 * Songs that show the top and bottom of a singer's range, for pages whose
 * catalog record ties no song to either endpoint. Each note is the one the
 * song itself reaches, which can sit inside the catalog's reported span, so
 * the page labels it "High note" / "Low note" rather than reading it as the
 * catalog endpoint. The first five are the artist page's own highest- and
 * lowest-pitched picks; the rest are the highest and lowest songs on the
 * artist page that fit inside the span, kept only within five semitones of
 * that end. Every note must sit inside the catalog's reported span, or the
 * page would contradict itself (lib/singer-endpoint-songs.test.ts). Band
 * frontmen are read from their band's page when they are its only lead
 * singer. Checked 2026-11-04 against Singing Carrots' per-song ranges.
 */

export interface CitedSong {
  song: string;
  /** The note the cited song reaches, in the page's sharp spelling. */
  note: string;
}

export interface CitedEndpointSongs {
  high?: CitedSong;
  low?: CitedSong;
  /** Where the song-to-note pairs come from. */
  source: string;
}

const SINGING_CARROTS = "Singing Carrots’ song database (checked November 4, 2026)";

export const CITED_ENDPOINT_SONGS: Readonly<Record<string, CitedEndpointSongs>> = {
  "bruno-mars": {
    high: { song: "Gorilla", note: "A5" },
    low: { song: "Liquor Store Blues", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "taylor-swift": {
    // No high song: the database's top pick (E6, a duet) sits above the catalog's A#5 ceiling.
    // Becomesingers names the same song for her A2.
    low: { song: "Cruel Summer", note: "A2" },
    source: SINGING_CARROTS,
  },
  "michael-jackson": {
    high: { song: "Smooth Criminal", note: "C6" },
    low: { song: "Burn This Disco Out", note: "E2" },
    source: SINGING_CARROTS,
  },
  "olivia-rodrigo": {
    high: { song: "traitor", note: "G#5" },
    low: { song: "ballad of a homeschooled girl", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "stevie-wonder": {
    high: { song: "For Your Love", note: "D6" },
    low: { song: "I Wish", note: "D#2" },
    source: SINGING_CARROTS,
  },
  "aaron-neville": {
    low: { song: "Tell It Like It Is", note: "C3" },
    source: SINGING_CARROTS,
  },
  "aaron-tveit": {
    low: { song: "Aftershocks", note: "C#3" },
    source: SINGING_CARROTS,
  },
  "adam-lambert": {
    low: { song: "If I Had You", note: "A2" },
    source: SINGING_CARROTS,
  },
  "adam-levine": {
    low: { song: "Lost Stars", note: "C3" },
    source: SINGING_CARROTS,
  },
  "adele": {
    high: { song: "Sweetest Devotion", note: "A#5" },
    low: { song: "Love Is a Game", note: "C#3" },
    source: SINGING_CARROTS,
  },
  "al-green": {
    high: { song: "I Can't Get Next To You", note: "G5" },
    source: SINGING_CARROTS,
  },
  "al-jarreau": {
    low: { song: "Mornin'", note: "A2" },
    source: SINGING_CARROTS,
  },
  "alanis-morissette": {
    high: { song: "Joining You", note: "C6" },
    low: { song: "Reasons I Drink", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "alicia-keys": {
    high: { song: "Mr. Man", note: "A#5" },
    low: { song: "The Life", note: "C3" },
    source: SINGING_CARROTS,
  },
  "alison-krauss": {
    high: { song: "Baby Mine", note: "D5" },
    low: { song: "You Will Be My Ain True Love", note: "G3" },
    source: SINGING_CARROTS,
  },
  "amy-grant": {
    high: { song: "Baby Baby", note: "E5" },
    low: { song: "Cry a River", note: "F3" },
    source: SINGING_CARROTS,
  },
  "amy-winehouse": {
    high: { song: "Like Smoke", note: "D5" },
    low: { song: "A Song for You", note: "C3" },
    source: SINGING_CARROTS,
  },
  "andra-day": {
    high: { song: "Burn", note: "F#5" },
    low: { song: "Amen", note: "G3" },
    source: SINGING_CARROTS,
  },
  "andrea-bocelli": {
    low: { song: "Por Ti Volaré (Time to Say Goodbye)", note: "C3" },
    source: SINGING_CARROTS,
  },
  "anita-baker": {
    low: { song: "Sweet Love", note: "E3" },
    source: SINGING_CARROTS,
  },
  "annie-lennox": {
    high: { song: "Little Bird", note: "G#5" },
    source: SINGING_CARROTS,
  },
  "aretha-franklin": {
    high: { song: "Freeway of Love", note: "C6" },
    source: SINGING_CARROTS,
  },
  "ariana-grande": {
    low: { song: "Be My Baby", note: "D3" },
    source: SINGING_CARROTS,
  },
  "arijit-singh": {
    high: { song: "Tum Hi Ho", note: "G4" },
    low: { song: "Tum Hi Ho", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "ashanti": {
    high: { song: "Foolish", note: "C6" },
    low: { song: "Rain on Me", note: "G3" },
    source: SINGING_CARROTS,
  },
  "audra-mcdonald": {
    high: { song: "When Did I Fall in Love", note: "G5" },
    low: { song: "My Stupid Mouth", note: "F3" },
    source: SINGING_CARROTS,
  },
  "avril-lavigne": {
    high: { song: "My Happy Ending", note: "E5" },
    low: { song: "Complicated", note: "F3" },
    source: SINGING_CARROTS,
  },
  "barbra-streisand": {
    high: { song: "I Finally Found Someone", note: "A5" },
    low: { song: "No Matter What Happens", note: "D3" },
    source: SINGING_CARROTS,
  },
  "ben-platt": {
    high: { song: "In Case You Don't Live Forever", note: "C#5" },
    low: { song: "Grow As We Go", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "benson-boone": {
    high: { song: "Death Wish Love", note: "E5" },
    source: SINGING_CARROTS,
  },
  "bernadette-peters": {
    high: { song: "Move On", note: "G5" },
    low: { song: "Take That Look Off Your Face", note: "G3" },
    source: SINGING_CARROTS,
  },
  "beyonce": {
    high: { song: "The Closer I Get to You", note: "D#6" },
    low: { song: "PLASTIC OFF THE SOFA", note: "B2" },
    source: SINGING_CARROTS,
  },
  "bill-withers": {
    high: { song: "Ain't No Sunshine", note: "G4" },
    source: SINGING_CARROTS,
  },
  "billie-eilish": {
    high: { song: "goodbye", note: "B5" },
    source: SINGING_CARROTS,
  },
  "billie-holiday": {
    high: { song: "All of Me", note: "C5" },
    low: { song: "Mean To Me", note: "F3" },
    source: SINGING_CARROTS,
  },
  "billy-joel": {
    low: { song: "Say Goodbye to Hollywood", note: "G2" },
    source: SINGING_CARROTS,
  },
  "bing-crosby": {
    high: { song: "On the Beach At Waikiki", note: "F4" },
    low: { song: "Changing Partners", note: "F2" },
    source: SINGING_CARROTS,
  },
  "bjork": {
    low: { song: "Unison", note: "F3" },
    source: SINGING_CARROTS,
  },
  "bob-dylan": {
    high: { song: "Rainy Day Women #12 & 35", note: "A4" },
    low: { song: "I Contain Multitudes", note: "E2" },
    source: SINGING_CARROTS,
  },
  "bob-marley": {
    high: { song: "Exodus", note: "C5" },
    low: { song: "No Woman No Cry", note: "A2" },
    source: SINGING_CARROTS,
  },
  "bobby-mcferrin": {
    low: { song: "Good Lovin'", note: "G2" },
    source: SINGING_CARROTS,
  },
  "bonnie-tyler": {
    low: { song: "Total Eclipse of the Heart", note: "F3" },
    source: SINGING_CARROTS,
  },
  "brian-mcknight": {
    high: { song: "One Last Cry", note: "F5" },
    low: { song: "Home", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "brian-wilson": {
    high: { song: "Surf's Up", note: "F5" },
    low: { song: "In Blue Hawaii", note: "D2" },
    source: SINGING_CARROTS,
  },
  "britney-spears": {
    high: { song: "Toxic", note: "F5" },
    low: { song: "Oops!... I Did It Again", note: "C#3" },
    source: SINGING_CARROTS,
  },
  "bruce-springsteen": {
    low: { song: "Racing In the Street", note: "F2" },
    source: SINGING_CARROTS,
  },
  "camila-cabello": {
    high: { song: "Never Be the Same", note: "G5" },
    low: { song: "In the Dark", note: "D3" },
    source: SINGING_CARROTS,
  },
  "carrie-underwood": {
    high: { song: "No Way To Stop It", note: "B5" },
    low: { song: "See You Again", note: "F3" },
    source: SINGING_CARROTS,
  },
  "celia-cruz": {
    low: { song: "Quimbara", note: "E3" },
    source: SINGING_CARROTS,
  },
  "celine-dion": {
    high: { song: "Don't Save It All for Christmas Day", note: "C6" },
    low: { song: "Didn't Know Love", note: "C3" },
    source: SINGING_CARROTS,
  },
  "chaka-khan": {
    high: { song: "I Feel for You", note: "B5" },
    source: SINGING_CARROTS,
  },
  "chappell-roan": {
    high: { song: "Super Graphic Ultra Modern Girl", note: "G5" },
    low: { song: "The Subway", note: "F3" },
    source: SINGING_CARROTS,
  },
  "charli-xcx": {
    high: { song: "Boom Clap", note: "C#5" },
    low: { song: "5 in the Morning", note: "F3" },
    source: SINGING_CARROTS,
  },
  "charlie-puth": {
    high: { song: "Charlie Be Quiet!", note: "C6" },
    low: { song: "Patient", note: "A2" },
    source: SINGING_CARROTS,
  },
  "cher": {
    high: { song: "War Paint and Soft Feathers", note: "G#5" },
    source: SINGING_CARROTS,
  },
  "chris-brown": {
    low: { song: "Forever", note: "C3" },
    source: SINGING_CARROTS,
  },
  "chris-stapleton": {
    low: { song: "Was It 26", note: "A2" },
    source: SINGING_CARROTS,
  },
  "chris-tomlin": {
    high: { song: "Chosen Generation", note: "B4" },
    low: { song: "Rejoice", note: "A2" },
    source: SINGING_CARROTS,
  },
  "christina-aguilera": {
    low: { song: "Somos Nada", note: "C3" },
    source: SINGING_CARROTS,
  },
  "christopher-cross": {
    low: { song: "Sailing", note: "D3" },
    source: SINGING_CARROTS,
  },
  "colm-wilkinson": {
    high: { song: "Bring Him Home", note: "A4" },
    source: SINGING_CARROTS,
  },
  "conan-gray": {
    high: { song: "Holidays", note: "G5" },
    low: { song: "Heather", note: "C3" },
    source: SINGING_CARROTS,
  },
  "curtis-mayfield": {
    high: { song: "Move On Up", note: "F#5" },
    low: { song: "People Get Ready", note: "A2" },
    source: SINGING_CARROTS,
  },
  "cyndi-lauper": {
    high: { song: "True Colors", note: "C6" },
    low: { song: "True Colours", note: "G3" },
    source: SINGING_CARROTS,
  },
  "cynthia-erivo": {
    high: { song: "I'm here", note: "G5" },
    low: { song: "I'm here", note: "E3" },
    source: SINGING_CARROTS,
  },
  "dangelo": {
    high: { song: "Spanish Joint", note: "F5" },
    low: { song: "Playa Playa", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "david-bowie": {
    high: { song: "John, I'm Only Dancing (Again)", note: "E5" },
    low: { song: "Magic Dance", note: "F2" },
    source: SINGING_CARROTS,
  },
  "dean-martin": {
    high: { song: "Ev'ry Street's a Boulevard (In Old New York)", note: "G4" },
    low: { song: "Everybody Loves Somebody", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "demi-lovato": {
    high: { song: "Anyone", note: "C6" },
    low: { song: "Neon Lights", note: "C#3" },
    source: SINGING_CARROTS,
  },
  "diana-krall": {
    high: { song: "Let's Get Lost", note: "C5" },
    low: { song: "I'm Not in Love", note: "E3" },
    source: SINGING_CARROTS,
  },
  "diana-ross": {
    high: { song: "Touch Me In the Morning", note: "B5" },
    low: { song: "It's My Turn", note: "E3" },
    source: SINGING_CARROTS,
  },
  "dolly-parton": {
    high: { song: "Jolene", note: "A5" },
    low: { song: "One of the Boys", note: "F3" },
    source: SINGING_CARROTS,
  },
  "don-henley": {
    high: { song: "New York Minute", note: "D#5" },
    low: { song: "All She Wants to Do Is Dance", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "donnie-mcclurkin": {
    high: { song: "Holy, Holy, Holy", note: "D5" },
    low: { song: "Stand", note: "C3" },
    source: SINGING_CARROTS,
  },
  "donny-hathaway": {
    high: { song: "The Ghetto", note: "C5" },
    low: { song: "The Ghetto", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "drake": {
    high: { song: "Fake Love", note: "C5" },
    low: { song: "Signs", note: "E2" },
    source: SINGING_CARROTS,
  },
  "dua-lipa": {
    high: { song: "Break My Heart", note: "G5" },
    low: { song: "IDGAF", note: "D3" },
    source: SINGING_CARROTS,
  },
  "dusty-springfield": {
    high: { song: "Goin' Back", note: "D#5" },
    source: SINGING_CARROTS,
  },
  "ed-sheeran": {
    high: { song: "Castle on the Hill", note: "A5" },
    low: { song: "Give Me Love", note: "G2" },
    source: SINGING_CARROTS,
  },
  "ella-fitzgerald": {
    low: { song: "Misty", note: "D3" },
    source: SINGING_CARROTS,
  },
  "ella-mai": {
    low: { song: "Trip", note: "E3" },
    source: SINGING_CARROTS,
  },
  "ellie-goulding": {
    high: { song: "My Blood", note: "A5" },
    low: { song: "Hollow Crown", note: "D3" },
    source: SINGING_CARROTS,
  },
  "elton-john": {
    low: { song: "Rocket Man", note: "F2" },
    source: SINGING_CARROTS,
  },
  "elvis-presley": {
    high: { song: "Kissin' Cousins", note: "C5" },
    source: SINGING_CARROTS,
  },
  "emeli-sande": {
    high: { song: "Brighter Days", note: "F5" },
    low: { song: "Selah", note: "E3" },
    source: SINGING_CARROTS,
  },
  "emmylou-harris": {
    high: { song: "Pledging My Love", note: "D5" },
    low: { song: "If I Could Only Win Your Love", note: "G3" },
    source: SINGING_CARROTS,
  },
  "enrique-iglesias": {
    high: { song: "Somebody's Me", note: "G#4" },
    low: { song: "Bailando (Spanish Version)", note: "D3" },
    source: SINGING_CARROTS,
  },
  "erykah-badu": {
    high: { song: "Love of My Life", note: "D5" },
    source: SINGING_CARROTS,
  },
  "ethel-merman": {
    high: { song: "Anything You Can Do", note: "D5" },
    low: { song: "I Got Lost in His Arms", note: "A#3" },
    source: SINGING_CARROTS,
  },
  "etta-james": {
    high: { song: "(There Is) No Greater Love", note: "G5" },
    source: SINGING_CARROTS,
  },
  "faith-hill": {
    high: { song: "A Baby Changes Everything", note: "G#5" },
    low: { song: "I Want You", note: "D3" },
    source: SINGING_CARROTS,
  },
  "fantasia": {
    high: { song: "Free Yourself", note: "F#5" },
    low: { song: "Free Yourself", note: "E3" },
    source: SINGING_CARROTS,
  },
  "faouzia": {
    low: { song: "Bad Dreams", note: "E3" },
    source: SINGING_CARROTS,
  },
  "fiona-apple": {
    high: { song: "Never Is a Promise", note: "E5" },
    low: { song: "Paper Bag", note: "D3" },
    source: SINGING_CARROTS,
  },
  "frank-ocean": {
    high: { song: "Thinkin Bout You", note: "G5" },
    low: { song: "Pilot Jones", note: "F2" },
    source: SINGING_CARROTS,
  },
  "frank-sinatra": {
    high: { song: "Try a Little Tenderness", note: "A4" },
    low: { song: "Love's Been Good To Me", note: "G2" },
    source: SINGING_CARROTS,
  },
  "frankie-valli": {
    low: { song: "Cry for Me", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "fred-hammond": {
    high: { song: "I Want My Destiny", note: "A#4" },
    low: { song: "Everything To Me", note: "E2" },
    source: SINGING_CARROTS,
  },
  "garth-brooks": {
    high: { song: "Friends in Low Places", note: "A4" },
    low: { song: "Friends in Low Places", note: "G2" },
    source: SINGING_CARROTS,
  },
  "george-michael": {
    high: { song: "If You Were There", note: "F#5" },
    low: { song: "Jesus To a Child", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "george-strait": {
    high: { song: "True", note: "E4" },
    low: { song: "You Look So Good In Love", note: "A2" },
    source: SINGING_CARROTS,
  },
  "gladys-knight": {
    high: { song: "License to Kill", note: "D5" },
    low: { song: "License to Kill", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "glen-campbell": {
    high: { song: "A Better Place", note: "A4" },
    low: { song: "Country Boy (You Got Your Feet in L.A.)", note: "F2" },
    source: SINGING_CARROTS,
  },
  "gloria-estefan": {
    high: { song: "Punto De Referencia", note: "A#5" },
    low: { song: "One Name", note: "E3" },
    source: SINGING_CARROTS,
  },
  "gracie-abrams": {
    low: { song: "I Love You, I'm Sorry", note: "F3" },
    source: SINGING_CARROTS,
  },
  "gregory-porter": {
    high: { song: "Water Under Bridges", note: "G4" },
    low: { song: "Be Good (Lion's Song)", note: "A2" },
    source: SINGING_CARROTS,
  },
  "gwen-stefani": {
    high: { song: "Baby Don't Lie", note: "G#5" },
    low: { song: "Cool", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "halsey": {
    high: { song: "Without Me", note: "F5" },
    low: { song: "Graveyard", note: "E3" },
    source: SINGING_CARROTS,
  },
  "hank-williams": {
    low: { song: "You Win Again", note: "A2" },
    source: SINGING_CARROTS,
  },
  "harry-styles": {
    high: { song: "Treat People With Kindness", note: "E5" },
    low: { song: "Sunflower, Vol. 6", note: "A2" },
    source: SINGING_CARROTS,
  },
  "her": {
    high: { song: "The Journey", note: "D5" },
    source: SINGING_CARROTS,
  },
  "hozier": {
    high: { song: "Shrike", note: "C5" },
    low: { song: "Take Me To Church", note: "E2" },
    source: SINGING_CARROTS,
  },
  "hugh-jackman": {
    high: { song: "Once Before I Go", note: "F#4" },
    low: { song: "Suddenly", note: "B2" },
    source: SINGING_CARROTS,
  },
  "idina-menzel": {
    high: { song: "Dream Girl", note: "B5" },
    source: SINGING_CARROTS,
  },
  "indiaarie": {
    high: { song: "This Too Shall Pass", note: "C6" },
    low: { song: "Steady Love", note: "C3" },
    source: SINGING_CARROTS,
  },
  "jacob-collier": {
    high: { song: "Summer Rain", note: "C6" },
    source: SINGING_CARROTS,
  },
  "james-blake": {
    high: { song: "You're Too Precious", note: "C#5" },
    low: { song: "Don't Miss It", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "james-brown": {
    high: { song: "Night Train", note: "C5" },
    low: { song: "Cold Sweat, Pt. 1", note: "A2" },
    source: SINGING_CARROTS,
  },
  "james-taylor": {
    high: { song: "She Thinks I Still Care", note: "A4" },
    low: { song: "Only One", note: "F2" },
    source: SINGING_CARROTS,
  },
  "janis-joplin": {
    high: { song: "Cry Baby", note: "A5" },
    low: { song: "Move Over", note: "D3" },
    source: SINGING_CARROTS,
  },
  "jason-mraz": {
    high: { song: "Little Time", note: "A#5" },
    low: { song: "Only Human", note: "F2" },
    source: SINGING_CARROTS,
  },
  "jazmine-sullivan": {
    high: { song: "In Love With Another Man", note: "A#5" },
    source: SINGING_CARROTS,
  },
  "jeff-buckley": {
    low: { song: "Forget Her", note: "E2" },
    source: SINGING_CARROTS,
  },
  "jelly-roll": {
    high: { song: "Winning Streak", note: "G4" },
    source: SINGING_CARROTS,
  },
  "jennifer-hudson": {
    high: { song: "Fix Me, Jesus", note: "A5" },
    source: SINGING_CARROTS,
  },
  "jessie-j": {
    high: { song: "Big White Room", note: "G#5" },
    low: { song: "Big White Room", note: "E3" },
    source: SINGING_CARROTS,
  },
  "jewel": {
    low: { song: "Deep Water", note: "E3" },
    source: SINGING_CARROTS,
  },
  "jill-scott": {
    high: { song: "Rolling Hills", note: "E5" },
    low: { song: "He Loves Me (Lyzel in E Flat)", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "jimmy-cliff": {
    high: { song: "Wonderful World, Beautiful People", note: "B4" },
    low: { song: "The Harder They Come", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "joan-baez": {
    low: { song: "The Night They Drove Old Dixie Down", note: "F3" },
    source: SINGING_CARROTS,
  },
  "joan-jett": {
    high: { song: "Bad Reputation", note: "C5" },
    low: { song: "Do You Wanna Touch Me?", note: "G3" },
    source: SINGING_CARROTS,
  },
  "joe-cocker": {
    high: { song: "Let's Go Get Stoned", note: "A4" },
    low: { song: "You Are So Beautiful", note: "G2" },
    source: SINGING_CARROTS,
  },
  "john-legend": {
    high: { song: "I Don’t Love You Like I Used To", note: "A5" },
    low: { song: "Prelude", note: "E2" },
    source: SINGING_CARROTS,
  },
  "john-lennon": {
    low: { song: "Working Class Hero", note: "G2" },
    source: SINGING_CARROTS,
  },
  "johnny-cash": {
    high: { song: "Cocaine Blues", note: "E4" },
    low: { song: "I Won't Back Down", note: "E2" },
    source: SINGING_CARROTS,
  },
  "johnny-mathis": {
    low: { song: "It's Not for Me To Say", note: "C3" },
    source: SINGING_CARROTS,
  },
  "jonathan-groff": {
    high: { song: "You'll Be Back", note: "C5" },
    low: { song: "All That's Known", note: "C3" },
    source: SINGING_CARROTS,
  },
  "joni-mitchell": {
    high: { song: "Talk to Me", note: "C6" },
    low: { song: "Strong and Wrong", note: "E3" },
    source: SINGING_CARROTS,
  },
  "jose-jose": {
    low: { song: "Sabras Que Te Quiero", note: "A2" },
    source: SINGING_CARROTS,
  },
  "josh-groban": {
    high: { song: "When You Say You Love Me", note: "A4" },
    low: { song: "Caruso", note: "G2" },
    source: SINGING_CARROTS,
  },
  "josh-turner": {
    low: { song: "You Don't Mess Around With Jim", note: "C2" },
    source: SINGING_CARROTS,
  },
  "joss-stone": {
    high: { song: "Security", note: "F#5" },
    low: { song: "Headturner", note: "E3" },
    source: SINGING_CARROTS,
  },
  "juan-gabriel": {
    high: { song: "Se Me Olvido Otra Vez", note: "B4" },
    low: { song: "Amor Eterno", note: "A2" },
    source: SINGING_CARROTS,
  },
  "judy-garland": {
    low: { song: "(Can This Be) The End of the Rainbow?", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "julie-andrews": {
    high: { song: "I Love to Laugh", note: "G5" },
    low: { song: "Feed the Birds", note: "A#3" },
    source: SINGING_CARROTS,
  },
  "jungkook": {
    high: { song: "Dreamers", note: "F5" },
    source: SINGING_CARROTS,
  },
  "justin-bieber": {
    high: { song: "Lifetime", note: "A5" },
    low: { song: "Baby", note: "A2" },
    source: SINGING_CARROTS,
  },
  "justin-timberlake": {
    high: { song: "Selfish", note: "C6" },
    low: { song: "My Love", note: "A2" },
    source: SINGING_CARROTS,
  },
  "kacey-musgraves": {
    high: { song: "High Horse", note: "D5" },
    low: { song: "Biscuits", note: "G3" },
    source: SINGING_CARROTS,
  },
  "kali-uchis": {
    high: { song: "telepatía", note: "D5" },
    source: SINGING_CARROTS,
  },
  "kate-bush": {
    high: { song: "Aerial Tal", note: "B5" },
    low: { song: "Nocturn", note: "E3" },
    source: SINGING_CARROTS,
  },
  "katy-perry": {
    high: { song: "This Is How We Do", note: "C6" },
    source: SINGING_CARROTS,
  },
  "kehlani": {
    high: { song: "Gangsta", note: "C#5" },
    low: { song: "Honey", note: "F3" },
    source: SINGING_CARROTS,
  },
  "kelly-clarkson": {
    high: { song: "I Don't Think About You", note: "C6" },
    low: { song: "Never Enough", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "kelly-rowland": {
    low: { song: "Stole", note: "E3" },
    source: SINGING_CARROTS,
  },
  "kesha": {
    low: { song: "Tik Tok", note: "D3" },
    source: SINGING_CARROTS,
  },
  "keyshia-cole": {
    low: { song: "We Could Be", note: "F3" },
    source: SINGING_CARROTS,
  },
  "kim-burrell": {
    low: { song: "I Come to You More Than I Give", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "kristin-chenoweth": {
    low: { song: "The Girl In 14G", note: "G3" },
    source: SINGING_CARROTS,
  },
  "lady-gaga": {
    high: { song: "Disease", note: "C6" },
    source: SINGING_CARROTS,
  },
  "lana-del-rey": {
    high: { song: "Cola", note: "C#6" },
    low: { song: "I Can Fly", note: "C3" },
    source: SINGING_CARROTS,
  },
  "laufey": {
    high: { song: "Bored", note: "D5" },
    low: { song: "Lover Girl", note: "F3" },
    source: SINGING_CARROTS,
  },
  "lauren-daigle": {
    high: { song: "You Say", note: "E5" },
    low: { song: "Losing My Religion", note: "E3" },
    source: SINGING_CARROTS,
  },
  "lauryn-hill": {
    high: { song: "Superstar", note: "G5" },
    low: { song: "When It Hurts So Bad", note: "D3" },
    source: SINGING_CARROTS,
  },
  "lea-michele": {
    high: { song: "Run to You", note: "F#5" },
    low: { song: "Cue the Rain", note: "F3" },
    source: SINGING_CARROTS,
  },
  "lenny-kravitz": {
    high: { song: "Calling All Angels", note: "F#5" },
    low: { song: "If You Can't Say No", note: "A2" },
    source: SINGING_CARROTS,
  },
  "leon-bridges": {
    high: { song: "Coming Home", note: "F#4" },
    low: { song: "River", note: "C3" },
    source: SINGING_CARROTS,
  },
  "leonard-cohen": {
    high: { song: "Tonight Will Be Fine", note: "E4" },
    source: SINGING_CARROTS,
  },
  "lewis-capaldi": {
    high: { song: "Lost on You", note: "D5" },
    low: { song: "Hold Me While You Wait", note: "G2" },
    source: SINGING_CARROTS,
  },
  "linda-ronstadt": {
    high: { song: "Don't Know Much", note: "G#5" },
    low: { song: "'Round Midnight", note: "E3" },
    source: SINGING_CARROTS,
  },
  "lionel-richie": {
    high: { song: "Goodbye", note: "E5" },
    low: { song: "Just for You", note: "A2" },
    source: SINGING_CARROTS,
  },
  "lizzo": {
    high: { song: "Jerome", note: "A#5" },
    low: { song: "Cuz I Love You", note: "F3" },
    source: SINGING_CARROTS,
  },
  "lorde": {
    high: { song: "Liability", note: "A5" },
    low: { song: "Green Light", note: "D3" },
    source: SINGING_CARROTS,
  },
  "loretta-lynn": {
    high: { song: "I'm Lonesome for Trouble Tonight", note: "D5" },
    low: { song: "Fist City", note: "G3" },
    source: SINGING_CARROTS,
  },
  "louis-armstrong": {
    high: { song: "When It's Sleepy Time Down South", note: "G4" },
    low: { song: "Dream a Little Dream of Me", note: "G2" },
    source: SINGING_CARROTS,
  },
  "luciano-pavarotti": {
    low: { song: "Caruso", note: "D3" },
    source: SINGING_CARROTS,
  },
  "luis-miguel": {
    high: { song: "Sol, Arena y Mar", note: "C#5" },
    low: { song: "Amarte Es Un Placer", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "luke-combs": {
    high: { song: "Beer Never Broke My Heart", note: "A4" },
    low: { song: "Beer Never Broke My Heart", note: "A2" },
    source: SINGING_CARROTS,
  },
  "luther-vandross": {
    high: { song: "I Can Make It Better", note: "G5" },
    low: { song: "I Can Make It Better", note: "C3" },
    source: SINGING_CARROTS,
  },
  "madison-beer": {
    high: { song: "Selfish", note: "G5" },
    low: { song: "Dangerous", note: "F3" },
    source: SINGING_CARROTS,
  },
  "madonna": {
    high: { song: "4 Minutes", note: "A#5" },
    low: { song: "4 Minutes", note: "F3" },
    source: SINGING_CARROTS,
  },
  "mahalia-jackson": {
    high: { song: "Move on Up a Little Higher", note: "F5" },
    low: { song: "I'm Going To Live the Life I Sing About In My Song", note: "G#3" },
    source: SINGING_CARROTS,
  },
  "marc-anthony": {
    high: { song: "I've Got You", note: "C5" },
    low: { song: "Don't Tell Me It's Love", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "mario-lanza": {
    low: { song: "Arrivederci, Roma", note: "D3" },
    source: SINGING_CARROTS,
  },
  "martina-mcbride": {
    high: { song: "How I Feel", note: "E5" },
    low: { song: "Anyway", note: "F3" },
    source: SINGING_CARROTS,
  },
  "marvin-gaye": {
    low: { song: "Inner City Blues (Make Me Wanna Holler)", note: "A2" },
    source: SINGING_CARROTS,
  },
  "mary-j-blige": {
    high: { song: "Just Fine", note: "B5" },
    source: SINGING_CARROTS,
  },
  "maxwell": {
    low: { song: "Pretty Wings", note: "B2" },
    source: SINGING_CARROTS,
  },
  "meghan-trainor": {
    high: { song: "I’ll Be Home", note: "F#5" },
    low: { song: "Rainbow", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "mel-torme": {
    low: { song: "Haven't We Met", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "melanie-martinez": {
    high: { song: "Show & Tell", note: "D5" },
    low: { song: "Show & Tell", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "merle-haggard": {
    high: { song: "Swinging Doors", note: "E4" },
    low: { song: "Silver Wings", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "michael-buble": {
    high: { song: "Feeling Good", note: "A4" },
    low: { song: "You and I", note: "G2" },
    source: SINGING_CARROTS,
  },
  "michael-crawford": {
    high: { song: "Amazing Grace", note: "A4" },
    low: { song: "On Eagle's Wings", note: "A2" },
    source: SINGING_CARROTS,
  },
  "michael-w-smith": {
    high: { song: "Help Is on the Way", note: "B4" },
    low: { song: "Almost There", note: "A2" },
    source: SINGING_CARROTS,
  },
  "miguel": {
    high: { song: "Adorn", note: "F#5" },
    low: { song: "Adorn", note: "D3" },
    source: SINGING_CARROTS,
  },
  "miley-cyrus": {
    high: { song: "Wake Up America", note: "C#6" },
    source: SINGING_CARROTS,
  },
  "mitski": {
    high: { song: "Liquid Smooth", note: "D#5" },
    low: { song: "Nobody", note: "F3" },
    source: SINGING_CARROTS,
  },
  "monica": {
    high: { song: "Everything To Me", note: "A5" },
    low: { song: "For You I Will", note: "E3" },
    source: SINGING_CARROTS,
  },
  "morgan-wallen": {
    high: { song: "Whiskey Glasses", note: "G4" },
    low: { song: "Wasted on You", note: "A2" },
    source: SINGING_CARROTS,
  },
  "morrissey": {
    high: { song: "I Have Forgiven Jesus", note: "G4" },
    low: { song: "I Have Forgiven Jesus", note: "A2" },
    source: SINGING_CARROTS,
  },
  "musiq-soulchild": {
    low: { song: "Buddy", note: "C#3" },
    source: SINGING_CARROTS,
  },
  "nat-king-cole": {
    high: { song: "Caroling, Caroling", note: "G4" },
    low: { song: "Let There Be Love", note: "G2" },
    source: SINGING_CARROTS,
  },
  "neil-diamond": {
    low: { song: "Face Me", note: "D2" },
    source: SINGING_CARROTS,
  },
  "neil-young": {
    high: { song: "Transformer Man", note: "C5" },
    low: { song: "Stringman", note: "G2" },
    source: SINGING_CARROTS,
  },
  "nina-simone": {
    high: { song: "I Get Along Without You Very Well", note: "F5" },
    low: { song: "New World Coming", note: "G2" },
    source: SINGING_CARROTS,
  },
  "norah-jones": {
    high: { song: "Peace", note: "C5" },
    low: { song: "Peace", note: "F3" },
    source: SINGING_CARROTS,
  },
  "olivia-newton-john": {
    high: { song: "A Little More Love", note: "G#5" },
    low: { song: "Make a Move on Me", note: "G3" },
    source: SINGING_CARROTS,
  },
  "otis-redding": {
    high: { song: "Mr. Pitiful", note: "C5" },
    low: { song: "Hard to Handle", note: "G2" },
    source: SINGING_CARROTS,
  },
  "ozzy-osbourne": {
    high: { song: "Bark At the Moon", note: "D5" },
    low: { song: "Mama, I'm Coming Home", note: "C3" },
    source: SINGING_CARROTS,
  },
  "pat-benatar": {
    high: { song: "Promises In the Dark", note: "A5" },
    low: { song: "We Belong", note: "F3" },
    source: SINGING_CARROTS,
  },
  "patsy-cline": {
    high: { song: "Seven Lonely Days", note: "D5" },
    low: { song: "Three Cigarettes In An Ashtray", note: "E3" },
    source: SINGING_CARROTS,
  },
  "paul-mccartney": {
    low: { song: "Vanilla Sky", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "paul-simon": {
    high: { song: "Diamonds on the Soles of Her Shoes", note: "C5" },
    low: { song: "50 Ways to Leave Your Lover", note: "A2" },
    source: SINGING_CARROTS,
  },
  "peter-gabriel": {
    high: { song: "In Your Eyes", note: "A4" },
    low: { song: "The Book of Love", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "peter-tosh": {
    high: { song: "Equal Rights", note: "G4" },
    source: SINGING_CARROTS,
  },
  "phil-collins": {
    low: { song: "Trashin' the Camp (Pop Version)", note: "F2" },
    source: SINGING_CARROTS,
  },
  "phoebe-bridgers": {
    low: { song: "Nothing Else Matters", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "pink": {
    high: { song: "Hate Me", note: "G#5" },
    low: { song: "My Attic", note: "G2" },
    source: SINGING_CARROTS,
  },
  "prince": {
    low: { song: "Beautiful, Loved and Blessed", note: "E2" },
    source: SINGING_CARROTS,
  },
  "randy-travis": {
    high: { song: "If You Only Knew", note: "E4" },
    low: { song: "Peace in the Valley", note: "G2" },
    source: SINGING_CARROTS,
  },
  "ray-charles": {
    low: { song: "I Believe To My Soul", note: "D#2" },
    source: SINGING_CARROTS,
  },
  "reba-mcentire": {
    high: { song: "This Christmas", note: "E5" },
    low: { song: "Fancy", note: "E3" },
    source: SINGING_CARROTS,
  },
  "regina-spektor": {
    low: { song: "All the Rowboats", note: "F3" },
    source: SINGING_CARROTS,
  },
  "rick-astley": {
    high: { song: "Hopelessly", note: "C#5" },
    low: { song: "Keep Singing", note: "A2" },
    source: SINGING_CARROTS,
  },
  "ricky-martin": {
    high: { song: "I Count the Minutes", note: "C5" },
    low: { song: "She's All I Ever Had", note: "B2" },
    source: SINGING_CARROTS,
  },
  "rihanna": {
    high: { song: "Dem Haters", note: "B5" },
    low: { song: "Towards the Sun", note: "D3" },
    source: SINGING_CARROTS,
  },
  "robert-plant": {
    low: { song: "Killing the Blues", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "rod-stewart": {
    high: { song: "Born Loose", note: "C5" },
    source: SINGING_CARROTS,
  },
  "roy-orbison": {
    high: { song: "Indian Wedding", note: "E5" },
    low: { song: "That Lovin' You Feelin' Again", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "rufus-wainwright": {
    high: { song: "California", note: "C#5" },
    low: { song: "California", note: "A2" },
    source: SINGING_CARROTS,
  },
  "sabrina-carpenter": {
    high: { song: "We'll Be the Stars", note: "A5" },
    low: { song: "Please Please Please", note: "E3" },
    source: SINGING_CARROTS,
  },
  "sam-cooke": {
    high: { song: "Born Again", note: "D#5" },
    low: { song: "Cupid", note: "A2" },
    source: SINGING_CARROTS,
  },
  "sam-smith": {
    high: { song: "I'm Not the Only One", note: "C6" },
    source: SINGING_CARROTS,
  },
  "samara-joy": {
    high: { song: "Guess Who I Saw Today", note: "D5" },
    low: { song: "Guess Who I Saw Today", note: "E3" },
    source: SINGING_CARROTS,
  },
  "sandi-patty": {
    high: { song: "Passion Medley", note: "C6" },
    low: { song: "Through the Eyes of a Child", note: "F3" },
    source: SINGING_CARROTS,
  },
  "sara-bareilles": {
    high: { song: "I Wanna Be Like Me", note: "E6" },
    low: { song: "Eyes on You", note: "B2" },
    source: SINGING_CARROTS,
  },
  "sarah-brightman": {
    low: { song: "Tell Me on a Sunday", note: "G3" },
    source: SINGING_CARROTS,
  },
  "sarah-mclachlan": {
    high: { song: "Fear", note: "B5" },
    low: { song: "I Will Remember You", note: "F3" },
    source: SINGING_CARROTS,
  },
  "selena-gomez": {
    high: { song: "Dance Again", note: "D#5" },
    low: { song: "Camouflage", note: "D3" },
    source: SINGING_CARROTS,
  },
  "selena": {
    low: { song: "Como La Flor", note: "F3" },
    source: SINGING_CARROTS,
  },
  "serj-tankian": {
    low: { song: "The Rains of Castamere", note: "G2" },
    source: SINGING_CARROTS,
  },
  "shaggy": {
    high: { song: "Piece of My Heart", note: "E4" },
    low: { song: "Piece of My Heart", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "shakira": {
    high: { song: "Poem To a Horse", note: "A5" },
    low: { song: "La Tortura", note: "E3" },
    source: SINGING_CARROTS,
  },
  "shania-twain": {
    high: { song: "Forever and for Always", note: "E5" },
    low: { song: "Party for Two", note: "E3" },
    source: SINGING_CARROTS,
  },
  "shawn-mendes": {
    high: { song: "Particular Taste", note: "D5" },
    low: { song: "Stitches", note: "G2" },
    source: SINGING_CARROTS,
  },
  "sia": {
    high: { song: "Unforgettable", note: "A5" },
    low: { song: "Midnight Decisions", note: "D3" },
    source: SINGING_CARROTS,
  },
  "smokey-robinson": {
    low: { song: "Cruisin'", note: "D3" },
    source: SINGING_CARROTS,
  },
  "steve-lacy": {
    high: { song: "Dark Red", note: "D#5" },
    source: SINGING_CARROTS,
  },
  "steve-perry": {
    low: { song: "Foolish Heart", note: "G2" },
    source: SINGING_CARROTS,
  },
  "stevie-nicks": {
    high: { song: "Edge of Seventeen", note: "B4" },
    low: { song: "Stand Back", note: "A3" },
    source: SINGING_CARROTS,
  },
  "sting": {
    low: { song: "I Love Her But She Loves Someone Else", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "sutton-foster": {
    high: { song: "Flight", note: "G#5" },
    low: { song: "Show Off", note: "G3" },
    source: SINGING_CARROTS,
  },
  "sza": {
    high: { song: "The Weekend", note: "G5" },
    low: { song: "The Weekend", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "tammy-wynette": {
    low: { song: "Good Lovin'", note: "G3" },
    source: SINGING_CARROTS,
  },
  "tasha-cobbs-leonard": {
    high: { song: "Break Every Chain", note: "G5" },
    low: { song: "This Is a Move", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "tate-mcrae": {
    high: { song: "what would you do?", note: "E5" },
    low: { song: "what would you do?", note: "E3" },
    source: SINGING_CARROTS,
  },
  "teddy-pendergrass": {
    high: { song: "I Don't Love You Anymore", note: "G4" },
    source: SINGING_CARROTS,
  },
  "the-weeknd": {
    high: { song: "Sacrifice", note: "B5" },
    low: { song: "Losers", note: "G2" },
    source: SINGING_CARROTS,
  },
  "thom-yorke": {
    high: { song: "Atoms for Peace", note: "C#5" },
    source: SINGING_CARROTS,
  },
  "tom-jones": {
    low: { song: "With These Hands", note: "B2" },
    source: SINGING_CARROTS,
  },
  "toni-braxton": {
    high: { song: "The Time of Our Lives", note: "A5" },
    low: { song: "Let It Flow", note: "C3" },
    source: SINGING_CARROTS,
  },
  "tony-bennett": {
    high: { song: "Anything Goes", note: "A4" },
    low: { song: "Maybe This Time", note: "A2" },
    source: SINGING_CARROTS,
  },
  "tori-amos": {
    high: { song: "Cornflake Girl", note: "B5" },
    low: { song: "Crucify", note: "E3" },
    source: SINGING_CARROTS,
  },
  "tori-kelly": {
    low: { song: "Paper Hearts", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "tracy-chapman": {
    high: { song: "Fast Car", note: "A4" },
    low: { song: "Heaven's Here on Earth", note: "D3" },
    source: SINGING_CARROTS,
  },
  "troye-sivan": {
    low: { song: "Talk Me Down", note: "C3" },
    source: SINGING_CARROTS,
  },
  "tyla": {
    high: { song: "Water", note: "C#5" },
    source: SINGING_CARROTS,
  },
  "usher": {
    high: { song: "Confessions Part II", note: "F5" },
    low: { song: "Climax", note: "A#2" },
    source: SINGING_CARROTS,
  },
  "van-morrison": {
    high: { song: "Wavelength", note: "C5" },
    low: { song: "When the Leaves Come Falling Down", note: "G2" },
    source: SINGING_CARROTS,
  },
  "vince-gill": {
    high: { song: "Don't Come Cryin' To Me", note: "C5" },
    low: { song: "One Bright Star", note: "A2" },
    source: SINGING_CARROTS,
  },
  "waylon-jennings": {
    high: { song: "Rainy Day Woman", note: "D4" },
    low: { song: "Ladies Love Outlaws", note: "E2" },
    source: SINGING_CARROTS,
  },
  "whitney-houston": {
    high: { song: "Run to You", note: "A#5" },
    low: { song: "Where Do Broken Hearts Go?", note: "A2" },
    source: SINGING_CARROTS,
  },
  "willie-nelson": {
    high: { song: "The Shelter of Your Arms", note: "F4" },
    low: { song: "Always on My Mind", note: "G2" },
    source: SINGING_CARROTS,
  },
  "yolanda-adams": {
    high: { song: "The Only Way", note: "G#5" },
    low: { song: "Let Us Worship Him", note: "F3" },
    source: SINGING_CARROTS,
  },
  "zayn": {
    low: { song: "Sour Diesel", note: "D3" },
    source: SINGING_CARROTS,
  },
  "amy-lee": {
    high: { song: "Farther Away", note: "E6" },
    low: { song: "Going Under", note: "E3" },
    source: SINGING_CARROTS,
  },
  "anohni": {
    low: { song: "For Today I Am a Boy", note: "D3" },
    source: SINGING_CARROTS,
  },
  "anthony-kiedis": {
    high: { song: "The Zephyr Song", note: "E5" },
    low: { song: "Get on Top", note: "G2" },
    source: SINGING_CARROTS,
  },
  "billie-joe-armstrong": {
    high: { song: "East Jesus Nowhere", note: "B4" },
    low: { song: "Minority", note: "G2" },
    source: SINGING_CARROTS,
  },
  "billy-corgan": {
    high: { song: "Pug", note: "E5" },
    source: SINGING_CARROTS,
  },
  "brandon-boyd": {
    low: { song: "Stellar", note: "A2" },
    source: SINGING_CARROTS,
  },
  "corey-taylor": {
    low: { song: "Vermilion Pt. 2", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "debbie-harry": {
    low: { song: "Hanging on the Telephone", note: "F3" },
    source: SINGING_CARROTS,
  },
  "dolores-oriordan": {
    high: { song: "Dreams", note: "C6" },
    low: { song: "Put Me Down", note: "E3" },
    source: SINGING_CARROTS,
  },
  "geddy-lee": {
    high: { song: "The Spirit of Radio", note: "G#5" },
    low: { song: "Fly By Night", note: "F2" },
    source: SINGING_CARROTS,
  },
  "hayley-williams": {
    high: { song: "Born For This", note: "D6" },
    low: { song: "Misery Business", note: "F3" },
    source: SINGING_CARROTS,
  },
  "ian-curtis": {
    high: { song: "Disorder", note: "D4" },
    low: { song: "Atmosphere", note: "A2" },
    source: SINGING_CARROTS,
  },
  "james-hetfield": {
    high: { song: "Hit the Lights", note: "C5" },
    low: { song: "Enter Sandman", note: "E2" },
    source: SINGING_CARROTS,
  },
  "jim-morrison": {
    low: { song: "The Spy", note: "E2" },
    source: SINGING_CARROTS,
  },
  "justin-vernon": {
    high: { song: "S P E Y S I D E", note: "E5" },
    low: { song: "__45__", note: "F#2" },
    source: SINGING_CARROTS,
  },
  "kurt-cobain": {
    low: { song: "Plateau", note: "F2" },
    source: SINGING_CARROTS,
  },
  "lzzy-hale": {
    high: { song: "Here's To Us", note: "G5" },
    source: SINGING_CARROTS,
  },
  "m-shadows": {
    low: { song: "Afterlife", note: "D2" },
    source: SINGING_CARROTS,
  },
  "matt-bellamy": {
    low: { song: "Reapers", note: "F2" },
    source: SINGING_CARROTS,
  },
  "maynard-james-keenan": {
    low: { song: "Lateralus", note: "A2" },
    source: SINGING_CARROTS,
  },
  "morten-harket": {
    low: { song: "Take on Me", note: "A2" },
    source: SINGING_CARROTS,
  },
  "patrick-stump": {
    high: { song: "We Didn’t Start the Fire", note: "B5" },
    low: { song: "The Kids Aren't Alright", note: "C3" },
    source: SINGING_CARROTS,
  },
  "placido-domingo": {
    high: { song: "The Gift of Love", note: "A4" },
    low: { song: "Perhaps Love", note: "B2" },
    source: SINGING_CARROTS,
  },
  "robert-smith": {
    high: { song: "Boys Don't Cry", note: "B4" },
    low: { song: "Lullaby", note: "C#3" },
    source: SINGING_CARROTS,
  },
  "rose": {
    high: { song: "On the ground", note: "G#5" },
    low: { song: "On the ground", note: "F#3" },
    source: SINGING_CARROTS,
  },
  "sade-adu": {
    high: { song: "Love Affair With Life", note: "D5" },
    low: { song: "All About Our Love", note: "E3" },
    source: SINGING_CARROTS,
  },
  "scott-weiland": {
    high: { song: "Down", note: "C5" },
    low: { song: "And So I Know", note: "E2" },
    source: SINGING_CARROTS,
  },
  "sebastian-bach": {
    high: { song: "Youth Gone Wild", note: "G5" },
    source: SINGING_CARROTS,
  },
  "sharon-den-adel": {
    low: { song: "Stand My Ground", note: "C4" },
    source: SINGING_CARROTS,
  },
  "shirley-manson": {
    high: { song: "Only Happy When It Rains", note: "G5" },
    source: SINGING_CARROTS,
  },
  "sinead-oconnor": {
    high: { song: "Nothing Compares 2 U", note: "F5" },
    low: { song: "Back Where You Belong (Theme from The Water Horse)", note: "G3" },
    source: SINGING_CARROTS,
  },
  "thalia": {
    low: { song: "Rosas", note: "F3" },
    source: SINGING_CARROTS,
  },
};
