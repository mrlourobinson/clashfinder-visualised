document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('file-upload');

    csvFileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const contents = e.target.result;
                const rows = d3.csvParseRows(contents);

                // Skip the first 10 rows
                const relevantRows = rows.slice(11);

                const data = relevantRows.map(row => ({
                    start: new Date(row[0]),
                    end: new Date(row[1]),
                    location: row[3],
                    name: row[2],
                    clash: false // Initialize with false
                }));
                
                clearExistingCharts();
                checkOverlaps(data);
                renderGanttChart(data);
                renderPackedCircles(data);
            };
            reader.readAsText(file);
        }
    });

    d3.select('#file-upload')
        .attr("display", "none");

});

function clearExistingCharts() {
    d3.select("#chart").selectAll("*").remove();
    d3.select("#packedCircles").selectAll("*").remove();
    d3.select("#instructions").selectAll("*").remove();

}

function checkOverlaps(data) {
    const overlaps = [];

    for (let i = 0; i < data.length - 1; i++) {
        for (let j = i + 1; j < data.length; j++) {
            if (data[i].end > data[j].start && data[i].start < data[j].end) {
                overlaps.push({ entry1: data[i], entry2: data[j] });
                data[i].clash = true;
                data[j].clash = true;
            }
        }
    }

    if (overlaps.length > 0) {
        console.warn('Overlapping entries found:', overlaps);
        d3.select('#clash-count')
            .html("<span style='font-size: 30px'>&#x26a0;</span> You have "+ overlaps.length + " clashes 	<span style='font-size: 30px'>&#x26a0;</span>")
    } else {
        console.log('No overlaps found');
        d3.select('#clash-count')
            .text("You have no clashes! 1f973")
    }
}

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
        .range([0, height-margin.top]);

    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y)
                .ticks(40)
                .tickFormat(d3.timeFormat("%-I %p")));

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
            .tickSize(-height+margin.top)
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

    const formatTime = d3.utcFormat("%A %d %B, %H:%M");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
    Tooltip
        .style("opacity", 1)
    }


    const mousemove = function(event, d) {
        Tooltip
            .html(d.clash
                ? `<span style="color: black; font-size: 11pt;"><b>Clash detected!</b><br></span><br><b>${d.name}</b><br>${d.location}<br>${formatTime(d.start)}<br>`
                : `<b>${d.name}</b><br>${d.location}<br>${formatTime(d.start)}`)
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY) + "px");
    };
    
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
        .attr("class", function(d) {
            if(d.clash == true) {
                return "dashed";
            } else {
                return "solid";
            }
        })
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

