var appThirdPlugin = Subclass.createModule('appThirdPlugin', {
    plugin: true,
    parameters: {
        searchSolrEngine: "Search/Engine/SolrEngine"
    },
    services: {
        search_solr_engine: {
            extends: "search_engine",
            className: "%searchSolrEngine%"
        }
    }
});

!function() {
    appThirdPlugin.registerClass('Search/Engine/SolrEngine', {

        $_implements: ["Search/SearchEngineInterface"],

        _searchConstruct: null,

        _searchCalls: null,

        $_constructor: function(search)
        {
            this._searchConstruct = search;
        },

        getName: function()
        {
            return "solr";
        },

        setSearch: function(search)
        {
            this._searchCalls = search;
        },

        search: function(keywords)
        {
            return 'Solr search results of keywords: "' + keywords.join('", "') + '"';
        }
    });
}();