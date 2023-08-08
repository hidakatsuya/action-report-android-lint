const check = require("../src/check");
const path = require("path");

describe("single XML file", () => {
  test("pass", () => {
    const results = check(path.join(__dirname, "xml/success1.xml"))

    expect(results.isPassed).toBe(true)
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(1)

    const { result } = results.results[0]

    expect(result.issues.length).toEqual(0)
    expect(result.errors.length).toEqual(0)
    expect(result.warnings.length).toEqual(0)
  })

  test("fail", () => {
    const results = check(path.join(__dirname, "xml/failure1.xml"))

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(1)

    const { result } = results.results[0]

    expect(result.issues.length).toEqual(2)

    expect(result.warnings.length).toEqual(1)
    expect(result.warnings[0].message).toMatch("The resource `R.color.purple_200` appears to be unused")

    expect(result.errors.length).toEqual(1)
    expect(result.errors[0].message).toMatch("The resource `R.color.purple_500` appears to be unused")
  })
})

describe("multiple XML files", () => {
  test("all pass", () => {
    const results = check(path.join(__dirname, "xml/success*.xml"))

    expect(results.isPassed).toBe(true)
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(2)
  })

  test("all fail", () => {
    const results = check(path.join(__dirname, "xml/failure*.xml"))

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(2)
    expect(results.results.length).toEqual(2)
  })

  test("one fail", () => {
    const results = check([
      path.join(__dirname, "xml/success1.xml"),
      path.join(__dirname, "xml/failure1.xml")
    ])

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(2)
  })
})

describe("ignoreWarning", () => {
  test("true", () => {
    const results = check(path.join(__dirname, "xml/failure2.xml"), { ignoreWarning: true })

    expect(results.isPassed).toBe(true)
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(1)
  })

  test("false", () => {
    const results = check(path.join(__dirname, "xml/failure2.xml"), { ignoreWarning: false })

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(1)
  })
})

test("No XML file found", () => {
  expect(() => {
    check(path.join(__dirname, "xml/unknown.xml"))
  }).toThrow("No XML file found")
})

test("Invalid XML file", () => {
  expect(() => {
    check(path.join(__dirname, "xml/invalid.xml"))
  }).toThrow("Unexpected structure XML file")
})
