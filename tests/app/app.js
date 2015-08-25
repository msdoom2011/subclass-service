var app = Subclass.createModule("app", ['appFirstPlugin'], {
    parameters: {
        mode: "dev",
        engine: "mysql",
        searchClass: "Search/SearchService",
        searchFailEngine: "Search/Engine/FailEngine",
        searchMysqlEngine: "Search/Engine/MysqlEngine",
        searchSphinxEngine: "Search/Engine/SphinxEngine",
        mySearchClass: "Custom/MySearch"
    },
    services: {
        search: {
            className: "%searchClass%",
            arguments: ["%engine%"]
        },
        search_engine_bad_name: {
            abstract: true,
            tags: ["search"]
        },
        search_fail_engine: {
            extends: "search_engine",
            className: "%searchFailEngine%"
        },
        search_mysql_engine: {
            extends: "search_engine",
            className: "%searchMysqlEngine%"
        },
        search_sphinx_engine: {
            extends: "search_engine",
            className: "%searchSphinxEngine%"
        },
        my_search: {
            className: "%mySearchClass%",
            arguments: ["@search"],
            calls: {
                setUsedEngine: ["solr"]
            }
        }
    },
    onSetup: function(evt) {
        var searchEngine = this.getServiceManager().getServiceDefinition('search_engine_bad_name');
            searchEngine.rename('search_engine');
    }
});
