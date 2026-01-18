const pool = require('./config/database');

async function checkSchema() {
  try {
    const [rows] = await pool.query('DESCRIBE class_student_map');
    console.log('Table structure:');
    rows.forEach(r => console.log(`  ${r.Field} - ${r.Type}`));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSchema();
