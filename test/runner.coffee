Runner = require "../runner"

describe "runner", ->
  it "should hot reload", (done) ->
    runner = Runner()
    r = null

    setTimeout ->
      r = runner.run()
      runner.reload("test")
      
      assert r != window, "Popup should not be this window"
    , 500

    setTimeout ->
      r.close()
      done()
    , 1000
