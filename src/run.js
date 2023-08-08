const core = require("@actions/core");
const check = require("./check");
const report = require("./report");

module.exports = () => {
  try {
    const pathPattern = core.getInput("result-path")
    const ignoreWarning = core.getInput("ignore-warning")

    const results = check(pathPattern, { ignoreWarning });

    if (!results.isPassed) {
      report(results)
      core.setFailed("Android Lint issues found. Please check Job Summaries.")
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
