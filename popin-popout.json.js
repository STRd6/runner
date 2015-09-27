window["distri/runner:popin-popout"]({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "mode": "100644",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "content": "runner\n======\n\nRunner manages running apps in sandboxed windows and passing messages back and forth from the parent to the running instances.\n",
      "mode": "100644",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "content": "Runner\n======\n\nExpose some runners.\n\n    Sandbox = require \"./sandbox\"\n\n    module.exports =\n      Sandbox: Sandbox\n      PackageRunner: require \"./package_runner\"\n\nRun some code in a sandboxed popup window. We need to popup the window immediately\nin response to user input to prevent pop-up blocking so we also pass a promise\nthat will contain the content to render in the window. If the promise fails we\nauto-close the window.\n\n      openWindowWithContent: (config, contentPromise) ->\n        sandbox = Sandbox config\n\n        contentPromise.then(\n          (content) ->\n            sandbox.document.open()\n            sandbox.document.write(content)\n            sandbox.document.close()\n\n            sandbox\n          , (error) ->\n            sandbox.close()\n\n            throw error\n        )\n",
      "mode": "100644",
      "type": "blob"
    },
    "package_runner.coffee.md": {
      "path": "package_runner.coffee.md",
      "content": "Package Runner\n==============\n\nRun a package in an iframe.\n\nThe `launch` command will get the state of the app, replace the iframe with a clean\none, boot the new package and reload the app state. You can also optionally pass\nin an app state to launch into.\n\nA primary reason for wrapping the running iframe with a shim window is that we\ncan dispose of timeouts and everything else very cleanly, while still keeping the\nsame opened window.\n\nOne example use of hot reloading is if you are modifying your css you can run\nseveral instances of your app and navigate to different states. Then you can see\nin real time how the css changes affect each one.\n\nThe package runner assumes that it has total control over the document so you\nprobably won't want to give it the one in your own window.\n\n    {extend} = require \"util\"\n\n    Sandbox = require \"./sandbox\"\n    Postmaster = require \"postmaster\"\n\n    module.exports = (config={}) ->\n      runningInstance = null\n      \n      externalWindow = null\n      externalDocument = null\n\n      self =\n        popOut: ->\n          return if externalWindow\n\n          externalWindow = Sandbox(config)\n          externalDocument = externalWindow.document\n    \n          applyStylesheet externalDocument, require \"./style\"\n\n          # TODO: Migrate data from existing state\n      \n        remoteTarget: ->\n          runningInstance?.contentWindow\n\n        launch: (pkg, data) ->\n          # Get data from running instance\n          # TODO: This won't work on remote urls,\n          # need to use postMessage\n          data ?= runningInstance?.contentWindow?.appData?()\n\n          # Remove Running instance\n          runningInstance?.remove()\n\n          # Create new instance\n          runningInstance = document.createElement \"iframe\"\n          externalDocument.body.appendChild runningInstance\n\n          proxyCalls externalWindow, runningInstance\n\n          # Pass in app state\n          extend runningInstance.contentWindow.ENV ?= {},\n            APP_STATE: data\n\n          runningInstance.contentWindow.document.write html(pkg)\n\n          return self\n\n        close: ->\n          externalWindow.close()\n\n        eval: (code) ->\n          runningInstance.contentWindow.eval(code)\n\n      Postmaster(config, self)\n\n      return self\n\nA standalone html page for a package.\n\n    html = module.exports.html = (pkg) ->\n      \"\"\"\n        <!DOCTYPE html>\n        <html>\n        <head>\n        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n        #{dependencyScripts(pkg.remoteDependencies)}\n        </head>\n        <body>\n        <script>\n        #{require('require').executePackageWrapper(pkg)}\n        <\\/script>\n        </body>\n        </html>\n      \"\"\"\n\nHelpers\n-------\n\nProxy calls from the iframe to the top window. Currently just proxying logging,\nbut may add others as needed.\n\n    proxyCalls = (window, iframe) ->\n      [\n        \"opener\"\n        \"console\"\n      ].forEach (name) ->\n        # !!! Can't do this on remote urls\n        # Either need to do a full postMessage proxy\n        # or don't wrap remote windows, just let them be\n        iframe.contentWindow[name] = window[name]\n\n`makeScript` returns a string representation of a script tag that has a src\nattribute.\n\n    makeScript = (src) ->\n      \"<script src=#{JSON.stringify(src)}><\\/script>\"\n\n`dependencyScripts` returns a string containing the script tags that are\nthe remote script dependencies of this build.\n\n    dependencyScripts = (remoteDependencies=[]) ->\n      remoteDependencies.map(makeScript).join(\"\\n\")\n\n    applyStylesheet = (document, style, id=\"primary\") ->\n      styleNode = document.createElement(\"style\")\n      styleNode.innerHTML = style\n      styleNode.id = id\n\n      if previousStyleNode = document.head.querySelector(\"style##{id}\")\n        previousStyleNode.parentNode.removeChild(prevousStyleNode)\n\n      document.head.appendChild(styleNode)\n",
      "mode": "100644",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "content": "version: \"0.3.1\"\nentryPoint: \"main\"\ndependencies:\n  postmaster: \"distri/postmaster:v0.3.1\"\n  require: \"distri/require:quinine\"\n  util: \"distri/util:v0.1.0\"\n",
      "mode": "100644",
      "type": "blob"
    },
    "style.styl": {
      "path": "style.styl",
      "content": "body\n  height: 100%\n  margin: 0\n\nhtml\n  height: 100%\n\niframe\n  border: none\n  height: 100%\n  width: 100%\n",
      "mode": "100644",
      "type": "blob"
    },
    "test/runner.coffee": {
      "path": "test/runner.coffee",
      "content": "{PackageRunner} = Runner = require \"../main\"\n\ndescribe \"Runner\", ->\n  it \"should be able to open a window with content\", (done) ->\n    p = new Promise (resolve) ->\n      setTimeout ->\n        resolve \"some content\"\n\n    Runner.openWindowWithContent({}, p)\n    .then (sandbox) ->\n      assert.equal sandbox.document.body.innerText, \"some content\"\n      sandbox.close()\n      done()\n    .catch (err) ->\n      console.log err\n\ndescribe \"PackageRunner\", ->\n  it \"should be separate from the popup\", (done) ->\n    launcher = PackageRunner()\n    launcher.popOut()\n\n    launcher.launch(PACKAGE)\n\n    assert launcher.eval(\"window !== top\")\n\n    launcher.close()\n    done()\n\n  it \"should share console with the popup\", (done) ->\n    launcher = PackageRunner()\n    launcher.popOut()\n\n    launcher.launch(PACKAGE)\n\n    assert launcher.eval(\"console === top.console\")\n\n    launcher.close()\n    done()\n\n  it \"should share opener with the popup\", (done) ->\n    launcher = PackageRunner()\n    launcher.popOut()\n\n    launcher.launch(PACKAGE)\n\n    assert launcher.eval(\"opener === top.opener\")\n\n    launcher.close()\n    done()\n\n  it \"should be able to make RPC calls to the a package that runs `Postmaster`\", (done) ->\n    pkg =\n      distribution:\n        main:\n          content: \"\"\"\n            pm = require(\"postmaster\")();\n            pm.successRPC = function() {\n              return \"success\";\n            };\n            pm.failRPC = function() {\n              throw new Error(\"I am error\");\n            };\n            pm.echo = function(a) {\n              return a;\n            };\n          \"\"\"\n      dependencies: PACKAGE.dependencies\n      entryPoint: \"main\"\n\n    launcher = PackageRunner()\n    launcher.popOut()\n    launcher.launch(pkg)\n\n    Promise.all [\n      launcher.invokeRemote \"successRPC\"\n      .then (result) ->\n        assert.equal result, \"success\"\n\n      launcher.invokeRemote \"failRPC\"\n      .catch (e) ->\n        assert.equal e.message, \"I am error\"\n\n      launcher.invokeRemote(\"echo\", 5)\n      .then (result) ->\n        assert.equal result, 5\n    ]\n    .then ->\n      launcher.close()\n      done()\n\nSandbox = require \"../sandbox\"\ndescribe \"sandbox\", ->\n  it \"should be able to open a window\", ->\n    sandbox = Sandbox()\n\n    assert sandbox\n    assert sandbox != window, \"Popup should not be this window\"\n\n    sandbox.close()\n",
      "mode": "100644",
      "type": "blob"
    },
    "sandbox.coffee.md": {
      "path": "sandbox.coffee.md",
      "content": "Sandbox\n=======\n\nSandbox creates a popup window in which you can run code.\n\nYou can pass in a width and a height to set the size of the window.\n\n    module.exports = ({name, width, height, methods}={}) ->\n      name ?= \"sandbox-#{Math.random()}\"\n      width ?= 800\n      height ?= 600\n      methods ?= {}\n\n      sandbox = window.open(\n        \"\"\n        name\n        \"width=#{width},height=#{height}\"\n      )\n\nPass in functions to attach to the running window. Useful for things like\n`onerror` or other utilities if you would like the running code to be able to\ncommunicate back to the parent.\n\n      extend sandbox, methods\n\n      autoClose(sandbox)\n\nThe newly created window is returned.\n\n      return sandbox\n\nHelpers\n-------\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\nClose sandbox when closing our window.\n\n    autoClose = (sandbox) ->\n      closer = ->\n        window.removeEventListener \"unload\", closer\n        sandbox.close()\n\n      sandbox.addEventListener \"unload\", closer\n      window.addEventListener \"unload\", closer\n",
      "mode": "100644"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "(function() {\n  var Sandbox;\n\n  Sandbox = require(\"./sandbox\");\n\n  module.exports = {\n    Sandbox: Sandbox,\n    PackageRunner: require(\"./package_runner\"),\n    openWindowWithContent: function(config, contentPromise) {\n      var sandbox;\n      sandbox = Sandbox(config);\n      return contentPromise.then(function(content) {\n        sandbox.document.open();\n        sandbox.document.write(content);\n        sandbox.document.close();\n        return sandbox;\n      }, function(error) {\n        sandbox.close();\n        throw error;\n      });\n    }\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "package_runner": {
      "path": "package_runner",
      "content": "(function() {\n  var Postmaster, Sandbox, applyStylesheet, dependencyScripts, extend, html, makeScript, proxyCalls;\n\n  extend = require(\"util\").extend;\n\n  Sandbox = require(\"./sandbox\");\n\n  Postmaster = require(\"postmaster\");\n\n  module.exports = function(config) {\n    var externalDocument, externalWindow, runningInstance, self;\n    if (config == null) {\n      config = {};\n    }\n    runningInstance = null;\n    externalWindow = null;\n    externalDocument = null;\n    self = {\n      popOut: function() {\n        if (externalWindow) {\n          return;\n        }\n        externalWindow = Sandbox(config);\n        externalDocument = externalWindow.document;\n        return applyStylesheet(externalDocument, require(\"./style\"));\n      },\n      remoteTarget: function() {\n        return runningInstance != null ? runningInstance.contentWindow : void 0;\n      },\n      launch: function(pkg, data) {\n        var _base, _ref;\n        if (data == null) {\n          data = runningInstance != null ? (_ref = runningInstance.contentWindow) != null ? typeof _ref.appData === \"function\" ? _ref.appData() : void 0 : void 0 : void 0;\n        }\n        if (runningInstance != null) {\n          runningInstance.remove();\n        }\n        runningInstance = document.createElement(\"iframe\");\n        externalDocument.body.appendChild(runningInstance);\n        proxyCalls(externalWindow, runningInstance);\n        extend((_base = runningInstance.contentWindow).ENV != null ? _base.ENV : _base.ENV = {}, {\n          APP_STATE: data\n        });\n        runningInstance.contentWindow.document.write(html(pkg));\n        return self;\n      },\n      close: function() {\n        return externalWindow.close();\n      },\n      \"eval\": function(code) {\n        return runningInstance.contentWindow[\"eval\"](code);\n      }\n    };\n    Postmaster(config, self);\n    return self;\n  };\n\n  html = module.exports.html = function(pkg) {\n    return \"<!DOCTYPE html>\\n<html>\\n<head>\\n<meta http-equiv=\\\"Content-Type\\\" content=\\\"text/html; charset=UTF-8\\\" />\\n\" + (dependencyScripts(pkg.remoteDependencies)) + \"\\n</head>\\n<body>\\n<script>\\n\" + (require('require').executePackageWrapper(pkg)) + \"\\n<\\/script>\\n</body>\\n</html>\";\n  };\n\n  proxyCalls = function(window, iframe) {\n    return [\"opener\", \"console\"].forEach(function(name) {\n      return iframe.contentWindow[name] = window[name];\n    });\n  };\n\n  makeScript = function(src) {\n    return \"<script src=\" + (JSON.stringify(src)) + \"><\\/script>\";\n  };\n\n  dependencyScripts = function(remoteDependencies) {\n    if (remoteDependencies == null) {\n      remoteDependencies = [];\n    }\n    return remoteDependencies.map(makeScript).join(\"\\n\");\n  };\n\n  applyStylesheet = function(document, style, id) {\n    var previousStyleNode, styleNode;\n    if (id == null) {\n      id = \"primary\";\n    }\n    styleNode = document.createElement(\"style\");\n    styleNode.innerHTML = style;\n    styleNode.id = id;\n    if (previousStyleNode = document.head.querySelector(\"style#\" + id)) {\n      previousStyleNode.parentNode.removeChild(prevousStyleNode);\n    }\n    return document.head.appendChild(styleNode);\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.3.1\",\"entryPoint\":\"main\",\"dependencies\":{\"postmaster\":\"distri/postmaster:v0.3.1\",\"require\":\"distri/require:quinine\",\"util\":\"distri/util:v0.1.0\"}};",
      "type": "blob"
    },
    "style": {
      "path": "style",
      "content": "module.exports = \"body {\\n  height: 100%;\\n  margin: 0;\\n}\\n\\nhtml {\\n  height: 100%;\\n}\\n\\niframe {\\n  border: none;\\n  height: 100%;\\n  width: 100%;\\n}\";",
      "type": "blob"
    },
    "test/runner": {
      "path": "test/runner",
      "content": "(function() {\n  var PackageRunner, Runner, Sandbox;\n\n  PackageRunner = (Runner = require(\"../main\")).PackageRunner;\n\n  describe(\"Runner\", function() {\n    return it(\"should be able to open a window with content\", function(done) {\n      var p;\n      p = new Promise(function(resolve) {\n        return setTimeout(function() {\n          return resolve(\"some content\");\n        });\n      });\n      return Runner.openWindowWithContent({}, p).then(function(sandbox) {\n        assert.equal(sandbox.document.body.innerText, \"some content\");\n        sandbox.close();\n        return done();\n      })[\"catch\"](function(err) {\n        return console.log(err);\n      });\n    });\n  });\n\n  describe(\"PackageRunner\", function() {\n    it(\"should be separate from the popup\", function(done) {\n      var launcher;\n      launcher = PackageRunner();\n      launcher.popOut();\n      launcher.launch(PACKAGE);\n      assert(launcher[\"eval\"](\"window !== top\"));\n      launcher.close();\n      return done();\n    });\n    it(\"should share console with the popup\", function(done) {\n      var launcher;\n      launcher = PackageRunner();\n      launcher.popOut();\n      launcher.launch(PACKAGE);\n      assert(launcher[\"eval\"](\"console === top.console\"));\n      launcher.close();\n      return done();\n    });\n    it(\"should share opener with the popup\", function(done) {\n      var launcher;\n      launcher = PackageRunner();\n      launcher.popOut();\n      launcher.launch(PACKAGE);\n      assert(launcher[\"eval\"](\"opener === top.opener\"));\n      launcher.close();\n      return done();\n    });\n    return it(\"should be able to make RPC calls to the a package that runs `Postmaster`\", function(done) {\n      var launcher, pkg;\n      pkg = {\n        distribution: {\n          main: {\n            content: \"pm = require(\\\"postmaster\\\")();\\npm.successRPC = function() {\\n  return \\\"success\\\";\\n};\\npm.failRPC = function() {\\n  throw new Error(\\\"I am error\\\");\\n};\\npm.echo = function(a) {\\n  return a;\\n};\"\n          }\n        },\n        dependencies: PACKAGE.dependencies,\n        entryPoint: \"main\"\n      };\n      launcher = PackageRunner();\n      launcher.popOut();\n      launcher.launch(pkg);\n      return Promise.all([\n        launcher.invokeRemote(\"successRPC\").then(function(result) {\n          return assert.equal(result, \"success\");\n        }), launcher.invokeRemote(\"failRPC\")[\"catch\"](function(e) {\n          return assert.equal(e.message, \"I am error\");\n        }), launcher.invokeRemote(\"echo\", 5).then(function(result) {\n          return assert.equal(result, 5);\n        })\n      ]).then(function() {\n        launcher.close();\n        return done();\n      });\n    });\n  });\n\n  Sandbox = require(\"../sandbox\");\n\n  describe(\"sandbox\", function() {\n    return it(\"should be able to open a window\", function() {\n      var sandbox;\n      sandbox = Sandbox();\n      assert(sandbox);\n      assert(sandbox !== window, \"Popup should not be this window\");\n      return sandbox.close();\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    },
    "sandbox": {
      "path": "sandbox",
      "content": "(function() {\n  var autoClose, extend,\n    __slice = [].slice;\n\n  module.exports = function(_arg) {\n    var height, methods, name, sandbox, width, _ref;\n    _ref = _arg != null ? _arg : {}, name = _ref.name, width = _ref.width, height = _ref.height, methods = _ref.methods;\n    if (name == null) {\n      name = \"sandbox-\" + (Math.random());\n    }\n    if (width == null) {\n      width = 800;\n    }\n    if (height == null) {\n      height = 600;\n    }\n    if (methods == null) {\n      methods = {};\n    }\n    sandbox = window.open(\"\", name, \"width=\" + width + \",height=\" + height);\n    extend(sandbox, methods);\n    autoClose(sandbox);\n    return sandbox;\n  };\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  autoClose = function(sandbox) {\n    var closer;\n    closer = function() {\n      window.removeEventListener(\"unload\", closer);\n      return sandbox.close();\n    };\n    sandbox.addEventListener(\"unload\", closer);\n    return window.addEventListener(\"unload\", closer);\n  };\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://www.danielx.net/editor/"
  },
  "version": "0.3.1",
  "entryPoint": "main",
  "repository": {
    "branch": "popin-popout",
    "default_branch": "master",
    "full_name": "distri/runner",
    "homepage": null,
    "description": "Runner manages running apps in sandboxed windows and passing messages back and forth from the parent to the running instances.",
    "html_url": "https://github.com/distri/runner",
    "url": "https://api.github.com/repos/distri/runner",
    "publishBranch": "gh-pages"
  },
  "dependencies": {
    "postmaster": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2013 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "mode": "100644",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "content": "postmaster\n==========\n\nSend and receive `postMessage` commands using promises to handle the results.\n",
          "mode": "100644",
          "type": "blob"
        },
        "main.coffee": {
          "path": "main.coffee",
          "content": "###\n\nPostmaster wraps the `postMessage` API with promises.\n\n###\n\ndefaultReceiver = self\n\nmodule.exports = Postmaster = (I={}, self={}) ->\n  send = (data) ->\n    target = self.remoteTarget()\n    if !Worker? or target instanceof Worker\n      target.postMessage data\n    else\n      target.postMessage data, \"*\"\n\n  dominant = Postmaster.dominant()\n  self.remoteTarget ?= -> dominant\n  self.receiver ?= -> defaultReceiver\n\n  self.receiver().addEventListener \"message\", (event) ->\n    # Only listening to messages from `opener`\n    if event.source is self.remoteTarget() or !event.source\n      data = event.data\n      {type, method, params, id} = data\n\n      switch type\n        when \"response\"\n          pendingResponses[id].resolve data.result\n        when \"error\"\n          pendingResponses[id].reject data.error\n        when \"message\"\n          Promise.resolve()\n          .then ->\n            self[method](params...)\n          .then (result) ->\n            send\n              type: \"response\"\n              id: id\n              result: result\n          .catch (error) ->\n            if typeof error is \"string\"\n              message = error\n            else\n              message = error.message\n\n            send\n              type: \"error\"\n              id: id\n              error:\n                message: message\n                stack: error.stack\n\n  pendingResponses = {}\n  remoteId = 0\n\n  self.invokeRemote = (method, params...) ->\n    id = remoteId++\n\n    send\n      type: \"message\"\n      method: method\n      params: params\n      id: id\n\n    new Promise (resolve, reject) ->\n      clear = ->\n        delete pendingResponses[id]\n\n      pendingResponses[id] =\n        resolve: (result) ->\n          clear()\n          resolve(result)\n        reject: (error) ->\n          clear()\n          reject(error)\n\n  return self\n\nPostmaster.dominant = ->\n  if window? # iframe or child window context\n    opener or ((parent != window) and parent) or undefined\n  else # Web Worker Context\n    self\n\nreturn Postmaster\n",
          "mode": "100644",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "content": "version: \"0.3.1\"\n",
          "mode": "100644",
          "type": "blob"
        },
        "test/postmaster.coffee": {
          "path": "test/postmaster.coffee",
          "content": "Postmaster = require \"../main\"\n\nscriptContent = ->\n  fn = ->\n    pm = Postmaster()\n    pm.echo = (value) ->\n      return value\n    pm.throws = ->\n      throw new Error(\"This always throws\")\n    pm.promiseFail = ->\n      Promise.reject new Error \"This is a failed promise\"\n\n  \"\"\"\n    var module = {};\n    Postmaster = #{PACKAGE.distribution.main.content};\n    (#{fn.toString()})();\n  \"\"\"\n\ninitWindow = (targetWindow) ->\n  targetWindow.document.write \"<script>#{scriptContent()}<\\/script>\"\n\ndescribe \"Postmaster\", ->\n  it \"should work with openened windows\", (done) ->\n    childWindow = open(\"\", null, \"width=200,height=200\")\n\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.invokeRemote \"echo\", 5\n    .then (result) ->\n      assert.equal result, 5\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      childWindow.close()\n\n  it \"should work with iframes\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.invokeRemote \"echo\", 17\n    .then (result) ->\n      assert.equal result, 17\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      iframe.remove()\n\n  it \"should handle the remote call throwing errors\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.invokeRemote \"throws\"\n    .catch (error) ->\n      done()\n    .then ->\n      iframe.remove()\n\n  it \"should handle the remote call returning failed promises\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.invokeRemote \"promiseFail\"\n    .catch (error) ->\n      done()\n    .then ->\n      iframe.remove()\n\n  it \"should be able to go around the world\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.yolo = (txt) ->\n      \"heyy #{txt}\"\n    postmaster.invokeRemote \"invokeRemote\", \"yolo\", \"cool\"\n    .then (result) ->\n      assert.equal result, \"heyy cool\"\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      iframe.remove()\n\n  it \"should work with web workers\", (done) ->\n    blob = new Blob [scriptContent()]\n    jsUrl = URL.createObjectURL(blob)\n\n    worker = new Worker(jsUrl)\n\n    base =\n      remoteTarget: -> worker\n      receiver: -> worker\n\n    postmaster = Postmaster({}, base)\n    postmaster.invokeRemote \"echo\", 17\n    .then (result) ->\n      assert.equal result, 17\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      worker.terminate()\n",
          "mode": "100644",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "\n/*\n\nPostmaster wraps the `postMessage` API with promises.\n */\n\n(function() {\n  var Postmaster, defaultReceiver,\n    __slice = [].slice;\n\n  defaultReceiver = self;\n\n  module.exports = Postmaster = function(I, self) {\n    var dominant, pendingResponses, remoteId, send;\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = {};\n    }\n    send = function(data) {\n      var target;\n      target = self.remoteTarget();\n      if ((typeof Worker === \"undefined\" || Worker === null) || target instanceof Worker) {\n        return target.postMessage(data);\n      } else {\n        return target.postMessage(data, \"*\");\n      }\n    };\n    dominant = Postmaster.dominant();\n    if (self.remoteTarget == null) {\n      self.remoteTarget = function() {\n        return dominant;\n      };\n    }\n    if (self.receiver == null) {\n      self.receiver = function() {\n        return defaultReceiver;\n      };\n    }\n    self.receiver().addEventListener(\"message\", function(event) {\n      var data, id, method, params, type;\n      if (event.source === self.remoteTarget() || !event.source) {\n        data = event.data;\n        type = data.type, method = data.method, params = data.params, id = data.id;\n        switch (type) {\n          case \"response\":\n            return pendingResponses[id].resolve(data.result);\n          case \"error\":\n            return pendingResponses[id].reject(data.error);\n          case \"message\":\n            return Promise.resolve().then(function() {\n              return self[method].apply(self, params);\n            }).then(function(result) {\n              return send({\n                type: \"response\",\n                id: id,\n                result: result\n              });\n            })[\"catch\"](function(error) {\n              var message;\n              if (typeof error === \"string\") {\n                message = error;\n              } else {\n                message = error.message;\n              }\n              return send({\n                type: \"error\",\n                id: id,\n                error: {\n                  message: message,\n                  stack: error.stack\n                }\n              });\n            });\n        }\n      }\n    });\n    pendingResponses = {};\n    remoteId = 0;\n    self.invokeRemote = function() {\n      var id, method, params;\n      method = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      id = remoteId++;\n      send({\n        type: \"message\",\n        method: method,\n        params: params,\n        id: id\n      });\n      return new Promise(function(resolve, reject) {\n        var clear;\n        clear = function() {\n          return delete pendingResponses[id];\n        };\n        return pendingResponses[id] = {\n          resolve: function(result) {\n            clear();\n            return resolve(result);\n          },\n          reject: function(error) {\n            clear();\n            return reject(error);\n          }\n        };\n      });\n    };\n    return self;\n  };\n\n  Postmaster.dominant = function() {\n    if (typeof window !== \"undefined\" && window !== null) {\n      return opener || ((parent !== window) && parent) || void 0;\n    } else {\n      return self;\n    }\n  };\n\n  return Postmaster;\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.3.1\"};",
          "type": "blob"
        },
        "test/postmaster": {
          "path": "test/postmaster",
          "content": "(function() {\n  var Postmaster, initWindow, scriptContent;\n\n  Postmaster = require(\"../main\");\n\n  scriptContent = function() {\n    var fn;\n    fn = function() {\n      var pm;\n      pm = Postmaster();\n      pm.echo = function(value) {\n        return value;\n      };\n      pm.throws = function() {\n        throw new Error(\"This always throws\");\n      };\n      return pm.promiseFail = function() {\n        return Promise.reject(new Error(\"This is a failed promise\"));\n      };\n    };\n    return \"var module = {};\\nPostmaster = \" + PACKAGE.distribution.main.content + \";\\n(\" + (fn.toString()) + \")();\";\n  };\n\n  initWindow = function(targetWindow) {\n    return targetWindow.document.write(\"<script>\" + (scriptContent()) + \"<\\/script>\");\n  };\n\n  describe(\"Postmaster\", function() {\n    it(\"should work with openened windows\", function(done) {\n      var childWindow, postmaster;\n      childWindow = open(\"\", null, \"width=200,height=200\");\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      return postmaster.invokeRemote(\"echo\", 5).then(function(result) {\n        return assert.equal(result, 5);\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return childWindow.close();\n      });\n    });\n    it(\"should work with iframes\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      return postmaster.invokeRemote(\"echo\", 17).then(function(result) {\n        return assert.equal(result, 17);\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return iframe.remove();\n      });\n    });\n    it(\"should handle the remote call throwing errors\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      return postmaster.invokeRemote(\"throws\")[\"catch\"](function(error) {\n        return done();\n      }).then(function() {\n        return iframe.remove();\n      });\n    });\n    it(\"should handle the remote call returning failed promises\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      return postmaster.invokeRemote(\"promiseFail\")[\"catch\"](function(error) {\n        return done();\n      }).then(function() {\n        return iframe.remove();\n      });\n    });\n    it(\"should be able to go around the world\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      postmaster.yolo = function(txt) {\n        return \"heyy \" + txt;\n      };\n      return postmaster.invokeRemote(\"invokeRemote\", \"yolo\", \"cool\").then(function(result) {\n        return assert.equal(result, \"heyy cool\");\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return iframe.remove();\n      });\n    });\n    return it(\"should work with web workers\", function(done) {\n      var base, blob, jsUrl, postmaster, worker;\n      blob = new Blob([scriptContent()]);\n      jsUrl = URL.createObjectURL(blob);\n      worker = new Worker(jsUrl);\n      base = {\n        remoteTarget: function() {\n          return worker;\n        },\n        receiver: function() {\n          return worker;\n        }\n      };\n      postmaster = Postmaster({}, base);\n      return postmaster.invokeRemote(\"echo\", 17).then(function(result) {\n        return assert.equal(result, 17);\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return worker.terminate();\n      });\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://www.danielx.net/editor/"
      },
      "version": "0.3.1",
      "entryPoint": "main",
      "repository": {
        "branch": "v0.3.1",
        "default_branch": "master",
        "full_name": "distri/postmaster",
        "homepage": null,
        "description": "Send and receive postMessage commands.",
        "html_url": "https://github.com/distri/postmaster",
        "url": "https://api.github.com/repos/distri/postmaster",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    },
    "require": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "mode": "100644",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "content": "require\n=======\n\nRequire system for self replicating client side apps\n\n[Docs](http://distri.github.io/require/docs)\n",
          "mode": "100644",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "content": "Require\n=======\n\nA Node.js compatible require implementation for pure client side apps.\n\nEach file is a module. Modules are responsible for exporting an object. Unlike\ntraditional client side JavaScript, Ruby, or other common languages the module\nis not responsible for naming its product in the context of the requirer. This\nmaintains encapsulation because it is impossible from within a module to know\nwhat external name would be correct to prevent errors of composition in all\npossible uses.\n\nUses\n----\n\nFrom a module require another module in the same package.\n\n>     require \"./soup\"\n\nRequire a module in the parent directory\n\n>     require \"../nuts\"\n\nRequire a module from the root directory in the same package.\n\nNOTE: This could behave slightly differently under Node.js if your package does\nnot have it's own isolated filesystem.\n\n>     require \"/silence\"\n\nFrom a module within a package, require a dependent package.\n\n>     require \"console\"\n\nThe dependency could be delcared in pixie.cson as follows:\n\n>     dependencies:\n>       console: \"http://strd6.github.io/console/v1.2.2.json\"\n\nYou can require a package directly from its JSON representation as well.\n\n>     $.getJSON(packageURL)\n>     .then (pkg) ->\n>       require pkg\n\nImplementation\n--------------\n\nFile separator is '/'\n\n    fileSeparator = '/'\n\nIn the browser `global` is `self`.\n\n    global = self\n\nDefault entry point\n\n    defaultEntryPoint = \"main\"\n\nA sentinal against circular requires.\n\n    circularGuard = {}\n\nA top-level module so that all other modules won't have to be orphans.\n\n    rootModule =\n      path: \"\"\n\nRequire a module given a path within a package. Each file is its own separate\nmodule. An application is composed of packages.\n\n    loadPath = (parentModule, pkg, path) ->\n      if startsWith(path, '/')\n        localPath = []\n      else\n        localPath = parentModule.path.split(fileSeparator)\n\n      normalizedPath = normalizePath(path, localPath)\n\n      cache = cacheFor(pkg)\n\n      if module = cache[normalizedPath]\n        if module is circularGuard\n          throw \"Circular dependency detected when requiring #{normalizedPath}\"\n      else\n        cache[normalizedPath] = circularGuard\n\n        try\n          cache[normalizedPath] = module = loadModule(pkg, normalizedPath)\n        finally\n          delete cache[normalizedPath] if cache[normalizedPath] is circularGuard\n\n      return module.exports\n\nTo normalize the path we convert local paths to a standard form that does not\ncontain an references to current or parent directories.\n\n    normalizePath = (path, base=[]) ->\n      base = base.concat path.split(fileSeparator)\n      result = []\n\nChew up all the pieces into a standardized path.\n\n      while base.length\n        switch piece = base.shift()\n          when \"..\"\n            result.pop()\n          when \"\", \".\"\n            # Skip\n          else\n            result.push(piece)\n\n      return result.join(fileSeparator)\n\n`loadPackage` Loads a dependent package at that packages entry point.\n\n    loadPackage = (pkg) ->\n      path = pkg.entryPoint or defaultEntryPoint\n\n      loadPath(rootModule, pkg, path)\n\nLoad a file from within a package.\n\n    loadModule = (pkg, path) ->\n      unless (file = pkg.distribution[path])\n        throw \"Could not find file at #{path} in #{pkg.name}\"\n\n      unless (content = file.content)?\n        throw \"Malformed package. No content for file at #{path} in #{pkg.name}\"\n\n      program = annotateSourceURL content, pkg, path\n      dirname = path.split(fileSeparator)[0...-1].join(fileSeparator)\n\n      module =\n        path: dirname\n        exports: {}\n\nThis external context provides some variable that modules have access to.\n\nA `require` function is exposed to modules so they may require other modules.\n\nAdditional properties such as a reference to the global object and some metadata\nare also exposed.\n\n      context =\n        require: generateRequireFn(pkg, module)\n        global: global\n        module: module\n        exports: module.exports\n        PACKAGE: pkg\n        __filename: path\n        __dirname: dirname\n\n      args = Object.keys(context)\n      values = args.map (name) -> context[name]\n\nExecute the program within the module and given context.\n\n      Function(args..., program).apply(module, values)\n\n      return module\n\nHelper to detect if a given path is a package.\n\n    isPackage = (path) ->\n      if !(startsWith(path, fileSeparator) or\n        startsWith(path, \".#{fileSeparator}\") or\n        startsWith(path, \"..#{fileSeparator}\")\n      )\n        path.split(fileSeparator)[0]\n      else\n        false\n\nGenerate a require function for a given module in a package.\n\nIf we are loading a package in another module then we strip out the module part\nof the name and use the `rootModule` rather than the local module we came from.\nThat way our local path won't affect the lookup path in another package.\n\nLoading a module within our package, uses the requiring module as a parent for\nlocal path resolution.\n\n    generateRequireFn = (pkg, module=rootModule) ->\n      pkg.name ?= \"ROOT\"\n      pkg.scopedName ?= \"ROOT\"\n\n      fn = (path) ->\n        if typeof path is \"object\"\n          loadPackage(path)\n        else if isPackage(path)\n          unless otherPackage = pkg.dependencies[path]\n            throw \"Package: #{path} not found.\"\n\n          otherPackage.name ?= path\n          otherPackage.scopedName ?= \"#{pkg.scopedName}:#{path}\"\n\n          loadPackage(otherPackage)\n        else\n          loadPath(module, pkg, path)\n\n      fn.packageWrapper = publicAPI.packageWrapper\n      fn.executePackageWrapper = publicAPI.executePackageWrapper\n\n      return fn\n\nBecause we can't actually `require('require')` we need to export it a little\ndifferently.\n\n    publicAPI =\n      generateFor: generateRequireFn\n\nWrap a package as a string that will bootstrap `require` and execute the package.\nThis can be used for generating standalone HTML pages, scripts, and tests.\n\n      packageWrapper: (pkg, code) ->\n        \"\"\"\n          ;(function(PACKAGE) {\n            var src = #{JSON.stringify(PACKAGE.distribution.main.content)};\n            var Require = new Function(\"PACKAGE\", \"return \" + src)({distribution: {main: {content: src}}});\n            var require = Require.generateFor(PACKAGE);\n            #{code};\n          })(#{JSON.stringify(pkg, null, 2)});\n        \"\"\"\n\nWrap a package as a string that will execute its entry point.\n\n      executePackageWrapper: (pkg) ->\n        publicAPI.packageWrapper pkg, \"require('./#{pkg.entryPoint}')\"\n\nRequire a package directly.\n\n      loadPackage: loadPackage\n\n    if exports?\n      module.exports = publicAPI\n    else\n      global.Require = publicAPI\n\nNotes\n-----\n\nWe have to use `pkg` as a variable name because `package` is a reserved word.\n\nNode needs to check file extensions, but because we only load compiled products\nwe never have extensions in our path.\n\nSo while Node may need to check for either `path/somefile.js` or `path/somefile.coffee`\nthat will already have been resolved for us and we will only check `path/somefile`\n\nCircular dependencies are not allowed and raise an exception when detected.\n\nHelpers\n-------\n\nDetect if a string starts with a given prefix.\n\n    startsWith = (string, prefix) ->\n      string.lastIndexOf(prefix, 0) is 0\n\nCreates a cache for modules within a package. It uses `defineProperty` so that\nthe cache doesn't end up being enumerated or serialized to json.\n\n    cacheFor = (pkg) ->\n      return pkg.cache if pkg.cache\n\n      Object.defineProperty pkg, \"cache\",\n        value: {}\n\n      return pkg.cache\n\nAnnotate a program with a source url so we can debug in Chrome's dev tools.\n\n    annotateSourceURL = (program, pkg, path) ->\n      \"\"\"\n        #{program}\n        //# sourceURL=#{pkg.scopedName}/#{path}\n      \"\"\"\n\nReturn value for inserting into function for embedded windows.\n\n    return publicAPI\n\nDefinitions\n-----------\n\n### Module\n\nA module is a file.\n\n### Package\n\nA package is an aggregation of modules. A package is a json object with the\nfollowing properties:\n\n- `distribution` An object whose keys are paths and properties are `fileData`\n- `entryPoint` Path to the primary module that requiring this package will require.\n- `dependencies` An object whose keys are names and whose values are packages.\n\nIt may have additional properties such as `source`, `repository`, and `docs`.\n\n### Application\n\nAn application is a package which has an `entryPoint` and may have dependencies.\nAdditionally an application's dependencies may have dependencies. Dependencies\nmust be bundled with the package.\n",
          "mode": "100644",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "content": "version: \"0.5.1\"\n",
          "mode": "100644",
          "type": "blob"
        },
        "samples/circular.coffee": {
          "path": "samples/circular.coffee",
          "content": "# This test file illustrates a circular requirement and should throw an error.\n\nrequire \"./circular\"\n",
          "mode": "100644",
          "type": "blob"
        },
        "samples/random.coffee": {
          "path": "samples/random.coffee",
          "content": "# Returns a random value, used for testing caching\n\nmodule.exports = Math.random()\n",
          "mode": "100644",
          "type": "blob"
        },
        "samples/terminal.coffee": {
          "path": "samples/terminal.coffee",
          "content": "# A test file for requiring a file that has no dependencies. It should succeed.\n\nexports.something = true\n",
          "mode": "100644",
          "type": "blob"
        },
        "samples/throws.coffee": {
          "path": "samples/throws.coffee",
          "content": "# A test file that throws an error.\n\nthrow \"yolo\"\n",
          "mode": "100644",
          "type": "blob"
        },
        "test/require.coffee": {
          "path": "test/require.coffee",
          "content": "\n# Load our latest require code for testing\n# NOTE: This causes the root for relative requires to be at the root dir, not the test dir\nlatestRequire = require('/main').generateFor(PACKAGE)\n\ndescribe \"PACKAGE\", ->\n  it \"should be named 'ROOT'\", ->\n    assert.equal PACKAGE.name, \"ROOT\"\n\ndescribe \"require\", ->\n  it \"should not exist globally\", ->\n    assert !global.require\n\n  it \"should be able to require a file that exists with a relative path\", ->\n    assert latestRequire('/samples/terminal')\n\n  it \"should get whatever the file exports\", ->\n    assert latestRequire('/samples/terminal').something\n\n  it \"should not get something the file doesn't export\", ->\n    assert !latestRequire('/samples/terminal').something2\n\n  it \"should throw a descriptive error when requring circular dependencies\", ->\n    assert.throws ->\n      latestRequire('/samples/circular')\n    , /circular/i\n\n  it \"should throw a descriptive error when requiring a package that doesn't exist\", ->\n    assert.throws ->\n      latestRequire \"does_not_exist\"\n    , /not found/i\n\n  it \"should throw a descriptive error when requiring a relative path that doesn't exist\", ->\n    assert.throws ->\n      latestRequire \"/does_not_exist\"\n    , /Could not find file/i\n\n  it \"should recover gracefully enough from requiring files that throw errors\", ->\n    assert.throws ->\n      latestRequire \"/samples/throws\"\n\n    assert.throws ->\n      latestRequire \"/samples/throws\"\n    , (err) ->\n      !/circular/i.test err\n\n  it \"should cache modules\", ->\n    result = latestRequire(\"/samples/random\")\n\n    assert.equal latestRequire(\"/samples/random\"), result\n\n  it \"should be able to require a JSON package object\", ->\n    SAMPLE_PACKAGE =\n      entryPoint: \"main\"\n      distribution:\n        main:\n          content: \"module.exports = require('./other')\"\n        other:\n          content: \"module.exports = 'TEST'\"\n\n    result = latestRequire SAMPLE_PACKAGE\n\n    assert.equal \"TEST\", result\n\ndescribe \"package wrapper\", ->\n  it \"should be able to generate a package wrapper\", ->\n    pkgString = latestRequire.packageWrapper(PACKAGE, \"window.r = Require;\")\n    assert pkgString\n\n  it \"should be able to execute code in the package context\", ->\n    code = latestRequire.packageWrapper(PACKAGE, \"window.test = require.packageWrapper(PACKAGE, 'alert(\\\"heyy\\\")');\")\n    Function(code)()\n    assert window.test\n    delete window.test\n\ndescribe \"public API\", ->\n  it \"should be able to require a JSON package directly\", ->\n    assert require('/main').loadPackage(PACKAGE).loadPackage\n\ndescribe \"module context\", ->\n  it \"should know __dirname\", ->\n    assert.equal \"test\", __dirname\n\n  it \"should know __filename\", ->\n    assert __filename\n\n  it \"should know its package\", ->\n    assert PACKAGE\n\ndescribe \"malformed package\", ->\n  malformedPackage =\n    distribution:\n      yolo: \"No content!\"\n\n  it \"should throw an error when attempting to require a malformed file in a package distribution\", ->\n    r = require('/main').generateFor(malformedPackage)\n\n    assert.throws ->\n      r.require \"yolo\"\n    , (err) ->\n      !/malformed/i.test err\n\ndescribe \"dependent packages\", ->\n  PACKAGE.dependencies[\"test-package\"] =\n    distribution:\n      main:\n        content: \"module.exports = PACKAGE.name\"\n\n  PACKAGE.dependencies[\"strange/name\"] =\n    distribution:\n      main:\n        content: \"\"\n\n  it \"should raise an error when requiring a package that doesn't exist\", ->\n    assert.throws ->\n      latestRequire \"nonexistent\"\n    , (err) ->\n      /nonexistent/i.test err\n\n  it \"should be able to require a package that exists\", ->\n    assert latestRequire(\"test-package\")\n\n  it \"Dependent packages should know their names when required\", ->\n    assert.equal latestRequire(\"test-package\"), \"test-package\"\n\n  it \"should be able to require by pretty much any name\", ->\n    assert latestRequire(\"strange/name\")\n",
          "mode": "100644"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "(function() {\n  var annotateSourceURL, cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, publicAPI, rootModule, startsWith,\n    __slice = [].slice;\n\n  fileSeparator = '/';\n\n  global = self;\n\n  defaultEntryPoint = \"main\";\n\n  circularGuard = {};\n\n  rootModule = {\n    path: \"\"\n  };\n\n  loadPath = function(parentModule, pkg, path) {\n    var cache, localPath, module, normalizedPath;\n    if (startsWith(path, '/')) {\n      localPath = [];\n    } else {\n      localPath = parentModule.path.split(fileSeparator);\n    }\n    normalizedPath = normalizePath(path, localPath);\n    cache = cacheFor(pkg);\n    if (module = cache[normalizedPath]) {\n      if (module === circularGuard) {\n        throw \"Circular dependency detected when requiring \" + normalizedPath;\n      }\n    } else {\n      cache[normalizedPath] = circularGuard;\n      try {\n        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);\n      } finally {\n        if (cache[normalizedPath] === circularGuard) {\n          delete cache[normalizedPath];\n        }\n      }\n    }\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var piece, result;\n    if (base == null) {\n      base = [];\n    }\n    base = base.concat(path.split(fileSeparator));\n    result = [];\n    while (base.length) {\n      switch (piece = base.shift()) {\n        case \"..\":\n          result.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          result.push(piece);\n      }\n    }\n    return result.join(fileSeparator);\n  };\n\n  loadPackage = function(pkg) {\n    var path;\n    path = pkg.entryPoint || defaultEntryPoint;\n    return loadPath(rootModule, pkg, path);\n  };\n\n  loadModule = function(pkg, path) {\n    var args, content, context, dirname, file, module, program, values;\n    if (!(file = pkg.distribution[path])) {\n      throw \"Could not find file at \" + path + \" in \" + pkg.name;\n    }\n    if ((content = file.content) == null) {\n      throw \"Malformed package. No content for file at \" + path + \" in \" + pkg.name;\n    }\n    program = annotateSourceURL(content, pkg, path);\n    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);\n    module = {\n      path: dirname,\n      exports: {}\n    };\n    context = {\n      require: generateRequireFn(pkg, module),\n      global: global,\n      module: module,\n      exports: module.exports,\n      PACKAGE: pkg,\n      __filename: path,\n      __dirname: dirname\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    if (!(startsWith(path, fileSeparator) || startsWith(path, \".\" + fileSeparator) || startsWith(path, \"..\" + fileSeparator))) {\n      return path.split(fileSeparator)[0];\n    } else {\n      return false;\n    }\n  };\n\n  generateRequireFn = function(pkg, module) {\n    var fn;\n    if (module == null) {\n      module = rootModule;\n    }\n    if (pkg.name == null) {\n      pkg.name = \"ROOT\";\n    }\n    if (pkg.scopedName == null) {\n      pkg.scopedName = \"ROOT\";\n    }\n    fn = function(path) {\n      var otherPackage;\n      if (typeof path === \"object\") {\n        return loadPackage(path);\n      } else if (isPackage(path)) {\n        if (!(otherPackage = pkg.dependencies[path])) {\n          throw \"Package: \" + path + \" not found.\";\n        }\n        if (otherPackage.name == null) {\n          otherPackage.name = path;\n        }\n        if (otherPackage.scopedName == null) {\n          otherPackage.scopedName = \"\" + pkg.scopedName + \":\" + path;\n        }\n        return loadPackage(otherPackage);\n      } else {\n        return loadPath(module, pkg, path);\n      }\n    };\n    fn.packageWrapper = publicAPI.packageWrapper;\n    fn.executePackageWrapper = publicAPI.executePackageWrapper;\n    return fn;\n  };\n\n  publicAPI = {\n    generateFor: generateRequireFn,\n    packageWrapper: function(pkg, code) {\n      return \";(function(PACKAGE) {\\n  var src = \" + (JSON.stringify(PACKAGE.distribution.main.content)) + \";\\n  var Require = new Function(\\\"PACKAGE\\\", \\\"return \\\" + src)({distribution: {main: {content: src}}});\\n  var require = Require.generateFor(PACKAGE);\\n  \" + code + \";\\n})(\" + (JSON.stringify(pkg, null, 2)) + \");\";\n    },\n    executePackageWrapper: function(pkg) {\n      return publicAPI.packageWrapper(pkg, \"require('./\" + pkg.entryPoint + \"')\");\n    },\n    loadPackage: loadPackage\n  };\n\n  if (typeof exports !== \"undefined\" && exports !== null) {\n    module.exports = publicAPI;\n  } else {\n    global.Require = publicAPI;\n  }\n\n  startsWith = function(string, prefix) {\n    return string.lastIndexOf(prefix, 0) === 0;\n  };\n\n  cacheFor = function(pkg) {\n    if (pkg.cache) {\n      return pkg.cache;\n    }\n    Object.defineProperty(pkg, \"cache\", {\n      value: {}\n    });\n    return pkg.cache;\n  };\n\n  annotateSourceURL = function(program, pkg, path) {\n    return \"\" + program + \"\\n//# sourceURL=\" + pkg.scopedName + \"/\" + path;\n  };\n\n  return publicAPI;\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.5.1\"};",
          "type": "blob"
        },
        "samples/circular": {
          "path": "samples/circular",
          "content": "(function() {\n  require(\"./circular\");\n\n}).call(this);\n",
          "type": "blob"
        },
        "samples/random": {
          "path": "samples/random",
          "content": "(function() {\n  module.exports = Math.random();\n\n}).call(this);\n",
          "type": "blob"
        },
        "samples/terminal": {
          "path": "samples/terminal",
          "content": "(function() {\n  exports.something = true;\n\n}).call(this);\n",
          "type": "blob"
        },
        "samples/throws": {
          "path": "samples/throws",
          "content": "(function() {\n  throw \"yolo\";\n\n}).call(this);\n",
          "type": "blob"
        },
        "test/require": {
          "path": "test/require",
          "content": "(function() {\n  var latestRequire;\n\n  latestRequire = require('/main').generateFor(PACKAGE);\n\n  describe(\"PACKAGE\", function() {\n    return it(\"should be named 'ROOT'\", function() {\n      return assert.equal(PACKAGE.name, \"ROOT\");\n    });\n  });\n\n  describe(\"require\", function() {\n    it(\"should not exist globally\", function() {\n      return assert(!global.require);\n    });\n    it(\"should be able to require a file that exists with a relative path\", function() {\n      return assert(latestRequire('/samples/terminal'));\n    });\n    it(\"should get whatever the file exports\", function() {\n      return assert(latestRequire('/samples/terminal').something);\n    });\n    it(\"should not get something the file doesn't export\", function() {\n      return assert(!latestRequire('/samples/terminal').something2);\n    });\n    it(\"should throw a descriptive error when requring circular dependencies\", function() {\n      return assert.throws(function() {\n        return latestRequire('/samples/circular');\n      }, /circular/i);\n    });\n    it(\"should throw a descriptive error when requiring a package that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"does_not_exist\");\n      }, /not found/i);\n    });\n    it(\"should throw a descriptive error when requiring a relative path that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"/does_not_exist\");\n      }, /Could not find file/i);\n    });\n    it(\"should recover gracefully enough from requiring files that throw errors\", function() {\n      assert.throws(function() {\n        return latestRequire(\"/samples/throws\");\n      });\n      return assert.throws(function() {\n        return latestRequire(\"/samples/throws\");\n      }, function(err) {\n        return !/circular/i.test(err);\n      });\n    });\n    it(\"should cache modules\", function() {\n      var result;\n      result = latestRequire(\"/samples/random\");\n      return assert.equal(latestRequire(\"/samples/random\"), result);\n    });\n    return it(\"should be able to require a JSON package object\", function() {\n      var SAMPLE_PACKAGE, result;\n      SAMPLE_PACKAGE = {\n        entryPoint: \"main\",\n        distribution: {\n          main: {\n            content: \"module.exports = require('./other')\"\n          },\n          other: {\n            content: \"module.exports = 'TEST'\"\n          }\n        }\n      };\n      result = latestRequire(SAMPLE_PACKAGE);\n      return assert.equal(\"TEST\", result);\n    });\n  });\n\n  describe(\"package wrapper\", function() {\n    it(\"should be able to generate a package wrapper\", function() {\n      var pkgString;\n      pkgString = latestRequire.packageWrapper(PACKAGE, \"window.r = Require;\");\n      return assert(pkgString);\n    });\n    return it(\"should be able to execute code in the package context\", function() {\n      var code;\n      code = latestRequire.packageWrapper(PACKAGE, \"window.test = require.packageWrapper(PACKAGE, 'alert(\\\"heyy\\\")');\");\n      Function(code)();\n      assert(window.test);\n      return delete window.test;\n    });\n  });\n\n  describe(\"public API\", function() {\n    return it(\"should be able to require a JSON package directly\", function() {\n      return assert(require('/main').loadPackage(PACKAGE).loadPackage);\n    });\n  });\n\n  describe(\"module context\", function() {\n    it(\"should know __dirname\", function() {\n      return assert.equal(\"test\", __dirname);\n    });\n    it(\"should know __filename\", function() {\n      return assert(__filename);\n    });\n    return it(\"should know its package\", function() {\n      return assert(PACKAGE);\n    });\n  });\n\n  describe(\"malformed package\", function() {\n    var malformedPackage;\n    malformedPackage = {\n      distribution: {\n        yolo: \"No content!\"\n      }\n    };\n    return it(\"should throw an error when attempting to require a malformed file in a package distribution\", function() {\n      var r;\n      r = require('/main').generateFor(malformedPackage);\n      return assert.throws(function() {\n        return r.require(\"yolo\");\n      }, function(err) {\n        return !/malformed/i.test(err);\n      });\n    });\n  });\n\n  describe(\"dependent packages\", function() {\n    PACKAGE.dependencies[\"test-package\"] = {\n      distribution: {\n        main: {\n          content: \"module.exports = PACKAGE.name\"\n        }\n      }\n    };\n    PACKAGE.dependencies[\"strange/name\"] = {\n      distribution: {\n        main: {\n          content: \"\"\n        }\n      }\n    };\n    it(\"should raise an error when requiring a package that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"nonexistent\");\n      }, function(err) {\n        return /nonexistent/i.test(err);\n      });\n    });\n    it(\"should be able to require a package that exists\", function() {\n      return assert(latestRequire(\"test-package\"));\n    });\n    it(\"Dependent packages should know their names when required\", function() {\n      return assert.equal(latestRequire(\"test-package\"), \"test-package\");\n    });\n    return it(\"should be able to require by pretty much any name\", function() {\n      return assert(latestRequire(\"strange/name\"));\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://www.danielx.net/editor/"
      },
      "version": "0.5.1",
      "entryPoint": "main",
      "repository": {
        "branch": "quinine",
        "default_branch": "master",
        "full_name": "distri/require",
        "homepage": null,
        "description": "Require system for self replicating client side apps",
        "html_url": "https://github.com/distri/require",
        "url": "https://api.github.com/repos/distri/require",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    },
    "util": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 \n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "util\n====\n\nSmall utility methods for JS\n",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "mode": "100644",
          "content": "Util\n====\n\n    module.exports =\n      approach: (current, target, amount) ->\n        (target - current).clamp(-amount, amount) + current\n\nApply a stylesheet idempotently.\n\n      applyStylesheet: (style, id=\"primary\") ->\n        styleNode = document.createElement(\"style\")\n        styleNode.innerHTML = style\n        styleNode.id = id\n\n        if previousStyleNode = document.head.querySelector(\"style##{id}\")\n          previousStyleNode.parentNode.removeChild(prevousStyleNode)\n\n        document.head.appendChild(styleNode)\n\n      defaults: (target, objects...) ->\n        for object in objects\n          for name of object\n            unless target.hasOwnProperty(name)\n              target[name] = object[name]\n\n        return target\n\n      extend: (target, sources...) ->\n        for source in sources\n          for name of source\n            target[name] = source[name]\n\n        return target\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.1.0\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "(function() {\n  var __slice = [].slice;\n\n  module.exports = {\n    approach: function(current, target, amount) {\n      return (target - current).clamp(-amount, amount) + current;\n    },\n    applyStylesheet: function(style, id) {\n      var previousStyleNode, styleNode;\n      if (id == null) {\n        id = \"primary\";\n      }\n      styleNode = document.createElement(\"style\");\n      styleNode.innerHTML = style;\n      styleNode.id = id;\n      if (previousStyleNode = document.head.querySelector(\"style#\" + id)) {\n        previousStyleNode.parentNode.removeChild(prevousStyleNode);\n      }\n      return document.head.appendChild(styleNode);\n    },\n    defaults: function() {\n      var name, object, objects, target, _i, _len;\n      target = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      for (_i = 0, _len = objects.length; _i < _len; _i++) {\n        object = objects[_i];\n        for (name in object) {\n          if (!target.hasOwnProperty(name)) {\n            target[name] = object[name];\n          }\n        }\n      }\n      return target;\n    },\n    extend: function() {\n      var name, source, sources, target, _i, _len;\n      target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      for (_i = 0, _len = sources.length; _i < _len; _i++) {\n        source = sources[_i];\n        for (name in source) {\n          target[name] = source[name];\n        }\n      }\n      return target;\n    }\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.1.0\"};",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.0",
      "entryPoint": "main",
      "repository": {
        "id": 18501018,
        "name": "util",
        "full_name": "distri/util",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/distri/util",
        "description": "Small utility methods for JS",
        "fork": false,
        "url": "https://api.github.com/repos/distri/util",
        "forks_url": "https://api.github.com/repos/distri/util/forks",
        "keys_url": "https://api.github.com/repos/distri/util/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/util/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/util/teams",
        "hooks_url": "https://api.github.com/repos/distri/util/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/util/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/util/events",
        "assignees_url": "https://api.github.com/repos/distri/util/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/util/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/util/tags",
        "blobs_url": "https://api.github.com/repos/distri/util/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/util/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/util/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/util/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/util/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/util/languages",
        "stargazers_url": "https://api.github.com/repos/distri/util/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/util/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/util/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/util/subscription",
        "commits_url": "https://api.github.com/repos/distri/util/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/util/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/util/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/util/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/util/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/util/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/util/merges",
        "archive_url": "https://api.github.com/repos/distri/util/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/util/downloads",
        "issues_url": "https://api.github.com/repos/distri/util/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/util/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/util/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/util/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/util/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/util/releases{/id}",
        "created_at": "2014-04-06T22:42:56Z",
        "updated_at": "2014-04-06T22:42:56Z",
        "pushed_at": "2014-04-06T22:42:56Z",
        "git_url": "git://github.com/distri/util.git",
        "ssh_url": "git@github.com:distri/util.git",
        "clone_url": "https://github.com/distri/util.git",
        "svn_url": "https://github.com/distri/util",
        "homepage": null,
        "size": 0,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": null,
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "organization": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
          "url": "https://api.github.com/users/distri",
          "html_url": "https://github.com/distri",
          "followers_url": "https://api.github.com/users/distri/followers",
          "following_url": "https://api.github.com/users/distri/following{/other_user}",
          "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
          "organizations_url": "https://api.github.com/users/distri/orgs",
          "repos_url": "https://api.github.com/users/distri/repos",
          "events_url": "https://api.github.com/users/distri/events{/privacy}",
          "received_events_url": "https://api.github.com/users/distri/received_events",
          "type": "Organization",
          "site_admin": false
        },
        "network_count": 0,
        "subscribers_count": 2,
        "branch": "v0.1.0",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    }
  }
});