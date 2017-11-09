App.Datepicker = App.UiPhoneControl.extend({
    name: DS.attr('string', {defaultValue: 'Datepicker'}),
    minWidth: 348,
    minHeight: 365,
    defaultWidth: 348,
    defaultHeight: 365,

    width: DS.attr('number', {defaultValue: 348}),
    height: DS.attr('number', {defaultValue: 365}),

    xmlName: 'datepickers',

    toXml: function (xmlDoc) {
        var datepicker = xmlDoc.createElement(this.get('xmlName'));
        this.decorateXml(xmlDoc, datepicker);
        return datepicker;
    }

});
