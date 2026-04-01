const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

try {
  console.log('📁 Copying latest report...');

  // 🔹 SOURCE (your Playwright project)
  const source = path.join(__dirname, 'ortoni-report');

  // 🔹 DESTINATION (your GitHub repo folder)
  const destination = 'D:/Regression_CM'; // ⚠️ your repo local path

  // 🔹 Remove old report in repo
  fs.removeSync(path.join(destination, 'ortoni-report'));

  // 🔹 Copy new report
  fs.copySync(source, path.join(destination, 'ortoni-report'));

  console.log('✅ Report copied');

  // 🔹 Move to repo folder
  process.chdir(destination);

  // 🔹 Git commands
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "Auto update report - ${new Date().toLocaleString()}"`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });

  console.log('🚀 Report pushed to GitHub successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
}