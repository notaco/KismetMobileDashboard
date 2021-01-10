( typeof define === "function" ? function (m) { define("kmd_devices_list", m); } :
  function(m){ this.kmd_devices_list = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'devices_list';
kmd.timers[page_id] = {};
var timers = kmd.timers[page_id];

exports.listDevices = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    if (! kmd.ui.navi.topPage.data)
        return true;
    else var dev_type = kmd.ui.navi.topPage.data['type'];

    $('#dl-title').html(dev_type);

    // use applicable view and fields
    switch(dev_type) {
        case 'Wi-Fi AP':
            var endpoint = "devices/views/phydot11_accesspoints/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.crypt","crypt"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['crypt']); };
            break;
        case 'Wi-Fi Client':
        case 'Wi-Fi Device':
        case 'Wi-Fi Bridged':
        case 'Wi-Fi Ad-Hoc':
        case 'Wi-Fi WDS':
            var endpoint = "devices/views/phy-IEEE802.11/devices.json"
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        case 'BREDR':
            var endpoint = "devices/views/phy-Bluetooth/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        case 'BTLE':
            var endpoint = "devices/views/phy-BTLE/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        case 'RTL433':
            var endpoint = "devices/views/phy-RTL433/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        case 'RTLADSB':
            var endpoint = "devices/views/phy-RTLADSB/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["rtladsb.device/rtladsb.device.icao","icao"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'],
                                                                dev_info['type'] + ': ' + dev_info['icao'], dev_info['commonname']); };
            break;
        case 'RTLAMR':
            var endpoint = "devices/views/phy-RTLAMR/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        case 'Z-Wave':
            var endpoint = "devices/views/phy-Z-Wave/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        case 'NrfMousejack':
            var endpoint = "devices/views/phy-NrfMousejack/devices.json"
            dev_type = 'all';
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"],
                                 ["kismet.device.base.type","type"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
            break;
        default:
            var endpoint = "devices/views/all/devices.json";
            var device_fields = [["kismet.device.base.key","key"],
                                 ["kismet.device.base.type","type"],
                                 ["kismet.device.base.commonname","commonname"],
                                 ["kismet.device.base.manuf","manuf"]];
            var list_element = function(dev_info) { return list_template(dev_info['key'], dev_info['commonname'], dev_info['manuf']); };
    }

    $.ajax({
        url: kmd_rest_prefix + endpoint,
        type: 'POST',
        data: { "json": '{"fields":' + JSON.stringify(device_fields) + '}'},
    })
    .done(function(data, textStatus, jqXHR) {
        if (dev_type === 'all')
            var devs = data;
        else
            var devs = data.filter( function(obj) { return obj['type'].match(dev_type); } );
        var dev_list = $('#devices-list');

        if (dev_list[0].children.length !== devs.length) {
            for (var i = 0; i < devs.length; i++) {
                if (typeof dev_list[0].children[i] === 'undefined')
                    dev_list.append(list_element(devs[i]));
                else if (dev_list[0].children[i].id !== devs[i]['key'])
                    dev_list[0].children[i].before(list_element(devs[i]));
            }
        }
    })
    .always(function() {
        timers['updates'].timeout = setTimeout(exports.listDevices, 5000);
    });
}
timers['updates'] = { fn: exports.listDevices };

// start on dynamic load
exports.listDevices();

var list_template = function(key, title, sub) {
    return $('<ons-list-item>', { id: key,
                                  modifier: "chevron"
            })
            .html($('<span>', { class: "list-item__title",
                                text: kmd.sanitizeHTML(title)
            }))
            .append($('<span>', { class: "list-item__subtitle",
                                  text: kmd.sanitizeHTML(sub)
            }));
};

return exports;
});
