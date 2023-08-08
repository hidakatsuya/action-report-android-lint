const run = require("../src/run")
const core = require("@actions/core");
const path = require("path");

beforeEach(() => {
  core.setFailed = jest.fn()
})

afterEach(() => {
  core.setFailed.mockReset()
})

test("pass", () => {
  core.getInput = jest.fn().mockReturnValue(path.join(__dirname, "xml/success*.xml"))

  run()

  expect(core.setFailed.mock.calls.length).toEqual(0)
})

test("fail", () => {
  core.getInput = jest.fn().mockReturnValue(path.join(__dirname, "xml/failure*.xml"))

  run()

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("Android Lint issues found")
})

test("error", () => {
  core.getInput = jest.fn().mockReturnValue(path.join(__dirname, "xml/unknown.xml"))

  run()

  expect(core.setFailed.mock.calls.length).toEqual(1)
  expect(core.setFailed.mock.lastCall[0]).toMatch("No XML file found")
})
