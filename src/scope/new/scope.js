'use strict'

const asyncHooks = require('../async_hooks')
const executionAsyncId = asyncHooks.executionAsyncId
const Base = require('./base')
const platform = require('../../platform')

let singleton = null

class Scope extends Base {
  constructor (options) {
    if (singleton) return singleton

    super()

    singleton = this

    this._spans = Object.create(null)
    this._hook = asyncHooks.createHook({
      init: this._init.bind(this),
      destroy: this._destroy.bind(this),
      promiseResolve: this._destroy.bind(this)
    })

    this._hook.enable()

    if (options && options.debug) {
      this._debug()
    }
  }

  _active () {
    return this._get(executionAsyncId())
  }

  _activate (span, callback) {
    const asyncId = executionAsyncId()
    const oldSpan = this._get(asyncId)

    this._spans[asyncId] = span || null

    try {
      return callback()
    } catch (e) {
      if (span && typeof span.addTags === 'function') {
        span.addTags({
          'error.type': e.name,
          'error.msg': e.message,
          'error.stack': e.stack
        })
      }

      throw e
    } finally {
      this._spans[asyncId] = oldSpan
    }
  }

  _init (asyncId) {
    this._spans[asyncId] = this._active()

    platform.metrics().increment('async.resources')
  }

  _destroy (asyncId) {
    if (this._spans[asyncId] !== undefined) {
      platform.metrics().decrement('async.resources')
    }

    delete this._spans[asyncId]
  }

  _get (asyncId) {
    return this._spans[asyncId] || null
  }

  _debug () {
    asyncHooks.createHook({
      init: this._debugInit.bind(this),
      destroy: this._debugDestroy.bind(this),
      promiseResolve: this._debugDestroy.bind(this)
    }).enable()

    this._types = Object.create(null)
  }

  _debugInit (asyncId, type) {
    this._types[asyncId] = type

    platform.metrics().increment('async.resources.by.type', `resource_type:${type}`)
  }

  _debugDestroy (asyncId) {
    const type = this._types[asyncId]

    if (type) {
      platform.metrics().decrement('async.resources.by.type', `resource_type:${type}`)
    }

    delete this._types[asyncId]
  }
}

module.exports = Scope
