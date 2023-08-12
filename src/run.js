const core = require("@actions/core")
const { check } = require("./check")
const report = require("./report")

async function run() {
  try {
    const pathPattern = core.getInput("result-path")
    const ignoreWarning = core.getInput("ignore-warning").toString() === 'true'
    const baseDir = process.env.GITHUB_WORKSPACE

    const results = check({ pathPattern, ignoreWarning })

    if (!results.isPassed) {
      await report({ results, core, baseDir })
      core.setFailed("Android Lint issues found. Please check Job Summaries.")
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = run
