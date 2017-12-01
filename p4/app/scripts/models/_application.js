App.Application = DS.Model.extend({

    name: DS.attr('string', {defaultValue: 'newApp'}),
    companyIdentifier: DS.attr('string', {defaultValue: 'it.polimi'}),

    menu: DS.belongsTo('menu'),

    dataHandler: DS.belongsTo('dataHandler'),

    watchControllers: DS.hasMany('watchController', {inverse: 'application', async: true}),
    scenes: DS.hasMany('scene', {inverse: 'application', async: true}),

    deleteRecord: function () {
        this.get('menu').deleteRecord();
        this.get('menu').save();

        this._super();
    },

    toXml: function () {
        var self = this;
        return new Promise(function (resolve) {
            var xmlDocType = document.implementation.createDocumentType('appModel', 'MODEL', '<?xml version="1.0" encoding="ASCII"?>');
            var xmlDoc = document.implementation.createDocument('appModelXml', '', xmlDocType);

            var appModel = xmlDoc.createElement('metamodel:Application');
            appModel.setAttribute('xmi:version', '2.0');
            appModel.setAttribute('xmlns:xmi', 'http://www.omg.org/XMI');
            appModel.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            appModel.setAttribute('xmlns:metamodel', 'http://metamodel/1.0');
            appModel.setAttribute('xsi:schemaLocation', 'http://metamodel/1.0 ../metamodel/metamodel.ecore');
            appModel.setAttribute('name', self.get('name'));
            appModel.setAttribute('companyIdentifier', self.get('companyIdentifier'));

            appModel.appendChild(self.get('dataHandler').toXml(xmlDoc));

            var scenes = self.get('scenes');
            var watchControllers = self.get('watchControllers');

            Promise.all(scenes.map(function (item_scenes) {
                return item_scenes.toXml(xmlDoc);
            })).then(function (values_scenes) {

                Promise.all(watchControllers.map(function (item_watchControllers) {
                    return item_watchControllers.toXml(xmlDoc);
                })).then(function (values_watchControllers) {

                    values_scenes.map(function (value) {
                        appModel.appendChild(value);
                    });

                    values_watchControllers.map(function (value) {
                        appModel.appendChild(value);
                    });

                    appModel.appendChild(self.get('menu').toXml(xmlDoc));

                    xmlDoc.appendChild(appModel);

                    resolve(xmlDoc);
                });
            });
        });
    }
});
