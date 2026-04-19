const path = require("path")
const process = require("process")

let check
let createRun
let report

beforeAll(async () => {
  ({ check } = await import("../src/check.mjs"));
  ({ createRun } = await import("../src/run.mjs"));
  ({ default: report } = await import("../src/report.mjs"));
})

function buildCore() {
  return {
    getInput(name) {
      return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`]
    },
    setFailed: jest.fn(),
    summary: {
      write: jest.fn(),
      addHeading() { return this },
      addRaw() { return this },
      wrap(tag, text) { return `<${tag}>${text}</${tag}>` },
      addDetails() { return this }
    }
  }
}

let core

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
  core = buildCore()
})

afterEach(() => {
  core.setFailed.mockReset()
  core.summary.write.mockReset()
})

test("when the results is success", async () => {
  setupActionEnv(path.join(__dirname, "xml/success*.xml"))

  const run = createRun({ coreImpl: core, checkFn: check, reportFn: report })
  await run()

  expect(core.summary.write.mock.calls.length).toEqual(1)

  expect(core.setFailed.mock.calls.length).toEqual(0)
})

test("when the results is error", async () => {
  setupActionEnv(path.join(__dirname, "xml/failure1.xml"))

  const run = createRun({ coreImpl: core, checkFn: check, reportFn: report })
  await run()

  expect(core.summary.write.mock.calls.length).toEqual(1)

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("Android Lint issues found")
})

test("when the results is warning", async () => {
  setupActionEnv(path.join(__dirname, "xml/failure2.xml"))

  const run = createRun({ coreImpl: core, checkFn: check, reportFn: report })
  await run()

  expect(core.summary.write.mock.calls.length).toEqual(1)

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("Android Lint issues found")
})

test("when no XML file found", async () => {
  setupActionEnv(path.join(__dirname, "xml/unknown.xml"))

  const run = createRun({ coreImpl: core, checkFn: check, reportFn: report })
  await run()

  expect(core.summary.write.mock.calls.length).toEqual(0)

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("No XML file found")
})

test("when a non-Error is thrown", async () => {
  setupActionEnv(path.join(__dirname, "xml/success*.xml"))

  const run = createRun({
    coreImpl: core,
    checkFn: async () => {
      throw "unexpected failure"
    },
    reportFn: report
  })
  await run()

  expect(core.summary.write.mock.calls.length).toEqual(0)
  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toEqual("unexpected failure")
})

describe("fail-on-warning option", () => {
  beforeEach(() => setupActionEnv(path.join(__dirname, "xml/failure2.xml")))

  test("true", async () => {
    setupFailOnWarning("true")
    const run = createRun({ coreImpl: core, checkFn: check, reportFn: report })
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(1)
  })

  test("false", async () => {
    setupFailOnWarning("false")
    const run = createRun({ coreImpl: core, checkFn: check, reportFn: report })
    await run()
    expect(core.setFailed.mock.calls.length).toEqual(0)
  })
})
