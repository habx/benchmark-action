# Benchmark github action 📊

Monitoring scripts speed can ben hard and when you have improved your
scripts, it would be a shale to get regression on new code...

This github action notifies you when your scripts execution time changed
compared to the main branch (in good or bad)

<p align="center">
  <img height="200" src="https://res.cloudinary.com/habx/image/upload/tech/benchmark/example.png" />
</p>

## Benchmark definition

You need to define what functions you want to test with parameters. The
default file to define this is `benchmark/index.ts` at the root of your
project

#### Example

```typescript
import layoutTemplate from '../examples/layoutTemplate.json'
import {
  getLayoutFromTemplate,
  getAlternativesFromTemplate,
  OptimizerLayoutTemplate,
} from '../src'


export default {
  getLayoutFromTemplate: () =>
    getLayoutFromTemplate(layoutTemplate, [
      { region: 'A', id: '0' },
      { region: 'B', id: '1' },
    ]),
  getAlternativesFromTemplate: () =>
    getAlternativesFromTemplate(layoutTemplate),
}
```

## Configuration

| Environment variable   |   description | Default |Required |
|------------------------|------------------|-------------|--------|
| GITHUB_TOKEN     |  github token |  | yes
| BENCHMARK_PATH     |  relative path of the benchmark test file | `benchmark/index` | no
| BASE_BRANCH     |  branch to compare the benchmark with  | `dev` | no
| PRECISION     |  time precision to notify when there is an important change | `1000ms` | no

### Example of .yml action file

```yaml
name: Benchmark

on:
  push:
    branches-ignore:
      - 'dev'
      - 'release/*'

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v1
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: Benchmark
        uses: habx/benchmark-action@dev
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```
