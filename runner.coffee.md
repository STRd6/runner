Runner
======

Runner manages running apps in sandboxed windows and passing messages back and
forth from the parent to the running instances.

We keep a list of running windows so we can hot-update them when we modify our
own code.

One cool example use is if you are modifying your css you can run several
instances of your app and navigate to different states. Then you can see in real
time how the css changes affect each one.

    Sandbox = require "sandbox"

    runningWindows = []

    Runner = ->
      run: ({config}={}) ->
        {width, height} = (config or {})

        sandbox = Sandbox
          width: width
          height: height

        runningWindows.push sandbox

        return sandbox

Call a global reload method on each running window, passing in the given args.
We may want to switch to using `postMessage` in the future.

      reload: (args...) ->
        runningWindows = runningWindows.filter (window) ->
          return false if window.closed

          window.reload?(args...)

          return true

    module.exports = Runner
