const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendEmail() {
  // 🔹 Read Playwright JSON report
  const rawData = fs.readFileSync("test-results/results.json", "utf-8");
  const results = JSON.parse(rawData);

  let total = 0;
  let passed = 0;
  let failed = 0;
  let failedTests = [];
  let attachments = [];

  // 🛑 FIX: Recursive function to find ALL tests, even inside nested test.describe blocks
  function processSuite(suite) {
    // 1. Process specs in the current suite
    if (suite.specs) {
      suite.specs.forEach(spec => {
        spec.tests.forEach(test => {
          total++;
          
          // Get the last result in case there were auto-retries
          const result = test.results[test.results.length - 1]; 
          const status = result.status;

          if (status === "passed" || status === "expected") {
            passed++;
          } else {
            failed++;
            failedTests.push(spec.title);

            // 🔥 Attach screenshots
            if (result.attachments) {
              result.attachments.forEach(att => {
                if (att.name === "screenshot" && att.path) {
                  attachments.push({
                    filename: path.basename(att.path),
                    path: att.path
                  });
                }
              });
            }
          }
        });
      });
    }

    // 2. Recursively process any nested suites (test.describe blocks)
    if (suite.suites) {
      suite.suites.forEach(processSuite);
    }
  }

  // Start processing from the top level
  if (results.suites) {
    results.suites.forEach(processSuite);
  }

  const reportLink = "https://Naveen-1a.github.io/Regression_CM/ortoni-report/";

  // 🔹 Email setup
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "naveen.s@elblearning.com",
      pass: "vmuuqltbcvdwgbpf"
    }
  });

  // 🔹 Enhanced Email HTML
  let mailOptions = {
    from: "naveen.s@elblearning.com",
    to: "naveen.s@elblearning.com",
    subject: `Playwright Report | Passed: ${passed}, Failed: ${failed}`,
    html: `
    <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">

      <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

        <h2 style="text-align:center; color:#2E86C1;">🚀 Playwright Test Report</h2>

        <p>Hello Team,</p>
        <p>The test execution has been completed. Here is the summary:</p>

        <div style="display:flex; justify-content:space-between; margin:20px 0;">
          
          <div style="flex:1; margin-right:10px; padding:15px; background:#eef2ff; border-radius:8px; text-align:center;">
            <p style="margin:0; font-size:14px;">Total</p>
            <h3 style="margin:5px 0;">${total}</h3>
          </div>

          <div style="flex:1; margin-right:10px; padding:15px; background:#e6ffed; border-radius:8px; text-align:center;">
            <p style="margin:0; font-size:14px;">Passed</p>
            <h3 style="margin:5px 0; color:green;">${passed}</h3>
          </div>

          <div style="flex:1; padding:15px; background:#ffe6e6; border-radius:8px; text-align:center;">
            <p style="margin:0; font-size:14px;">Failed</p>
            <h3 style="margin:5px 0; color:red;">${failed}</h3>
          </div>

        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <tr>
            <td style="padding:8px;"><b>Execution Time</b></td>
            <td style="padding:8px;">${new Date().toLocaleString()}</td>
          </tr>
        </table>

        ${
          failed > 0
            ? `
            <div style="background:#fff5f5; padding:15px; border-radius:8px; border:1px solid #ffcccc;">
              <h3 style="color:red; margin-top:0;">❌ Failed Tests</h3>
              <ul>
                ${failedTests.map(test => `<li>${test}</li>`).join("")}
              </ul>
            </div>
            `
            : `
            <div style="background:#f0fff4; padding:15px; border-radius:8px; border:1px solid #b7f5c5;">
              <p style="color:green; margin:0;">✅ All tests passed successfully</p>
            </div>
            `
        }

        <div style="text-align:center; margin:25px 0;">
          <a href="${reportLink}" 
             style="background:#28a745; color:white; padding:12px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">
             🔍 View Full Report
          </a>
        </div>

        <p style="font-size:12px; color:#666;">
          Report Link:<br/>
          <a href="${reportLink}">${reportLink}</a>
        </p>

        <p>Thanks,<br/>Naveen S</p>

      </div>
    </div>
    `,
    attachments: attachments
  };

  await transporter.sendMail(mailOptions);

  console.log("✅ Enhanced email sent successfully with all " + total + " tests counted!");
}

sendEmail();