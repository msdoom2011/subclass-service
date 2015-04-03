app.registerClass('Search/Engine/SphinxEngine', {

    $_implements: ["Search/SearchEngineInterface"],

    getName: function()
    {
        return "sphinx";
    },

    search: function(keywords)
    {
        return 'Sphinx search results of keywords: "' + keywords.join('", "') + '"';
    }
});