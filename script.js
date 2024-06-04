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
    const margin = { top: 20, right: 30, bottom: 40, left: 150 };
    const width = 1000 - margin.left - margin.right;
    const height = 2000 - margin.top - margin.bottom;

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
                .ticks(40)  );

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .ticks(40)  
            .tickSize(-width)
            .tickFormat("")
        );

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // create a tooltip
    var Tooltip = d3.select("#chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position","absolute");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
    Tooltip
        .style("opacity", 1)
    d3.select(this)
        .style("stroke", "black")
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
    d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
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
