const report = require("../src/report")
const core = require("@actions/core")
const { Issue, Result, Results } = require("../src/check")

const baseDir = "/path/to"

function buildIssue(no = 1) {
  return new Issue({
    location: {
      "@_file": `/path/to/app/src/source${no}.kt`,
      "@_line": `${no}`,
    },
    "@_id": "SomeError",
    "@_severity": "Warning",
    "@_message": `Error message${no}`,
    "@_summary": "Some Error",
    "@_errorLine1": "line1",
    "@_errorLine2": "line2"
  })
}

beforeEach(() => {
  core.summary.write = jest.fn()
})

test("single result", async () => {
  const result = new Result([buildIssue()])
  const results = new Results([{ path: "/path/to/app/build/result.xml", result }])

  await report({ results, core, baseDir })

  expect(core.summary.write.mock.calls.length).toEqual(1)

  const summary = core.summary.stringify()

  expect(summary).toMatch("<h2>Android Lint</h2>")
  expect(summary).toMatch("<h3>app/build/result.xml</h3>")
  expect(summary).toMatch("<details><summary>⚠️ Warnings</summary>")
  expect(summary).toMatch("#### app/src/source1.kt (1 issues)")
  expect(summary).toMatch("* **Line#1** - SomeError: Error message1")
  expect(summary).toMatch("  ```")
  expect(summary).toMatch("  line1")
  expect(summary).toMatch("  line2")
  expect(summary).toMatch("  ```")
})

test("multiple results", async () => {
  const results = new Results([
    {
      path: "/path/to/app/build/result1.xml",
      result: new Result([buildIssue(1), buildIssue(2)])
    },
    {
      path: "/path/to/app/build/result2.xml",
      result: new Result([buildIssue(3)])
    }
  ])

  await report({ results, core, baseDir })

  expect(core.summary.write.mock.calls.length).toEqual(1)

  const summary = core.summary.stringify()

  expect(summary).toMatch("<h2>Android Lint</h2>")
  expect(summary).toMatch("<h3>app/build/result1.xml</h3>")
  expect(summary).toMatch("<details><summary>⚠️ Warnings</summary>")
  expect(summary).toMatch("#### app/src/source1.kt (1 issues)")
  expect(summary).toMatch("* **Line#1** - SomeError: Error message1")
  expect(summary).toMatch("* **Line#2** - SomeError: Error message2")
  expect(summary).toMatch("#### app/src/source2.kt (1 issues)")
  expect(summary).toMatch("* **Line#3** - SomeError: Error message3")
})
