let nodeData, linkData, link, node, strength;


// var SerialPort = require("serialport");
//
// const parsers = SerialPort.parsers;
// const parser = new parsers.Readline({
//   delimeter: "\r\n"
// })
//
// var port = new SerialPort("/dev/cu.usbmodem14401",{
//   baudRate: 9600,
//   dataBits: 8,
//   parity: 'none',
//   stopBits: 1,
//   flowControl: false
// });
//
// port.pipe(parser);
//
// parser.on('data', function(data){
//   console.log(data);
// })

// const width = 1500;
// const height = 900;
const width = window.innerWidth;
const height = window.innerHeight- 100;

const line = d3
  .line()
  .x((d) => d.x)
  .y((d) => d.y);

let yScale = d3
  .scaleLinear()
  // .domain([1378,1635])
  .domain([5, 3028])
  .range([0, height]);
let xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);

var reScaleX = d3.scaleLinear().domain([0, 1200]).range([0, width]);
var reScaleY = d3.scaleLinear().domain([0, 900]).range([0, height]);
let valScale = d3.scaleLinear().domain([0, 1]).range([1, 0]);

var topics_color = [

  "#F07800",
  "#E10901",
  "#F78554",
  "#CD51ED",
  "#6B0CF7",
  "#905FE1",
  "#F70CAE",
  "#B10CED",
  "#CA00F0",
  "#0009E0",
  "#E16158",
];
var collections = [150, 114, 1, 3, 24, 27];
var color = d3.scaleOrdinal().domain([0, 12]).range(topics_color);
var hoverwave = d3.scaleLinear().domain([0, 200]).range([5, 1]);

const compatibility_threshold = 0.15;
const bundling_stiffness = 1;
const step_size = 1;
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
  .force("center", d3.forceCenter(width * 0.5, (height) * 0.5))

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


var changeColor = function(color){
  simulation
    .force(
    "link",
    d3
      .forceLink()
      .strength(10)
      .distance(10)
  )
  .force("charge", d3.forceManyBody().strength(-0.5))
  // .force("center", d3.forceCenter(width * 0.5, (height) * 0.5))
  .force(
    "y",
    d3
      .forceY()
      .y(0)
      .strength(0)
  )
  .force(
    "x",
    d3
      .forceX()
      .x(0)
      .strength(0)
  )
  .alpha(1).restart();
  // simulation.nodes(nodeData).on("tick", ticked);
}


var slider = d3
  .sliderHorizontal()
  .min(0)
  .max(1)
  .step(0.01)
  .width(300)
  .displayValue(false)
  .on("onchange", (val) => {
    simulation.force(
      "y",
      d3
        .forceY()
        .y(function (d) {
          return reScaleY(d.rooty) * val + yScale(d.conversation) * valScale(val);
        })
        .strength(1)
    );
    simulation.force(
      "x",
      d3
        .forceX()
        .x(function (d) {
          return reScaleX(d.rootx) * val + xScale(d.convo_prop_index) * valScale(val);
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

    simulation.force("center", d3.forceCenter(width * 0.5, (height) * 0.5).strength(0))
    simulation.alpha(1).restart();

  });

d3.select("#slider")
  .append("svg")
  .attr("width", 500)
  .attr("height", 80)
  .append("g")
  .attr("transform", "translate(30,30)")
  .call(slider);

let orginalData;
let selectedEdges;
d3.json("multi_set_five.json").then(function (data) {
  // TODO: this is a hack to get the data in the right format
  // update the nodes so that x and y are set
  data.nodes.forEach(function (d) {
    d.x = d.rootx;
    d.y = d.rooty;
  });

  orginalData = data;
  orginalData.links = orginalData.edges;

  // If you wanted to bundle ALL edges, you could do this:
  // bundling = edgeBundling(orginalData, {
  //   compatibility_threshold,
  //   bundling_stiffness,
  //   step_size,
  // });

  var selectedCollection = 114
  nodeData = orginalData.nodes.filter(function (d) {
    if (
      // selectedCollection === "all" ||
      d.collection == selectedCollection
    ) {
      return d;
    }
  });
  linkData = orginalData.links.filter(function (d) {
    if (
      // selectedCollection === "all" ||
      d.collection == selectedCollection
    ) {
      return d;
    }
  });

  document
    .getElementById("collectionSelect")
    .addEventListener("change", function () {
      // remove the slider (it'll get re-added later)
      // d3.select("#slider").select("svg").remove();

      // remove all edges and nodes
      d3.select(".links").transition()
      .duration(500).remove();
      d3.select(".nodes").transition()
      .duration(500).remove();


      let selectedCollection = this.value;

      // Filter nodeData and linkData based on the selected collection
      nodeData = orginalData.nodes.filter(function (d) {
        if (
          // selectedCollection === "all" ||
          d.collection == selectedCollection
        ) {
          return d;
        }
      });
      linkData = orginalData.edges.filter(function (d) {
        if (
          // selectedCollection === "all" ||
          d.collection == selectedCollection
        ) {
          return d;
        }
      });
      onDataLoad({ nodes: nodeData, edges: linkData });

      // TODO: this gets the pulsing, but it makes it unstable...
      //   repeat();
    });

  // onDataLoad(data);
  onDataLoad({ nodes: nodeData, edges: linkData });
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

var rect = svg
  .append("svg:rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "black")
  .on("click", function (event, d) {

    tooltip.transition().duration(500)
      .style("opacity", 0)
      // .style("left", "0px")
      // .style("top", "0px")
      .attr('width', 0)
      .attr('height', 0)
      .text(null)
    d3.select(".nodes").selectAll("circle").classed("selected", false);
    d3.select(".nodes").selectAll("circle").classed("not-selected", false);
    d3.select(".links")
      .transition()
      .duration(500)
      .selectAll("path")
      .attr("stroke", "none")
      .style("fill", "none")
      .attr("d", function(f) {
        if (f.d > 0){line(0, 0)}
      })

    // console.log(d.path)


  });

function onDataLoad(data) {
  nodeData = data.nodes;
  linkData = data.edges;

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
    .attr("stroke", (d) => d.group)
    // .attr("d", line(0, 0));

  var node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodeData)
    .enter()
    .append("circle")
    .attr("r", 1)
    .attr("fill", function (o) {
      return color(o.group);
    })

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
        .style("left", String(d.x +10)  + "px")
        .style("top", String(d.y + 5) + "px")
        .style("text-anchor", "top")
        // .attr('y', '500')
        // .attr('x', '600')
        // .style("text-anchor", "middle")
        .text(d.words)
        .style("background", "black")
        .style("background-opacity", "0.3")
        .style("width", tooltipWidth);
      d3.select(".nodes")
        .transition()
        .duration(500)
        .selectAll("circle")
        .attr("fill", function (o) {
          return color(o.group);
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

    .on("mouseout", function (event, d) {
      d3.select(event.currentTarget).classed("moused-over-node", false);
      d3.select(".nodes")
        .selectAll("circle")
        .classed("moused-over-conversation", false);
    });

  const drag = d3.drag().on("start", dragstart).on("drag", dragged);

  node.call(drag).on("click", click);

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



  d3.select("#button")
    .append("svg")
    .attr("width", 10)
    .attr("height", 10)
    .append("g")
    // .attr("transform", "translate(30,30)")

  function ticked() {
    if (bundling && selectedEdges) {
      bundling.update();
      bundledPaths.data(selectedEdges).attr("d", (d) => line(d.path));
    }
    node.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
  }

  function click(event, d) {
    console.log('clickeed')
    delete d.fx;
    delete d.fy;
    d3.select(this).classed("fixed", false);

      console.log(d.group, color(d.group))
      const selectedConversation = d.conversation;

      // filter the data to just the selected conversation
      const selectedNodes = nodeData.filter(function (d) {
        if (d.conversation === selectedConversation) {
          return true;
        }
      });
      selectedEdges = linkData.filter(function (d) {
        // check to see if the source or target is in the selected nodes
        const sourceInSelectedNodes = selectedNodes.find(function (node) {
          return node.conversation === d.source.conversation;
        });
        const targetInSelectedNodes = selectedNodes.find(function (node) {
          return node.conversation === d.target.conversation;
        });
        if (sourceInSelectedNodes || targetInSelectedNodes) {
          return true;
        }
      });

      // update the bundling to just the selected nodes and edges (it's otherwise quite slow)
      bundling = edgeBundling(
        {
          nodes: selectedNodes,
          links: selectedEdges,
        },
        {
          compatibility_threshold,
          bundling_stiffness,
          step_size,
        }
      );
      bundling.update();
      bundledPaths.data(selectedEdges).attr("d", (d) => line(d.path));

      d3.select(".nodes")
        .selectAll("circle")
        .classed("selected", function (o) {
          return o.conversation === selectedConversation;
        })
        // .attr("opacity", 0.5)
      d3.select(".nodes")
        .selectAll("circle")
        .classed("not-selected", function (o) {
          return o.conversation !== selectedConversation;
        });

      d3.select(".nodes")
        .selectAll("circle")
        .classed("opacity", function (o) { if (o.conversation !== selectedConversation){
            return 0.5
          } else {
            return 1
          }
        });

      d3.select(".links")
        .transition()
        .duration(500)
        .selectAll("path")
        .attr("stroke-opacity", 0.5)
        .attr("stroke", function (o) {
          if (o.source.conversation === d.conversation) {
            // return "rgb(" + colorScale(o.source.convo_prop_index) + ","+ colorScale(o.source.convo_prop_index) + "," + colorScale(o.source.convo_prop_index) + ")"
            return color(o.source.group);
            // return "white"
          } else {
            return "none";
          }
        })
        .attr("stroke-width", function (o) {
          if (o.source.conversation === d.conversation) {
            return 3;
          } else {
            return 0;
          }
        })
        .attr("fill", "none")

    // simulation.alpha(1).restart();
  }

  function dragstart() {
    d3.select(this).classed("fixed", true);
  }

  function dragged(event, d) {
    d.fx = clamp(event.x, 0, width);
    d.fy = clamp(event.y, 0, height);
    simulation.alpha(1).restart();
  }

}
