/**
 * @class
 * @constructor
 */
Subclass.Parser.ServiceParser = function()
{
    function ServiceParser()
    {
        ServiceParser.$parent.apply(this, arguments);
    }

    ServiceParser.$parent = Subclass.Parser.ParserAbstract;

    /**
     * @inheritDoc
     */
    ServiceParser.getName = function()
    {
        return "service";
    };

    ServiceParser.prototype = {

        /**
         * @inheritDoc
         */
        parse: function(string)
        {
            var serviceName;
            var parserManager = this.getParserManager();
            var moduleInstance = parserManager.getModuleInstance();
            var container = moduleInstance.getContainer();

            if (
                typeof string != 'string'
                || !(serviceName = string.match(/^@([a-z_0-9]+)$/i))
            ) {
                return string;
            }
            serviceName = this.getParserManager().parse(serviceName[1]);

            //return this.getParserManager()
            //    .getModule()
            //    .getServiceManager()
            //    .get(serviceName)
            //;
            return container.get(serviceName);
        }
    };

    // Registering Parser

    Subclass.Parser.ParserManager.registerParser(ServiceParser);

    return ServiceParser;
}();