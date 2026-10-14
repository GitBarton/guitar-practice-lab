// Local-first user-created repertoire. Custom song definitions are kept as
// versioned practice records, so existing JSON exports/imports and authenticated
// Supabase syncing use the same record pipeline. No MP3 bytes are ever persisted.
import {DRILL_BY_ID,SONGS} from './data.js';
import {uid} from './storage.js';
export const CUSTOM_SONG_KIND='custom-song';
export const SONG_METERS=['4/4','3/4','6/8','5/4','7/8','2/4','12/8'];
export const MAX_USER_SONGS=250;
const clean=(value,max)=>String(value??'').trim().replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').slice(0,max);
const normalized=title=>clean(title,120).toLocaleLowerCase();
export function manualSongs(records=[],builtins=SONGS){
 const saved=new Map(),protectedIds=new Set(builtins.map(song=>song.id));
 for(const record of Array.isArray(records)?records:[]){
  if(record?.kind!==CUSTOM_SONG_KIND)continue;
  const p=record.payload||{};
  if(typeof p.id!=='string'||!/^custom-[a-zA-Z0-9-]{8,90}$/.test(p.id)||protectedIds.has(p.id))continue;
  const title=clean(p.title,120);
  if(!title)continue;
  const meter=SONG_METERS.includes(p.meter)?p.meter:'4/4';
  const suggested=DRILL_BY_ID[p.suggested]?p.suggested:'jazz-guide';
  const song={id:p.id,title,focus:clean(p.focus,220)||'Personal repertoire study',
   notes:clean(p.notes,1000)||'Add a passage or arrangement goal.',
   meter,suggested,manual:true,
   initialKey:clean(p.initialKey,24),
   initialTempo:Number.isInteger(p.initialTempo)&&p.initialTempo>=30&&p.initialTempo<=260?p.initialTempo:null};
  saved.set(p.id,song); // most recently synced entry wins; ordered records are chronological
 }
 return [...saved.values()].sort((a,b)=>a.title.localeCompare(b.title));
}
export function completeSongLibrary(records=[],builtins=SONGS){
 return [...builtins,...manualSongs(records,builtins)];
}
export function newCustomSong(data,existing=[],createUid=uid){
 const title=clean(data?.title,120),focus=clean(data?.focus,220),notes=clean(data?.notes,1000);
 if(!title)throw Error('Enter a song title (up to 120 characters).');
 if(existing.length>=MAX_USER_SONGS+SONGS.length)throw Error('Your custom song library has reached its 250-song limit.');
 if(existing.some(s=>normalized(s.title)===normalized(title)))throw Error('That song title is already in your repertoire. Open the existing song or use a distinguishing arrangement title.');
 const meter=SONG_METERS.includes(data?.meter)?data.meter:'4/4';
 const suggested=DRILL_BY_ID[data?.suggested]?data.suggested:'jazz-guide';
 const initialKey=clean(data?.initialKey,24);
 const tempoText=String(data?.initialTempo??'').trim();
 const initialTempo=tempoText===''?null:Number(tempoText);
 if(initialTempo!==null&&(!Number.isInteger(initialTempo)||initialTempo<30||initialTempo>260))
  throw Error('Target tempo must be 30–260 BPM or left empty.');
 const generated=String(createUid());
 if(!/^[a-zA-Z0-9-]{8,90}$/.test(generated))throw Error('Could not generate a safe song identifier.');
 return {
  id:'custom-'+generated,title,
  focus:focus||'Personal repertoire study',
  notes:notes||'Add a passage or arrangement goal.',
  meter,suggested,initialKey,initialTempo
 };
}
