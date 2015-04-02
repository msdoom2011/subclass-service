/**
 * @class
 * @constructor
 */
Subclass.Service.Extension.ModuleAPIExtension = function() {

    function ModuleAPIExtension(classInst)
    {
        ModuleAPIExtension.$parent.apply(this, arguments);
    }

    ModuleAPIExtension.$parent = Subclass.Extension;


    //=========================================================================
    //========================== ADDING NEW METHODS ===========================
    //=========================================================================

    var ModuleAPI = Subclass.ModuleAPI;

    /**
    * The same as the {@link Subclass.Module#getServiceManager}
    *
    * @method getServiceManager
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.getServiceManager = function()
    {
        return this.getModule().getServiceManager.apply(this.getModule(), arguments);
    };

    /**
    * The same as the {@link Subclass.Service.ServiceManager#registerService}
    *
    * @method registerService
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.registerService = function()
    {
        return this.getModule().getServiceManager().registerService.apply(
            this.getModule().getServiceManager(),
            arguments
        );
    };

    /**
    * The same as the {@link Subclass.ConfigManager#setServices}
    *
    * @method registerServices
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.registerServices = function()
    {
        return this.getModule().getConfigManager().setServices.apply(
            this.getModule().getConfigManager(),
            arguments
        );
    };

    /**
    * The same as the {@link Subclass.Service.ServiceManager#getService}
    *
    * @method getService
    * @memberOf Subclass.ModuleAPI.prototype
    */
    ModuleAPI.prototype.getService = function()
    {
        return this.getModule().getServiceManager().getService.apply(
            this.getModule().getServiceManager(),
            arguments
        );
    };


    //=========================================================================
    //======================== REGISTERING EXTENSION ==========================
    //=========================================================================

    Subclass.Module.onInitializeBefore(function(evt, module)
    {
        ModuleAPI = Subclass.Tools.buildClassConstructor(ModuleAPI);

        if (!ModuleAPI.hasExtension(ModuleAPIExtension)) {
            ModuleAPI.registerExtension(ModuleAPIExtension);
        }
    });

    return ModuleAPIExtension;
}();