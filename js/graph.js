/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var margin = {top: 20, right: 80, bottom: 30, left: 50},
width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;
      
var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);
    
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
var yAxis2 = d3.svg.axis()
    .scale(y)
    .orient("right");

var line = d3.svg.line()
    .interpolate("step-after")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.count); });

var svg = d3.select("#burndown").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var data;
function doD3() {
    lates.sort(d3.ascending); allbugs.sort(d3.ascending); fixed.sort(d3.ascending); nonfixed.sort(d3.ascending);
    gdata.sort(function(ld, rd) {return d3.ascending(ld.date, rd.date);});
    data = [
        {
            color: 'grey',
            "class": 'top_all',
            values: []
        },
        {
            color: 'black',
            "class": 'l10n',
            values: []
        },
        {
            color: 'red',
            "class": "open_l10n",
            values: []
        },
        {
            color: 'grey',
            "class": "non_fixed",
            values: []
        }
    ], fixed_ = 0;
    gdata.forEach(function(d) {
        switch (d.event) {
            case "creation":
              data[0].values.push({date:d.date,
                                  count:data[0].values.length+1-data[3].values.length});
              break;
            case "l10n":
              data[1].values.push({date:d.date,
                                  count:data[1].values.length-data[3].values.length+1});
              data[2].values.push({date:d.date,
                                  count:data[1].values.length-fixed_});
              break;
            case "nonfixed":
              data[3].values.push({date:d.date, count:-data[3].values.length-1});
              data[0].values.push({date:d.date, count:data[0].values.length-data[3].values.length});
              data[1].values.push({date:d.date, count:data[1].values.length-data[3].values.length});
            case "fixed":
              fixed_++;
              data[2].values.push({date:d.date, count:data[1].values.length-fixed_});
      }
    });
    var now = new Date();
    x.domain([allbugs[0], now]);
    y.domain([-nonfixed.length, allbugs.length]);
    data[0].values.push({date:now, count:data[0].values.length-data[3].values.length});
    data[1].values.push({date:now, count:data[1].values.length-data[3].values.length});
    data[2].values.push({date:now, count:data[1].values.length-fixed_-1});
    data[3].values.push({date:now, count:-data[3].values.length});

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxis2);
    var abg = svg.selectAll('.buggraph')
      .data(data)
      .enter()
      .append("g")
      .attr("class", "buggraph");

    abg.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return d.color; });
}
