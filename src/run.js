const core = require("@actions/core")
const { check } = require("./check")
const report = require("./report")

function isInputTrue(input) {
  return input.toUpperCase() === "TRUE"
}

async function run() {
  try {
    const pathPattern = core.getInput("result-path")
    const ignoreWarning = isInputTrue(core.getInput("ignore-warning"))
    const followSymbolicLinks = isInputTrue(core.getInput("follow-symbolic-links"))

    const baseDir = process.env.GITHUB_WORKSPACE

    const results = await check({ pathPattern, ignoreWarning, followSymbolicLinks })

    if (!results.isPassed) {
      await report({ results, core, baseDir })
      core.setFailed("Android Lint issues found. Please check Job Summaries.")
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = run
