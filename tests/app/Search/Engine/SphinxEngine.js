app.registerClass('Search/Engine/SphinxEngine', {

    $_implements: ["Search/SearchEngineInterface"],

    _searchConstruct: null,

    _searchCalls: null,

    $_constructor: function(search)
    {
        this._searchConstruct = search;
    },

    getName: function()
    {
        return "sphinx";
    },

    setSearch: function(search)
    {
        this._searchCalls = search;
    },

    search: function(keywords)
    {
        return 'Sphinx search results of keywords: "' + keywords.join('", "') + '"';
    }
});