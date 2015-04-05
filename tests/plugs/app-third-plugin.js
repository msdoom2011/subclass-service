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

        getName: function()
        {
            return "solr";
        },

        search: function(keywords)
        {
            return 'Solr search results of keywords: "' + keywords.join('", "') + '"';
        }
    });
}();