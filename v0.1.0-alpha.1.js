(function() {
  var Runner, runningWindows;

  runningWindows = [];

  Runner = function() {
    return {
      run: function(_arg) {
        var config, height, sandbox, width, _ref;
        config = (_arg != null ? _arg : {}).config;
        _ref = config || {}, width = _ref.width, height = _ref.height;
        sandbox = Sandbox({
          width: width,
          height: height
        });
        runningWindows.push(sandbox);
        return sandbox;
      },
      testsHtml: function(testScripts) {
        return "<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>Mocha Tests</title>\n  <link rel=\"stylesheet\" href=\"http://strd6.github.io/tests/mocha.css\"/>\n</head>\n<body>\n  <div id=\"mocha\"></div>\n  <script src=\"http://strd6.github.io/tests/assert.js\"><\/script>\n  <script src=\"http://strd6.github.io/tests/mocha.js\"><\/script>\n  <script>mocha.setup('bdd')<\/script>\n  " + testScripts + "\n  <script>\n    mocha.checkLeaks();\n    mocha.globals(['jQuery']);\n    mocha.run();\n  <\/script>\n</body>\n</html>";
      },
      hotReloadCSS: function(css) {
        return runningWindows = runningWindows.select(function(window) {
          if (window.closed) {
            return false;
          }
          $(window.document).find("body style:eq(0)").html(css);
          return true;
        });
      }
    };
  };

  module.exports = Runner;

}).call(this);

//# sourceURL=runner.coffee