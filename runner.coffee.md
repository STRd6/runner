Runner
======

    Sandbox = require "sandbox"

    Runner = ->
      run: ({config}={}) ->
        {width, height} = (config or {})

        sandbox = Sandbox
          width: width
          height: height

        return sandbox

    Runner.PackageRunner = require "./package_runner"

    module.exports = Runner
