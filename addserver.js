import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
import { v4 as uuid } from 'uuid';

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

await db.read();
db.data = db.data || {
  servers: []
}
await db.write();
db.chain = lodash.chain(db.data);

var privateid = uuid();
var publicid = uuid();
var notes = 'cluster, adminname, servername';

console.log('-----------------------------');
console.log('publicid:', publicid);
console.log('notes:', notes);
console.log('Config:');
console.log('___');
console.log('[HTTPLocation]');
console.log('privateid="' + privateid + '"');
console.log('url=""');

db.data.servers
    .push({
    privateid: privateid,
    publicid: publicid,
    notes: notes
  });
await db.write();