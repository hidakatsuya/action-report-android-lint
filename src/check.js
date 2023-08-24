const fs = require("fs")
const glob = require("@actions/glob")
const { XMLParser } = require("fast-xml-parser")
const group = require("array.prototype.group")

class Issue {
  /**
    * Example of parsed issue:
    * {
    *   '@_id': 'UnusedResources',
    *   '@_severity': 'Warning',
    *   '@_message': 'The resource `R.color.purple_200` appears to be unused',
    *   '@_category': 'Performance',
    *   '@_priority': '3',
    *   '@_summary': 'Unused resources',
    *   '@_explanation': 'Unused resources make applications larger and slow down builds.&#xA;&#xA;&#xA;The unused resource check can ignore tests. If you want to include resources that are only referenced from tests, consider packaging them in a test source set instead.&#xA;&#xA;You can include test sources in the unused resource check by setting the system property lint.unused-resources.include-tests =true, and to exclude them (usually for performance reasons), use lint.unused-resources.exclude-tests =true.&#xA;,',
    *   '@_errorLine1': '    <color name="purple_200">#FFBB86FC</color>',
    *   '@_errorLine2': '           ~~~~~~~~~~~~~~~~~',
    *   location: {
    *     '@_file': '/path/to/app/src/main/res/values/colors.xml',
    *     '@_line': '3',
    *     '@_column': '12'
    *   },
    *   Or
    *   location: [
    *     {
    *       '@_file': '/path/to/app/src/main/res/values/colors.xml',
    *       '@_line': '3',
    *       '@_column': '12'
    *     },
    *     {
    *       '@_file': '/path/to/app/src/main/res/values/colors.xml',
    *       '@_line': '4',
    *       '@_column': '12'
    *     }
    *   ]
    * }
    */
  static parse(issue) {
    let locations = issue.location
    if (!Array.isArray(locations)) locations = Array.of(locations)

    const issues = locations.map(location => {
      return new Issue({
        id: issue["@_id"],
        severity: issue["@_severity"],
        file: location["@_file"],
        lineNumber: location["@_line"],
        message: issue["@_message"],
        errorLine1: issue["@_errorLine1"],
        errorLine2: issue["@_errorLine2"]
      })
    })

    return issues
  }

  constructor({
    id,
    severity,
    file,
    lineNumber,
    message,
    errorLine1,
    errorLine2
  }) {
    this.id = id
    this.severity = severity
    this.file = file
    this.lineNumber = lineNumber
    this.message = message
    this.errorLine1 = errorLine1
    this.errorLine2 = errorLine2
  }

  get isError() {
    return this.severity === "Error"
  }

  get isWarning() {
    return this.severity === "Warning"
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

  return new Result(issues.flatMap(i => Issue.parse(i)))
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
