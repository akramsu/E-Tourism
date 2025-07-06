require('dotenv').config();

console.log('🔍 TourEase Environment Check');
console.log('=============================');
console.log('');

// Check database connection
console.log('📊 Database Configuration:');
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
console.log('');

// Check JWT configuration
console.log('🔐 Authentication Configuration:');
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
console.log('');

// Check Gemini API configuration
console.log('🤖 Gemini AI Configuration:');
const hasApiKey = process.env.GEMINI_API_KEY && 
                 process.env.GEMINI_API_KEY.trim() !== '' &&
                 process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';

if (hasApiKey) {
  console.log('   ✅ API Key: Configured');
  console.log(`   📝 Key Preview: ${process.env.GEMINI_API_KEY.substring(0, 8)}...${process.env.GEMINI_API_KEY.slice(-4)}`);
  console.log('   🎯 Status: Ready for AI-powered analytics');
} else {
  console.log('   ❌ API Key: Not configured or using placeholder');
  console.log('   📝 Current Value:', process.env.GEMINI_API_KEY || 'undefined');
  console.log('   🎯 Status: Will use fallback data');
  console.log('');
  console.log('   📋 To fix this:');
  console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
  console.log('   2. Edit server/.env file');
  console.log('   3. Replace "your-gemini-api-key-here" with your real key');
  console.log('   4. Restart the server');
}

console.log('');

// Check server configuration
console.log('⚙️  Server Configuration:');
console.log(`   PORT: ${process.env.PORT || 'default (5003)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'default'}`);
console.log('');

console.log('🚀 Next Steps:');
if (hasApiKey) {
  console.log('   1. Start the backend: npm run dev');
  console.log('   2. Test integration: node test-gemini-integration.js');
  console.log('   3. Open frontend and test period changes');
} else {
  console.log('   1. Configure Gemini API key in .env file');
  console.log('   2. Restart backend server');
  console.log('   3. Run this check again: node check-setup.js');
}
