const fs = require('fs');
const initSqlJs = require('sql.js');
(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync('../../data/ai-notebook.db'));
  const r = db.exec('SELECT * FROM User');
  console.log(r.length ? r[0].values : 'NO USERS');
  db.close();
})();