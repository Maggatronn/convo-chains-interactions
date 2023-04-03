
var graph;

var nodeData, linkData, link, node;

const width = 800;
const height = 600;


nodeData = [
  {"id": 1, "x": 200, "y": 50},
  {"id": 2, "x": 0, "y": 80},
  {"id": 3, "x": 200, "y": 110},
  {"id": 4, "x": 200, "y": 140},
  {"id": 5, "x": 0, "y": 170}
]

linkData = [
  {"source": 1, "target": 2},
  {"source": 2, "target": 3},
  {"source": 3, "target": 4},
  {"source": 4, "target": 5}
]


var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) {return d.id;}))
  .force("charge", d3.forceManyBody())
  // .force("center", d3.forceCenter(width / 2, height / 2))
  .force('x', d3.forceX().x(function(d) {
    return d.x;
  }).strength(0))
  .force('y', d3.forceY().y(function(d) {
    return d.y;
  }).strength(0));

const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

var link = svg.append("g")
    .attr("class", "links")
  .selectAll("line")
  .data(linkData)
  .enter().append("line")
  .attr("stroke-width", 3)
  .attr("stroke", 'black')

var node = svg.append("g")
    .attr("class", "nodes")
  .selectAll("circle")
  .data(nodeData)
  .enter().append("circle")
    .attr("r", 5)
    .attr("fill", "black")
    // .attr("fill", function(d) { return color(d.group); })
    .call(drag(simulation));

simulation
    .nodes(nodeData)
    .on("tick", ticked);

simulation.force("link")
    .links(linkData);


function restart() {

  // Apply the general update pattern to the nodes.
  node = node.data(nodeData, function(d) { return d.id;});
  node.exit().remove();
  node = node.enter().append("circle").merge(node);

  // Apply the general update pattern to the links.
  link = link.data(linkData, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().remove();
  link = link.enter().append("line").merge(link);

  // Update and restart the simulation.
  // simulation.nodes(nodes);
  simulation.force("link").links(linkData);
  simulation.alpha(1).restart();
}
// Listen to the slider?
// console.log('hi')
// d3.select("mySlider").on("change", function(d){
//   selectedValue = this.value
//   console.log(this.value)
//   restart();
// })

var slider = d3
  .sliderHorizontal()
  .min(0)
  .max(10)
  .step(1)
  .width(300)
  .displayValue(false)
  .on('onchange', (val) => {
    d3.select('#value').text(val);
  });

d3.select('#slider')
  .append('svg')
  .attr('width', 500)
  .attr('height', 100)
  .append('g')
  .attr('transform', 'translate(30,30)')
  .call(slider);

function ticked() {
  link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
// });
