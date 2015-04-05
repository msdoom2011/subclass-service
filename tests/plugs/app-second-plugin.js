var appSecondPlugin = Subclass.createModule('appSecondPlugin', ['appThirdPlugin'], {
    pluginOf: "app",
    parameters: {
        searchMysqlEngine: "Search/Engine/MysqlCustomEngine"
    },
    services: {
        search_mysql_engine: {
            extends: "search_engine",
            className: "%searchMysqlEngine%",
            calls: {
                initialize: ["%mode%"]
            }
        }
    }
});

!function() {

    appSecondPlugin.registerClass("Search/Engine/MysqlCustomEngine", {

        $_extends: "Search/Engine/MysqlEngine",

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
