const path = require("path")

function buildDetails(issuesEachFile, baseDir) {
  if (Object.keys(issuesEachFile).length === 0) return null

  let summaries = []

  for (const [file, issues] of Object.entries(issuesEachFile)) {
    summaries.push(
      "\n",
      `#### ${path.relative(baseDir, file)} (${issues.length} issues)`
    )

    issues.forEach(issue => {
      summaries.push(
        `* **Line#${issue.lineNumber}** - ${issue.message}`,
        "  ```",
        `  ${issue.errorLine1}`,
        `  ${issue.errorLine2}`,
        "  ```",
        ""
      )
    })
  }

  return summaries.join("\n")
}

async function report({ results, core, baseDir }) {
  core.summary.addHeading("Android Lint", 2)

  results.failuresEach(({ xmlPath, errors, warnings }) => {
    core.summary.addHeading(path.relative(baseDir, xmlPath), 3)

    const errorDetails = buildDetails(errors, baseDir)
    if (errorDetails !== null) {
      core.summary.addDetails("❌ Errors", errorDetails)
    }

    const warningDetails = buildDetails(warnings, baseDir)
    if (warningDetails !== null) {
      core.summary.addDetails("⚠️ Warnings", warningDetails)
    }
  })

  await core.summary.write()
}

module.exports = report
