'use strict'

const RouterPlugin = require('../../datadog-plugin-router/src')

class ExpressPlugin extends RouterPlugin {
  static get id () {
    return 'express'
  }

  constructor (...args) {
    super(...args)

    // different argument for addSub method - new constructor
    this.addSub('apm:express:request:handle', ({ req }) => {
      console.time('PluginExecution');
      console.log('handling req', req.method, req.url);
      this.setFramework(req, 'express', this.config);
      console.timeEnd('PluginExecution');
      // this.tracer.setTag('custom.tag', this.config); - applies to all the express spans
      // add tags to see in trace explorer
    })
  }
}

// use pr to use hash and change packagejson or change path of dd-trace to my computer

// go outside of express plugins and see what others do (adding spans is majority of work but not all)

// how can i get more info from this code => getting access to different variables from different functions

// distributed tracing - because of plugins and context switching (context propagation) - connect the different plugins via context propagation in one trace 
module.exports = ExpressPlugin
