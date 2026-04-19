import * as core from "@actions/core"
import { check } from "./check.mjs"
import report from "./report.mjs"

function initEnv(coreImpl) {
  const baseDir = process.env.GITHUB_WORKSPACE

  const pathPattern = coreImpl.getInput("result-path")
  const failOnWarning = isInputTrue(coreImpl.getInput("fail-on-warning"))
  const followSymbolicLinks = isInputTrue(coreImpl.getInput("follow-symbolic-links"))

  return { baseDir, pathPattern, failOnWarning, followSymbolicLinks }
}

function isInputTrue(input) {
  return input.toUpperCase() === "TRUE"
}

function setFailedOn(coreImpl, resultStatus, failOnWarning = true) {
  let failure = true

  if (resultStatus === "warning") {
    failure = failOnWarning
  } else {
    failure = resultStatus !== "success"
  }

  if (failure) {
    coreImpl.setFailed("Android Lint issues found. Please check Job Summaries.")
  }
}

function failureMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

export function createRun({
  coreImpl = core,
  checkFn = check,
  reportFn = report
} = {}) {
  return async function run() {
    try {
      const {
        baseDir,
        pathPattern,
        failOnWarning,
        followSymbolicLinks
      } = initEnv(coreImpl)

      const results = await checkFn({ pathPattern, followSymbolicLinks })

      await reportFn({ results, core: coreImpl, baseDir })

      setFailedOn(coreImpl, results.status, failOnWarning)
    } catch (error) {
      coreImpl.setFailed(failureMessage(error))
    }
  }
}

const run = createRun()

export default run
