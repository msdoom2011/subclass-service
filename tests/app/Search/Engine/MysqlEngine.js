app.registerClass('Search/Engine/MysqlEngine', {

    $_implements: ["Search/SearchEngineInterface"],

    _searchConstruct: null,

    _searchCalls: null,

    $_constructor: function(search)
    {
        this._searchConstruct = search;
    },

    getName: function()
    {
        return "mysql";
    },

    setSearch: function(search)
    {
        this._searchCalls = search;
    },

    search: function(keywords)
    {
        return 'Mysql search results of keywords: "' + keywords.join('", "') + '"';
    }
});