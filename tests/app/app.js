var app = Subclass.createModule("app", ['appFirstPlugin'], {
    parameters: {
        engine: "mysql",
        searchClass: "Search/SearchService",
        searchFailEngine: "Search/Engine/FailEngine",
        searchMysqlEngine: "Search/Engine/MysqlEngine",
        searchSolrEngine: "Search/Engine/SolrEngine",
        searchSphinxEngine: "Search/Engine/SphinxEngine",
        mySearchClass: "Custom/MySearch"
    },
    services: {
        search: {
            className: "%searchClass%",
            arguments: ["%engine%"]
        },
        search_engine: {
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
        search_solr_engine: {
            extends: "search_engine",
            className: "%searchSolrEngine%"
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
    }
});
