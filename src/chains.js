var graph;

var nodeData, linkData, link, node, strength;
var nodeByID = {};
// var width = $(window).width();
// var height = $(window).height();
var width = 1500;
var height = 900;

// nodeData = [
//   {"id": 1, "rootx": 100, "rooty": 100, "loc": "start"},
//   {"id": 2, "rootx": 100, "rooty": 100, "loc": "mid"},
//   {"id": 3, "rootx": 200, "rooty": 110, "loc": "mid"},
//   {"id": 4, "rootx": 200, "rooty": 140, "loc": "mid"},
//   {"id": 5, "rootx": 40, "rooty": 300, "loc": "end"},
//   {"id": 6, "rootx": 200, "rooty": 200, "loc": "start"},
//   {"id": 7, "rootx": 300, "rooty": 300, "loc": "mid"},
//   {"id": 8, "rootx": 300, "rooty": 400, "loc": "mid"},
//   {"id": 9, "rootx": 400, "rooty": 400, "loc": "mid"},
//   {"id": 10, "rootx": 300, "rooty": 400, "loc": "end"}
// ]
//
// linkData = [
//   {"source": 1, "target": 2},
//   {"source": 2, "target": 3},
//   {"source": 3, "target": 4},
//   {"source": 4, "target": 5},
//   {"source": 6, "target": 7},
//   {"source": 7, "target": 8},
//   {"source": 8, "target": 9},
//   {"source": 9, "target": 10}
// ]
let yScale = d3
  .scaleLinear()
  // .domain([1378,1635])
  .domain([5, 3028])
  .range([0, height]);
let xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
let colorScale = d3.scaleLinear().domain([0, 1]).range([0, 255]);
let lineScale = d3.scaleLinear().domain([0, 1]).range([0.5, 3]);

// var topics_color = ["#F5770C", "#DE4600", "#E81C0C", "#F20C46", "#DB00A5", "#8E0CE8", "#0C47F2", "#12E154", "#B7E101", "#F7EC0C"]
// var topics_color = ["#F5770C", "#DE4600", "#0C47F2", "#12E154", "#B7E101", "#F7EC0C"]
var topics_color = [
  "#F07800",
  "#E10901",
  "#F78554",
  "#CD51ED",
  "#905FE1",
  "#F70CAE",
  "#B10CED",
  "#CA00F0",
  "#6B0CF7",
  "#0009E0",
  "#E16158",
];
var collections = [150, 114, 1, 3, 24, 27];
var color = d3.scaleOrdinal().domain([0, 12]).range(topics_color);
var hoverwave = d3.scaleLinear().domain([0, 200]).range([5, 1]);
// var color = d3.scaleOrdinal().domain(collections).range(topics_color)

var simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .strength(1)
      .id(function (d) {
        return d.id;
      })
  )
  // .force("charge", d3.forceManyBody().strength(-1))
  .force("center", d3.forceCenter(width * 0.5, height * 0.5));

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var tooltip_width = "500px";
var tooltip = d3
  .select("body")
  .append("g")
  .style("opacity", 0)
  .attr("font", "8px sans-serif")
  .attr("x", 0)
  .attr("y", 0)
  .style("position", "absolute")
  .attr("class", "tooltip")
  .style("border-radius", "5px")
  .style("width", tooltip_width)
  .style("padding", "10x")
  .html(nodeData);

simulation.force(
  "y",
  d3
    .forceY()
    .y(function (d) {
      return d.rooty * 0 + yScale(d.conversation) * 0;
    })
    .strength(0)
);
simulation.force(
  "x",
  d3
    .forceX()
    .x(function (d) {
      return d.rootx * 0 + xScale(d.convo_prop_index) * 0;
    })
    .strength(0)
);

var slider = d3
  .sliderHorizontal()
  .min(0)
  .max(1)
  .step(0.01)
  .width(300)
  .displayValue(false)
  .on("onchange", (val) => {
    let valScale = d3.scaleLinear().domain([0, 1]).range([1, 0]);
    simulation.force(
      "y",
      d3
        .forceY()
        .y(function (d) {
          return d.rooty * val + yScale(d.conversation) * valScale(val);
        })
        .strength(1)
    );
    simulation.force(
      "x",
      d3
        .forceX()
        .x(function (d) {
          return d.rootx * val + xScale(d.convo_prop_index) * valScale(val);
        })
        .strength(1)
    );
    simulation.force(
      "link",
      d3
        .forceLink()
        .strength(valScale(val))
        .id(function (d) {
          return d.id;
        })
    );
    simulation.alpha(1).restart();
  });

let orginalData;
d3.json("multi_set_five.json", function (data) {
  orginalData = data;
  document
    .getElementById("collectionSelect")
    .addEventListener("change", function () {
      let selectedCollection = this.value;

      // Filter nodeData and linkData based on the selected collection
      nodeData = orginalData.nodes.filter(function (d) {
        if (
          selectedCollection === "all" ||
          d.collection == selectedCollection
        ) {
          return d;
        }
      });
      linkData = orginalData.edges.filter(function (d) {
        if (
          selectedCollection === "all" ||
          d.collection == selectedCollection
        ) {
          return d;
        }
      });

      // remove the slider (it'll get re-added later)
      d3.select("#slider").select("svg").remove();

      // remove all edges and nodes
      d3.select(".links").remove();
      d3.select(".nodes").remove();

      onDataLoad({ nodes: nodeData, edges: linkData });
    });

  onDataLoad(data);
});

function onDataLoad(data) {
  data.nodes.forEach(function (n) {
    nodeByID[n.id] = n;
  });

  nodeData = data.nodes.filter(function (d) {
    // if(d.collection == 114){
    return d;
    // }
  });
  linkData = data.edges.filter(function (d) {
    // if(d.collection == 114){
    return d;
    // }
  });

  var rect = svg
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black")
    .on("click", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
      d3.select(".nodes")
        .transition()
        .duration(500)
        .selectAll("circle")
        .attr("r", 1)
        .attr("opacity", 1);
      d3.select(".links")
        .transition()
        .duration(500)
        .selectAll("path")
        .attr("stroke", "none")
        .style("fill", "none");
    });

  var link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(linkData)
    .enter()
    .append("path")
    // .attr("stroke", function(o){
    //   return "rgb(0, " + colorScale(o.source.convo_prop_index) + "," + 255 - colorScale(o.source.convo_prop_index) + ")"
    // })
    // .attr("stroke-width", 0.05)
    .attr("fill", "none")
    .attr("stroke", "none");

  var node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodeData)
    .enter()
    .append("circle")
    .attr("r", 1)
    .attr("fill", "white")
    // .call(drag(simulation))
    .on("mouseover", function (d) {
      tooltip.transition().duration(1000);
      tooltip
        .style("opacity", 1)
        .style("font", "12px mono")
        .style("font-family", "Share Tech Mono")
        .style("color", "white")
        .style("padding", "10px")
        .html(nodeData)
        .style("left", String(width / 2 - 250) + "px")
        .style("top", String(height - 50) + "px")
        // .style("text-anchor", "middle")
        // .attr('y', '500')
        // .attr('x', '600')
        // .style("text-anchor", "middle")
        .text(d.words)
        .style("background", "none")
        .style("width", tooltip_width);
      d3.select(".nodes")
        .transition()
        .duration(500)
        .selectAll("circle")
        .attr("fill", function (o) {
          return color(o.kmeans);
        })
        // .attr("r", function(o){ if (getDistance(o.rootx, d.rootx, o.rooty, d.rooty) < 50){
        //   return getDistance(o.rootx, d.rootx, o.rooty, d.rooty)/50 }
        //   else {return 3}
        // })
        .attr("stroke", function (o) {
          if (o.id === d.id) {
            return "white";
          } else {
            return "none";
          }
        })
        .attr("stroke-weight", function (o) {
          if (o.id === d.id) {
            return 2;
          } else {
            return 0;
          }
        });
    })
    .on("click", function (d) {
      d3.select(".links")
        .transition()
        .duration(500)
        .selectAll("path")
        .attr("stroke-opacity", 1)
        .attr("stroke", function (o) {
          if (o.source.conversation === d.conversation) {
            // return "rgb(" + colorScale(o.source.convo_prop_index) + ","+ colorScale(o.source.convo_prop_index) + "," + colorScale(o.source.convo_prop_index) + ")"
            return color(o.source.kmeans);
            // return "white"
          } else {
            return "none";
          }
        })
        .attr("stroke-width", function (o) {
          if (o.source.conversation === d.conversation) {
            // return lineScale(o.source.convo_prop_index)
            return 1;
          } else {
            return 0;
          }
        })
        .attr("fill", "none");
      d3.select(".nodes")
        .transition()
        .duration(500)
        .selectAll("circle")
        .attr("fill", function (d) {
          return color(d.kmeans);
        })
        // .attr("fill", 'white')
        .attr("r", function (o) {
          if (o.conversation === d.conversation) {
            // return o.words.length/50
            return 5;
          } else {
            return 0;
          }
        })
        .attr("opacity", 1);
    });

  simulation.nodes(nodeData).on("tick", ticked);

  simulation.force("link").links(linkData);
  simulation.force(
    "x",
    d3
      .forceX()
      .x(function (d) {
        return d.rootx;
      })
      .strength(0)
  );

  simulation.force(
    "y",
    d3
      .forceY()
      .y(function (d) {
        return d.rooty;
      })
      .strength(0)
  );

  d3.select("#slider")
    .append("svg")
    .attr("width", 500)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)")
    .call(slider);

  function draw(context, x1, y1, x2, y2, f) {
    context.moveTo(x1, y1);
    // context.lineTo(x1, y1); // draw straight line to ⟨100,10⟩
    context.arcTo(x1, y1, x2, y2, f); // draw an arc, the turtle ends up at ⟨194.4,108.5⟩
    context.lineTo(x2, y2); // draw straight line to ⟨300,10⟩
    // etc.
    return context; // not mandatory, but will make it easier to chain operations
  }

  function ticked(data) {
    link.attr("d", function (d) {
      var offset = 50;
      return draw(
        d3.path(),
        d.source.x,
        d.source.y,
        d.target.x,
        d.target.y,
        offset
      );
    });

    node.attr("transform", function (d) {
      return (
        "translate(" +
        Math.max(-30, Math.min(width + 30, d.x)) +
        "," +
        Math.max(-30, Math.min(height + 30, d.y)) +
        ")"
      );
    });
  }

  function restart() {
    // Apply the general update pattern to the nodes.
    node = node.data(nodeData, function (d) {
      return d.id;
    });
    node.exit().remove();
    node = node.enter().append("circle").merge(node);

    // Apply the general update pattern to the links.
    link = link.data(linkData, function (d) {
      return d.source.id + "-" + d.target.id;
    });
    link.exit().remove();
    link = link.enter().append("path").merge(link);

    // Update and restart the simulation.
    simulation.nodes(nodeData);
    simulation.force("link").links(linkData);
    simulation.alpha(0.1).restart();
  }
}
