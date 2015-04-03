var appSecondPlugin = Subclass.createModule('appSecondPlugin', ['appThirdPlugin'], {
    pluginOf: "app",
    parameters: {
        foo: false
    }
});
