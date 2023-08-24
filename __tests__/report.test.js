const report = require("../src/report")
const core = require("@actions/core")
const { Issue, Result, Results } = require("../src/check")

const baseDir = "/path/to"

function buildIssue({ severity, identifier = 1 }) {
  return new Issue({
    id: "SomeError",
    file: `/path/to/app/src/source${identifier}.kt`,
    lineNumber: `${identifier}`,
    severity: severity,
    message: `Error message${identifier}`,
    summary: "Some Error",
    errorLine1: "line1",
    errorLine2: "line2"
  })
}

beforeEach(() => {
  core.summary.emptyBuffer()
  core.summary.write = jest.fn()
})

afterEach(() => {
  core.summary.write.mockReset()
})

describe("single result", () => {
  test("when the results is success", async () => {
    const result = new Result([])
    const results = new Results([{ path: "/path/to/app/build/result.xml", result }])

    await report({ results, core, baseDir })

    expect(core.summary.write.mock.calls.length).toEqual(1)

    const summary = core.summary.stringify()

    expect(summary).toMatch([
      "<h2>✅ Android Lint</h2>",
      "<p>No issue.</p>"
    ].join("\n"))

    expect(summary).not.toMatch("<h3>app/build/result.xml</h3>")
  })

  test("when the results is error", async () => {
    const result = new Result([buildIssue({ severity: "Error", identifier: 1 })])
    const results = new Results([{ path: "/path/to/app/build/result.xml", result }])

    await report({ results, core, baseDir })

    expect(core.summary.write.mock.calls.length).toEqual(1)

    const summary = core.summary.stringify()

    expect(summary).toMatch([
      "<h2>❌ Android Lint</h2>",
      "<h3>app/build/result.xml</h3>",
      "<details><summary>❌ Errors</summary>",
      "",
      "#### app/src/source1.kt (1 issues)",
      "* **Line#1** - SomeError: Error message1",
      "  ```",
      "  line1",
      "  line2",
      "  ```"
    ].join("\n"))

    expect(summary).not.toMatch("No issue")
    expect(summary).not.toMatch("Warnings")
  })

  test("when the results is warning", async () => {
    const result = new Result([buildIssue({ severity: "Warning", identifier: 2 })])
    const results = new Results([{ path: "/path/to/app/build/result.xml", result }])

    await report({ results, core, baseDir })

    expect(core.summary.write.mock.calls.length).toEqual(1)

    const summary = core.summary.stringify()

    expect(summary).toMatch([
      "<h2>⚠️ Android Lint</h2>",
      "<h3>app/build/result.xml</h3>",
      "<details><summary>⚠️ Warnings</summary>",
      "",
      "#### app/src/source2.kt (1 issues)",
      "* **Line#2** - SomeError: Error message2",
      "  ```",
      "  line1",
      "  line2",
      "  ```"
    ].join("\n"))

    expect(summary).not.toMatch("No issue")
    expect(summary).not.toMatch("Errors")
  })
})

test("multiple results", async () => {
  const results = new Results([
    {
      path: "/path/to/app/build/result1.xml",
      result: new Result([
        buildIssue({ identifier: 1, severity: "Error" }),
        buildIssue({ identifier: 2, severity: "Warning" })
      ])
    },
    {
      path: "/path/to/app/build/result2.xml",
      result: new Result([buildIssue({ identifier: 3, severity: "Error" })])
    }
  ])

  await report({ results, core, baseDir })

  expect(core.summary.write.mock.calls.length).toEqual(1)

  const summary = core.summary.stringify()

  expect(summary).toMatch([
    "<h2>❌ Android Lint</h2>",
    "<h3>app/build/result1.xml</h3>",
    "<details><summary>❌ Errors</summary>",
    "",
    "#### app/src/source1.kt (1 issues)",
    "* **Line#1** - SomeError: Error message1",
    "  ```",
    "  line1",
    "  line2",
    "  ```",
    "</details>",
    "<details><summary>⚠️ Warnings</summary>",
    "",
    "#### app/src/source2.kt (1 issues)",
    "* **Line#2** - SomeError: Error message2",
    "  ```",
    "  line1",
    "  line2",
    "  ```",
    "</details>",
    "<h3>app/build/result2.xml</h3>",
    "<details><summary>❌ Errors</summary>",
    "",
    "#### app/src/source3.kt (1 issues)",
    "* **Line#3** - SomeError: Error message3",
    "  ```",
    "  line1",
    "  line2",
    "  ```",
    "</details>"
  ].join("\n"))
})
