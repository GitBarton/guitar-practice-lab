export const APP_VERSION = '1.2.0';
export const RELEASE_NOTES = [
  {
    version: '1.2.0', date: '2026-10-13', title: 'Dynamic technique and musical challenges',
    changes: [
      'Add staged picking practice with single-string precision, string skips, double-stops and octave targets.',
      'Expand major-pentatonic questions and answers with manually advanced musical stages.',
      'Introduce a G-string blues/rock vibrato drill for all four fretting fingers, including D/B muting and hammer-on/pull-off control.',
      'Clarify chromatic V7 third enclosures with the selected key and easier-to-read B-flat note spellings.',
      'Preserve the current tempo, metronome, 10%-step ratings, songs, session history, private sync and exports during stage changes.'
    ]
  },
  {
    version: '1.1.0', date: '2026-10-12', title: 'Precision and feedback',
    changes: [
      'Rate exercise execution from 0% to 100% in 10% steps, with one-tap choices and ±10% controls.',
      'Track average self-assessed quality and qualifying tempos while preserving older three-level ratings without inventing percentages.',
      'See version history directly in Guitar Practice Lab using the What’s new link.',
      'Use a compact practice layout: instructions alongside diagrams and metronome/timer on the right when space permits.',
      'Hide labels correctly on TAB and fretboard diagrams.',
      'Opt in to a separate development feedback queue; review changes via GitHub pull requests before deployment.',
      'A timer-completion chime and clearer exercise feedback were introduced during this release cycle.'
    ]
  },
  {
    version: '1.0.0', date: '2026-10-08', title: 'Initial release',
    changes: [
      'A local-first guitar practice workspace with guided 45-minute technique and repertoire sessions.',
      'TAB and fretboard views, metronome, twelve-key rotation and the Logos-Motive repertoire library.',
      'Progress reporting, JSON and CSV exports, and optional Supabase sync for multiple devices.'
    ]
  }
];
export const KEYS = ['C','F','Bb','Eb','Ab','Db','Gb','B','E','A','D','G'];
export const CATEGORIES = [
  ['picking','Picking & feel','Wrist motion, swing and low-tension control'],
  ['muting','Muting & precision','Both hands, clear attacks and intentional silence'],
  ['arpeggio','Arpeggios','CAGED-oriented triads and seventh chords'],
  ['pentatonic','Pentatonics','Musical phrasing with major and minor sounds'],
  ['jazz','Jazz vocabulary','ii–V–I, approach notes and enclosures'],
  ['comping','Comping & strumming','Shells, voicings, rhythm and chord releases'],
  ['ear','Ear & recall','Hear, sing and play before relying on the shape'],
];
export const SONGS = [
  {id:'a-train',title:'Take the A Train',focus:'Swing groove, guide tones, relaxed comping',notes:'Work the A-section transitions and four-bar phrase shapes.',suggested:'jazz-guide',meter:'4/4'},
  {id:'fly-me',title:'Fly Me to the Moon',focus:'Connected ii–V movement and steady swing',notes:'Link chord tones over the circle progression.',suggested:'jazz-251',meter:'4/4'},
  {id:'cant-help',title:"Can't Help Falling in Love",focus:'6/8 articulation, dynamic strumming, bass support',notes:'Your arrangement is in 6/8; aim for even groups of three.',suggested:'picking-triplets',meter:'6/8'},
  {id:'cest-si-bon',title:"C'est si bon",focus:'Bright chord attacks, vocal/guitar handoff',notes:'Previously marked complete in your arrangement workflow; maintain performance readiness.',suggested:'comp-release',meter:'4/4'},
  {id:'thats-amore',title:"That's Amore",focus:'Percussive clean strumming, consistent muted strings',notes:'Practice the rhythmic guitar figure without unwanted ringing.',suggested:'comp-rhythm',meter:'4/4'},
  {id:'autumn-leaves',title:'Autumn Leaves',focus:'Major/minor ii–V–I, guide-tone solos',notes:'Your tempo-map sections: 62 / 65 / 130 BPM. practice transitions separately.',suggested:'jazz-251',meter:'4/4'},
  {id:'all-of-me',title:'All of Me',focus:'Dominant resolutions and connected chord tones',notes:'Build two-bar phrases that end on the third of the next chord.',suggested:'jazz-enclosure',meter:'4/4'},
  {id:'wonderful-world',title:'What a Wonderful World',focus:'Lyrical pacing, restrained dynamics and clean releases',notes:'Previously marked complete; focus on repeatable live delivery.',suggested:'comp-shell',meter:'4/4'},
];
const D=(id,title,category,minutes,summary,instructions,kind,extra={})=>({id,title,category,minutes,summary,instructions,kind,...extra});
export const DRILLS = [
 D('picking-reset','Pick control: strings, skips and octave pairs','picking',5,'Keep a relaxed Jazz III / Jazz II grip while moving between note groups and damping unplayed strings.', ['Start with four quiet down/up strokes on a single G string.','Move to string skips, then gentle two-string grips and octave pairs; silence unwanted strings.','Return to one string and identify whether the wrist, palm or fingers caused any ghost notes.'],'single',{reference:['pick-grip','pick-motion','muting'],stages:[
{title:'One-string baseline',focus:'A relaxed grip is the priority, not speed.',instructions:['Play G-string fret 5 with tiny down/up strokes.','Stop every four notes to release hand/shoulder tension.'],exampleKind:'single'},
{title:'Controlled string skips',focus:'Unplayed strings must stay silent.',instructions:['Play A-string fret 5 → G-string fret 5 → B-string fret 6 → G-string fret 5.','Listen especially for unintended D-string noise.'],exampleKind:'skip'},
{title:'Double-stop control',focus:'Two intended notes at once, the other four strings quiet.',instructions:['Lightly strum G fret 5 and B fret 5 together. The TAB shows two fingering targets, not two separate rhythmic beats.','Repeat with soft and accented attacks; check low-string damping.'],exampleKind:'double-stop'},
{title:'Octave-pair control',focus:'Mute the intervening string during an octave grip.',instructions:['Play low E fret 8 and D fret 10 (two C notes) as an octave pair.','Keep the A string silent throughout the attack and release.'],exampleKind:'octave'},
{title:'Return to baseline',focus:'Verify that increased complexity did not introduce tension.',instructions:['Return to one G-string note and repeat at your original tempo.','Record whether the low strings still ring accidentally.'],exampleKind:'single'}
]}),
 D('picking-swing','Swing eighth-note alternate picking','picking',5,'Keep a continuous D–U cycle with controlled long-short phrasing.', ['Play two notes per beat with a loose, moderate swing ratio.','Accent musical phrases rather than every downstroke.','Move between adjacent strings without a large hopping motion.'],'swing',{reference:['pick-motion']}),
 D('picking-triplets','6/8 and triplet independence','picking',5,'Group six notes into two pulses, without squeezing the pick.', ['Count ONE-two-three FOUR-five-six.','Play alternate picking across two adjacent strings.','Try accents on 1 and 4 while keeping stroke size consistent.'],'triplet',{reference:['pick-motion']}),
 D('picking-escape','Efficient string-change motion','picking',5,'Test the smallest practical movement that clears neighboring strings.', ['Alternate across G and B, then skip from D to B.','Observe which strokes naturally clear the strings; do not force a large arc.','Prioritize low-tension repeatability over speed.'],'skip',{reference:['pick-motion']}),
 D('muting-one','Single-string isolation','muting',7,'Play one string at a time; silence all five others.', ['Play the G-string fifth fret, four consecutive strokes.','Rest the palm lightly on low strings when useful; use fretting-hand touch to silence nearby high strings.','Release each note on purpose, then repeat on D, B and high E.'],'single',{reference:['muting']}),
 D('muting-skip','Dm7 string skips with clean silence','muting',7,'D–C–F–C across A, G and B; no sympathetic ringing.', ['A-string fret 5 → G-string fret 5 → B-string fret 6 → G-string fret 5.','Keep the intermediate D string silent during the first jump.','Start straight, then swing; listen critically for all unwanted notes.'],'skip',{reference:['muting','pick-motion']}),
 D('muting-accent','Intentional note-off control','muting',7,'Play a short note, then silence it exactly on the next beat.', ['Alternate one sounded beat and one silent beat.','Try a fretting-hand pressure release, then subtle picking-hand damping.','Record any accidental string ringing as a precision issue.'],'single',{reference:['muting']}),
 D('muting-wide','Wide-skip accuracy','muting',7,'Cross two or more unused strings without catching them.', ['Alternate D string and high E string at one steady tempo.','Reduce the pick depth rather than gripping harder.','Change note lengths between staccato and legato while retaining string isolation.'],'wide',{reference:['muting','pick-motion']}),
 D('muting-vibrato-g','G-string vibrato: mute D and B with all four fingers','muting',7,'Sustain one G-string note while controlling nearby-string silence during blues/rock vibrato.', ['Keep the G string ringing; D and B must remain quiet.','Try a gentle wrist-driven motion with finger 1, 2, 3, then 4 separately.','Finish with G-string 5→7 hammer-on, 7→5 pull-off and vibrato; listen for unwanted D-string ghosting.'],'vibrato-g',{reference:['muting'],stages:[
{title:'Index finger (1)',focus:'Clear sustained G note without choking it.',instructions:['Fret G string at fret 5 (C) with finger 1, pick once, then add small relaxed vibrato.','Use light picking-hand damping of D and available fingers for B without touching the ringing G note.'],exampleKind:'vibrato-g',activeNote:0},
{title:'Middle finger (2)',focus:'Use a loose support finger only if it helps.',instructions:['Fret G string fret 6 (D♭) with finger 2. Start from a clean, held note.','Check whether finger 1 accidentally grazes the D string as your hand moves.'],exampleKind:'vibrato-g',activeNote:1},
{title:'Ring finger (3)',focus:'Manage your original D-string ghost-noise problem.',instructions:['Fret G string fret 7 (D) with finger 3; optional support from fingers 1 and 2.','If finger 1 follows the vibrato motion and plucks D, reduce its reach; damp D gently with the picking hand instead.'],exampleKind:'vibrato-g',activeNote:2},
{title:'Pinky (4)',focus:'Maintain a relaxed wrist with lighter vibrato width.',instructions:['Fret G string fret 8 (E♭) with finger 4; support it lightly if comfortable.','Keep D and B quiet without gripping harder or overstretching.'],exampleKind:'vibrato-g',activeNote:3},
{title:'Hammer-on → pull-off → vibrato',focus:'Do not lose muting when fingers 1 and 3 move rapidly.',instructions:['On G only: hammer finger 1 fret 5 to finger 3 fret 7; pull off to fret 5, then apply controlled vibrato.','Listen after each motion for D-string ghost notes and for accidentally choking the target G note.'],exampleKind:'vibrato-g',activeNote:4}
] }),
 D('muting-chord','Muted-string strumming test','muting',7,'Strike the intended chord strings without sounding the X-marked strings.', ['Use Dm7 x535xx then G7 3x34xx.','Strum on beats two and four only.','Check that your fretting fingers protect the adjacent strings.'],'chords',{reference:['muting','comping']}),
 D('arp-major','Major triad · two octaves','arpeggio',10,'Connect 1–3–5 shapes over two octaves, position by position.', ['Play ascending and descending with alternate picking.','Identify each note by scale degree before increasing tempo.','Finish with a two-bar melodic statement using the same tones.'],'arpeggio',{quality:'major',reference:['arpeggios']}),
 D('arp-minor','Minor triad · two octaves','arpeggio',10,'Connect 1–♭3–5 without squeezing during position shifts.', ['Use one clear starting root and follow the notes ascending through two octaves.','Sing the minor third before touching the guitar.','Resolve the ending to a chord tone in the next bar.'],'arpeggio',{quality:'minor',reference:['arpeggios']}),
 D('arp-maj7','Major seventh · two octaves','arpeggio',10,'1–3–5–7; practice secure B-string changes and guide tones.', ['Locate and name the major seventh before playing.','Keep a continuous D–U pattern through the string changes.','Make an ascending phrase, then answer descending.'],'arpeggio',{quality:'maj7',reference:['arpeggios']}),
 D('arp-m7','Minor seventh · two octaves','arpeggio',10,'1–♭3–5–♭7; hear the relation to the ii chord.', ['Play twice ascending / descending with a soft pick attack.','Accent the third or seventh as your melodic destination.','Finish on the nearest guide tone of the V chord.'],'arpeggio',{quality:'m7',reference:['arpeggios']}),
 D('arp-dom7','Dominant seventh · two octaves','arpeggio',10,'1–3–5–♭7; anticipate a resolution to I.', ['Play the chord tones and identify the third and flat seventh.','Approach the third from one chromatic semitone below.','Resolve the flat seventh downward by a semitone where the harmony permits.'],'arpeggio',{quality:'7',reference:['arpeggios','chromatic']}),
 D('arp-m7b5','Half-diminished · two octaves','arpeggio',10,'1–♭3–♭5–♭7; the minor-key ii chord.', ['Hear the diminished fifth against the root.','Shape a minor ii–V–i phrase with a target note on V.','Keep the right-hand motion small over string changes.'],'arpeggio',{quality:'m7b5',reference:['arpeggios']}),
 D('arp-dim','Diminished triad · two octaves','arpeggio',10,'1–♭3–♭5; hear the unstable fifth and resolve it.', ['Compare against the minor triad in the same register.','Identify the diminished fifth by ear before playing it.','End with a deliberate resolution into the next harmony.'],'arpeggio',{quality:'dim',reference:['arpeggios']}),
 D('arp-dim7','Diminished seventh · two octaves','arpeggio',10,'1–♭3–♭5–𝄫7; symmetrical minor-third steps.', ['Notice the equal three-semitone spacing.','Play one ascent, then invent a descending sequence.','Avoid turning every string change into a vertical hop.'],'arpeggio',{quality:'dim7',reference:['arpeggios']}),
 D('arp-aug','Augmented triad · two octaves','arpeggio',10,'1–3–♯5; a symmetrical major-third structure.', ['Play slowly and hear the raised fifth.','Try ending on the fifth before returning to the root.','Keep two common chord tones when moving toward the next harmony.'],'arpeggio',{quality:'aug',reference:['arpeggios']}),
 D('arp-3oct-major','Major triad · three octaves','arpeggio',10,'Occasional extended-register work, with shifts as needed.', ['Use a comfortable key and stop before reaching inaccessible upper frets.','Split the line into three one-octave fragments first.','Reassemble without forcing a fixed hand position.'],'arpeggio',{quality:'major',octaves:3,reference:['arpeggios']}),
 D('arp-3oct-minor','Minor triad · three octaves','arpeggio',10,'Occasional three-octave melodic expansion.', ['Sing the third, then climb in a controlled dynamic arc.','Allow planned position shifts and never force painful stretches.','Finish with a descending phrase in swing eighths.'],'arpeggio',{quality:'minor',octaves:3,reference:['arpeggios']}),
 D('penta-major','Major pentatonic: notes to musical phrases','pentatonic',4,'Hear and connect degrees 1–2–3–5–6 without getting stuck in one repeated fingering.', ['Find and play degrees 1, 2, 3, 5 and 6 slowly in the selected key.','Create a short four-note question (any four tones), pause, then answer it with a different four-note phrase.','Make the last note feel like a resolution; try a contrasting rhythm or position.'],'scale',{quality:'pentMajor',reference:['arpeggios'],stages:[
{title:'Map the five notes',focus:'Name degrees 1–2–3–5–6 before increasing speed.',instructions:['Ascend and descend once; point to each degree on the diagram.','Use an easy down/up pick motion.'],exampleKind:'scale'},
{title:'Make a four-note question',focus:'Rhythm gives a small group of notes musical direction.',instructions:['Choose ANY four pentatonic notes; play them as a one-bar phrase.','Leave a brief silence at the end.'],exampleKind:'scale'},
{title:'Answer the question',focus:'Make a new phrase that contrasts with the first.',instructions:['Change the rhythmic grouping, register or final note.','End confidently on degree 1 or 3 over the tonic chord.'],exampleKind:'scale'},
{title:'Shift and self-check',focus:'Transfer the idea without merely repeating a shape.',instructions:['Try the same question/answer one neck position higher or lower if comfortable.','Rate your phrasing, timing and relaxed transitions.'],exampleKind:'scale'}
]}),
 D('penta-minor','Minor pentatonic · melodic cells','pentatonic',4,'Use 1–♭3–4–5–♭7 without a repetitive box sound.', ['Change rhythm more than notes.','Create a 2-bar question and a 2-bar answer.','Practice a controlled rest between the phrases.'],'scale',{quality:'pentMinor',reference:['arpeggios']}),
 D('penta-string','Pentatonic string-skipping sequence','pentatonic',4,'A controlled skip is more important than speed.', ['Extract four notes from the selected pentatonic shape.','Play across non-adjacent strings using alternate picking.','Make the last two notes a melodic answer.'],'scale',{quality:'pentMinor',reference:['muting']}),

 D('study-chromatic-target','Chromatic enclosure → dominant third','jazz',7,'Upper and lower chromatic neighbours resolve onto the third of V7, followed by the third of I.',[
 'In C major use G7: C–B♭–B; the final B is the major third of G7. Transpose the four-note figure to today’s key.',
 'Play neighbour tones softly and accent the target. The diagram maps pitches, not a prescribed rhythm.',
 'Conclude with the I chord’s third, then repeat with a different rhythmic placement.'
 ],'reference-chromatic',{reference:['chromatic','ii-v-i']}),
 D('study-guide-tones','Guide-tone pathway: ii–V–I','jazz',7,'Connect each chord’s third and seventh across ii–V–I, using small voice-leading movements.',[
 'Over Dm7 → G7 → Cmaj7, identify F/C, B/F and E/B respectively. Transpose to today’s key.',
 'Alternate thirds and sevenths; anticipate the next chord before moving.',
 'Repeat as a sparse two-bar melody; then play over a metronome with rests.'
 ],'reference-guides',{reference:['ii-v-i','arpeggios']}),
 D('study-tritone-sub','Tritone substitution: common guide tones','jazz',7,'Compare V7 with ♭II7: both contain the same tritone, respelled.',[
 'In C, compare G7 (B and F) with D♭7 (C♭ and F); the guide-tone pitch classes are shared.',
 'Follow Dm7 → D♭7 → Cmaj7. The diagram shows a selected guide-tone line, not the entire chord voicings.',
 'Resolve chromatically into I and alternate conventional V7 and substitute ♭II7 by ear.'
 ],'reference-tritone',{reference:['ii-v-i','chromatic']}),
 D('jazz-251','ii–V–I chord-tone connection','jazz',10,'Link the 3rds and 7ths, then shape a two-bar phrase.', ['Sing the third of ii and find the nearest seventh of V.','Continue by semitone or whole-step to a guide tone on I.','Play one restrained melodic response with a rest.'],'ii-v-i',{reference:['ii-v-i','arpeggios']}),
 D('jazz-guide','Guide-tone voice leading','jazz',10,'Make guide-tone motion audible without extra notes.', ['Outline only 3rds and 7ths through ii–V–I.','Sing the resolution before playing.','Add one approach note when the basic line is secure.'],'ii-v-i',{reference:['ii-v-i']}),
 D('jazz-enclosure','Chromatic enclosure of the V7 third','jazz',10,'Surround the dominant chord’s major third with its upper and lower chromatic neighbors, then resolve on a strong beat.', ['In C major, V7 is G7 and its major third is B.','Play C (a semitone above B), then B♭ (a semitone below), then B (the target) on a strong beat.','Transpose to today’s key and resolve a short V7 phrase into the I chord.'],'enclosure',{reference:['chromatic','barry']}),
 D('jazz-approach','Chromatic approach to a chord tone','jazz',10,'Place a non-chord approach note on an offbeat.', ['Choose the third of the I chord as a landing tone.','Approach by a semitone below on the weak subdivision.','Continue with 3–5–7, preserving rhythmic clarity.'],'approach',{reference:['chromatic','barry'],stages:[
 {title:'Listen for the V7 third',focus:'The dominant third is a precise harmonic target.',instructions:['Choose the major third of the V7, not an arbitrary scale note.','Sing the target before playing the displayed guide tone.'],exampleKind:'target-third'},
 {title:'Chromatic approach cell',focus:'Use one semitone below the tonic third before landing on a strong beat.',instructions:['Play the lower chromatic neighbor followed by the major third of I.','Continue to the fifth and seventh with relaxed economy of motion.'],exampleKind:'approach'},
 {title:'Land on the tonic root',focus:'Resolve the phrase instead of repeating the same approach shape.',instructions:['Improvise a two-beat lead-in, then stop on the root of I.','Reveal the target to check pitch and articulation.'],exampleKind:'target-root'}
 ]}),
 D('jazz-barry','Barry Harris-inspired passing tones','jazz',10,'Add the chromatic major-seventh approach in a descending dominant scale.', ['Start on the dominant root and descend with a chromatic approach through the natural seventh to the flat seventh.','As even eighths, place the dominant chord tones on strong beats.','Sing the guide-tone resolution before playing; this is an entry point, not the full Barry Harris system.'],'barry',{reference:['barry','chromatic']}),
 D('comp-shell','ii–V–I shell voicings','comping',6,'Roots, thirds and sevenths with voice-leading.', ['Use compact three-note shells in a comfortable position.','Play on beats 2 and 4 with relaxed wrist movement.','Release pressure between chords without fully losing your shape.'],'chords',{reference:['comping']}),
 D('comp-rhythm','Swing comping and accents','comping',6,'Hear the rhythm between the chords; do not fill every beat.', ['Alternate attacks on beat 2 and beat 4.','Introduce a syncopated anticipation on the next pass.','Record whether any other strings rang.'],'chords',{reference:['comping','muting']}),
 D('comp-drop2','Drop-2 chord transitions','comping',6,'Compact four-note voicings with small voice-leading motion.', ['Start with a comfortable maj7 drop-2 grip.','Move to the nearest dominant or minor seventh shape.','Make every note ring intentionally, then mute as a unit.'],'chords',{reference:['comping']}),
 D('comp-release','Strum, release, silence','comping',6,'Controlled staccato and dynamics without unwanted strings.', ['One short chord on beat 2; release exactly afterward.','Repeat with a softer attack, same rhythm.','Check both string selection and release speed.'],'chords',{reference:['comping','muting']}),
 D('circle-recall','Circle of fourths and fifths: instant recall','ear',6,
 'Learn the movement of roots by fourths and fifths without relying on a visual chart.',
 ['Starting in today’s key, name the next root a perfect fourth above before looking at the diagram.','Check five consecutive roots; restart and work clockwise by fifths instead.','Say the notes out loud first, then locate each on the guitar in a comfortable register.'],'circle-fourths',{reference:['ear','ii-v-i'],stages:[
  {title:'Fourth-up roots',focus:'Recall the next root before revealing its position.',instructions:['In the selected key, go UP five semitones to find the next root.','Say five consecutive roots; use Next note only to check each answer.'],exampleKind:'circle-fourths'},
  {title:'Fifth-up roots',focus:'A fifth above is seven semitones higher, not a fourth.',instructions:['Start again on the selected root and name a perfect fifth above (seven semitones).','Continue around the circle in fifths; compare both directions.'],exampleKind:'circle-fifths'},
  {title:'Recall without labels',focus:'Build automatic recall before consulting TAB.',instructions:['Hide labels and say each new root aloud first.','Reveal labels to check, then repeat faster without rushing.'],exampleKind:'circle-fourths'}
 ]}),
 D('ear-third','Sing the third, then play','ear',3,'Hear major or minor quality before checking the fretboard.', ['Sound the root once.','Sing its major or minor third before playing it.','Verify with the guitar and repeat in today’s key.'],'ear',{reference:['ear']}),
 D('ear-guide','Hear the guide-tone resolution','ear',3,'Anticipate a V7 tone resolving to I.', ['Play the V7 third or seventh.','Sing the nearest tone of I that resolves it.','Play to verify; do not look at labels until afterward.'],'ear',{reference:['ii-v-i','ear'],stages:[
 {title:'Hear the third of V7',focus:'Find the dominant third by ear before viewing the target.',instructions:['Sing the major third of the V chord, then locate it on guitar.','Click Next note to compare with the highlighted target.'],exampleKind:'target-third'},
 {title:'Hear the seventh of V7',focus:'Hear the flat seventh pulling into the I chord.',instructions:['Sing the minor seventh of V7; think of its voice-leading resolution.','Play the displayed target and compare with what you sang.'],exampleKind:'target-seventh'},
 {title:'Resolve to the tonic',focus:'Finish with an audible and stable tonic root.',instructions:['Sing the key center without looking at labels.','Play the root of I and verify it using the note controls.'],exampleKind:'target-root'}
 ]}),
 D('ear-recall','Two-bar phrase recall','ear',3,'Remember and reproduce a phrase rather than sight-read.', ['Play an original two-bar cell.','Sing it back after a few seconds of silence.','Replay it from memory and compare.'],'ear',{reference:['ear']}),
];
// Pure helpers used by staged practice; old drills without stages behave as before.
export function stageCount(drill){return Array.isArray(drill?.stages)&&drill.stages.length>0?drill.stages.length:0;}
export function clampedStageIndex(drill,index){const count=stageCount(drill);return count?Math.max(0,Math.min(count-1,Number.isInteger(index)?index:0)):0;}
export function currentStage(drill,index=0){return stageCount(drill)?drill.stages[clampedStageIndex(drill,index)]:null;}
export const DRILL_BY_ID=Object.fromEntries(DRILLS.map(d=>[d.id,d]));
export const REFERENCES=[
 {id:'pick-grip',title:'Pick grip and tension',category:'Technique',takeaway:'Thumb and index stabilize; the wrist makes the stroke. Hold securely, not rigidly.',points:['Index gently curled, thumb across pick; a few millimetres of tip exposed.','Keep excess pressure low; relax between phrases.','Compare Jazz III and Jazz II on the same cell, not between every note.'],links:[['Troy Grady — motion tutorials','https://troygrady.com/primer/motion-tutorials/']]},
 {id:'pick-motion',title:'Alternate picking and escape motion',category:'Technique',takeaway:'Clear the strings without forcing large hopping strokes.',points:['USX: upstrokes escape; DSX: downstrokes escape; DBX: both escape.','Allow small forearm repositioning for larger skips.','Optimise for fluid motion and consistent sound, not artificially tiny strokes.'],links:[['Troy Grady — picking motion','https://troygrady.com/primer/motion-tutorials/'],['Efficient wrist motion','https://troygrady.com/2023/02/12/pickslanting-primer-update-getting-started-with-super-efficient-wrist-picking-motion/']]},
 {id:'muting',title:'Muting with both hands',category:'Technique',takeaway:'Silence is part of the phrase: stop unintended strings while preserving the desired note.',points:['Use fretting-hand fingertip edges for adjacent treble strings.','Rest the palm lightly on lower strings when needed; do not flatten the intended note.','practice the attack and note-off independently.'],links:[['Picking motion context','https://troygrady.com/primer/motion-tutorials/']]},
 {id:'arpeggios',title:'Arpeggios and fretboard mapping',category:'Harmony',takeaway:'Learn notes and guide tones within CAGED areas; connect to neighboring positions with intentional shifts.',points:['Triads: major 1–3–5; minor 1–♭3–5; diminished 1–♭3–♭5; augmented 1–3–♯5.','Sevenths: maj7 1–3–5–7; m7 1–♭3–5–♭7; 7 1–3–5–♭7; m7♭5 1–♭3–♭5–♭7; dim7 1–♭3–♭5–𝄫7.','The generated maps are suggested playable routes, not canonical fingerings; review comfort and intonation.'],links:[['Jens Larsen — arpeggios','https://jenslarsen.nl/the-3-most-important-arpeggios-for-jazz-2/']]},
 {id:'ii-v-i',title:'ii–V–I voice leading',category:'Jazz language',takeaway:'The third and seventh of each chord give a strong harmonic skeleton.',points:['In C: Dm7 → G7 → Cmaj7.','F of G7 resolves to E of Cmaj7; B of G7 can resolve to C.','Build a two-bar melody with rests instead of running constant arpeggios.'],links:[['Jens Larsen — ii–V–I arpeggios','https://jenslarsen.nl/how-to-start-soloing-over-a-ii-v-i-with-arpeggios/']]},
 {id:'chromatic',title:'Chromatic approaches and enclosures',category:'Jazz language',takeaway:'Target a chord tone on a strong subdivision; approach from the semitones around it.',points:['For G7, enclose its third B with C–A♯–B.','The enclosure notes are color tones, not all chord tones.','Make the last note a resolution; use rhythm to establish harmonic clarity.'],links:[['Jens Larsen — chromatic enclosures','https://jenslarsen.nl/5-chromatic-licks-chromatic-enclosures/']]},
 {id:'barry',title:'Barry Harris concepts — entry point',category:'Jazz language',takeaway:'Chromatic notes become musical when used to place key chord tones on strong beats.',points:['practice simple passing notes before complex sixth-diminished patterns.','Use a short descending scale fragment and check which notes land on beats.','Treat these as introductory exercises, not a complete reproduction of the Barry Harris system.'],links:[['Jens Larsen — Barry Harris approach','https://jenslarsen.nl/why-barry-harris-approach-is-so-much-better-than-bebop-scales/']]},
 {id:'comping',title:'Jazz comping mechanics',category:'Chords',takeaway:'Build compact voicings with intentional attacks, releases and relaxed right-hand rhythm.',points:['Start with root–third–seventh shells, then compact drop-2 voicings.','For muted-string strums, control the attack span and damp unused strings.','Use beats 2 and 4; later add syncopation without overcrowding the singer.'],links:[['Jens Larsen — jazz guitar lessons','https://jenslarsen.nl/']]},
 {id:'ear',title:'Integrate ear training',category:'Musicianship',takeaway:'Hear a target note, sing it, then confirm it on the instrument.',points:['Sing thirds and sevenths before playing.','Play the same two-bar idea in two neighboring keys.','Record a phrase, pause, reproduce without looking.'],links:[]},
];
export const REFERENCE_BY_ID=Object.fromEntries(REFERENCES.map(r=>[r.id,r]));
export const SESSION_DURATIONS=[30,45,60,75,90,120];
export const SESSION_MODES=[
 ['technique','Technique','Picking, muting, harmony and fundamentals'],
 ['repertoire','Song day','Repertoire, transitions and supporting technique'],
 ['soloing','Soloing','Arpeggios, pentatonics, melodic lines and phrasing'],
 ['comping','Comping','Rhythm, chords, shell voicings and clean releases'],
 ['ear','Ear training','Listening, singing, recall and chord awareness'],
 ['mixed','Mixed practice','A balanced combination of technique, jazz, ear and songs']
];
const TECH=[['picking-reset',5],['muting-skip',7],['arp-maj7',10],['penta-major',4],['jazz-251',10],['comp-shell',6],['ear-guide',3]];
const REP=[['picking-swing',4],['muting-one',5],['arp-m7',7],['jazz-enclosure',7],['comp-rhythm',7],['ear-recall',3],['song',12]];
const arps=['arp-maj7','arp-m7','arp-dom7','arp-major','arp-minor','arp-m7b5','arp-dim','arp-dim7','arp-aug','arp-3oct-major','arp-3oct-minor'];
const jazz=['jazz-251','jazz-guide','jazz-enclosure','jazz-approach','jazz-barry'];
const PLAN_LIBRARY={
 technique:[['picking-reset',5],['muting-skip',7],['arp-maj7',10],['penta-major',4],['jazz-251',10],['comp-shell',6],['ear-guide',3]],
 repertoire:[['picking-swing',4],['muting-one',5],['arp-m7',7],['jazz-enclosure',7],['comp-rhythm',7],['ear-recall',3],['song',12]],
 soloing:[['picking-swing',4],['arp-maj7',9],['penta-major',8],['jazz-approach',8],['jazz-enclosure',7],['jazz-barry',5],['ear-guide',4]],
 comping:[['picking-swing',4],['muting-chord',6],['comp-shell',10],['comp-rhythm',9],['comp-release',7],['jazz-guide',5],['song',4]],
 ear:[['ear-guide',9],['ear-recall',9],['jazz-guide',5],['ear-guide',7],['ear-recall',7],['penta-major',4],['song',4]],
 mixed:[['picking-reset',4],['muting-skip',5],['arp-maj7',7],['penta-major',6],['jazz-251',7],['comp-shell',6],['ear-guide',5],['song',5]]
};
function allocateMinutes(template,total){
 const weight=template.reduce((sum,item)=>sum+item[1],0);
 const units=template.map(([id,w],i)=>({id,minutes:Math.floor(total*w/weight),remainder:total*w/weight%1,i}));
 let remaining=total-units.reduce((sum,item)=>sum+item.minutes,0);
 for(const item of [...units].sort((a,b)=>b.remainder-a.remainder||a.i-b.i).slice(0,remaining))item.minutes++;
 return units.map(({id,minutes})=>({id,minutes,done:false}));
}
export function makeSession(dayNumber=0,mode='technique',songId='autumn-leaves',durationMinutes=45){
 const safeMode=Object.hasOwn(PLAN_LIBRARY,mode)?mode:'technique';
 const duration=SESSION_DURATIONS.includes(Number(durationMinutes))?Number(durationMinutes):45;
 const key=KEYS[((dayNumber%KEYS.length)+KEYS.length)%KEYS.length];
 // Preserve the long-standing 45-minute Technique/Song Day plans exactly.
 const template=safeMode==='technique'&&duration===45?TECH:safeMode==='repertoire'&&duration===45?REP:PLAN_LIBRARY[safeMode];
 const entries=allocateMinutes(template,duration);
 const arpeggio=entries.find(e=>e.id==='arp-maj7'||e.id==='arp-m7');
 if(arpeggio)arpeggio.id=arps[dayNumber%arps.length];
 const jazzEntry=entries.find(e=>e.id==='jazz-251'||e.id==='jazz-enclosure');
 if(jazzEntry)jazzEntry.id=jazz[dayNumber%jazz.length];
 const pent=entries.find(e=>e.id==='penta-major');
 if(pent)pent.id=dayNumber%2?'penta-minor':'penta-major';
 const mute=entries.find(e=>e.id==='muting-skip'||e.id==='muting-one');
 if(mute)mute.id=['muting-skip','muting-one','muting-wide','muting-chord','muting-accent'][dayNumber%5];
 return {id:globalThis.crypto?.randomUUID?.()||String(Date.now()),mode:safeMode,durationMinutes:duration,key,dayNumber,songId,entries,position:0,createdAt:new Date().toISOString(),startedAt:null,elapsedMs:0,notes:'',isFree:false};
}
