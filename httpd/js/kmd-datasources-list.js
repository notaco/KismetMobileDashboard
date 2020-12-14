( typeof define === "function" ? function (m) { define("kmd_datasources_list", m); } :
  function(m){ this.kmd_datasources_list = m(); }
)(function () {

"use strict";

var exports = {};
var page_id = 'datasources_list';
kmd.timers[page_id] = {};
var timers = kmd.timers[page_id];

exports.dsl_charts = {};

var source_chart = function(ds, index, all_ds) {
    var result_set = [];
    var start_point = ds['last_time'] % 60;
    var gap = ds['serial_time'] - ds['last_time']
    for (var j = 1; j < 61; j++)
        result_set.push( j < gap ? 0 : ds['minute_rrd'][(start_point + j) % 60] );
    result_set.reverse();
    if ( $('#dsl-' + ds['uuid']).length ) {
        exports.dsl_charts[ds['uuid']].data.datasets[0].data = result_set;
        exports.dsl_charts[ds['uuid']].update();
    } else {
        $('#datasources-list').append(
            $('<p>', { class: 'field-label show-clickable' })
            .text(ds['name'] + ': Details ')
            .append($('<ons-icon>', { icon: 'fa-angle-double-right' }))
            .click(function() {
                kmd.ui.push_page('views/datasource_details.html', { uuid: ds['uuid'] });
            })
        );
        $('#datasources-list').append(
            $('<div>', { style: "width: 100%; height: 100px;" })
            .html( $('<canvas>', { id: 'dsl-' + ds['uuid'] }))
        );
        var labels = new Array();
        for (var l = 0; l < 60; l++)
            labels.push(l + " seconds ago");
        exports.dsl_charts[ds['uuid']] = new Chart($('#dsl-' + ds['uuid']), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Packets",
                        backgroundColor: "rgba(0,0,0,1.0)",
                        data: result_set
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        display: false,
                        ticks: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function(value) {if (value % 1 === 0) {return value;}}
                        }
                    }]
                },
                animation: {
                    duration: 0
                },
                legend: {
                    display: false
                }
            }
        });
    }
};

exports.datasourcesCharts = function() {
    if (kmd.paused || (page_id !== kmd.ui.navi.topPage.id))
        return true;
    var source_fields = [["kismet.datasource.uuid","uuid"],
                         ["kismet.datasource.name","name"],
                         ["kismet.datasource.packets_rrd/kismet.common.rrd.minute_vec","minute_rrd"],
                         ["kismet.datasource.packets_rrd/kismet.common.rrd.last_time","last_time"],
                         ["kismet.datasource.packets_rrd/kismet.common.rrd.serial_time","serial_time"]];
    $.ajax({
            url: kmd_rest_prefix + "datasource/all_sources.json",
            type: "POST",
            data: { "json": '{"fields":' + JSON.stringify(source_fields) + '}'}
    }).done(function(data, textStatus, jqXHR) {
        data.forEach(source_chart);
    }).always(function() { timers['list'].timeout = setTimeout(exports.datasourcesCharts, 1000); });
};
timers['list'] = { fn: exports.datasourcesCharts };

// start on dynamic load
exports.datasourcesCharts();

return exports;
});

