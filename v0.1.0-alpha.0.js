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