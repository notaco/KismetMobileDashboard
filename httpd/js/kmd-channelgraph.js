( typeof define === "function" ? function (m) { define("kmd.kmd_channelgraph", m); } :
  function(m){ this.kmd_channelgraph = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'home';
var timers = kmd.timers[page_id];

var state = {};
state['rrd_ages'] = [];

var dot11_chan_conv = function(in_freq) {
    in_freq = parseInt(in_freq / 1000);

    if (in_freq < 2412)
        return false;

    if (in_freq == 2484)
        return 14;
    else if (in_freq < 2484)
        return (in_freq - 2407) / 5;
    else if (in_freq >= 4910 && in_freq <= 4980)
        return (in_freq - 4000) / 5;
    else if (in_freq <= 45000)
        return (in_freq - 5000) / 5;
    else if (in_freq >= 58320 && in_freq <= 64800)
        return (in_freq - 56160) / 2160;
    else
        return false;
};

var channel_bar_color = function(age) {
    if (age < 5)
        return [0, 0, 0, 1.0];
    else if (age < 10)
        return [0, 0, 0, 0.9];
    else if (age < 20)
        return [0, 0, 0, 0.8];
    else if (age < 30)
        return [0, 0, 0, 0.7];
    else if (age < 45)
        return [0, 0, 0, 0.6];
    else if (age < 60)
        return [0, 0, 0, 0.5];
    else if (age < 120)
        return [0, 0, 0, 0.4];
    else if (age < 600)
        return [0, 0, 0, 0.3];
    else if (age < 1200)
        return [0, 0, 0, 0.2];
    else if (age < 1800)
        return [50, 0, 0, 0.2];
    else if (age < 2400)
        return [100, 0, 0, 0.2];
    else if (age < 3600)
        return [150, 0, 0, 0.2];
    else if (age < 4800)
        return [200, 0, 0, 0.2];
    else if (age >= 4800)
        return [250, 0, 0, 0.2];
    else
        return [0, 0, 0, 1.0];
};

exports.channelGraph = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    $.get(kmd_rest_prefix + "channels/channels.json")
    .done(function(data) {
        var chans = [];
        var counts = [];
        var colors = [];
        state['rrd_ages'] = [];

        for (var key in data['kismet.channeltracker.frequency_map']) {
            var chan_name = dot11_chan_conv(key);
            if (chan_name) {
                var chan_data = data['kismet.channeltracker.frequency_map'][key];
                var last_time = chan_data['kismet.channelrec.device_rrd']['kismet.common.rrd.last_time'];
                var data_age = chan_data['kismet.channelrec.device_rrd']['kismet.common.rrd.serial_time'] - last_time;

                var rgba = channel_bar_color(data_age);
                var chan_color = 'rgba(' + rgba.join(',') + ')';

                chans.push(chan_name);
                counts.push(chan_data['kismet.channelrec.device_rrd']['kismet.common.rrd.minute_vec'][last_time % 60]);
                colors.push(chan_color);
                state['rrd_ages'].push(data_age);
            }
        }

        if (typeof state.channel_chartjs === 'undefined') {
            state.channel_chartjs = new Chart($('#channel_chart'), {
                type: 'bar',
                data: {
                    labels: chans,
                    datasets: [
                        {
                            label: "Devices per Channel",
                            backgroundColor: colors,
                            data: counts
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                callback: function(value) {if (value % 1 === 0) {return value;}}
                            }
                        }]
                    },
                tooltips: {
                    callbacks: {
                        title: function(tooltipItems, data) { return "Channel: "+tooltipItems[0]['xLabel']; },
                        label: function(tooltipItems, data) { return " " + tooltipItems.yLabel + " devices"; },
                        afterLabel: function(tooltipItems, data) { return state.rrd_ages[tooltipItems.index] + " secs ago."; }
                        }
                    }
                
                }
            });
        } else {
            state.channel_chartjs.data.labels = chans;
            state.channel_chartjs.data.datasets[0].backgroundColor = colors;
            state.channel_chartjs.data.datasets[0].data = counts;

            state.channel_chartjs.update();
        }
    })
    .always(function() {
        timers['chart'].timeout = setTimeout(exports.channelGraph, 5000);
    });
};
timers['chart'] = { fn: exports.channelGraph };

return exports;
});
