const run = require("../src/run")
const core = require("@actions/core")
const path = require("path")
const process = require("process")

function setupActionEnv(pathPattern) {
  process.env["INPUT_RESULT-PATH"] = pathPattern
  process.env["GITHUB_WORKSPACE"] ??= path.join(__dirname, '..')
}

function setupIgnoreWarning(value) {
  process.env["INPUT_IGNORE-WARNING"] = value
}

beforeEach(() => {
  core.setFailed = jest.fn()
  core.summary.write = jest.fn()
})

afterEach(() => {
  core.setFailed.mockReset()
  core.summary.write.mockReset()
})

test("when the result is success", async () => {
  setupActionEnv(path.join(__dirname, "xml/success*.xml"))

  await run()

  expect(core.summary.write.mock.calls.length).toEqual(0)

  expect(core.setFailed.mock.calls.length).toEqual(0)
})

test("when the result is failure", async () => {
  setupActionEnv(path.join(__dirname, "xml/failure*.xml"))

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

describe("ignore-warning option", () => {
  beforeEach(() => setupActionEnv(path.join(__dirname, "xml/failure2.xml")))

  test("not set (false by default)", async () => {
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(1)
  })

  test("true", async () => {
    setupIgnoreWarning("true")
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(0)
  })

  test("false", async () => {
    setupIgnoreWarning("false")
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(1)
  })
})
