var appForthPlugin = Subclass.createModule('appForthPlugin', {
    pluginOf: 'appSecondPlugin',
    services: {
        search: {
            className: "Search/InitSearch",
            arguments: ["%engine%", "@service_manager"],
            calls: {
                initialize: ["%mode%"]
            }
        }
    },
    onSetup: function(evt)
    {
        var searchService = this.getServiceManager().getDefinition('search');
        searchService.addArgument(2, 'extraArg');
        searchService.addCall('extraMethod');
    }
});

!function() {

    appForthPlugin.registerClass("Search/InitSearch", {

        $_extends: "Plugs/SearchService",

        _mode: null,

        _extraArg: null,

        _extraCalled: false,

        _serviceManager: null,

        $_constructor: function(engineName, serviceManager, extraArg)
        {
            this.callParent('$_constructor', engineName);
            this._serviceManager = serviceManager;
            this._extraArg = extraArg;
        },

        initialize: function(mode)
        {
            this._mode = mode;
        },

        getMode: function()
        {
            return this._mode;
        },

        extraMethod: function()
        {
            this._extraCalled = true;
        }
    });
}();