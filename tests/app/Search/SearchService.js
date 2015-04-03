app.registerClass("Search/SearchService", {

    $_implements: [
        "Subclass/Service/TaggableInterface",
        "Search/SearchInterface"
    ],

    _usedEngine: null,

    _engines: {},

    _error: false,

    $_constructor: function(engineName)
    {
        this.setUsedEngine(engineName);
    },

    processTaggedServices: function(taggedServices)
    {
        for (var i = 0; i < taggedServices.length; i++) {
            var service = taggedServices[i];
            var serviceInstance = service.createInstance();
            var serviceName = serviceInstance.getName();

            if (!serviceInstance.isImplements('Search/SearchEngineInterface')) {
                this._error = true;
                continue;
            }
            this.addEngine(
                serviceName,
                service.createInstance()
            );
        }
    },

    setUsedEngine: function(engineName)
    {
        this._usedEngine = engineName;
    },

    getUsedEngine: function()
    {
        return this.getEngine(this._usedEngine);
    },

    addEngine: function(engineName, engine)
    {
        this._engines[engineName] = engine;
    },

    getEngine: function(engineName)
    {
        return this._engines[engineName];
    },

    getEngines: function()
    {
        return this._engines;
    },

    search: function(keywords)
    {
        return this.getUsedEngine().search(keywords);
    },

    isError: function()
    {
        return this._error;
    }
});