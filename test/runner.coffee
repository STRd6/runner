Runner = require "../runner"

describe "runner", ->
  it "should launch windows", (done) ->
    runner = Runner()
    r = null

    setTimeout ->
      r = runner.run()

      assert r != window, "Popup should not be this window"
    , 100

    setTimeout ->
      r.close()
      done()
    , 200

describe "PackageRunner", ->
  it "should launch and run packages", (done) ->
    {PackageRunner} = Runner
    runner = Runner()

    sandbox = runner.run()
    
    launcher = PackageRunner(sandbox.document)

    launcher.launch(PACKAGE)

    setTimeout ->
      sandbox.close()
      done()
    , 1000
