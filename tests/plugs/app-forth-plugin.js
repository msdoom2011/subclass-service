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
    }
});

!function() {

    appForthPlugin.registerClass("Search/InitSearch", {

        $_extends: "Plugs/SearchService",

        _mode: null,

        initialize: function(mode)
        {
            this._mode = mode;
        },

        getMode: function()
        {
            return this._mode;
        }
    });
}();