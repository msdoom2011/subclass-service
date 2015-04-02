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
 * @param {Subclass.Service.ServiceManager} serviceManager
 *      The instance of service manager
 */
Subclass.Service.ServiceFactory = (function()
{
    /**
     * @alias Subclass.Service.ServiceFactory
     */
    function ServiceFactory(serviceManager)
    {
        if (!serviceManager || !(serviceManager instanceof Subclass.Service.ServiceManager)) {
            Subclass.Error.create('InvalidArgument')
                .argument('the service manager instance', false)
                .received(serviceManager)
                .expected('an instance of Subclass.Service.ServiceManager')
                .apply()
            ;
        }
        /**
         * Service manager instance
         *
         * @type {Subclass.Service.ServiceManager}
         */
        this._serviceManager = serviceManager;
    }

    /**
     * Returns service manager instance
     *
     * @method getServiceManager
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @returns {Subclass.Service.ServiceManager}
     */
    ServiceFactory.prototype.getServiceManager = function()
    {
        return this._serviceManager;
    };

    /**
     * Returns the service class instance.<br /><br />
     *
     * If the passed service definition was not initialized
     * it will be initialized and will be created and returned
     * the new instance of the service.<br /><br />
     *
     * If the passed service definition was initialized
     * and it is marked as singleton the early created
     * instance will be returned without creating the new one.<br /><br />
     *
     * If the service is not singleton then every time
     * will be returned the new instance of service.
     *
     * @method getService
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @throws {Error}
     *      Throws error if trying to get instance of abstract service
     *
     * @param {Subclass.Service.Service} serviceDefinition
     *      The instance of definition of service
     *      (the instance of class which contains the service configuration)
     *
     * @returns {Object}
     */
    ServiceFactory.prototype.getService = function(serviceDefinition)
    {
        var firstCreation = false;

        if (serviceDefinition.getAbstract()) {
            Subclass.Error.create('AbstractService')
                .service(serviceDefinition.getName())
                .apply()
            ;
        }
        if (
            serviceDefinition.isInitialized()
            && serviceDefinition.isSingleton()
        ) {
            return serviceDefinition.getInstance();
        }
        if (!serviceDefinition.isInitialized()) {
            serviceDefinition.initialize();
            firstCreation = true;
        }
        var serviceClassInst = this.createService(serviceDefinition);

        if (firstCreation) {
            serviceDefinition.setInstance(serviceClassInst);
        }

        return serviceClassInst;
    };

    /**
     * Creates and returns the service class instance
     *
     * @method createService
     * @memberOf Subclass.Service.ServiceFactory.prototype
     *
     * @param {Subclass.Service.Service} serviceDefinition
     */
    ServiceFactory.prototype.createService = function(serviceDefinition)
    {
        if (serviceDefinition.getAbstract()) {
            Subclass.Error.create('AbstractService')
                .service(serviceDefinition.getName())
                .apply()
            ;
        }
        var serviceManager = this.getServiceManager();
        var classManager = serviceManager.getModule().getClassManager();

        // Creating class instance

        var classDef = classManager.getClass(serviceDefinition.getClassName());
        var classArguments = serviceDefinition.normalizeArguments(serviceDefinition.getArguments());
        var classInst = classDef.createInstance.apply(classDef, classArguments);

        // Processing calls

        var calls = serviceDefinition.normalizeCalls(serviceDefinition.getCalls());

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
            var taggedServices = serviceManager.getServicesByTag(
                serviceDefinition.getName()
            );
            classInst.processTaggedServices(taggedServices);
        }

        return classInst;
    };

    return ServiceFactory;

})();