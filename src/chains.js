let nodeData, linkData, link, node, strength;

// const width = 1500;
// const height = 900;
const width = window.innerWidth;
const height = window.innerHeight - 100;

let yScale = d3
  .scaleLinear()
  // .domain([1378,1635])
  .domain([5, 3028])
  .range([0, height]);
let xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);

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

const compatibility_threshold = 0.2;
const bundling_stiffness = 24;
const step_size = 0.8;
let bundling;

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

const tooltipWidth = "500px";
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
  .style("width", tooltipWidth)
  .style("padding", "10x")
  .html(nodeData);

simulation.force("y", d3.forceY().y(0).strength(0));
simulation.force("x", d3.forceX().x(0).strength(0));

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
d3.json("multi_set_five.json").then(function (data) {
  data.edges = data.edges.filter(function (d) {
    if (d.collection == 114) {
      return d;
    }
  });

  data.nodes = data.nodes.filter(function (d) {
    if (d.collection == 114) {
      return d;
    }
  });
  console.log(data);

  // update the nodes so that x and y are set
  data.nodes.forEach(function (d) {
    d.x = d.rootx;
    d.y = d.rooty;
  });

  orginalData = data;
  orginalData.links = orginalData.edges;

  bundling = edgeBundling(orginalData, {
    compatibility_threshold,
    bundling_stiffness,
    step_size,
  });

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

      // TODO: this gets the pulsing, but it makes it unstable...
      //   repeat();
    });

  onDataLoad(data);
});

let toFind = "machine";
d3.select("#search").on("input", function () {
  toFind = this.value;
  d3.select(".nodes")
    .selectAll("circle")
    .classed("matched", function (d) {
      if (!toFind) return false; // if nothing to find, remove the 'matched' class
      const sentence = d.words;
      const regex = new RegExp("\\b" + toFind + "\\b");
      const words = sentence.match(regex);
      return !!words; // this will return true if there are any matches, false otherwise
    });
});

function repeat() {
  // select all circles
  var circles = d3.selectAll("circle");

  // choose a random subset of nodes
  var subset = circles.filter(function (d, i) {
    return Math.random() < 0.5; // 50% chance of being selected
  });

  subset
    .transition() // apply a transition
    .duration(function () {
      return 200 + Math.random() * 500; // random duration between 500 and 1500 ms
    })
    .attr("r", function () {
      return 1 + Math.random() * 1.5; // random radius between 1 and 10
    });
  // .transition() // apply a second transition
  // .duration(function () {
  //   return 200 + Math.random() * 500; // random duration between 500 and 1500 ms
  // });
  // .attr("r", 1); // change the radius attribute back to 1
  setTimeout(repeat, 700); // when the second transition finishes, restart the function
}

function onDataLoad(data) {
  nodeData = data.nodes;
  linkData = data.edges;

  var rect = svg
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black")
    .on("click", function (event, d) {
      tooltip.transition().duration(500).style("opacity", 0);
      d3.select(".nodes").selectAll("circle").classed("selected", false);
      d3.select(".nodes").selectAll("circle").classed("not-selected", false);
      d3.select(".links")
        .transition()
        .duration(500)
        .selectAll("path")
        .attr("stroke", "none")
        .style("fill", "none");
    });
  // var link = svg
  //   .append("g")
  //   .attr("class", "links")
  //   .selectAll("path")
  //   .data(linkData)
  //   .enter()
  //   .append("line")
  //   // .attr("stroke", function(o){
  //   //   return "rgb(0, " + colorScale(o.source.convo_prop_index) + "," + 255 - colorScale(o.source.convo_prop_index) + ")"
  //   // })
  //   // .attr("stroke-width", 0.05)
  //   .attr("fill", "none")
  //   .attr("stroke", "none");
  // var link = svg
  //   .selectAll(".link")
  //   .data(linkData)
  //   .join("line")
  //   .classed("link", true)
  //   .style("stroke", "firebrick")
  //   .style("opacity", 0);

  var gLinks = svg
    .selectAll("g#bundledLinks")
    .data([0]) // create one if doesn't exist
    .join("g")
    .attr("id", "bundledLinks");

  var bundledPaths = gLinks
    .append("g")
    .attr("class", "links")
    .selectAll("path.bundled")
    .data(linkData)
    .join("path")
    .attr("class", "bundled")
    .attr("stroke", "#ccc")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", "none");

  var node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodeData)
    .enter()
    .append("circle")
    .attr("r", 1)
    // .attr("fill", "white")
    // .call(drag(simulation))
    .on("mouseover", function (event, d) {
      d3.select(event.currentTarget).classed("moused-over-node", true);
      const hoveredConversation = d.conversation;
      d3.select(".nodes")
        .selectAll("circle")
        .classed("moused-over-conversation", function (o) {
          return o.conversation === hoveredConversation;
        });

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
        .style("width", tooltipWidth);
      d3.select(".nodes")
        .transition()
        .duration(500)
        .selectAll("circle")
        // .attr("fill", function (o) {
        //   return color(o.kmeans);
        // })
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
    .on("click", function (event, d) {
      const selectedConversation = d.conversation;

      // TODO:
      // filter the data to just the selected conversation
      // const selectedNodes = data.nodes.filter(function (d) {
      //   if (d.conversation === selectedConversation) {
      //     return true;
      //   }
      // });
      // selectedEdges = data.links.filter(function (d) {
      //   // check to see if the source or target is in the selected nodes
      //   const sourceInSelectedNodes = selectedNodes.find(function (node) {
      //     return node.conversation === d.source.conversation;
      //   });
      //   const targetInSelectedNodes = selectedNodes.find(function (node) {
      //     return node.conversation === d.target.conversation;
      //   });
      //   if (sourceInSelectedNodes || targetInSelectedNodes) {
      //     return true;
      //   }
      // });

      // bundling = edgeBundling(
      //   {
      //     nodes: selectedNodes,
      //     links: selectedEdges,
      //   },
      //   {
      //     compatibility_threshold,
      //     bundling_stiffness,
      //     step_size,
      //   }
      // );

      d3.select(".nodes")
        .selectAll("circle")
        .classed("selected", function (o) {
          return o.conversation === selectedConversation;
        });
      d3.select(".nodes")
        .selectAll("circle")
        .classed("not-selected", function (o) {
          return o.conversation !== selectedConversation;
        });

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
            return 1;
          } else {
            return 0;
          }
        })
        .attr("fill", "none");
    })
    .on("mouseout", function (event, d) {
      d3.select(event.currentTarget).classed("moused-over-node", false);
      d3.select(".nodes")
        .selectAll("circle")
        .classed("moused-over-conversation", false);
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
    .attr("height", 80)
    .append("g")
    .attr("transform", "translate(30,30)")
    .call(slider);

  const line = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);

  function ticked() {
    // link
    //   .attr("x1", (d) => d.source.x)
    //   .attr("y1", (d) => d.source.y)
    //   .attr("x2", (d) => d.target.x)
    //   .attr("y2", (d) => d.target.y);

    bundling.update();
    bundledPaths.data(linkData).attr("d", (d) => line(d.path));

    // link.attr("d", function (d) {
    //   var dx = d.target.x - d.source.x,
    //     dy = d.target.y - d.source.y,
    //     dr = Math.sqrt(dx * dx + dy * dy); // distance
    //   if (dr > 100) {
    //     // draw an arc if the nodes are sufficiently far apart
    //     return (
    //       "M" +
    //       d.source.x +
    //       "," +
    //       d.source.y +
    //       "A" +
    //       dr +
    //       "," +
    //       dr +
    //       " 0 0,1 " +
    //       d.target.x +
    //       "," +
    //       d.target.y
    //     );
    //   } else {
    //     // draw a straight line if the nodes are too close
    //     return (
    //       "M" +
    //       d.source.x +
    //       "," +
    //       d.source.y +
    //       "L" +
    //       d.target.x +
    //       "," +
    //       d.target.y
    //     );
    //   }
    // });

    node.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }
}
