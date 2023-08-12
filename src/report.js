const path = require("path")

function buildDetails(issuesEachFile, baseDir) {
  if (Object.keys(issuesEachFile).length === 0) return null

  let summaries = []

  for (const [file, issues] of Object.entries(issuesEachFile)) {
    summaries.push("\n")
    summaries.push(`#### ${path.relative(baseDir, file)} (${issues.length} issues)`)

    issues.forEach(issue => {
      summaries.push(`* **Line#${issue.lineNumber}** - ${issue.message}`)
      summaries.push("  ```")
      summaries.push(`  ${issue.errorLine1}`)
      summaries.push(`  ${issue.errorLine2}`)
      summaries.push("  ```")
      summaries.push("")
    })
  }

  return summaries.join("\n")
}

async function report({ results, core, baseDir }) {
  core.summary.addHeading("Android Lint", 2)

  results.failuresEach(({ xmlPath, errors, warnings }) => {
    core.summary.addHeading(path.relative(baseDir, xmlPath), 3)

    const errorDetails = buildDetails(errors, baseDir)
    if (errorDetails) {
      core.summary.addDetails("❌ Errors", errorDetails)
    }

    const warningDetails = buildDetails(warnings, baseDir)
    if (warningDetails) {
      core.summary.addDetails("⚠️ Warnings", warningDetails)
    }
  })

  await core.summary.write()
}

module.exports = report
