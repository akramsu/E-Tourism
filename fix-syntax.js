/**
 * Quick fix for the syntax error in authorityController.js
 */

const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'server', 'src', 'controllers', 'authorityController.js')

console.log('🔧 Fixing syntax error in authorityController.js...')

try {
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Find the problematic area and fix it
  // Look for the pattern where the return statement is missing a closing brace
  const problemPattern = /(\s+}\s+}\s+)\s+} catch \(error\) {/
  
  if (problemPattern.test(content)) {
    console.log('✅ Found the syntax error pattern')
    
    // Add the missing closing brace for the return statement
    content = content.replace(problemPattern, '$1\n\n  } catch (error) {')
    
    fs.writeFileSync(filePath, content, 'utf8')
    console.log('✅ Syntax error fixed!')
    console.log('🚀 You can now restart the server')
  } else {
    console.log('❌ Could not find the expected syntax error pattern')
  }
  
} catch (error) {
  console.error('❌ Error fixing file:', error.message)
}
