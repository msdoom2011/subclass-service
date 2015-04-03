app.registerClass('Search/Engine/SolrEngine', {

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