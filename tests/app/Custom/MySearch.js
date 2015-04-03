app.registerClass("Custom/MySearch", {

    _search: null,

    $_constructor: function(search)
    {
        this._search = search;
    },

    setUsedEngine: function(engineName)
    {
        this._search.setUsedEngine(engineName);
    },

    search: function(keywords)
    {
        return 'Search words "' + keywords.join('", "') + '" ' +
            'using engine "' + this._search.getUsedEngine().getName() + '". (custom search)';
    }
});