const { check } = require("../src/check")
const path = require("path")

describe("single XML file", () => {
  test("when the result is success", () => {
    const results = check({ pathPattern: path.join(__dirname, "xml/success1.xml") })

    expect(results.isPassed).toBe(true)
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(1)

    const { result } = results.results[0]

    expect(result.issues.length).toEqual(0)
    expect(result.errors.length).toEqual(0)
    expect(result.warnings.length).toEqual(0)
  })

  test("when the result is failure", () => {
    const results = check({ pathPattern: path.join(__dirname, "xml/failure1.xml") })

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
  test("when the all results are success", () => {
    const results = check({ pathPattern: path.join(__dirname, "xml/success*.xml") })

    expect(results.isPassed).toBe(true)
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(2)
  })

  test("when the all results are failure", () => {
    const results = check({ pathPattern: path.join(__dirname, "xml/failure*.xml") })

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(2)
    expect(results.results.length).toEqual(2)
  })

  test("when one of the results is failure", () => {
    const pathPattern = [
      path.join(__dirname, "xml/success1.xml"),
      path.join(__dirname, "xml/failure1.xml")
    ]
    const results = check({ pathPattern })

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(2)
  })
})

describe("ignoreWarning", () => {
  test("when true", () => {
    const results = check({ pathPattern: path.join(__dirname, "xml/failure2.xml"), ignoreWarning: true })

    expect(results.isPassed).toBe(true)
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(1)
  })

  test("when false", () => {
    const results = check({ pathPattern: path.join(__dirname, "xml/failure2.xml"), ignoreWarning: false })

    expect(results.isPassed).toBe(false)
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(1)
  })
})

test("when the XML file can't be found", () => {
  expect(() => {
    check({ pathPattern: path.join(__dirname, "xml/unknown.xml") })
  }).toThrow("No XML file found")
})

test("when the contents of the XML file is invalid", () => {
  expect(() => {
    check({ pathPattern: path.join(__dirname, "xml/invalid.xml") })
  }).toThrow("Unexpected structure XML file")
})
