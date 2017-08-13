
function showMap() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        width = g.clientWidth || e.clientWidth || w.innerWidth,
        height = w.innerHeight || e.clientHeight|| g.clientHeight;

    d3.select("#map").style("width", width + "px").style("height", height + "px");
    var map = L.map("map").setView([40, -70], 5);

    var svg = d3.select(map.getPanes().overlayPane).append("svg");
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }

    function project(lat, lng) {
        return map.latLngToLayerPoint(new L.LatLng(lat, lng));
    }

    d3.queue()
        .defer(d3.json, "data/routes.geojson")
        .defer(d3.json, "data/events.json")
        .await(function(error, routeCollection, events) {
        if(error) throw error;
    
        var transform = d3.geoTransform({point : projectPoint});
        var path = d3.geoPath().projection(transform);
        var feature = g.selectAll("path")
            .data(routeCollection.features).enter().append("path")
            .style("stroke", "white").style("fill", "transparent")
            .style("stroke-width", "2px")
            .attr("class", "route-path")
            .attr("id", function(d) {
                return "trip-" + d.properties.src_id + "-" + d.properties.dest_id;
            });

        var locations = {}
        _.each(routeCollection.features, function(f) {
            locations[f.properties.src_id] = {
                "type" : "source",
                "id" : f.properties.src_id,
                "loc" : f.properties.actualStart.coordinates
            };

            locations[f.properties.dest_id] = {
                "type" : "dest",
                "id" : f.properties.dest_id,
                "loc" : f.properties.actualEnd.coordinates
            };
        });
        var locations = _.values(locations);

        // Reposition the SVG to cover the features.
        function reset() {
            var bounds = path.bounds(routeCollection),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr("width", (bottomRight[0] - topLeft[0] + 20))
                .attr("height", (bottomRight[1] - topLeft[1] + 20))
                .style("left", (topLeft[0] - 10) + "px")
                .style("top", (topLeft[1] - 10) + "px");

            g.attr("transform", "translate(" + (-topLeft[0] + 10) + "," + (-topLeft[1] + 10) + ")");

            // add a point for sources and dstinations
            g.selectAll(".loc-point")
                .data(locations)
                .attr("cx", function(d) { return project(d.loc[0], d.loc[1]).x })
                .attr("cy", function(d) { return project(d.loc[0], d.loc[1]).y })
                .enter().append("circle")
                .attr("class", "leaflet-zoom-hide loc-point")
                .attr("cx", function(d) { return project(d.loc[0], d.loc[1]).x })
                .attr("cy", function(d) { return project(d.loc[0], d.loc[1]).y })
                .attr("r", "2px")
                .attr("fill", function(d) { return d.type == "source" ? "white" : "#3366FF" });

            feature.attr("d", path);
        }

        map.on("viewreset" ,reset);
        map.on("zoom" ,reset);
        reset();


        var year = 2016;
        _.each(events, function(e) {
            e.key = e.src_id + "-" + e.dest_id
        });
        var keyedEvents = _.groupBy(events, "key");
        var eventDates = _.mapObject(keyedEvents, function(v) {
            return new Set(_.map(v, function(r) {
                return parseInt(moment(r.date).format("DDD"))
            }));
        });

        var runAnimation = function() {
            var trans = d3.selectAll(".route-path").style("opacity", 1)
                .transition().duration(20000)
                .styleTween("opacity", function() {
                    var nodeData = d3.select(this).datum();
                    var routeName = nodeData.properties.src_id + "-" + nodeData.properties.dest_id;
                    var curEventDates = eventDates[routeName];
                    return function(t) {
                        var dayOfYear = parseInt(Math.ceil(t * 365.0));
                        var lastEventDay = nodeData.properties.lastEventDay;
                        if(curEventDates != undefined && curEventDates.has(dayOfYear)) {
                            nodeData.properties.lastEventDay = dayOfYear;
                            return 1;
                        } else if(lastEventDay != undefined) {
                            return 0.1/(0.1 * (dayOfYear - lastEventDay))
                        } else {
                            return 0;
                        }
                    }
                });

            endall(trans, runAnimation);
        }

        runAnimation();
    });

}

$(document).ready(function() {
    showMap();
});


