( typeof define === "function" ? function (m) { define("kmd_datasource_details", m); } :
  function(m){ this.kmd_datasource_details = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'datasource_details';
kmd.timers[page_id] = {};
var timers = kmd.timers[page_id];
var state = { current: {} };

// regex to clean chan name for jquery
var jQclean = function( chan_id ) {
    return chan_id.replace( /[-\+]$/g, "" );
}

var pause_restart = function() {
    clearTimeout(timers['updates'].timeout);

    state.current['status_text'] = 'Changing...';
    $("#dsd-state").text(state.current['status_text']);

    if (state.current['status_bool'])
        var cmd = "pause_source.cmd";
    else
        var cmd = "resume_source.cmd";

    $.ajax({
        url: kmd_rest_prefix + "datasource/by-uuid/" + state.current['uuid'] + '/' + cmd,
        type: "GET"
    })
    .done(function(data, textStatus, jqXHR) {
        kmd.ui.alert("Pause/Restart request successful!");
        exports.listDetails();
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert("Pause/Restart failed!");
        exports.listDetails();
    });
};

var form_set_channels = function() {
    clearTimeout(timers['updates'].timeout);
    var cmd_dict = {};
    if ($('#dsd-hopping').prop("checked")) {
        if ($("ons-checkbox input:checked").length === 0) {
            kmd.ui.alert("Empty channel set!");
            exports.listDetails();
            return false;
        }
        cmd_dict['channels'] = [];
        for (var chan of $("ons-checkbox input:checked"))
            cmd_dict['channels'].push(chan.value);
    } else {
        cmd_dict['channel'] = $("#dsd-chan-select option:selected").text();
    }

    $.ajax({
        url: kmd_rest_prefix + "datasource/by-uuid/" + state.current['uuid'] + "/set_channel.cmd",
        type: "POST",
        data: encodeURIComponent("json=" + JSON.stringify(cmd_dict))
    })
    .done(function(data, textStatus, jqXHR) {
        kmd.ui.alert("Set channel request successful!");
        state.ignore_refresh = false;
        state.current['uuid'] = '';
        exports.listDetails();
        $('#dsd-channels-ctrls').hide();
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        kmd.ui.alert("Set channel failed!");
        exports.listDetails();
    });
};

var form_revert = function() {
    state.ignore_refresh = false;
    state.current['uuid'] = '';
    clearTimeout(timers['updates'].timeout);
    exports.listDetails();
    $('#dsd-channels-ctrls').hide();
};

var show_submit = function() {
    if ( $('#dsd-channels-ctrls').length === 0 ) {
        $('#dsd-channels-title').after(
            $("<span>", { id: "dsd-channels-ctrls",
                          class: "field-label show-clickable"
            })
        );
        $('#dsd-channels-ctrls').append(
            $("<span>", { text: "Apply" })
            .click(form_set_channels)
        );
        $('#dsd-channels-ctrls').append(" | ");
        $('#dsd-channels-ctrls').append(
            $("<span>", { text: "Revert" })
            .click(form_revert)
        );
    } else
        $('#dsd-channels-ctrls').show();
};

var hop_change = function() {
    if ( $('#dsd-hopping').prop("checked") )
        channels_details( {show_hop: true} );
    else
        channels_details( {show_lock: true} );
    show_submit();
};

var channels_details = function(opts) {
    if (opts['show_hop'] || opts['show_lock'])
        state.ignore_refresh = true;
    else if (state.ignore_refresh)
        return true;

    if (typeof opts['data'] !== 'undefined')
        var dev_details = opts['data'];
    else
        var dev_details = state[state.current['uuid']];

    if ( dev_details['uuid'] !== state.current['uuid'] ||
         dev_details['hopping'] !== state.current['hopping'] ||
         opts['show_hop'] || opts['show_lock'] ) {
        if ( (dev_details['hopping'] && ! opts['show_lock']) || opts['show_hop'] )
            $("#dsd-channels-title").text("Channels:");
        else
            $("#dsd-channels-title").text("Channel:");
    }

    if ( (dev_details['hopping'] && ! opts['show_lock']) || opts['show_hop'] ) {
        if ($('#dsd-chan-all').length === 1)
            if ( dev_details['hop_channels'].length !== dev_details['channels'].length )
                $('#dsd-chan-all').addClass("button--outline");
            else
                $('#dsd-chan-all').removeClass("button--outline");
        else {
            $('#dsd-channels').html(
                $('<button>', {
                    id: "dsd-chan-all",
                    html: "All",
                    class: dev_details['hop_channels'].length === dev_details['channels'].length ? 
                            "show-clickable button" : "show-clickable button button--outline",
                    disabled: (dev_details["paused"] == 1 || dev_details["running"] == 0)
                }).click(function() {
                    for (var chan of state[state.current['uuid']]['channels'])
                        $('#dsd-chan-' + jQclean(chan)).prop('checked', true);
                    show_submit();
                }));
            $('#dsd-channels').append(
                $('<button>', {
                    id: "dsd-chan-none",
                    html: "None",
                    class: "show-clickable button--quiet",
                    disabled: (dev_details["paused"] == 1 || dev_details["running"] == 0)
                }).click(function() {
                    for (var chan of state[state.current['uuid']]['channels'])
                        $('#dsd-chan-' + jQclean(chan)).prop('checked', false);
                    show_submit();
                }));
        }

        if ( state.current['uuid'] !== dev_details['uuid'] ||
             dev_details['channels'].length !== $('#dsd-chan-list li').length ) {
            $('#dsd-chan-list').empty();
            for (var chan of dev_details['channels']) {
                $('#dsd-chan-list').append(
                    $('<li>').html(
                        $('<ons-checkbox>', { id: 'dsd-chan-' + jQclean(chan),
                                            value: chan,
                                            checked: dev_details['hop_channels'].includes(chan) ? true : false,
                                            modifier: "material"} )
                        .on("change", show_submit)
                    ).append($('<label>', { for: 'dsd-chan-cb-' + jQclean(chan) } ).text(" " + chan))
                );
            }
        } else {
            for (var chan of dev_details['channels']) {
                if (dev_details['hop_channels'].includes(chan))
                    $('#dsd-chan-' + jQclean(chan)).prop('checked', true);
                else
                    $('#dsd-chan-' + jQclean(chan)).prop('checked', false);
            }
        }

        $('#dsd-chan-hopping').show();
    } else {
        $('#dsd-chan-hopping').hide();
        if ( dev_details['uuid'] !== state.current['uuid'] ||
             $('option').length !== dev_details['channels'].length) {
            $('#dsd-channels').html(
                $('<ons-select>', { id: 'dsd-chan-select',
                                    modifier: 'underbar' })
                .on("change", show_submit)
            );
            for (var chan of dev_details['channels'])
                $('#dsd-chan-select').append(
                    $('<option>', { id: 'dsd-chan-opt-' + jQclean(chan) }).text(chan));
            $('#dsd-chan-opt-' + jQclean(dev_details['channel'])).prop('selected', true);
        } else {
            $('#dsd-chan-opt-' + jQclean(dev_details['channel'])).prop('selected', true);
        }
    }
}

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
        if ( $("#datasource_details").data()['uuid'] !== dev_uuid )
            state.current['uuid'] = '';
        var uuid = data["uuid"];

        var status_text = "Paused";
        var status_bool = false;
        if (data["paused"] == 0 && data["running"] == 1) {
            status_text = "Running";
            status_bool = true;
        } 
        if (data["error"] == 1) {
            status_text = "Error";
        }

        // textual setup for uuid
        if (uuid !== state.current['uuid']) {
            $("#dsd-uuid").text(kmd.sanitizeHTML(uuid));
            $("#dsd-name").text(kmd.sanitizeHTML(data["name"]));
            $("#dsd-interface").text(kmd.sanitizeHTML(data["capture_interface"]));
            $("#dsd-driver").text(kmd.sanitizeHTML(data["type"]));
            $("#dsd-hardware").text(kmd.sanitizeHTML(data["hardware"]));
        }
        // textual refresh for packets and status
        if (uuid !== state.current['uuid'] || data["num_packets"] !== state[uuid]["num_packets"])
            $("#dsd-packets").text(kmd.sanitizeHTML(data["num_packets"]));
        if ($("#dsd-state").text() !== status_text)
            $("#dsd-state").text(status_text);

        // form state for active and hopping switches
        if ( uuid !== state.current['uuid'] || status_bool !== state.current['status_bool'] ) {
            if ( status_bool ) {
                $('#dsd-active').prop('checked', true);
                $('#dsd-hopping, button, fieldset, #dsd-chan-select').prop("disabled", false);
            } else {
                $('#dsd-active').prop('checked', false);
                $('#dsd-hopping, button, fieldset, #dsd-chan-select').prop("disabled", true);
            }
        }
        if ( state.ignore_refresh !== true &&
             ( uuid !== state.current['uuid'] || data['hopping'] !== state.current['hopping'] ) )
            if ( data['hopping'] ) {
                $('#dsd-hopping').prop('checked', true);
            } else {
                $('#dsd-hopping').prop('checked', false);
            }

        if ( uuid !== state.current['uuid'] ||
             typeof state[uuid] === 'undefined' ||
             status_bool !== state.current['status_bool'] ||
             data['hopping'] !== state[uuid]['hopping'] ||
             data['channel'] !== state[uuid]['channel'] ||
             data['hop_channels'].length !== state[uuid]['hop_channels'].length ) {
            channels_details({ data: data });
        }

        $("#datasource_details").data("uuid", dev_uuid)
        state.current['uuid'] = dev_uuid;
        state.current['status_text'] = status_text;
        state.current['status_bool'] = status_bool;
        state[uuid] = data;
    })
    .always(function() {
        timers['updates'].timeout = setTimeout(exports.listDetails, 5000);
    });
}
timers['updates'] = { fn: exports.listDetails };

// start on dynamic load
exports.listDetails();

// form event handlers
var form_handlers = function() {
    $('#dsd-active').on("change", pause_restart);
    $('#dsd-hopping').on("change", hop_change);
};
// add on page load
form_handlers();
// readd on following page loads
document.addEventListener('show', function(event) {
    if ( event.target.id === 'datasource_details' ) {
        form_handlers();
    }
}, false);

return exports;
});

