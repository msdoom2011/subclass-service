app.registerClass('Search/Engine/MysqlEngine', {

    $_implements: ["Search/SearchEngineInterface"],

    getName: function()
    {
        return "mysql";
    },

    search: function(keywords)
    {
        return 'Mysql search results of keywords: "' + keywords.join('", "') + '"';
    }
});