const initSqlJs = require('sql.js');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const SQL = await initSqlJs();
  const dbPath = path.resolve(__dirname, 'data', 'ai-notebook.db');
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_drizzle_%' ORDER BY name");
  if (tables.length > 0) {
    const names = tables[0].values.map(r => r[0]);
    console.log('用户表:', JSON.stringify(names));
  } else {
    console.log('没有找到表');
  }
  db.close();
})();
