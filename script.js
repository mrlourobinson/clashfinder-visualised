document.addEventListener('DOMContentLoaded', () => {
    fetch('data.csv')
        .then(response => response.text())
        .then(contents => {
            const rows = d3.csvParseRows(contents);

            // Skip the first 10 rows
            const relevantRows = rows.slice(11);

            const data = relevantRows.map(row => ({
                start: new Date(row[0]),
                end: new Date(row[1]),
                location: row[3],
                name: row[2]
            }));

            renderGanttChart(data);
        })
        .catch(error => console.error('Error fetching the CSV file:', error));
});

function renderGanttChart(data) {

    var element = d3.select('#chart').node();
    element.getBoundingClientRect().width;

    const margin = { top: 150, right: 30, bottom: 40, left: 60 };
    const width = element.getBoundingClientRect().width - margin.left - margin.right;
    const height = (element.getBoundingClientRect().width * 1.75) - margin.top - margin.bottom;

    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.location))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleTime()
        .domain([d3.min(data, d => d.start), d3.max(data, d => d.end)])
        .range([0, height]);

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y)
                .ticks(40));

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .ticks(40)  
            .tickSize(-width)
            .tickFormat(""));

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisTop(x)
            .ticks(40)  
            .tickSize(-height)
            .tickFormat(""));

    svg.append("g")
        .attr("class", "axis")
        //.attr("transform", `translate(0,${height})`)
        .call(d3.axisTop(x))
        .selectAll("text")  
            .style("text-anchor", "start")
            .attr("class","x-text")
            .attr("dx", "1em")
            .attr("dy", "-0.2em")
            .attr("transform", "rotate(-45)" );;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // create a tooltip
    var Tooltip = d3.select("#chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position","absolute");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
    Tooltip
        .style("opacity", 1)
    }
    var mousemove = function(event, d) {
    Tooltip
        .html(`<b>${d.name}</b><br>${d.location}`)
        .style("left", (event.pageX+20) + "px")
        .style("top", (event.pageY) + "px")
    }
    var mouseleave = function(d) {
    Tooltip
        .style("opacity", 0)
    }

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.start))
        .attr("x", d => x(d.location))
        .attr("height", d => y(d.end) - y(d.start))
        .attr("width", x.bandwidth())
        .attr("fill", d => color(d.location))
        .attr("fill-opacity", 0.3)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // svg.selectAll(".label")
    //     .data(data)
    //     .enter().append("text")
    //     .attr("class", "label")
    //     .attr("y", d => y(d.start) + 5)
    //     .attr("x", d => x(d.location) + x.bandwidth() / 2)
    //     .attr("dx", ".35em")
    //     .text(d => d.name)
    //     .attr("fill", "black");


    
}
