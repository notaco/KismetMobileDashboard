( typeof define === "function" ? function (m) { define("kmd_home", m); } :
  function(m){ this.kmd_home = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'home';
var timers = kmd.timers[page_id];

exports.refreshStatus = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    $.ajax({
            url: kmd_rest_prefix + "system/status.json",
            type: "POST",
            data: { "json": '{"fields":["kismet.system.timestamp.sec","kismet.system.timestamp.start_sec",'+
                                '"kismet.system.devices.count","kismet.device.packets_rrd"]}' }
    })
    .done(function(data, textStatus, jqXHR) {
        var utime = Math.round((data['kismet.system.timestamp.sec'] - data['kismet.system.timestamp.start_sec']) / 60);
        utime = " Uptime: " + utime + " minutes.";

        var devices = data['kismet.system.devices.count'];

        var now = (data['kismet.device.packets_rrd']['kismet.common.rrd.last_time'] - 1) % 60;
        var packets = data['kismet.device.packets_rrd']['kismet.common.rrd.minute_vec'][now];

        $('#uptime').text(utime);
        $('#numdevs').text(devices);
        $('#numpackets').text(packets);
    })
    .always(function() {
        timers['status'].timeout = setTimeout(exports.refreshStatus, 5000);
    });
};
timers['status'] = { fn: exports.refreshStatus };

exports.refreshSources = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    $.ajax({
            url: kmd_rest_prefix + "datasource/all_sources.json",
            type: "POST",
            data: { "json": '{"fields":[["kismet.datasource.running","running"],["kismet.datasource.channels","channels"],["kismet.datasource.error","error"]]}' }
    })
    .done(function(data) {
        var sources = data.filter(function(data) { return data['running'] == "1" }).length;
        var source_total = data.length;

        var chans = {};
        for (var i = 0; i < source_total; i++) {
            var datum = data[i];

            for (var c in data[i]['channels']) {
                chans[data[i]['channels'][c]] = 1;
            }

            if (data[i]['error'] == 1) {
                $('#numsources').addClass('error');
                $('#SourceErrors').text("Source Error Detected");
                $('#SourceErrors').addClass('error');
            }
        }

        $('#numchans').text(Object.keys(chans).length);
        $('#numsources').text(sources);
        $('#numsources_total').text(source_total);
    })
    .always(function() {
        timers['sources'].timeout = setTimeout(exports.refreshSources, 5000);
    });
};
timers['sources'] = { fn: exports.refreshSources };

exports.refreshDevices = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    $.ajax({
            url: kmd_rest_prefix + "devices/views/phy-IEEE802.11/devices.json",
            type: "POST",
            data: { "json": '{"fields":[["kismet.device.base.type","base_type"]]}' }
    })
    .done(function(data, textStatus, jqXHR) {
        $('#num802Aps').text(data.filter(function(data) { return data['base_type'] == "Wi-Fi AP" }).length);
        $('#num802Clients').text(data.filter(function(data) { return data['base_type'] == "Wi-Fi Client" }).length);
        $('#num802Devices').text(data.filter(function(data) { return data['base_type'] == "Wi-Fi Device" }).length);
        $('#num802Bridges').text(data.filter(function(data) { return data['base_type'] == "Wi-Fi Bridged" }).length);
        $('#num802Adhoc').text(data.filter(function(data) { return data['base_type'] == "Wi-Fi Ad-Hoc" }).length);
        $('#num802WDS').text(data.filter(function(data) { return data['base_type'] == "Wi-Fi WDS" }).length);
    })
    .always(function() {
        timers['devices'].timeout = setTimeout(exports.refreshDevices, 5000);
    });
};
timers['devices'] = { fn: exports.refreshDevices };

exports.refreshViews = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    $.ajax({
            url: kmd_rest_prefix + "devices/views/all_views.json",
            type: "POST",
            data: { "json": '{"fields":[["kismet.devices.view.size","view_size"],'+
                                    '["kismet.devices.view.id","view_id"]]}' }
    })
    .done(function(data, textStatus, jqXHR) {
        $('#numBTLE').text(data.filter(function(data) { return data['view_id'] == "phy-BTLE" })[0]['view_size']);
        $('#numBR').text(data.filter(function(data) { return data['view_id'] == "phy-Bluetooth" })[0]['view_size']);

        $('#numRTL433').text(data.filter(function(data) { return data['view_id'] == "phy-RTL433" })[0]['view_size']);
        $('#numRTLADSB').text(data.filter(function(data) { return data['view_id'] == "phy-RTLADSB" })[0]['view_size']);
        $('#numZWave').text(data.filter(function(data) { return data['view_id'] == "phy-Z-Wave" })[0]['view_size']);
        $('#numMousejack').text(data.filter(function(data) { return data['view_id'] == "phy-NrfMousejack" })[0]['view_size']);
        $('#numUAV').text(data.filter(function(data) { return data['view_id'] == "phy-UAV" })[0]['view_size']);
        $('#numRTLAMR').text(data.filter(function(data) { return data['view_id'] == "phy-RTLAMR" })[0]['view_size']);
    })
    .always(function() {
        timers['views'].timeout = setTimeout(exports.refreshViews, 5000);
    });
};
timers['views'] = { fn: exports.refreshViews };

return exports;
});

