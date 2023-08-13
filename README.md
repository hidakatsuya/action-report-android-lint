# action-report-android-lint

[![units-test](https://github.com/hidakatsuya/action-report-android-lint/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/hidakatsuya/action-report-android-lint/actions/workflows/test.yml)

A GitHub Action to check and report the results of Android Lint in Job Summaries.

![build summary](./doc/sample-build-summary.png)

## Usage

```yaml
  - name: Lint
    run: ./gradlew lint

  - name: Check and report lint results
    uses: hidakatsuya/action-report-android-lint@v1
    with:
      result-path: 'app/build/reports/lint-results-debug.xml'
```

### result-path

Indicates the relative path from the working directory to Android Lint result XML file.
Path patterns by [@actions/glob](https://www.npmjs.com/package/@actions/glob) can also be specified.

### (optional) ignore-warning

Indicates whether warnings should be ignored as build failures. Default is `false`.

### (optional) follow-symbolic-links

Indicates whether symbolic links are followed in searching XML files. Default is `true`.

## Versioning

This action follows [the recommendations of GitHub Actions Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md).

## Releasing

1. Make sure CI for main branch has passed
2. Create a new release to publish to the GitHub Marketplace
3. Make sure that [the release workflow](https://github.com/hidakatsuya/action-report-android-lint/actions/workflows/release.yml) has passed
