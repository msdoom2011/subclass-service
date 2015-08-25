var appForthPlugin = Subclass.createModule('appForthPlugin', {
    pluginOf: 'appSecondPlugin',
    services: {
        search: {
            className: "Search/InitSearch",
            arguments: ["%engine%"],
            calls: {
                initialize: ["%mode%"]
            }
        }
    },
    onSetup: function(evt)
    {
        var searchService = this.getServiceManager().getServiceDefinition('search');
        searchService.addArgument(1, 'extraArg');
        searchService.addCall('extraMethod');
    }
});

!function() {

    appForthPlugin.registerClass("Search/InitSearch", {

        $_extends: "Plugs/SearchService",

        _mode: null,

        _extraArg: null,

        _extraCalled: false,

        $_constructor: function(engineName, extraArg)
        {
            this.callParent('$_constructor', engineName);
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