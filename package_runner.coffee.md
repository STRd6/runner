Package Runner
==============

Run a package in an iframe.

The `launch` command will get the state of the app, replace the iframe with a clean
one, boot the new package and reload the app state. You can also optionally pass
in an app state to launch into.

A primary reason for wrapping the running iframe with a shim window is that we
can dispose of timeouts and everything else very cleanly, while still keeping the
same opened window.

One example use of hot reloading is if you are modifying your css you can run
several instances of your app and navigate to different states. Then you can see
in real time how the css changes affect each one.

The package runner assumes that it has total control over the document so you
probably won't want to give it the one in your own window.

    {extend} = require "util"

    Sandbox = require "./sandbox"
    Postmaster = require "postmaster"

    module.exports = (config={}) ->
      runningInstance = null
      
      externalWindow = null
      externalDocument = null

      self =
        popOut: ->
          return if externalWindow

          externalWindow = Sandbox(config)
          externalDocument = externalWindow.document
    
          applyStylesheet externalDocument, require "./style"

          # TODO: Migrate data from existing state
      
        remoteTarget: ->
          runningInstance?.contentWindow

        launch: (pkg, data) ->
          # Get data from running instance
          data ?= runningInstance?.contentWindow?.appData?()

          # Remove Running instance
          runningInstance?.remove()

          # Create new instance
          runningInstance = document.createElement "iframe"
          externalDocument.body.appendChild runningInstance

          proxyCalls externalDocument, runningInstance

          # Pass in app state
          extend runningInstance.contentWindow.ENV ?= {},
            APP_STATE: data

          runningInstance.contentWindow.document.write html(pkg)

          return self

        close: ->
          externalWindow.close()

        eval: (code) ->
          runningInstance.contentWindow.eval(code)

      Postmaster(config, self)

      return self

A standalone html page for a package.

    html = module.exports.html = (pkg) ->
      """
        <!DOCTYPE html>
        <html>
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        #{dependencyScripts(pkg.remoteDependencies)}
        </head>
        <body>
        <script>
        #{require('require').executePackageWrapper(pkg)}
        <\/script>
        </body>
        </html>
      """

Helpers
-------

Proxy calls from the iframe to the top window. Currently just proxying logging,
but may add others as needed.

    proxyCalls = (document, iframe) ->
      [
        "opener"
        "console"
      ].forEach (name) ->
        iframe.contentWindow[name] = document.defaultView[name]

`makeScript` returns a string representation of a script tag that has a src
attribute.

    makeScript = (src) ->
      "<script src=#{JSON.stringify(src)}><\/script>"

`dependencyScripts` returns a string containing the script tags that are
the remote script dependencies of this build.

    dependencyScripts = (remoteDependencies=[]) ->
      remoteDependencies.map(makeScript).join("\n")

    applyStylesheet = (document, style, id="primary") ->
      styleNode = document.createElement("style")
      styleNode.innerHTML = style
      styleNode.id = id

      if previousStyleNode = document.head.querySelector("style##{id}")
        previousStyleNode.parentNode.removeChild(prevousStyleNode)

      document.head.appendChild(styleNode)
