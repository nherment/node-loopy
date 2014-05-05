
[![Build Status](https://api.travis-ci.org/nherment/node-loopy.png?branch=master)](https://travis-ci.org/nherment/node-loopy)


Loopy
=====

Executes asynchronous tasks at regular intervals with the ability to be serialized and resumed later.


Quick start
-----------

    var Loopy = require('loopy')

    var loop = new Loopy({
      interval: 60 * 1000,
      count: -1, // number of loops to run. -1 for infinity
      onError: Loopy.OnError.IGNORE || Loopy.OnError.EXPONENTIAL_BACKOFF || Loopy.OnError.STOP // behaviour when there is an error,
      maxInterval: 60*60*1000
    })

    // loop.status() === Loopy.Status.STOPPED

    loop.on('tick', function(callback) {

      callback(new Error('...')) // optional error argument

    })

    loop.on('stop', function(err) {

      if(loop.status() === Loopy.Status.ERROR) {
        // if the loop was stopped due to an error
        // err is defined
      }
    })

    loop.on('error', function(err) {
      // this event fires for each error that is reported by a ```tick```
      // event handler. It cannot fire after ```loop.stop()``` is called.
      // That means that if a ```tick``` is in process when you call
      // ```stop```, an error reported by that last tick will be ignored
    })

    loop.start()
    // loop.status() === Loopy.Status.STARTED


API
---

### new Loopy(options)

    var loop = new Loopy({
      timeout: 30 * 1000,
      interval: 60 * 1000,
      count: -1, // number of loop iterations to run. -1 for infinity
      onError: Loopy.OnError.IGNORE || Loopy.OnError.EXPONENTIAL_BACKOFF || Loopy.OnError.STOP // behaviour when there is an error.
      maxInterval: 60 * 60 * 1000
    })

- ```timeout```: **NOT YET IMPLEMENTED. open an issue to have it** delay in milliseconds after which an async action is considered failed. An 'timeout' event is triggered and
the subsequent behaviour is defined by the 'onError' configuration option
- ```interval```: the interval between each async function in milliseconds.
If the interval is 10 seconds and your async function takes 2 seconds to complete, async function will be called every 12 seconds.
- ```count```: the number of loop iterations to execute. The loop will stop after the count is reached.
- ```onError```: defines the behaviour when the asynchronous 'tick' handler reports an error
  - ```Loopy.OnError.IGNORE```: continue to the next iteration like nothing happened. An 'error' event will be fired.
  - ```Loopy.OnError.EXPONENTIAL_BACKOFF```: continue to the next iteration but multiply the last iteration interval by 2. That means that the interval will keep growing if there are many subsequent errors. The interval will resume to the regular value on the first successful tick. It
is possible to cap this value with the ```maxInterval``` option.
  - ```Loopy.OnError.STOP```: stop the loop. Both an ```error``` and a ```stop``` event will fire.
- ```maxInterval```: the exponential backoff upper limit, in milliseconds.


### loopy.start(now)

Starts the loop. If the loop is already started, it will behave as if the loop was not started and but the iterations count will not be reset.

- now: boolean, set to true if you wish the first tick to fire immediately instead of waiting the interval


### loopy.stop()

Immediately stops the loop iterations. If an iteration (```tick```) is currently in progress, any tick error will be ignored.


### loopy.reset()

Resets the number of iterations.


### loopy.count()

Returns the number of iterations executed.


### loopy.status()

Returns one of:

- ```Loopy.Status.ERROR```
- ```Loopy.Status.STARTED```
- ```Loopy.Status.STOPPED```
