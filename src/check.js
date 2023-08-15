const fs = require("fs")
const glob = require("@actions/glob")
const { XMLParser } = require("fast-xml-parser")
const group = require("array.prototype.group")

class Issue {
  /**
    * Example of parsed issue:
    * {
    *   location: {
    *     '@_file': '/path/to/app/src/main/res/values/colors.xml',
    *     '@_line': '3',
    *     '@_column': '12'
    *   },
    *   '@_id': 'UnusedResources',
    *   '@_severity': 'Warning',
    *   '@_message': 'The resource `R.color.purple_200` appears to be unused',
    *   '@_category': 'Performance',
    *   '@_priority': '3',
    *   '@_summary': 'Unused resources',
    *   '@_explanation': 'Unused resources make applications larger and slow down builds.&#xA;&#xA;&#xA;The unused resource check can ignore tests. If you want to include resources that are only referenced from tests, consider packaging them in a test source set instead.&#xA;&#xA;You can include test sources in the unused resource check by setting the system property lint.unused-resources.include-tests =true, and to exclude them (usually for performance reasons), use lint.unused-resources.exclude-tests =true.&#xA;,',
    *   '@_errorLine1': '    <color name="purple_200">#FFBB86FC</color>',
    *   '@_errorLine2': '           ~~~~~~~~~~~~~~~~~'
    * }
    */
  constructor(issue) {
    this.issue = issue
  }

  attr(name) {
    return this.issue[`@_${name}`]
  }

  get severity() {
    return this.attr("severity")
  }

  get isError() {
    return this.severity === "Error"
  }

  get isWarning() {
    return this.severity === "Warning"
  }

  get file() {
    return this.issue.location["@_file"]
  }

  get lineNumber() {
    return this.issue.location["@_line"]
  }

  get message() {
    return `${this.attr("id")}: ${this.attr("message")}`
  }

  get errorLine1() {
    return this.attr("errorLine1")
  }

  get errorLine2() {
    return this.attr("errorLine2")
  }
}

class Result {
  #status = null
  #errors = null
  #warnings = null

  constructor(issues) {
    this.issues = issues
    this.#initStatus()
  }

  get status() {
    return this.#status
  }

  get errors() {
    this.#errors ??= this.issues.filter(issue => issue.isError)
    return this.#errors
  }

  get warnings() {
    this.#warnings ??= this.issues.filter(issue => issue.isWarning)
    return this.#warnings
  }

  #initStatus() {
    if (this.errors.length > 0) {
      this.#status = "error"
    } else if (this.warnings.length > 0) {
      this.#status = "warning"
    } else {
      this.#status = "success"
    }
  }
}

class Results {
  constructor(results) {
    this.results = results
    this.#initStatus()
    this.#initFailures()
  }

  failuresEach(fn) {
    this.failures.forEach(({ path, result }) => {
      const { errors, warnings } = result

      fn({
        xmlPath: path,
        errors: this.#groupIssuesByFile(errors),
        warnings: this.#groupIssuesByFile(warnings)
      })
    })
  }

  #groupIssuesByFile(issues) {
    return group(issues, ({ file }) => file)
  }

  #initStatus() {
    const statsues = this.results.map(({ result }) => result.status)

    if (statsues.includes("error")) {
      this.status = "error"
    } else if (statsues.includes("warning")) {
      this.status = "warning"
    } else {
      this.status = "success"
    }
  }

  #initFailures() {
    this.failures = this.results.filter(({ result }) => {
      return result.status !== "success"
    })
  }
}

function parse(xmlData) {
  const parser = new XMLParser({
    trimValues: false,
    ignoreAttributes: false,
    ignoreDeclaration: true,
    tagValueProcessor: () => ""
  })

  const json = parser.parse(xmlData)

  if (json.issues === undefined) {
    throw new Error("Unexpected structure XML file")
  }

  let issues = json.issues.issue ?? []
  if (!Array.isArray(issues)) {
    issues = Array.of(issues)
  }

  return new Result(issues.map(i => new Issue(i)))
}

async function fetchXML(pathPattern, followSymbolicLinks) {
  const pattern = Array.isArray(pathPattern) ? pathPattern.join("\n") : pathPattern
  const globber = await glob.create(pattern, { followSymbolicLinks })
  const paths = await globber.glob()

  return paths.map(path => {
    const data = fs.readFileSync(path, { encoding: "utf-8" })
    return { path, data }
  })
}

async function check({ pathPattern, followSymbolicLinks = true }) {
  const xmls = await fetchXML(pathPattern, followSymbolicLinks)

  if (xmls.length === 0) {
    throw new Error(`No XML file found: ${pathPattern}`)
  }

  const results = xmls.map(({ path, data }) => {
    return { path, result: parse(data) }
  })

  return new Results(results)
}

module.exports = {
  check,
  Issue,
  Result,
  Results
}
