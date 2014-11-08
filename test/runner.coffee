{PackageRunner} = require "../main"

describe "PackageRunner", ->
  it "should be separate from the popup", (done) ->
    launcher = PackageRunner()

    launcher.launch(PACKAGE)

    assert launcher.eval("window !== top")

    launcher.close()
    done()

  it "should have a window", (done) ->
    launcher = PackageRunner()

    assert launcher.window
    assert launcher.window != window

    launcher.close()
    done()

  it "should share console with the popup", (done) ->
    launcher = PackageRunner()

    launcher.launch(PACKAGE)

    assert launcher.eval("console === top.console")

    launcher.close()
    done()

  it "should share opener with the popup", (done) ->
    launcher = PackageRunner()

    launcher.launch(PACKAGE)

    assert launcher.eval("opener === top.opener")

    launcher.close()
    done()
