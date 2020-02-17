const { exec: defaultExec } = require('child_process')

const exec = (cmd: string) =>
  new Promise(resolve =>
    defaultExec(cmd, (error: string, stdout: string) => {
      if (error) {
        console.log(error) // eslint-disable-line
      }
      return resolve(stdout)
    })
  )

export default exec
