/**
 * Registers the new SubclassJS plug-in
 */
Subclass.registerPlugin(function() {

    function ServicePlugin()
    {
        ServicePlugin.$parent.call(this);
    }

    ServicePlugin.$parent = Subclass.SubclassPlugin;

    /**
     * @inheritDoc
     */
    ServicePlugin.getName = function()
    {
        return "SubclassService";
    };

    /**
     * @inheritDoc
     */
    ServicePlugin.getDependencies = function()
    {
        return [
            'SubclassParser',
            'SubclassInstance',
            'SubclassParameter'
        ];
    };

    return ServicePlugin;
}());