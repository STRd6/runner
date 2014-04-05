(function(pkg) {
  (function() {
  var annotateSourceURL, cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule, startsWith,
    __slice = [].slice;

  fileSeparator = '/';

  global = window;

  defaultEntryPoint = "main";

  circularGuard = {};

  rootModule = {
    path: ""
  };

  loadPath = function(parentModule, pkg, path) {
    var cache, localPath, module, normalizedPath;
    if (startsWith(path, '/')) {
      localPath = [];
    } else {
      localPath = parentModule.path.split(fileSeparator);
    }
    normalizedPath = normalizePath(path, localPath);
    cache = cacheFor(pkg);
    if (module = cache[normalizedPath]) {
      if (module === circularGuard) {
        throw "Circular dependency detected when requiring " + normalizedPath;
      }
    } else {
      cache[normalizedPath] = circularGuard;
      try {
        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);
      } finally {
        if (cache[normalizedPath] === circularGuard) {
          delete cache[normalizedPath];
        }
      }
    }
    return module.exports;
  };

  normalizePath = function(path, base) {
    var piece, result;
    if (base == null) {
      base = [];
    }
    base = base.concat(path.split(fileSeparator));
    result = [];
    while (base.length) {
      switch (piece = base.shift()) {
        case "..":
          result.pop();
          break;
        case "":
        case ".":
          break;
        default:
          result.push(piece);
      }
    }
    return result.join(fileSeparator);
  };

  loadPackage = function(pkg) {
    var path;
    path = pkg.entryPoint || defaultEntryPoint;
    return loadPath(rootModule, pkg, path);
  };

  loadModule = function(pkg, path) {
    var args, context, dirname, file, module, program, values;
    if (!(file = pkg.distribution[path])) {
      throw "Could not find file at " + path + " in " + pkg.name;
    }
    program = annotateSourceURL(file.content, pkg, path);
    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);
    module = {
      path: dirname,
      exports: {}
    };
    context = {
      require: generateRequireFn(pkg, module),
      global: global,
      module: module,
      exports: module.exports,
      PACKAGE: pkg,
      __filename: path,
      __dirname: dirname
    };
    args = Object.keys(context);
    values = args.map(function(name) {
      return context[name];
    });
    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);
    return module;
  };

  isPackage = function(path) {
    if (!(startsWith(path, fileSeparator) || startsWith(path, "." + fileSeparator) || startsWith(path, ".." + fileSeparator))) {
      return path.split(fileSeparator)[0];
    } else {
      return false;
    }
  };

  generateRequireFn = function(pkg, module) {
    if (module == null) {
      module = rootModule;
    }
    if (pkg.name == null) {
      pkg.name = "ROOT";
    }
    if (pkg.scopedName == null) {
      pkg.scopedName = "ROOT";
    }
    return function(path) {
      var otherPackage;
      if (isPackage(path)) {
        if (!(otherPackage = pkg.dependencies[path])) {
          throw "Package: " + path + " not found.";
        }
        if (otherPackage.name == null) {
          otherPackage.name = path;
        }
        if (otherPackage.scopedName == null) {
          otherPackage.scopedName = "" + pkg.scopedName + ":" + path;
        }
        return loadPackage(otherPackage);
      } else {
        return loadPath(module, pkg, path);
      }
    };
  };

  if (typeof exports !== "undefined" && exports !== null) {
    exports.generateFor = generateRequireFn;
  } else {
    global.Require = {
      generateFor: generateRequireFn
    };
  }

  startsWith = function(string, prefix) {
    return string.lastIndexOf(prefix, 0) === 0;
  };

  cacheFor = function(pkg) {
    if (pkg.cache) {
      return pkg.cache;
    }
    Object.defineProperty(pkg, "cache", {
      value: {}
    });
    return pkg.cache;
  };

  annotateSourceURL = function(program, pkg, path) {
    return "" + program + "\n//# sourceURL=" + pkg.scopedName + "/" + path;
  };

}).call(this);

//# sourceURL=main.coffee
  window.require = Require.generateFor(pkg);
})({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "mode": "100644",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "mode": "100644",
      "content": "runner\n======\n\nRunner manages running apps in sandboxed windows and passing messages back and forth from the parent to the running instances.\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.2.2\"\nentryPoint: \"runner\"\ndependencies:\n  sandbox: \"distri/sandbox:v0.2.1\"\n",
      "type": "blob"
    },
    "runner.coffee.md": {
      "path": "runner.coffee.md",
      "mode": "100644",
      "content": "Runner\n======\n\nRunner manages running apps in sandboxed windows and passing messages back and\nforth from the parent to the running instances.\n\nWe keep a list of running windows so we can hot-update them when we modify our\nown code.\n\nOne cool example use is if you are modifying your css you can run several\ninstances of your app and navigate to different states. Then you can see in real\ntime how the css changes affect each one.\n\n    Sandbox = require \"sandbox\"\n\n    runningWindows = []\n\n    Runner = ->\n      run: ({config}={}) ->\n        {width, height} = (config or {})\n\n        sandbox = Sandbox\n          width: width\n          height: height\n\n        runningWindows.push sandbox\n\n        return sandbox\n\nGenerate an html template that runs the given script tag strings as tests.\n\n      testsHtml: (testScripts) ->\n        \"\"\"\n          <html>\n          <head>\n            <meta charset=\"utf-8\">\n            <title>Mocha Tests</title>\n            <link rel=\"stylesheet\" href=\"http://strd6.github.io/tests/mocha.css\"/>\n          </head>\n          <body>\n            <div id=\"mocha\"></div>\n            <script src=\"http://strd6.github.io/tests/assert.js\"><\\/script>\n            <script src=\"http://strd6.github.io/tests/mocha.js\"><\\/script>\n            <script>mocha.setup('bdd')<\\/script>\n            #{testScripts}\n            <script>\n              mocha.checkLeaks();\n              mocha.globals(['jQuery']);\n              mocha.run();\n            <\\/script>\n          </body>\n          </html>\n        \"\"\"\n\n      hotReloadCSS: (css) ->\n        runningWindows = runningWindows.filter (window) ->\n          return false if window.closed\n\n          # TODO: We're assuming only one style in the body\n          # which is reasonable in most cases, but we may want\n          # to scope it by the path of the specific css file\n          # to handle a wider range of situations\n          $(window.document).find(\"body style:eq(0)\").html(css)\n\n          return true\n\nCall a global reload method on each running window, passing in the given args.\nWe may want to switch to using `postMessage` in the future.\n\n      reload: (args...) ->\n        runningWindows = runningWindows.filter (window) ->\n          return false if window.closed\n\n          window.reload?(args...)\n\n          return true\n\n    module.exports = Runner\n",
      "type": "blob"
    },
    "test/runner.coffee": {
      "path": "test/runner.coffee",
      "mode": "100644",
      "content": "Runner = require \"../runner\"\n\ndescribe \"runner\", ->\n  it \"should hot reload\", (done) ->\n    runner = Runner()\n    r = null\n\n    setTimeout ->\n      r = runner.run()\n      runner.reload(\"test\")\n      \n      assert r != window, \"Popup should not be this window\"\n    , 500\n\n    setTimeout ->\n      r.close()\n      done()\n    , 1000\n",
      "type": "blob"
    }
  },
  "distribution": {
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.2.2\",\"entryPoint\":\"runner\",\"dependencies\":{\"sandbox\":\"distri/sandbox:v0.2.1\"}};",
      "type": "blob"
    },
    "runner": {
      "path": "runner",
      "content": "(function() {\n  var Runner, Sandbox, runningWindows,\n    __slice = [].slice;\n\n  Sandbox = require(\"sandbox\");\n\n  runningWindows = [];\n\n  Runner = function() {\n    return {\n      run: function(_arg) {\n        var config, height, sandbox, width, _ref;\n        config = (_arg != null ? _arg : {}).config;\n        _ref = config || {}, width = _ref.width, height = _ref.height;\n        sandbox = Sandbox({\n          width: width,\n          height: height\n        });\n        runningWindows.push(sandbox);\n        return sandbox;\n      },\n      testsHtml: function(testScripts) {\n        return \"<html>\\n<head>\\n  <meta charset=\\\"utf-8\\\">\\n  <title>Mocha Tests</title>\\n  <link rel=\\\"stylesheet\\\" href=\\\"http://strd6.github.io/tests/mocha.css\\\"/>\\n</head>\\n<body>\\n  <div id=\\\"mocha\\\"></div>\\n  <script src=\\\"http://strd6.github.io/tests/assert.js\\\"><\\/script>\\n  <script src=\\\"http://strd6.github.io/tests/mocha.js\\\"><\\/script>\\n  <script>mocha.setup('bdd')<\\/script>\\n  \" + testScripts + \"\\n  <script>\\n    mocha.checkLeaks();\\n    mocha.globals(['jQuery']);\\n    mocha.run();\\n  <\\/script>\\n</body>\\n</html>\";\n      },\n      hotReloadCSS: function(css) {\n        return runningWindows = runningWindows.filter(function(window) {\n          if (window.closed) {\n            return false;\n          }\n          $(window.document).find(\"body style:eq(0)\").html(css);\n          return true;\n        });\n      },\n      reload: function() {\n        var args;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        return runningWindows = runningWindows.filter(function(window) {\n          if (window.closed) {\n            return false;\n          }\n          if (typeof window.reload === \"function\") {\n            window.reload.apply(window, args);\n          }\n          return true;\n        });\n      }\n    };\n  };\n\n  module.exports = Runner;\n\n}).call(this);\n",
      "type": "blob"
    },
    "test/runner": {
      "path": "test/runner",
      "content": "(function() {\n  var Runner;\n\n  Runner = require(\"../runner\");\n\n  describe(\"runner\", function() {\n    return it(\"should hot reload\", function(done) {\n      var r, runner;\n      runner = Runner();\n      r = null;\n      setTimeout(function() {\n        r = runner.run();\n        runner.reload(\"test\");\n        return assert(r !== window, \"Popup should not be this window\");\n      }, 500);\n      return setTimeout(function() {\n        r.close();\n        return done();\n      }, 1000);\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.2.2",
  "entryPoint": "runner",
  "repository": {
    "id": 13482507,
    "name": "runner",
    "full_name": "distri/runner",
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
    "html_url": "https://github.com/distri/runner",
    "description": "Runner manages running apps in sandboxed windows and passing messages back and forth from the parent to the running instances.",
    "fork": false,
    "url": "https://api.github.com/repos/distri/runner",
    "forks_url": "https://api.github.com/repos/distri/runner/forks",
    "keys_url": "https://api.github.com/repos/distri/runner/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/distri/runner/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/distri/runner/teams",
    "hooks_url": "https://api.github.com/repos/distri/runner/hooks",
    "issue_events_url": "https://api.github.com/repos/distri/runner/issues/events{/number}",
    "events_url": "https://api.github.com/repos/distri/runner/events",
    "assignees_url": "https://api.github.com/repos/distri/runner/assignees{/user}",
    "branches_url": "https://api.github.com/repos/distri/runner/branches{/branch}",
    "tags_url": "https://api.github.com/repos/distri/runner/tags",
    "blobs_url": "https://api.github.com/repos/distri/runner/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/distri/runner/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/distri/runner/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/distri/runner/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/distri/runner/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/distri/runner/languages",
    "stargazers_url": "https://api.github.com/repos/distri/runner/stargazers",
    "contributors_url": "https://api.github.com/repos/distri/runner/contributors",
    "subscribers_url": "https://api.github.com/repos/distri/runner/subscribers",
    "subscription_url": "https://api.github.com/repos/distri/runner/subscription",
    "commits_url": "https://api.github.com/repos/distri/runner/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/distri/runner/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/distri/runner/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/distri/runner/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/distri/runner/contents/{+path}",
    "compare_url": "https://api.github.com/repos/distri/runner/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/distri/runner/merges",
    "archive_url": "https://api.github.com/repos/distri/runner/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/distri/runner/downloads",
    "issues_url": "https://api.github.com/repos/distri/runner/issues{/number}",
    "pulls_url": "https://api.github.com/repos/distri/runner/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/distri/runner/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/distri/runner/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/distri/runner/labels{/name}",
    "releases_url": "https://api.github.com/repos/distri/runner/releases{/id}",
    "created_at": "2013-10-10T20:42:25Z",
    "updated_at": "2014-04-05T16:37:55Z",
    "pushed_at": "2014-04-05T16:37:12Z",
    "git_url": "git://github.com/distri/runner.git",
    "ssh_url": "git@github.com:distri/runner.git",
    "clone_url": "https://github.com/distri/runner.git",
    "svn_url": "https://github.com/distri/runner",
    "homepage": null,
    "size": 156,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": "CoffeeScript",
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 1,
    "forks": 0,
    "open_issues": 1,
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
    "subscribers_count": 1,
    "branch": "v0.2.1",
    "publishBranch": "gh-pages"
  },
  "dependencies": {
    "sandbox": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "sandbox\n=======\n\nRun code in a popup window filled with sand.\n",
          "type": "blob"
        },
        "main.coffee.md": {
          "path": "main.coffee.md",
          "mode": "100644",
          "content": "Sandbox\n=======\n\nSandbox creates a popup window in which you can run code.\n\nYou can pass in a width and a height to set the size of the window.\n\n    module.exports = ({name, width, height, methods}={}) ->\n      name ?= \"sandbox\" + new Date\n      width ?= 800\n      height ?= 600\n      methods ?= {}\n\n      sandbox = window.open(\n        \"\"\n        name\n        \"width=#{width},height=#{height}\"\n      )\n\nPass in functions to attach to the running window. Useful for things like\n`onerror` or other utilities if you would like the running code to be able to\ncommunicate back to the parent.\n\n      extend sandbox, methods\n\nThe newly created window is returned.\n\n      return sandbox\n\nHelpers\n-------\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.2.1\"\n",
          "type": "blob"
        },
        "test/sandbox.coffee": {
          "path": "test/sandbox.coffee",
          "mode": "100644",
          "content": "Sandbox = require \"../main\"\n\ndescribe \"sandbox\", ->\n  it \"should be able to open a window\", ->\n    sandbox = Sandbox()\n\n    assert sandbox\n\n    assert sandbox != window, \"Popup should not be this window\"\n\n    sandbox.close()\n",
          "type": "blob"
        }
      },
      "distribution": {
        "main": {
          "path": "main",
          "content": "(function() {\n  var extend,\n    __slice = [].slice;\n\n  module.exports = function(_arg) {\n    var height, methods, name, sandbox, width, _ref;\n    _ref = _arg != null ? _arg : {}, name = _ref.name, width = _ref.width, height = _ref.height, methods = _ref.methods;\n    if (name == null) {\n      name = \"sandbox\" + new Date;\n    }\n    if (width == null) {\n      width = 800;\n    }\n    if (height == null) {\n      height = 600;\n    }\n    if (methods == null) {\n      methods = {};\n    }\n    sandbox = window.open(\"\", name, \"width=\" + width + \",height=\" + height);\n    extend(sandbox, methods);\n    return sandbox;\n  };\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.2.1\"};",
          "type": "blob"
        },
        "test/sandbox": {
          "path": "test/sandbox",
          "content": "(function() {\n  var Sandbox;\n\n  Sandbox = require(\"../main\");\n\n  describe(\"sandbox\", function() {\n    return it(\"should be able to open a window\", function() {\n      var sandbox;\n      sandbox = Sandbox();\n      assert(sandbox);\n      assert(sandbox !== window, \"Popup should not be this window\");\n      return sandbox.close();\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.2.1",
      "entryPoint": "main",
      "repository": {
        "id": 12746310,
        "name": "sandbox",
        "full_name": "distri/sandbox",
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
        "html_url": "https://github.com/distri/sandbox",
        "description": "Run code in a popup window filled with sand.",
        "fork": false,
        "url": "https://api.github.com/repos/distri/sandbox",
        "forks_url": "https://api.github.com/repos/distri/sandbox/forks",
        "keys_url": "https://api.github.com/repos/distri/sandbox/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/sandbox/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/sandbox/teams",
        "hooks_url": "https://api.github.com/repos/distri/sandbox/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/sandbox/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/sandbox/events",
        "assignees_url": "https://api.github.com/repos/distri/sandbox/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/sandbox/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/sandbox/tags",
        "blobs_url": "https://api.github.com/repos/distri/sandbox/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/sandbox/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/sandbox/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/sandbox/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/sandbox/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/sandbox/languages",
        "stargazers_url": "https://api.github.com/repos/distri/sandbox/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/sandbox/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/sandbox/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/sandbox/subscription",
        "commits_url": "https://api.github.com/repos/distri/sandbox/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/sandbox/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/sandbox/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/sandbox/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/sandbox/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/sandbox/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/sandbox/merges",
        "archive_url": "https://api.github.com/repos/distri/sandbox/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/sandbox/downloads",
        "issues_url": "https://api.github.com/repos/distri/sandbox/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/sandbox/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/sandbox/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/sandbox/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/sandbox/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/sandbox/releases{/id}",
        "created_at": "2013-09-11T03:03:50Z",
        "updated_at": "2014-04-05T16:45:49Z",
        "pushed_at": "2013-11-29T20:10:21Z",
        "git_url": "git://github.com/distri/sandbox.git",
        "ssh_url": "git@github.com:distri/sandbox.git",
        "clone_url": "https://github.com/distri/sandbox.git",
        "svn_url": "https://github.com/distri/sandbox",
        "homepage": null,
        "size": 232,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
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
        "subscribers_count": 1,
        "branch": "v0.2.1",
        "publishBranch": "gh-pages"
      },
      "dependencies": {}
    }
  }
});