Sandbox
=======

Sandbox creates a popup window in which you can run code.

You can pass in a width and a height to set the size of the window.

    module.exports = ({name, width, height, methods}={}) ->
      name ?= "sandbox-#{Math.random()}"
      width ?= 800
      height ?= 600
      methods ?= {}

      sandbox = window.open(
        ""
        name
        "width=#{width},height=#{height}"
      )

Pass in functions to attach to the running window. Useful for things like
`onerror` or other utilities if you would like the running code to be able to
communicate back to the parent.

      extend sandbox, methods

      autoClose(sandbox)

The newly created window is returned.

      return sandbox

Helpers
-------

    extend = (target, sources...) ->
      for source in sources
        for name of source
          target[name] = source[name]

      return target

Close sandbox when closing our window.

    autoClose = (sandbox) ->
      closer = ->
        window.removeEventListener "unload", closer
        sandbox.close()

      sandbox.addEventListener "unload", closer
      window.addEventListener "unload", closer
