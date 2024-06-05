document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('file-upload');
    const useSampleDataButton = document.getElementById('useSampleDataButton');

    csvFileInput.addEventListener('change', handleFileUpload);
    useSampleDataButton.addEventListener('click', useSampleData);
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            processData(e.target.result);
        };
        reader.readAsText(file);
    }
}

function useSampleData() {
    fetch('data.csv')
        .then(response => response.text())
        .then(processData)
        .catch(error => console.error('Error fetching sample data:', error));
}

function processData(contents) {
    const rows = d3.csvParseRows(contents);
    const relevantRows = rows.slice(11);
    const data = relevantRows.map(row => ({
        start: new Date(row[0]),
        end: new Date(row[1]),
        location: row[3],
        name: row[2],
        clash: false // Initialize with false
    }));

    checkOverlaps(data);
    clearExistingCharts();
    renderGanttChart(data);
    renderPackedCircles(data);

    d3.select(".viz-button").style("visibility","visible")
}



function clearExistingCharts() {
    d3.select("#chart").selectAll("*").remove();
    d3.select("#packedCircles").selectAll("*").remove();
    //d3.select("#instructions").selectAll("*").remove();

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


    let artists = [...new Set(data.map((d) => d.name))].length;
    let stages = [...new Set(data.map((d) => d.location))].length;

    d3.select('#artist-count')
            .html("You are going to see "+ artists + " artists on " + stages + " stages.")
    

    console.log(artists)
    console.log(stages)
}

function renderGanttChart(data) {

    var element = d3.select('#chart').node();
    const windowWidth = element.getBoundingClientRect().width;

    const isMobile = (windowWidth < 500) ? (true) : (false);

    const margin = { top: 150, right: 30, bottom: 40, left: 60 };
    const width = windowWidth - margin.left - margin.right;
    const multiplier = (isMobile == true) ? (4) : (1.75);
    const height = (element.getBoundingClientRect().width * multiplier) - margin.top - margin.bottom;

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
            .attr("dy", (isMobile == true) ? ("1em") : ("-0.2em"))
            .attr("transform", (isMobile == true) ? ("rotate(-90)") : ("rotate(-45)") );

        // Add the day as text inside the axis
    const days = d3.timeDays(d3.min(data, d => d.start), d3.max(data, d => d.end));
    svg.selectAll(".day-label")
        .data(days)
        .enter()
        .append("text")
        .attr("class", "day-label")
        .attr("x", 15)
        .attr("y", d => y(d))
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .text(d => d3.timeFormat("%A %d %B")(d));

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
}


function renderPackedCircles(data) {
    const element = d3.select('#packedCircles').node();
    const diameter = element.getBoundingClientRect().width;

    // Aggregate data by location and count names
    const locationCounts = d3.rollup(data, v => v.length, d => d.location);
    const packedData = Array.from(locationCounts, ([location, count]) => ({ location, count }));

    const root = d3.hierarchy({ children: packedData })
        .sum(d => d.count);

    const pack = d3.pack()
        .size([diameter, diameter])
        .padding(1.5);

    const svg = d3.select("#packedCircles").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", `translate(${diameter / 2},${diameter / 2})`);

    const nodes = pack(root).leaves();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => d.r)
        .attr("cx", d => d.x - diameter / 2)
        .attr("cy", d => d.y - diameter / 2)
        .style("fill", d => color(d.data.location))
        .attr("stroke", "#000")
        .attr("stroke-width", "1px");

    const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("dy", ".3em")
        .attr("x", d => d.x - diameter / 2)
        .attr("y", d => d.y - diameter / 2)
        .style("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-size", "10px")
        .text(d => `${d.data.location}: ${d.data.count}`);
}

function expandContract() {
    const el = document.getElementById("expand-contract")
    el.classList.toggle('collapsed')
    el.classList.toggle('expanded')

 }