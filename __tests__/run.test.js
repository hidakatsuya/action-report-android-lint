const run = require("../src/run")
const core = require("@actions/core")
const path = require("path")
const process = require("process")

function setupActionEnv(pathPattern) {
  process.env["INPUT_RESULT-PATH"] = pathPattern
  process.env["INPUT_FOLLOW-SYMBOLIC-LINKS"] = true
  process.env["GITHUB_WORKSPACE"] ??= path.join(__dirname, '..')
  setupFailOnWarning(true)
}

function setupFailOnWarning(value) {
  process.env["INPUT_FAIL-ON-WARNING"] = value
}

beforeEach(() => {
  core.setFailed = jest.fn()
  core.summary.write = jest.fn()
})

afterEach(() => {
  core.setFailed.mockReset()
  core.summary.write.mockReset()
})

test("when the results is success", async () => {
  setupActionEnv(path.join(__dirname, "xml/success*.xml"))

  await run()

  expect(core.summary.write.mock.calls.length).toEqual(1)

  expect(core.setFailed.mock.calls.length).toEqual(0)
})

test("when the results is error", async () => {
  setupActionEnv(path.join(__dirname, "xml/failure1.xml"))

  await run()

  expect(core.summary.write.mock.calls.length).toEqual(1)

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("Android Lint issues found")
})

test("when the results is warning", async () => {
  setupActionEnv(path.join(__dirname, "xml/failure2.xml"))

  await run()

  expect(core.summary.write.mock.calls.length).toEqual(1)

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("Android Lint issues found")
})

test("when no XML file found", async () => {
  setupActionEnv(path.join(__dirname, "xml/unknown.xml"))

  await run()

  expect(core.summary.write.mock.calls.length).toEqual(0)

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("No XML file found")
})

describe("fail-on-warning option", () => {
  beforeEach(() => setupActionEnv(path.join(__dirname, "xml/failure2.xml")))

  test("true", async () => {
    setupFailOnWarning("true")
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(1)
  })

  test("false", async () => {
    setupFailOnWarning("false")
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(0)
  })
})
