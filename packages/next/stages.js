let stagesExports

if (process.env.NEXT_RUNTIME === '') {
  const notAvailableInClient = (name) => {
    return function notAvailable() {
      throw new Error(`\`${name}\` is only available in a Server Component.`)
    }
  }

  stagesExports = {
    unstable_navigation: notAvailableInClient('unstable_navigation'),
  }
} else {
  // Keep server requires in this branch so browser builds can DCE them.
  stagesExports = {
    unstable_navigation: require('next/dist/server/request/stages')
      .unstable_navigation,
  }
}

// https://nodejs.org/api/esm.html#commonjs-namespaces
// When importing CommonJS modules, the module.exports object is provided as the default export
module.exports = stagesExports

// make import { xxx } from 'next/stages' work
exports.unstable_navigation = stagesExports.unstable_navigation
