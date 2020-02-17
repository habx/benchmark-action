import benchmark from 'benchmark'
import _ from 'lodash' // need this for benchmark
import process from 'process'

import { githubComment } from './github'
import exec from './utils/exec'

const appRoot = process.cwd()
const BENCHMARK_DIR = `${appRoot}/benchmark_${new Date().getTime()}`
const CURRENT_BENCH_DIR = `${BENCHMARK_DIR}/current`
const BASE_BENCH_DIR = `${BENCHMARK_DIR}/base`
const FILENAME = process.env.BENCHMARK_PATH || 'benchmark/index'

// @ts-ignore
const Benchmark = benchmark.runInContext({ _, process })

const benchmarck = async () => {
  await exec('npm i')

  const currentBranch =
    process.env.GITHUB_REF || (await exec('git rev-parse --abbrev-ref HEAD'))
  const BASE_BRANCH = process.env.BASE_BRANCH || 'dev'
  const PRECISION = Number(process.env.PRECISION) || 1000

  const initialMessage = `## Benchmark 📊`
  let message = initialMessage
  const benchSuites: Record<string, { suite: any; name: string }> = {}

  const timer = setTimeout(() => {}, 999999)

  const commentPullRequest = async () => {
    if (message === initialMessage) {
      message += '\nNothing to be reported'
    }
    await githubComment(message)
  }

  const addMessage = ({
    diff,
    functionName,
    results,
    currentTime,
  }: {
    results: object
    diff: number
    functionName: string
    currentTime: number
  }) => {
    const codeBlock = '```'
    const details = `\n<details><summary>See details</summary>\n\n${codeBlock}\n${JSON.stringify(
      results,
      null,
      '\t'
    )}\n${codeBlock}\n\n</details>\n`
    message += `\n**${functionName}** : `
    message += `*${currentTime}ms*`

    if (diff !== 0) {
      if (diff > 0) {
        message += `\n😱️ ${diff}ms more than branch ${BASE_BRANCH}`
      } else {
        message += `\n💪 ${Math.abs(diff)}ms less than branch ${BASE_BRANCH}`
      }
    }
    message += details
  }

  try {
    // Current branch
    try {
      await exec(
        `tsc ${FILENAME}.ts --outDir ${CURRENT_BENCH_DIR}  --target ES2018 --skipLibCheck --resolveJsonModule --module commonjs --moduleResolution node`
      )
      const currentFunctionDefinitions = require(`${CURRENT_BENCH_DIR}/${FILENAME}.js`)
        .default
      for (const functionName of Object.keys(currentFunctionDefinitions)) {
        const suite = new Benchmark.Suite()
        suite.add('current', currentFunctionDefinitions[functionName])
        benchSuites[functionName] = {
          name: functionName,
          suite,
        }
      }
    } catch (e) {
      throw new Error('Benchmark is not defined in current branch')
    }

    // Base branch
    await exec(`git checkout ${BASE_BRANCH}`)
    await exec(
      `tsc ${FILENAME}.ts --outDir ${BASE_BENCH_DIR}  --target ES2018 --skipLibCheck --resolveJsonModule --module commonjs --moduleResolution node`
    )
    try {
      const baseFunctionDefinitions = require(`${BASE_BENCH_DIR}/${FILENAME}.js`)
        .default
      Object.keys(baseFunctionDefinitions).forEach(functionName => {
        if (baseFunctionDefinitions[functionName]) {
          benchSuites[functionName].suite.add(
            'base',
            baseFunctionDefinitions[functionName]
          )
        }
      })
    } catch (e) {
      console.error('Benchmark is not defined in base branch') // eslint-disable-line
    }

    // Run benchmarks
    const run = async () => {
      for (const functionName in benchSuites) {
        await new Promise(resolve => {
          benchSuites[functionName].suite.on('complete', function(e: any) {
            const results = e.currentTarget
            const diff =
              results[1] && results[0]
                ? Math.round(
                    (results[0].stats.mean - results[1].stats.mean) * PRECISION
                  ) / PRECISION
                : 0

            addMessage({
              diff,
              functionName,
              results,
              currentTime: results[0].stats.mean,
            })

            resolve()
          })
          benchSuites[functionName].suite.run()
        })
      }
      clearTimeout(timer)
      commentPullRequest()
      await exec(`rm -r ${BENCHMARK_DIR}`)
    }
    run()
  } catch (e) {
    clearTimeout(timer)
    await exec(`rm -r ${BENCHMARK_DIR}`)
    console.error(e) // eslint-disable-line
  } finally {
    await exec(`git checkout ${currentBranch}`)
  }
}
benchmarck()
