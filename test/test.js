

var assert = require('assert')

var Loopy = require('../Loopy.js')

describe('loopy', function() {

  it('interval required', function() {
    try {
      var loop = new Loopy()
    } catch(err) {
      return assert.ok(err)
    }

    assert.fail('Expected an error')

  })


  it('interval', function(done) {
    var options = {
      interval: 100,
      count: 2
    }
    var loop = new Loopy(options)

    var actualTickCount = 0
    loop.on('tick', function(callback) {
      actualTickCount ++
      callback()
    })

    loop.on('error', function(err) {

      assert.fail(err)

    })

    loop.on('stop', function() {
      assert(actualTickCount, options.count)
      setTimeout(done, 200)
    })

    loop.start()


  })


  it('exponential backoff', function(done) {
    var options = {
      interval: 10,
      count: 5,
      onError: Loopy.OnError.EXPONENTIAL_BACKOFF
    }
    var loop = new Loopy(options)

    var lastTime = Date.now()
    var minExpectedInterval = 5
    loop.on('tick', function(callback) {
      if(loop.count() < options.count) {

        var interval = Date.now() - lastTime
        lastTime = Date.now()
        minExpectedInterval *= 2

        assert.ok(interval >= minExpectedInterval)

        callback(new Error('foo'))

      } else {
        var interval = Date.now() - lastTime
        assert.ok(interval >= options.interval)
        callback()
      }
    })

    var errorCount = 0

    loop.on('error', function(err) {
      errorCount ++
    })

    loop.on('stop', function() {
      assert.equal(errorCount, options.count-1)
      assert(loop.count(), options.count)
      setTimeout(done, 200)
    })

    loop.start()


  })


  it('manual stop', function(done) {
    var options = {
      interval: 100,
      count: 2
    }
    var loop = new Loopy(options)

    var tickCalled = false
    loop.on('tick', function(callback) {
      assert.ok(!tickCalled)
      tickCalled = true
      callback(new Error('foo'))
    })

    loop.on('error', function(err) {
      assert.ok(err)
    })

    loop.on('stop', function() {
      assert.ok(tickCalled)
      setTimeout(done, 200)
    })

    loop.start()

    setTimeout(function() {
      loop.stop()
    }, 150)


  })


  it('start(now)', function(done) {
    this.timeout(100)

    var options = {
      interval: 1000,
      count: 1
    }
    var loop = new Loopy(options)

    var tickCalled = false
    loop.on('tick', function(callback) {
      assert.ok(!tickCalled)
      tickCalled = true
      callback()
    })

    loop.on('error', function(err) {
      assert.fail(err)
    })

    loop.on('stop', function() {
      assert.ok(tickCalled)
      done()
    })

    loop.start(true)

  })


  it('reset interval', function(done) {
    this.timeout(200)
    var startTime = Date.now()
    
    function delaySinceStart() {
      return (Date.now() - startTime)
    }

    var options = {
      interval: 20,
      count: 1
    }
    var loop = new Loopy(options)
    
    var tickCalled = false
    loop.on('tick', function(callback) {
      tickCalled = true
      var delay = delaySinceStart()

      assert.ok(delay >= 40, delay)

      callback()
    })

    loop.on('error', function(err) {
      assert.fail(err)
    })

    loop.on('stop', function() {
      assert.ok(tickCalled)
      done()
    })

    loop.start()

    setTimeout(function() {
      loop.reset()
      setTimeout(function() {
        loop.reset()
      }, 10)
    }, 10)

  })

    
  it('update interval', function(done) {
    this.timeout(200)
    var startTime = Date.now()
    
    function delaySinceStart() {
      return (Date.now() - startTime)
    }

    var options = {
      interval: 10,
      count: 2
    }
    var loop = new Loopy(options)

    var tickCalled = 0
    loop.on('tick', function(callback) {
      tickCalled ++;
      var delay = delaySinceStart()

      if(tickCalled === 1) {
        loop.setInterval(100)
        assert.ok(delay < 100, delay)
        assert.ok(delay >= 10, delay)
      } else if(tickCalled === 2) {
        assert.ok(delay >= 110, delay)
      }
      callback()
    })

    loop.on('error', function(err) {
      assert.fail(err)
    })

    loop.on('stop', function() {
      assert.equal(tickCalled, 2)
      done()
    })

    loop.start()

  })

})
