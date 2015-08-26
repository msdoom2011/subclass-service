
describe("Checking SubclassJS initialization", function() {

    it ("", function() {
        expect(Subclass.issetPlugin('SubclassParameter')).toBe(true);
        expect(Subclass.issetPlugin('SubclassService')).toBe(true);
    });
});

describe("Checking services", function() {

    it ("existence", function() {
        expect(app.issetService('search')).toBe(true);
        expect(app.issetService('search_engine')).toBe(true);
        expect(app.issetService('search_mysql_engine')).toBe(true);
        expect(app.issetService('search_solr_engine')).toBe(true);
        expect(app.issetService('search_sphinx_engine')).toBe(true);
    });

    it ("creation", function() {
        var search = app.getService('search');
        var searchAnother = app.getService('search');

        //console.log(Object.keys(app.getServiceManager().getServices()));
        //console.log(app.getServiceManager().getServicesByTag('search'));


        expect(search.getMode()).toBe('dev');
        expect(search._extraArg).toBe('extraArg');
        expect(search._extraCalled).toBe(true);
        expect(search._serviceManager instanceof Subclass.Service.ServiceManager).toBe(true);

        expect(search == searchAnother).toBe(true);
        expect(search.isError()).toBe(true);
        expect(search.getCache()).toBe(true);

        var searchEngines = Object.keys(search.getEngines());
        expect(searchEngines).toContain('mysql');
        expect(searchEngines).toContain('solr');
        expect(searchEngines).toContain('sphinx');

        expect(search.getUsedEngine().getName()).toBe('mysql');
        expect(search.search(['word'])).toBe('Mysql search results of keywords: "word"');

        search.setUsedEngine('solr');
        expect(search.search(['word'])).toBe('Solr search results of keywords: "word"');

        search.setUsedEngine('sphinx');
        expect(search.search(['word'])).toBe('Sphinx search results of keywords: "word"');

        var mySearch = app.getService('my_search');
        expect(mySearch.search(['word'])).toBe('Search words "word" using engine "solr". (custom search)');

        var myMysqlEngine = search.getEngine('mysql');
        expect(myMysqlEngine.getMode()).toBe('dev');
    });

    it ("not allowed actions", function() {

    });
});