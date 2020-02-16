import { Config } from 'bili'

const config: Config = {
  plugins: {
    typescript2: {
      useTsconfigDeclarationDir: true,
      objectHashIgnoreUnknownHack: false,
    },
  },
  bundleNodeModules: true,
  input: 'src/index.ts',
  output: {
    target: 'node',
    minify: true,
    format: ['cjs'],
  },
}

export default config
