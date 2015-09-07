///**
// * @class
// * @constructor
// */
//Subclass.Service.ServiceBasic = function()
//{
//    function ServiceBasic(serviceManager, serviceName, serviceInstance)
//    {
//        ServiceBasic.$parent.call(this, serviceManager, serviceName, {});
//
//        /**
//         * Service instance
//         *
//         * @type {*}
//         * @private
//         */
//        this._instance = serviceInstance;
//    }
//
//    ServiceBasic.$parent = Subclass.Service.Service;
//
//    ServiceBasic.prototype = {
//
//        /**
//         * Returns the service class instance that was created earlier
//         *
//         * @method getInstance
//         * @memberOf Subclass.Service.Service.prototype
//         *
//         * @throws {Error}
//         *      Throws error if trying to get instance of abstract service class
//         *
//         * @returns {Object}
//         */
//        getInstance: function()
//        {
//            return this._instance;
//        }
//    };
//
//    return ServiceBasic;
//}();