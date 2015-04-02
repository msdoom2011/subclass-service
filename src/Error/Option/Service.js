/**
 * @mixin
 * @description
 *
 * Mixin which allows to specify the name of the service when creating an error instance
 */
Subclass.Error.Option.Service = (function()
{
    return {

        /**
         * Sets/returns service name
         *
         * @method service
         * @memberOf Subclass.Error.Option.Service
         *
         * @param {string} [service]
         *      The name of the service
         *
         * @returns {Subclass.Error}
         */
        service: function(service)
        {
            if (!arguments.length) {
                return this._service;
            }
            if (service && typeof service != 'string') {
                throw new Error('Specified invalid service name. It must be a string.');
            }
            this._service = service;

            return this;
        },

        /**
         * Checks whether the service option was specified
         *
         * @method hasService
         * @memberOf Subclass.Error.Option.Service
         *
         * @returns {boolean}
         */
        hasService: function()
        {
            return this._service !== undefined;
        }
    };
})();