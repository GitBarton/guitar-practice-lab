import test from 'node:test';
import assert from 'node:assert/strict';
import {ChordBacking} from '../backing-audio.js';
test('live backing volume updates do not restart the transport',()=>{
 const b=new ChordBacking();let value=null;
 b.ctx={currentTime:12};b.masterBus={gain:{setTargetAtTime:(...args)=>{value=args;}}};
 b.playing=true;b.barNumber=7;
 b.setVolume(.5);
 assert.deepEqual(value,[.44,12,.025]);assert.equal(b.barNumber,7);assert.equal(b.playing,true);
 b.setVolume(500);assert.equal(b.masterVolume,1);
});
