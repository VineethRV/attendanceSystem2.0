/**
 * Test file for datetime utility functions
 * Run with: node backend/utils/datetime.test.js
 */

const {
  encodeDtime,
  decodeDtime,
  encodeDayTime,
  decodeDayTime,
  getDayName,
  getDayNumber,
  getSlotName
} = require('./datetime');

console.log('=== Testing Dtime Functions (Date-based) ===\n');

// Test encodeDtime
console.log('1. Testing encodeDtime:');
try {
  console.log('   encodeDtime("18/01/26", 3):', encodeDtime("18/01/26", 3));
  console.log('   encodeDtime("25/12/25", 6):', encodeDtime("25/12/25", 6));
  console.log('   encodeDtime("01/01/24", 1):', encodeDtime("01/01/24", 1));
  console.log('   ✅ encodeDtime tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

// Test decodeDtime
console.log('2. Testing decodeDtime:');
try {
  console.log('   decodeDtime("180126:3"):', JSON.stringify(decodeDtime("180126:3")));
  console.log('   decodeDtime("251225:6"):', JSON.stringify(decodeDtime("251225:6")));
  console.log('   decodeDtime("010124:1"):', JSON.stringify(decodeDtime("010124:1")));
  console.log('   ✅ decodeDtime tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

// Test round-trip conversion
console.log('3. Testing round-trip conversion (encode -> decode):');
try {
  const original = { date: "18/01/26", slot: 3 };
  const encoded = encodeDtime(original.date, original.slot);
  const decoded = decodeDtime(encoded);
  console.log('   Original:', JSON.stringify(original));
  console.log('   Encoded:', encoded);
  console.log('   Decoded:', JSON.stringify(decoded));
  console.log('   Match:', JSON.stringify(original) === JSON.stringify(decoded) ? '✅' : '❌');
  console.log();
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

console.log('=== Testing DayTime Functions (classroom_time_map) ===\n');

// Test encodeDayTime
console.log('4. Testing encodeDayTime:');
try {
  console.log('   encodeDayTime(1, 6):', encodeDayTime(1, 6), '(Monday, Slot 6)');
  console.log('   encodeDayTime(3, 2):', encodeDayTime(3, 2), '(Wednesday, Slot 2)');
  console.log('   encodeDayTime(6, 1):', encodeDayTime(6, 1), '(Saturday, Slot 1)');
  console.log('   ✅ encodeDayTime tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

// Test decodeDayTime
console.log('5. Testing decodeDayTime:');
try {
  console.log('   decodeDayTime("1:6"):', JSON.stringify(decodeDayTime("1:6")));
  console.log('   decodeDayTime("3:2"):', JSON.stringify(decodeDayTime("3:2")));
  console.log('   decodeDayTime("6:1"):', JSON.stringify(decodeDayTime("6:1")));
  console.log('   ✅ decodeDayTime tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

// Test round-trip conversion for DayTime
console.log('6. Testing round-trip conversion (encode -> decode):');
try {
  const original = { day: 1, slot: 6 };
  const encoded = encodeDayTime(original.day, original.slot);
  const decoded = decodeDayTime(encoded);
  console.log('   Original:', JSON.stringify(original));
  console.log('   Encoded:', encoded);
  console.log('   Decoded:', JSON.stringify(decoded));
  console.log('   Match:', JSON.stringify(original) === JSON.stringify(decoded) ? '✅' : '❌');
  console.log();
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

console.log('=== Testing Helper Functions ===\n');

// Test getDayName
console.log('7. Testing getDayName:');
try {
  for (let day = 1; day <= 6; day++) {
    console.log(`   getDayName(${day}): ${getDayName(day)}`);
  }
  console.log('   ✅ getDayName tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

// Test getDayNumber
console.log('8. Testing getDayNumber:');
try {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  days.forEach(day => {
    console.log(`   getDayNumber("${day}"): ${getDayNumber(day)}`);
  });
  console.log('   ✅ getDayNumber tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

// Test getSlotName
console.log('9. Testing getSlotName:');
try {
  for (let slot = 1; slot <= 6; slot++) {
    console.log(`   getSlotName(${slot}): ${getSlotName(slot)}`);
  }
  console.log('   ✅ getSlotName tests passed\n');
} catch (error) {
  console.log('   ❌ Error:', error.message, '\n');
}

console.log('=== Testing Error Handling ===\n');

// Test invalid inputs
console.log('10. Testing error handling:');

try {
  encodeDtime("invalid", 3);
} catch (error) {
  console.log('   ✅ encodeDtime caught error:', error.message);
}

try {
  encodeDtime("18/01/26", 7);
} catch (error) {
  console.log('   ✅ encodeDtime caught error:', error.message);
}

try {
  decodeDtime("invalid");
} catch (error) {
  console.log('   ✅ decodeDtime caught error:', error.message);
}

try {
  encodeDayTime(7, 1);
} catch (error) {
  console.log('   ✅ encodeDayTime caught error:', error.message);
}

try {
  decodeDayTime("invalid");
} catch (error) {
  console.log('   ✅ decodeDayTime caught error:', error.message);
}

console.log('\n=== All Tests Complete ===');
