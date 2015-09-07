/**
 * @class
 * @constructor
 * @description
 *
 * The class which instance is the factory for the services
 *
 * @throws {Error}
 *      Throws error if specified not valid service manager instance
 *
 * @param {Subclass.Service.ServiceContainer} container
 *      The instance of service manager
 */
Subclass.Service.ServiceFactory = (function()
{
    /**
     * @alias Subclass.Service.ServiceFactory
     */
    function ServiceFactory(container)
    {
        if (!container || !(container instanceof Subclass.Service.ServiceContainer)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the service manager instance', false)
                .expected('an instance of Subclass.Service.ServiceManager')
                .received(container)
                .apply()
            ;
        }

        /**
         * @type {Subclass.Service.ServiceContainer}
         * @private
         */
        this._container = container;
    }

    /**
     * Returns service container instance
     *
     * @method getContainer
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @returns {Subclass.Service.ServiceContainer}
     */
    ServiceFactory.prototype.getContainer = function()
    {
        return this._container;
    };

    /**
     * Creates and returns the service class instance
     *
     * @method createService
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @param {Subclass.Service.Service} service
     */
    ServiceFactory.prototype.createService = function(service)
    {
        if (service.getAbstract()) {
            Subclass.Error.create('AbstractService')
                .service(service.getName())
                .apply()
            ;
        }

        var container = this.getContainer();
        var moduleInstance = container.getModuleInstance();
        var parserManager = moduleInstance.getParser();
        var serviceManager = container.getServiceManager();
        var classManager = serviceManager.getModule().getClassManager();

        // Initializing service
        service.initialize();

        // Creating class instance

        var classDef = classManager.get(service.getClassName());
        var classArguments = service.normalizeArguments(service.getArguments(), parserManager);
        var classInst = classDef.createInstance.apply(classDef, classArguments);

        // Processing calls

        var calls = service.normalizeCalls(service.getCalls(), parserManager);

        for (var methodName in calls) {
            if (!calls.hasOwnProperty(methodName)) {
                continue;
            }
            classInst[methodName].apply(
                classInst,
                calls[methodName]
            );
        }

        // Processing tags

        if (classInst.isImplements('Subclass/Service/TaggableInterface')) {
            var taggedServiceInstances = container.findByTag(service.getName());
            classInst.processTaggedServices(taggedServiceInstances);
        }

        return classInst;
    };

    return ServiceFactory;

})();