var appFirstPlugin = Subclass.createModule('appFirstPlugin', {
    plugin: true,
    parameters: {
        searchClass: "Plugs/SearchService"
    }
});

!function() {

    var plug = appFirstPlugin;

    plug.registerClass("Plugs/SearchService", {

        $_extends: 'Search/SearchService',

        getCache: function()
        {
            return true;
        }
    });
}();