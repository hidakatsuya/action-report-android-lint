const { check } = require("../src/check")
const path = require("path")

describe("single XML file", () => {
  test("when the results is success", async () => {
    const results = await check({ pathPattern: path.join(__dirname, "xml/success1.xml") })

    expect(results.status).toEqual("success")
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(1)

    const { result } = results.results[0]

    expect(result.issues.length).toEqual(0)
    expect(result.errors.length).toEqual(0)
    expect(result.warnings.length).toEqual(0)
  })

  test("when the results is error including warning", async () => {
    const results = await check({ pathPattern: path.join(__dirname, "xml/failure1.xml") })

    expect(results.status).toEqual("error")
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(1)

    const { result } = results.results[0]

    expect(result.status).toEqual("error")
    expect(result.issues.length).toEqual(2)

    expect(result.warnings.length).toEqual(1)
    expect(result.warnings[0].message).toMatch("The resource `R.color.purple_200` appears to be unused")

    expect(result.errors.length).toEqual(1)
    expect(result.errors[0].message).toMatch("The resource `R.color.purple_500` appears to be unused")
  })

  test("when the results is warning only", async () => {
    const results = await check({ pathPattern: path.join(__dirname, "xml/failure2.xml") })

    expect(results.status).toEqual("warning")
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(1)

    const { result } = results.results[0]

    expect(result.status).toEqual("warning")
    expect(result.issues.length).toEqual(1)

    expect(result.warnings.length).toEqual(1)
    expect(result.warnings[0].message).toMatch("The resource `R.color.purple_700` appears to be unused")

    expect(result.errors.length).toEqual(0)
  })
})

describe("multiple XML files", () => {
  test("when the all results are success", async () => {
    const results = await check({ pathPattern: path.join(__dirname, "xml/success*.xml") })

    expect(results.status).toEqual("success")
    expect(results.failures.length).toEqual(0)
    expect(results.results.length).toEqual(2)
  })

  test("when the all results are failure", async () => {
    const pathPattern = [
      path.join(__dirname, "xml/failure1.xml"),
      path.join(__dirname, "xml/failure2.xml")
    ]
    const results = await check({ pathPattern })

    expect(results.status).toEqual("error")
    expect(results.failures.length).toEqual(2)
    expect(results.results.length).toEqual(2)
  })

  test("when one of the results is failure", async () => {
    const pathPattern = [
      path.join(__dirname, "xml/success1.xml"),
      path.join(__dirname, "xml/failure1.xml")
    ]
    const results = await check({ pathPattern })

    expect(results.status).toEqual("error")
    expect(results.failures.length).toEqual(1)
    expect(results.results.length).toEqual(2)
  })
})

describe("invalid XML file", () => {
  test("when the XML file can't be found", async () => {
    await expect(check({ pathPattern: path.join(__dirname, "xml/unknown.xml") }))
      .rejects.toThrow("No XML file found")
  })

  test("when the contents of the XML file is invalid", async () => {
    await expect(check({ pathPattern: path.join(__dirname, "xml/invalid.xml") }))
      .rejects.toThrow("Unexpected structure XML file")
  })
})

test("XML file containing issues with multiple locations", async () => {
  const results = await check({ pathPattern: path.join(__dirname, "xml/failure3.xml") })

  expect(results.status).toEqual("warning")
  expect(results.failures.length).toEqual(1)
  expect(results.results.length).toEqual(1)

  const { result } = results.results[0]

  expect(result.status).toEqual("warning")
  expect(result.issues.length).toEqual(2)

  expect(result.warnings.length).toEqual(2)
  expect(result.warnings[0].file).toEqual("/path/to/root/app/src/main/res/values/colors1.xml")
  expect(result.warnings[1].file).toEqual("/path/to/root/app/src/main/res/values/colors2.xml")

  expect(result.errors.length).toEqual(0)
})

describe("basic glob path pattern", () => {
  test("**/xml/failure*.xml", async () => {
    const results = await check({ pathPattern: "**/xml/failure*.xml" })

    expect(results.status).toEqual("error")
    expect(results.failures.length).toEqual(3)
    expect(results.results.length).toEqual(3)
  })
})
