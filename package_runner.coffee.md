Package Runner
==============

Run a package in an iframe.

Reload command will get the state of the app, replace the iframe with a clean
one, boot the new package and reload the app state.

When given a document the package runner

    {extend} = require "util"

    module.exports = (document) ->
      applyStylesheet document, require "./style"
      runningInstance = null

      self =
        launch: (pkg, data) ->
          # Get data from running instance
          data ?= runningInstance?.contentWindow?.appData?()

          # Remove Running instance
          runningInstance?.remove()

          # Create new instance
          runningInstance = document.createElement "iframe"
          document.body.appendChild runningInstance

          # Pass in app state
          extend runningInstance.contentWindow.ENV ?= {},
            APP_STATE: data

          runningInstance.contentWindow.document.write html(pkg)

          return self

A standalone html page for a package.

    html = (pkg) ->
      """
        <!DOCTYPE html>
        <html>
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        #{dependencyScripts(pkg.remoteDependencies)}
        </head>
        <body>
        <script>
        #{packageWrapper(pkg, "require('./#{pkg.entryPoint}')")}
        <\/script>
        </body>
        </html>
      """

Wrap code in a closure that provides the package and a require function. This
can be used for generating standalone HTML pages, scripts, and tests.

    packageWrapper = (pkg, code) ->
      """
        ;(function(PACKAGE) {
        var oldRequire = window.Require;
        #{PACKAGE.dependencies.require.distribution.main.content}
        var require = Require.generateFor(PACKAGE);
        window.Require = oldRequire;
        #{code}
        })(#{JSON.stringify(pkg, null, 2)});
      """

Helpers
-------

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
