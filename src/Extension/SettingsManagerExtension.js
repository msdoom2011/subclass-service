/**
 * @class
 * @constructor
 */
Subclass.Service.Extension.SettingsManagerExtension = function() {

    function SettingsManagerExtension(classInst)
    {
        SettingsManagerExtension.$parent.apply(this, arguments);
    }

    SettingsManagerExtension.$parent = Subclass.Extension;


    //=========================================================================
    //========================== ADDING NEW METHODS ===========================
    //=========================================================================

    var SettingsManager = Subclass.SettingsManager;

    /**
     * Registers new services and redefines already existent ones with the same name.
     *
     * @method setServices
     * @memberOf Subclass.SettingsManager.prototype
     *
     * @throws {Error}
     *      Throws error if trying to change value after the module became ready
     *
     * @param {Object.<Object>} services
     *      A plain object which consists of pairs key/value. The keys
     *      are the service names and values are the service definitions.
     *      To see more info about service definition look at
     *      {@link Subclass.Service.Service} class constructor
     *
     * @example
     *
     * var moduleInst = Subclass.createModule("app", {
     *      parameters: {
     *          mode: "dev"
     *      },
     *      ...
     * });
     * ...
     *
     * var moduleSettings = moduleInst.getSettingsManager();
     *
     * // Registering services
     * moduleSettings.setServices({
     *      logger: {
     *          className: "Name/Of/LoggerService", // name of service class
     *          arguments: [ "%mode%" ],            // arguments for service class constructor
     *          calls: {                            // methods that will be called right away after service was created
     *              setParams: [                    // method name
     *                  "param 1 value",            // method argument 1
     *                  "param 2 value"             // method argument 2
     *              ],
     *          }
     *      }
     * });
     * ...
     *
     * // Creating service class
     * moduleInst.registerClass("Name/Of/LoggerService", {
     *      _mode: null,
     *      _param1: null,
     *      _param2: null,
     *
     *      $_constructor: function(mode)
     *      {
     *          this._mode = mode;
     *      },
     *
     *      setParams: function(param1, param2)
     *      {
     *          this._param1 = param1;
     *          this._param2 = param2;
     *      }
     * });
     * ...
     *
     * var logger = moduleInst.getService('logger');
     *
     * var mode = logger._mode;     // "dev"
     * var param1 = logger._param1; // "param 1 value"
     * var param2 = logger._param2; // "param 2 value"
     * ...
     */
    SettingsManager.prototype.setServices = function(services)
    {
        this.checkModuleIsReady();

        if (!services || !Subclass.Tools.isPlainObject(services)) {
            Subclass.Error.create('InvalidModuleOption')
                .option('services')
                .module(this.getModule().getName())
                .received(services)
                .expected('a plain object')
                .apply()
            ;
        }
        var serviceManager = this.getModule().getServiceManager();

        for (var serviceName in services) {
            if (!services.hasOwnProperty(serviceName)) {
                continue;
            }
            serviceManager.register(
                serviceName,
                services[serviceName]
            );
        }
    };

    /**
     * Returns all registered services in the form as they were defined
     *
     * @method getServices
     * @memberOf Subclass.SettingsManager.prototype
     *
     * @returns {Object.<Object>}
     */
    SettingsManager.prototype.getServices = function()
    {
        var services = this.getModule().getServiceManager().getServices();
        var serviceDefinitions = {};

        for (var i = 0; i < services.length; i++) {
            var serviceDefinition = services[i].getDefinition();
            var serviceName = services[i].getName();

            serviceDefinitions[serviceName] = Subclass.Tools.copy(serviceDefinition);
        }
        return serviceDefinitions;
    };


    //=========================================================================
    //======================== REGISTERING EXTENSION ==========================
    //=========================================================================

    Subclass.Module.onInitializeBefore(function(evt, module)
    {
        SettingsManager = Subclass.Tools.buildClassConstructor(SettingsManager);

        if (!SettingsManager.hasExtension(SettingsManagerExtension)) {
            SettingsManager.registerExtension(SettingsManagerExtension);
        }
    });

    return SettingsManagerExtension;
}();