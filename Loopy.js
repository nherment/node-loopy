
var util         = require('util')
var EventEmitter = require('events').EventEmitter

function Loopy(options) {
  EventEmitter.call(this)
  this._options = options || {}


  if(!this._options.interval || isNaN(this._options.interval) || !this._options.interval > 0) {
    throw new Error('unsupported interval. It should be a millisecond value')
  }
  if(!this._options.hasOwnProperty('timeout')) {
    this._options.timeout = 60 * 1000
  }

  this._status = Loopy.Status.STOPPED
  this._count = 0
  this._interval = this._options.interval
}

util.inherits(Loopy, EventEmitter)

Loopy.prototype._scheduleNextTick = function(err) {
  this._cancelPlannedTimeout()
  if(err) {

    switch(this._options.onError) {
      case Loopy.OnError.EXPONENTIAL_BACKOFF:
        if(this._interval === null || this._interval === undefined) {
          this._interval = this._options.interval
        }
        this._interval *= 2
        if(this._interval > this._options.maxInterval) {
          this._interval = this._options.maxInterval
        }
        var self = this
        this._plannedTimeout = setTimeout(function() {
          self._executeTick()
        }, this._interval)
        break
      case Loopy.OnError.STOP:
        this.stop()
        this._status = Loopy.Status.ERROR
        this.emit('stop', err)
        return;
        break
      case Loopy.OnError.IGNORE:
      default:
        if(this._interval === null || this._interval === undefined) {
          this._interval = this._options.interval
        }
        var self = this
        this._plannedTimeout = setTimeout(function() {
          self._executeTick()
        }, this._interval)
        break

    }
  } else {
    if(this._interval === null || this._interval === undefined) {
      this._interval = this._options.interval
    }
    var self = this
    this._plannedTimeout = setTimeout(function() {
      self._executeTick()
    }, this._interval)
  }
}

Loopy.prototype._cancelPlannedTimeout = function() {
  if(this._plannedTimeout) {
    clearTimeout(this._plannedTimeout)
    this._plannedTimeout = null
  }
}

Loopy.prototype._executeTick = function() {
  if(!this._handleTickCallback) { // this gimmick is to reduce the memory footprint by creating only one closure per loop object
    var self = this
    this._handleTickCallback = function(err) {

      if(self._status === Loopy.Status.STOPPED) {
        return
      }

      if(err) {
        self.emit('error', err)
      }

      if(self._options.count > 0 && self._count >= self._options.count) {
        self.stop()
        return
      }

      self._scheduleNextTick(err)
    }
  }
  this._count ++
  this.emit('tick', this._handleTickCallback)
}

Loopy.prototype.status = function() {
  return this._status
}

Loopy.prototype.count = function() {
  return this._count
}

Loopy.prototype.reset = function() {
  this._count = 0
}

Loopy.prototype.setInterval = function(interval) {
  this._interval = interval
}

Loopy.prototype.start = function(now) {
  this._status = Loopy.Status.STARTED

  if(now) {
    this._executeTick()
  } else {
    this._scheduleNextTick()
  }
}

Loopy.prototype.stop = function() {
  if(this._status !== Loopy.Status.STOPPED) {
    this._status = Loopy.Status.STOPPED
    this._cancelPlannedTimeout()
    this.emit('stop', undefined)
  }
}

Loopy.OnError = {
  IGNORE: 0,
  EXPONENTIAL_BACKOFF: 1,
  STOP: 2
}

Loopy.Status = {
  STOPPED: 0,
  RUNNING: 1,
  ERROR: 2
}

module.exports = Loopy
