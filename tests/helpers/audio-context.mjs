// Deterministic Web Audio substitute: records graph routing and absolute audio times.
export function installAudio(t,{resume=()=>Promise.resolve()}={}){
 const intervals=new Map();let nextTimer=0;
 const param=(value=0)=>({value,events:[],
  setValueAtTime(v,time){this.value=v;this.events.push(['value',v,time]);},
  exponentialRampToValueAtTime(v,time){this.value=v;this.events.push(['ramp',v,time]);},
  setTargetAtTime(v,time,constant){this.value=v;this.events.push(['target',v,time,constant]);},
  cancelScheduledValues(time){this.events.push(['cancel',time]);}
 });
 const oscillators=[];
 const node=()=>({connections:[],disconnected:false,connect(target){this.connections.push(target);return target;},disconnect(){this.disconnected=true;}});
 const ctx={currentTime:0,sampleRate:1000,state:'running',destination:node(),resume,
  createGain:()=>Object.assign(node(),{gain:param(1)}),
  createBiquadFilter:()=>Object.assign(node(),{frequency:param()}),
  createConvolver:node,
  createDynamicsCompressor:()=>Object.assign(node(),Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k=>[k,param()]))),
  createBuffer:(_,frames)=>({getChannelData:()=>new Float32Array(frames)}),
  createOscillator:()=>{const o=Object.assign(node(),{frequency:param(),starts:[],stops:[],start(time){this.starts.push(time);},stop(time){this.stops.push(time);}});oscillators.push(o);return o;}
 };
 t.mock.method(globalThis,'setInterval',fn=>{const id=++nextTimer;intervals.set(id,fn);return id;});
 t.mock.method(globalThis,'clearInterval',id=>intervals.delete(id));
 const audioDescriptor=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,writable:true,value:function(){return ctx;}});
 t.after(()=>{if(audioDescriptor)Object.defineProperty(globalThis,'AudioContext',audioDescriptor);else delete globalThis.AudioContext;});
 return {ctx,oscillators,intervals,tick(time){ctx.currentTime=time;for(const fn of [...intervals.values()])fn();}};
}
