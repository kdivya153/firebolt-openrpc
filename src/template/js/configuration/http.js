function _initialize(distributor, endpoint, config, apis) {
  Configuration.set(config)
  Configuration.set('distributor', distributor)
  Http.setEndpoint(endpoint || config.endpoint)
  Http.onAuthorize(apis.authorize)
}

export const initialize = window.__firebolt ? () => { throw new Error('Use Extensions.initialize() from \'@firebolt-js/sdk\' to initialize ${sdk.name}.') } : _initialize

window.__firebolt && window.__firebolt.registerExtensionSDK('${sdk.id}', _initialize)