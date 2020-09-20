const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const uuid = require('uuid').v4;

const adapter = new FileSync('db.json');
const db = low(adapter);

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

db.get('servers')
  .push({
    privateid: privateid,
    publicid: publicid,
    notes: notes
  })
  .write();