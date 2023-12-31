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
      summaries.push(buildIssueDetail(issue))
    })
  }

  return summaries.join("\n")
}

function buildIssueDetail(issue) {
  const detail = []

  if (issue.lineNumber) {
    detail.push(`* **Line#${issue.lineNumber}** - ${issue.id}: ${issue.message}`)
  } else {
    detail.push(`* ${issue.id}: ${issue.message}`)
  }

  if (issue.errorLine1 && issue.errorLine2) {
    detail.push(
      "  ```",
      `  ${issue.errorLine1}`,
      `  ${issue.errorLine2}`,
      "  ```"
    )
  }
  detail.push("")

  return detail.join("\n")
}

function resultIcon(resultStatus) {
  switch (resultStatus) {
    case "error":
      return "❌"
    case "warning":
      return "⚠️"
    case "success":
      return "✅"
    default:
      throw new Error(`Invalid result status: ${results.status}`)
  }
}

async function report({ results, core, baseDir }) {
  core.summary.addHeading(`${resultIcon(results.status)} Android Lint`, 2)

  if (results.failures.length === 0) {
    core.summary.addRaw(core.summary.wrap("p", "No issue."))
  } else {
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
  }
  await core.summary.write()
}

module.exports = report
