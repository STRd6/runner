Runner = require "../runner"

describe "runner", ->
  it "should hot reload", ->
    runner = Runner()

    r = runner.run()

    runner.reload("test")

    r.close()
