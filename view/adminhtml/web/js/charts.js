define([
    'jquery',
    'moment',
    'mageUtils',
    'google-charts',
], function($,  moment, utils) {
    'use strict';

    function onilabGoogleCharts(){

    }

    var chartsList = {};
    var chartsQueue = [];
    var googleChartsLoaded = false;

    function _prepareChartData(elementId, options){
        var chartData = new google.visualization.DataTable(),
            dateFormat = 'hh:mm a',
            momentFormat = 'h:mm a',
            skipStep = 0,
            xTicks = [];

        switch(options.period){
            case '24h':
                dateFormat = 'hh:mm a';
                momentFormat = 'h:mm a';
                break;
            case '7d':
            case '1m':
                dateFormat = 'M/d/yy';
                momentFormat = 'M/D/YY';
                break;
            case '1y':
            case '2y':
                dateFormat = 'MM/yyyy';
                momentFormat = 'M/YYYY';
                break;
        }

        /**
         * setting skip step
         */
        if(options.data.rows.length >= 15){
            skipStep = 2;
        }else if(options.data.rows.length > 8){
            skipStep = 1;
        }

        options = onilabGoogleCharts.prepareOptions(options);

        for(var i = 0; i < options.data.columns.length; ++i){
            chartData.addColumn(options.data.columns[i][0], options.data.columns[i][1]);
        }

        // tooltip
        chartData.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}});

        for(var i = 0, t = 0; i < options.data.rows.length; ++i){
            options.data.rows[i][0] = new Date(options.data.rows[i][0]);

            var tooltip = '', m = moment(options.data.rows[i][0]);
            for(var j = 1; j < options.data.columns.length; ++j){
                tooltip += '<div>'+options.data.columns[j][1]+': </td><td><strong>'+options.data.rows[i][j]+'</strong></div>';
            }
            options.data.rows[i].push('<div style="padding:5px 5px 5px 5px; min-width: 100px"><div><strong>'+m.format(momentFormat)+'</strong></div><trable>'+tooltip+'</trable></div>');

            if(0 === i){
                options.chart.hAxis.baseline = options.data.rows[i][0];
            }

            if(t == skipStep) {
                xTicks.push(options.data.rows[i][0]);
                t = 0;
            }else {
                t++;
            }
        }

        chartData.addRows(options.data.rows);

        var element = document.getElementById(elementId);
        var chart = new google.visualization.LineChart(element);

        // options.char
        options.chart.vAxis.ticks = options.y.ticks;
        options.chart.vAxis.gridlines.count = 10;
        options.chart.vAxis.minorGridlines.count = 0;

        options.chart.hAxis.format = dateFormat;
        options.chart.hAxis.ticks = xTicks;

        return [chart, chartData, options.chart];
    }

    function _drawChart(chartName){
        if(!chartsList[chartName] || chartsList[chartName].rendered){
            return ;
        }

        chartsList[chartName].chartData[0].draw(chartsList[chartName].chartData[1], chartsList[chartName].chartData[2]);
        chartsList[chartName].rendered = true;
    }

    onilabGoogleCharts.prepareOptions = function(options) {
        var customOptions = options.chart || {};

        var defaultOptions = {
            backgroundColor: '#fff',
            colors: ['#ef672f'],
            lineWidth: 7,
            width: '780',
            height: '384',
            chartArea: {
                width: '80%',
                height: '85%'
            },
            hAxis: {
                baselineColor: '#8e8e8e',
                gridlines: {
                    color: '#fff',
                },
                textStyle:{
                    color: '#8e8e8e'
                }
            },
            vAxis: {
                baselineColor: '#8e8e8e',
                gridlines: {
                    color: '#f5f0e7',
                    count: 10
                },
                minorGridlines:{
                    color: '#f5f0e7',
                    count: 0
                },
                textStyle:{
                    color: '#8e8e8e'
                },
                showTextEvery: 4
            },
            legend: 'none',
            fontSize: 15,
            tooltip: {
                isHtml: true
            }
        };

        options.chart =  options.skipDefaults
            ? customOptions
            : $.extend(true, defaultOptions, customOptions);

        return options;
    };

    onilabGoogleCharts.drawChart = function(elementId, options) {
        if(googleChartsLoaded){
            var chartData = _prepareChartData(elementId, options);

            chartsList[options.chartName] = {
                chartData: chartData,
                rendered: false
            };

            if($('#diagram_tab_'+options.chartName+'_content').is(':visible')){
                _drawChart(options.chartName);
            }
        }else{
            chartsQueue.push([elementId, options]);
        }
    };

    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback(function(){
        googleChartsLoaded = true;

        for(var i = 0; i < chartsQueue.length; ++i){
            onilabGoogleCharts.drawChart(chartsQueue[i][0], chartsQueue[i][1]);
        }

        chartsQueue = null;
    });

    $('#diagram_tab .tabs-horiz > li').click(function(){
        var id = $(this).find('a.ui-tabs-anchor').attr('id').replace('diagram_tab_', '');
        _drawChart(id);
    });

    return onilabGoogleCharts;
});
