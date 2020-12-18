( typeof define === "function" ? function (m) { define("kmd_interfaces", m); } :
  function(m){ this.kmd_interfaces = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'interfaces';
kmd.timers[page_id] = {};
var timers = kmd.timers[page_id];

var empty_card = $('<ons-card>')
                    .html($("<div>", { class: "dev-note",
                                       text: "None found!" })
                         );

exports.listConfigured = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
//  kismet.datasource.type_driver field selection seems broken in versions <= 2020-09
/*    var source_fields = [["kismet.datasource.uuid","uuid"],
                         ["kismet.datasource.name","name"],
                         ["kismet.datasource.interface","interface"],
                         ["kismet.datasource.type_driver/kismet.datasource.driver.type","type"],
                         ["kismet.datasource.hardware","hardware"],
                         ["kismet.datasource.type_driver/kismet.datasource.driver.description","description"],
                         ["kismet.datasource.running","running"],
                         ["kismet.datasource.paused","paused"],
                         ["kismet.datasource.error","error"],
                         ["kismet.datasource.error_reason","error_reason"]];*/
    $.ajax({
            url: kmd_rest_prefix + "datasource/all_sources.json",
            type: "GET"
    }).done(function(data, textStatus, jqXHR) {
        $('#configuredlist').empty();
        if (data.length === 0) {
            $('#configuredlist')
                .html(empty_card);
        } else {
            for (var result of data) {
                var iface = {};
                iface['uuid'] = result["kismet.datasource.uuid"];
                iface['name'] = kmd.sanitizeHTML(result['kismet.datasource.name']);
                iface['interface'] = kmd.sanitizeHTML(result["kismet.datasource.interface"]);
                iface['type'] = kmd.sanitizeHTML(result["kismet.datasource.type_driver"]["kismet.datasource.driver.type"]);
                iface['hardware'] = kmd.sanitizeHTML(result["kismet.datasource.hardware"]);
                iface['description'] = kmd.sanitizeHTML(result["kismet.datasource.type_driver"]["kismet.datasource.driver.description"]);
                iface['remote'] = result['kismet.datasource.remote'];
                iface['running'] = result['kismet.datasource.running'];
                iface['paused'] = result['kismet.datasource.paused'];
                iface['error'] = result['kismet.datasource.error'];
                iface['error_reason'] = kmd.sanitizeHTML(result['kismet.datasource.error_reason']);

                $("#" + iface['uuid']).remove();
                $('#configuredlist').append(iface_card(iface));
                var status = "Disabled";
                if (iface['running'])
                    status = "Running";
                if (iface['paused'])
                    status = "Paused";
                if (iface['error'])
                    status = "Error";
                var status_html = iface_prop("Status:", status);
                if (iface['error'])
                    status_html.find(".right")
                        .on('click', function() {
                            kmd.ui.show_dialog("<p class='iface-header'>Error message:</p>" + iface['error_reason']);
                        });
                $("#" + iface['uuid'] + " .iface-title").after(status_html);
                $('#' + iface['uuid'] + " ons-col").append(iface_btns(iface));
            }
        }
    }).always(function() { timers['list'].timeout = setTimeout(exports.listConfigured, 5000); });
};
timers['list'] = { fn: exports.listConfigured };

// run on dynamic load
exports.listConfigured();

exports.probeDevices = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    kmd.ui.show_spinner("Probing interfaces...");
    $.ajax({
        url: kmd_rest_prefix + "datasource/list_interfaces.json",
        type: "GET"
    })
    .done(function(data, textStatus, jqXHR) {
        $('#interfaceslist').empty();
        if (data.length === 0) {
            $('#interfaceslist')
                .html(empty_card);
        } else {
            for (var result of data) {
                var iface = {};
                iface['uuid'] = result["kismet.datasource.probed.in_use_uuid"];
                iface['interface'] = kmd.sanitizeHTML(result["kismet.datasource.probed.interface"]);
                iface['type'] = kmd.sanitizeHTML(result["kismet.datasource.type_driver"]["kismet.datasource.driver.type"]);
                iface['hardware'] = kmd.sanitizeHTML(result["kismet.datasource.probed.hardware"]);
                iface['description'] = kmd.sanitizeHTML(result["kismet.datasource.type_driver"]["kismet.datasource.driver.description"]);
                if (! iface['uuid'].match(/[1-9]/) ) {
                    $('#interfaceslist').append(iface_card(iface));
                    $('#' + iface['interface'] + " ons-col").append(iface_btns(iface));
                    
                }
            }
        }
        $("#interfaceslist").show()
        kmd.ui.hide_spinner();
    });
};

var iface_card = function(dev) {
    var uuid = dev['uuid'];
    if ( uuid.match(/[1-9]/) ) {
        var title = dev['name'];
        if (dev['remote'])
            title = title + " (remote capture)";
        var card_id = uuid;
    } else {
        var title = "Detected Device";
        var card_id = dev['interface'];
    }

    return $('<ons-card>', { id: card_id })
            .html($('<ons-row>')
                .html($('<ons-col>')
                    .html($('<ons-list>')
                        .html($('<ons-list-header>', { class: "iface-title" })
                            .text(title)
                        ).append(iface_prop("Interface:", dev['interface'])
                        ).append(iface_prop("Driver Type:", dev['type'])
                        ).append(iface_prop("Hardware:", dev["hardware"])
                        ).append($('<ons-list-header>')
                                .text("Description:")
                        )
                    ).append($('<div>', { class: "center dev-note" })
                        .text(dev['description'])
                    )
                )
            );
};

var iface_prop = function(name, value) {
    return $('<ons-list-item>')
                .html($('<div>', { class: "center" })
                    .text(name)
                ).append($('<div>', { class: "right" })
                    .text(value)
                )
};

var iface_btns = function(dev) {
    var uuid = dev['uuid'];
    if ( uuid.match(/[1-9]/) ) {
        if (dev['running'] || dev['paused'])
            return $('<div>', { class: 'righted' })
                .html(
                    $('<ons-button>', { modifier: 'outline',
                                        text: "Close" }
                    ).on('click', function() {
                        close_ds( uuid );
                    })
                );
        else
            if (! dev['remote'])
                return $('<div>', { class: 'righted' })
                    .html(
                        $('<ons-button>', { modifier: 'outline',
                                            text: "Restart" }
                        ).on('click', function() {
                            open_ds( uuid );
                        })
                    );
            else
                return "";
    } else {
        return $('<div>', { class: 'righted' })
                .html(
                    $('<ons-button>', { modifier: 'outline',
                                        text: "Add device" }
                    ).on('click', function() {
                        open_dev( dev['interface'], dev['type'] );
                    })
                );
    }
};

var open_dev = function(dev_name, type) {
    clearTimeout(timers['list'].timeout);
    var cmd_dict = { definition: dev_name + ":type=" + type };
    $.ajax({
        url: kmd_rest_prefix + "datasource/add_source.cmd",
        type: "POST",
        data: "json=" + encodeURIComponent(JSON.stringify(cmd_dict)),
        dataType: "json"
    })
    .done(function(data, textStatus, jqXHR) {
        kmd.ui.alert("Datasource added!");
        $("#" + dev_name).hide();
        $("#" + dev_name + "mon").hide();
        if (dev_name.match( /mon$/g, "" ))
            $("#" + dev_name.replace( /mon$/g, "" )).hide();
        timers['list'].timeout = setTimeout(exports.listConfigured, 1000);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert("Adding datasource failed!");
    });
};

var close_ds = function(uuid) {
    clearTimeout(timers['list'].timeout);
    $.ajax({
        url: kmd_rest_prefix + "datasource/by-uuid/" + uuid + "/close_source.cmd",
        type: "GET"
    })
    .done(function(data, textStatus, jqXHR) {
        kmd.ui.alert("Datasource closed!");
        timers['list'].timeout = setTimeout(exports.listConfigured, 1000);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert("Closing datasource failed!");
    });
};

var open_ds = function(uuid) {
    clearTimeout(timers['list'].timeout);
    $.ajax({
        url: kmd_rest_prefix + "datasource/by-uuid/" + uuid + "/open_source.cmd",
        type: "GET"
    })
    .done(function(data, textStatus, jqXHR) {
        kmd.ui.alert("Datasource opened!");
        timers['list'].timeout = setTimeout(exports.listConfigured, 1000);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert("Opening datasource failed!");
    });
};


return exports;
});
