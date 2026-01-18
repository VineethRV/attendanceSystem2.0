const pool = require('./config/database');

async function addDefaultRoomColumn() {
  try {
    // Add defaultRoom column to class_student_map
    await pool.query(`
      ALTER TABLE class_student_map 
      ADD COLUMN defaultRoom VARCHAR(15) DEFAULT NULL
    `);
    console.log('✅ Successfully added defaultRoom column to class_student_map');
    
    // Check the updated structure
    const [rows] = await pool.query('DESCRIBE class_student_map');
    console.log('\nUpdated table structure:');
    rows.forEach(r => console.log(`  ${r.Field} - ${r.Type}`));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addDefaultRoomColumn();
