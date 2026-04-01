const { execSync } = require('child_process');

try {
  console.log('📤 Pushing latest report to GitHub...');

  // 🔹 Add all changes
  execSync('git add .', { stdio: 'inherit' });

  // 🔹 Commit (skip if nothing changed)
  try {
    execSync(`git commit -m "Auto update report - ${new Date().toLocaleString()}"`, { stdio: 'inherit' });
  } catch (err) {
    console.log('⚠️ No changes to commit');
  }

  // 🔹 Push to GitHub
  execSync('git push', { stdio: 'inherit' });

  console.log('🚀 Report pushed successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
}