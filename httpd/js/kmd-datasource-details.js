( typeof define === "function" ? function (m) { define("kmd_datasource_details", m); } :
  function(m){ this.kmd_datasource_details = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'datasource_details';
kmd.timers[page_id] = {};
var timers = kmd.timers[page_id];

exports.listDetails = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    if (! kmd.ui.navi.topPage.data)
        return true;
    else var dev_uuid = kmd.ui.navi.topPage.data['uuid'];
    var source_fields = [["kismet.datasource.uuid","uuid"],
                         ["kismet.datasource.hopping","hopping"],
                         ["kismet.datasource.channels","channels"],
                         ["kismet.datasource.paused","paused"],
                         ["kismet.datasource.running","running"],
                         ["kismet.datasource.error","error"],
                         ["kismet.datasource.channel","channel"],
                         ["kismet.datasource.hop_channels","hop_channels"],
                         ["kismet.datasource.name","name"],
                         ["kismet.datasource.capture_interface","capture_interface"],
                         ["kismet.datasource.type_driver/kismet.datasource.driver.type","type"],
                         ["kismet.datasource.hardware","hardware"],
                         ["kismet.datasource.num_packets","num_packets"]];
    $.ajax({
            url: kmd_rest_prefix + "datasource/by-uuid/" + dev_uuid + "/source.json",
            type: "POST",
            data: { "json": '{"fields":' + JSON.stringify(source_fields) + '}'}
    })
    .done(function(data, textStatus, jqXHR) {
        $('#datasource-details').empty();

        var uuid = data["uuid"];
        var hopping = data['hopping'] == 1;
        var channels = data['channels'];

        var sourceState = "";
        var switchState = false;
        if (data["paused"] == 1 && data["running"] == 1) {
            sourceState = "Paused";
        } else if (data["paused"] == 0 && data["running"] == 1) {
            sourceState = "Running";
            switchState = true;
        } 
        if (data["error"] == 1) {
            sourceState = "Error";
        }

        var hop_channels = [];
        if (! hopping) {
            hop_channels[0] = data['channel'];
        } else {
            hop_channels = data['hop_channels'];
        }
        var channel_buttons = $('<span>')
                                .append(
                                    $('<button>', {
                                        html: "All",
                                        class: "button-group button button--outline",
                                        disabled: (! switchState) || (! hopping) 
                                    }).click(function() {
                                        
                                    })
                                );
        for (var chan of channels) {
            var button_class = "button-group button";
            if (! hop_channels.includes(chan) ) {
                button_class += " button--outline";
            }
            channel_buttons.append(
                $('<button>', {
                    html: chan,
                    class: button_class,
                    disabled: ! switchState
                }).click( function() {
                    if ( hopping ) {
                        console.log("hopping");
                    } else {
                        console.log("lock");
                    }
                })
            );
        }
        
        $('#datasource-details').append(
            $('<ons-card>', { id: uuid })
                .append($('<ons-row>', { class: 'centered' })
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'card-icon' })
                            .text(data["name"]))
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Interface: '))
                        .append(data["capture_interface"])
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Driver Type: '))
                        .append(data["type"])
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Hardware: '))
                        .append(data["hardware"])
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('UUID: '))
                        .append(uuid)
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Packets: '))
                        .append(data['num_packets'])
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Active: '))
                        .append(
                            $('<ons-switch>', {
                                id: "state-switch",
                                modifier: "material",
                                onChange: "datasource_pause_restart('" + uuid + "','" + sourceState + "')",
                                checked: switchState
                                }
                            )
                        )
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Hopping: '))
                        .append(
                            $('<ons-switch>', {
                                id: "state-switch",
                                modifier: "material",
                                disabled: ! switchState,
                                checked: hopping
                                }
                            ).on('change', function() {
                                if (hopping) {
                                    var encodeData = "json=" + encodeURIComponent(JSON.stringify({
                                        "cmd": "lock",
                                        "channel": channels[0],
                                        "uuid": uuid,
                                    }));

                                    datasource_channels(uuid, encodeData);
                                } else {
                                    var encodeData = "json=" + encodeURIComponent(JSON.stringify({
                                        "cmd": "hop",
                                        "channels": channels,
                                        "uuid": uuid
                                    }));

                                    datasource_channels(uuid, encodeData);
                                }
                            })
                        )
                    )
                )
                .append($('<ons-row>')
                    .append($('<ons-col>')
                        .append($('<span>', { class: 'field-label' }).text('Channels: '))
                        .append(channel_buttons)
                    )
                )
        );
    })
    .always(function() {
        timers['all'].timeout = setTimeout(exports.listDetails, 5000);
    });
}
timers['all'] = { fn: exports.listDetails };

// start on dynamic load
exports.listDetails();

exports.datasource_pause_restart = function(uuid, sourceState) {
    // console.log("pause restart called");
    var cmd = "";

    if (sourceState == "Running") {
        cmd = kmd_rest_prefix + "pause_source.cmd";
    } else {
        cmd = kmd_rest_prefix + "resume_source.cmd";
    }

    jQuery.ajax({
        url: kmd_rest_prefix + "datasource/by-uuid/" + uuid + cmd,
        type: "GET",
        headers: {},
    })
    .done(function(data, textStatus, jqXHR) {
        // console.log("HTTP Request Succeeded: " + jqXHR.status);
        list_datasources();
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        //    console.log("HTTP Request Failed");
        kmd.ui.alert("Pause/Restart failed");
    })
}

exports.datasource_channels = function(uuid, postdata) {
    $.post(kmd_rest_prefix + "datasource/by-uuid/" + uuid + "/set_channel.cmd", postdata, "json")
        .done(function(data, textStatus, jqXHR) {
            list_datasources();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            kmd.ui.alert("Set channels failed!");
        })
}

return exports;
});

