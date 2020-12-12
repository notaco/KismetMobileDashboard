( typeof define === "function" ? function (m) { define("kmd_datasource", m); } :
  function(m){ this.kmd_datasource = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'datasources';
kmd.timers[page_id] = {};
var timers = kmd.timers[page_id];

exports.list_datasources = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    $.ajax({
            url: kmd_rest_prefix + "datasource/all_sources.json",
            type: "POST",
            data: { "json": '{"fields": ["kismet.datasource.uuid","kismet.datasource.hopping","kismet.datasource.channels","kismet.datasource.paused","kismet.datasource.running","kismet.datasource.error","kismet.datasource.hop_channels","kismet.datasource.name","kismet.datasource.capture_interface","kismet.datasource.type_driver/kismet.datasource.driver.type","kismet.datasource.hardware","kismet.datasource.num_packets"]}' }
    })
    .done(function(data, textStatus, jqXHR) {
        $('#datasourceslist').empty();

        for (var i = 0; i < data.length; i++) {
            var uuid = data[i]["kismet.datasource.uuid"];
            var hopping = data[i]['kismet.datasource.hopping'] == 1;
            var channels = data[i]['kismet.datasource.channels'];

            var sourceState = "";
            var switchState = false;
            if (data[i]["kismet.datasource.paused"] == 1 && data[i]["kismet.datasource.running"] == 1) {
                sourceState = "Paused";
            } else if (data[i]["kismet.datasource.paused"] == 0 && data[i]["kismet.datasource.running"] == 1) {
                sourceState = "Running";
                switchState = true;
            } 
            if (data[i]["kismet.datasource.error"] == 1) {
                sourceState = "Error";
            }

            var hop_channels = [];
            if (! hopping) {
                hop_channels[0] = data[i]['kismet.datasource.channel'];
            } else {
                hop_channels = data[i]['kismet.datasource.hop_channels'];
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
            
            $('#datasourceslist').append(
                $('<ons-card>', { id: uuid })
                    .append($('<ons-row>', { class: 'centered' })
                        .append($('<ons-col>')
                            .append($('<span>', { class: 'card-icon' })
                                .text(data[i]["kismet.datasource.name"]))
                            .append($('<ons-progress-circular>', {
                                        indeterminate: true,
                                        class: 'spinner'
                                        }
                                    ))
                        )
                    )
                    .append($('<ons-row>')
                        .append($('<ons-col>')
                            .append($('<span>', { class: 'field-label' }).text('Interface: '))
                            .append(data[i]["kismet.datasource.capture_interface"])
                        )
                    )
                    .append($('<ons-row>')
                        .append($('<ons-col>')
                            .append($('<span>', { class: 'field-label' }).text('Driver Type: '))
                            .append(data[i]["kismet.datasource.driver.type"])
                        )
                    )
                    .append($('<ons-row>')
                        .append($('<ons-col>')
                            .append($('<span>', { class: 'field-label' }).text('Hardware: '))
                            .append(data[i]["kismet.datasource.hardware"])
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
                            .append(data[i]['kismet.datasource.num_packets'])
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
            $("#"+uuid+" .spinner").hide();
        }
    })
    .always(function() {
        timers['all'].timeout = setTimeout(exports.list_datasources, 5000);
    });
}
timers['all'] = { fn: exports.list_datasources };

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

