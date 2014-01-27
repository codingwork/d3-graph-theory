/*
 * This is the code for building a graph representation using D3.
 * The initial code if for transforming an XML representation I use 
 * into D3's representation. The stuff following that is for normal D3 layouts
 * 
    Brian J. Stinar
    Noventum Custom Software Development 
    505-750-1169  - Call me if you want to talk or have questions. 
    I like that more than email. 
 */

function buildJsonEdges(jsonRepresentation)
{
    var edges = []; 

    for (edgeNumber in jsonRepresentation.edgeData)
    {
        edges[edgeNumber] = {};
        edges[edgeNumber]['source'] = jsonRepresentation.edgeData[edgeNumber].fromNode;
        edges[edgeNumber]['target'] = jsonRepresentation.edgeData[edgeNumber].toNode;
    }        
    return edges;
}
        
        
function buildJsonNodes(jsonRepresentation)
{
    var nodes = [];

    for (nodeNumber in jsonRepresentation.nodeData)
    {
        nodes[nodeNumber] = {};
        nodes[nodeNumber].name = jsonRepresentation.nodeData[nodeNumber].nodeId;
        // There will need to be a reckoning between D3 names and our names. 
        // These 'names' are more like our IDs.
        nodes[nodeNumber].description = jsonRepresentation.nodeData[nodeNumber].description;
        nodes[nodeNumber].type = jsonRepresentation.nodeData[nodeNumber].type;

        //console.info(jsonRepresentation.nodeData[nodeNumber]);
    }
    return nodes;
}

function generateFourSubgraphs()
{
    var data = generateSixRingGraph();
    
    data["nodes"].push({"name" : "7"}, {"name" : "8"}, {"name" : "9"}, {"name" : "10"});
    data["edges"].push({"source" : "7", "target" : "8"}, {"source" : "7", "target" : "9"}, {"source" : "7", "target" : "10"});

    data["nodes"].push({"name" : "11"}, {"name" : "12"}, {"name" : "13"}, {"name" : "14"});
    data["edges"].push({"source" : "11", "target" : "12"}, {"source" : "11", "target" : "13"}, {"source" : "11", "target" : "14"});
    data["edges"].push({"source" : "12", "target" : "11"}, {"source" : "12", "target" : "13"}, {"source" : "12", "target" : "14"});
    data["edges"].push({"source" : "13", "target" : "14"});

    
    return data;
};
        
function generateDoubleBox()
{
    var data = generateSixRingGraph();
    data["edges"].push({"source" : "6", "target" : "3", "type" : "unvisited"});
    return data;
}
        
        
function generateSixRingGraph()
{
    var data = {};
    data["nodes"] = [{"name":"0"}, {"name":"1"}, {"name":"2"}, {"name":"3"}, {"name":"4"}, {"name":"5"}, {"name":"6"}];
    data["edges"] =  
    [
        {"source" : "1", "target" : "2"}, {"source" : "2", "target" : "3"}, {"source" : "3", "target" : "4"},
        {"source" : "4", "target" : "5"}, {"source" : "5", "target" : "6"}, {"source" : "6", "target" : "1"}
    ];

    for (node in data["nodes"])
    {
        data["nodes"][node]["type"] = "unvisited";
    }

    return data;
}


function runSubgraphDetection(data)
{
    var graphTheory = d3.graphTheory(data["nodes"], data["edges"]);
    var disjointSets = graphTheory.detectDisjointSubgraphs(); 
    
    for (var setIndex in disjointSets)
    {
        console.log("setIndex = " + setIndex);
        for (var nodeIndex in disjointSets[setIndex])
        {
            console.log("nodeIndex = " + nodeIndex);
            disjointSets[setIndex][nodeIndex]["type"] = setIndex;
        }
    }
    
    buildGraph(data);
}

function runDijkstras(data)
{
    var graphTheory = d3.graphTheory(data["nodes"], data["edges"]);
    var source = data["nodes"][2];
    source["type"] = "source";
    graphTheory.dijkstras(source);
    console.log("source['name'] = ");
    console.log(source['name']);

    buildGraph(data);
}


function buildGraph(data)
{
    var w = 1280;
    var h = 1024;

    var svg = d3.select("body")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    var colors = d3.scale.category10();
    // console.log(data);

    var edgesByPosition = [];
            
    data.edges.forEach(function(e) 
    {  
        // Get the source and target nodes
        var sourceNode = data.nodes.filter(function(n) { return n.name === e.source; })[0],
        targetNode = data.nodes.filter(function(n) { return n.name   === e.target; })[0];
        
        edgesByPosition.push({"source": sourceNode, "target": targetNode, "weight": 1}); // Add the edge to the array
        edgesByPosition.push({"source": targetNode, "target": sourceNode , "weight": 1}); // Delete this if we only have single directionaly edges.
    });
    
    var force = d3.layout.force()
        .nodes(data.nodes)
        .links(edgesByPosition)
        .size([w, h])
        .linkDistance([100])
        .charge([-1500])  
        .start();

    svg.append("svg:defs").selectAll("marker")  // Remove this if not interested in directional markings
        .data(["arrow"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,0");

    var edges = svg.selectAll("line")
        .data(edgesByPosition)
        .enter()
        .append("svg:line")
        .attr("class", "link arrow")
        .attr("marker-end", "url(#arrow)");
        
    edges.append("text").text("hi");

    // TODO: abstract this out. I don't need 400-line functions
    var nodes = svg.selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", 10)
        .style("fill", function(d, i) 
        {
            switch (d.type)
            {
                case "source":
                    return d3.rgb(0, 255, 0);
                case "visited" :
                    return d3.rgb(255, 255, 255);
                case "1": // Believe, or cluster 1
                    return d3.rgb(255, 10, 200);
                case "2": // Action, or cluster 2
                    return d3.rgb(200, 10, 10);   
                default:
                    return colors(d.type);
            }

        })
        .call(force.drag);
        
    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 10)
        .attr("y", ".31em")
        .text(function(d) { return d.name + "  distance : " + d.distance; });

    function transformText(d) 
    {
        return "translate(" + d.x + 1000 + "," + d.y + ")";
    }
            
    force.on("tick", function() 
    {
        edges.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        nodes.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        text.attr("transform", transformText);  
    });
}