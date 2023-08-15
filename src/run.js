const core = require("@actions/core")
const { check } = require("./check")
const report = require("./report")

function initEnv() {
  const baseDir = process.env.GITHUB_WORKSPACE

  const pathPattern = core.getInput("result-path")
  const failOnWarning = isInputTrue(core.getInput("fail-on-warning"))
  const followSymbolicLinks = isInputTrue(core.getInput("follow-symbolic-links"))

  return { baseDir, pathPattern, failOnWarning, followSymbolicLinks }
}

function isInputTrue(input) {
  return input.toUpperCase() === "TRUE"
}

function setFailedOn(resultStatus, failOnWarning = true) {
  let failure = true

  if (resultStatus === "warning") {
    failure = failOnWarning
  } else {
    failure = resultStatus !== "success"
  }

  if (failure) {
    core.setFailed("Android Lint issues found. Please check Job Summaries.")
  }
}

async function run() {
  try {
    const {
      baseDir,
      pathPattern,
      failOnWarning,
      followSymbolicLinks
    } = initEnv()

    const results = await check({ pathPattern, followSymbolicLinks })

    await report({ results, core, baseDir })

    setFailedOn(results.status, failOnWarning)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = run
