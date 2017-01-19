/* Display setup */
var heroViewHeight = 100,
	margin = {top: 20, right: 20, bottom: 20, left: 20},
	displayArea = getWindowSize(margin),
	body = d3.select("body"),
	left = body.select("div#left"),
	right = body.select("div#right"),
	svgHeroView = left.append("svg")
        .attr("width", displayArea.width / 2 - 10)
        .attr("height", heroViewHeight),
    svgCapacitiesView = left.append("svg")
        .attr("width", displayArea.width / 2 - 10)
        .attr("height", displayArea.height - heroViewHeight),
	svgMainView = right.append("svg")
        .attr("width", displayArea.width / 2)
        .attr("height", displayArea.height),
	heroView = {
		width: svgHeroView.attr("width") - margin.left - margin.right,
		height: svgHeroView.attr("height") - margin.top - margin.bottom,
		g: svgHeroView.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
		fontSize: 45
	},
    capacitiesView = {
		width: svgCapacitiesView.attr("width") - margin.left - margin.right,
		height: svgCapacitiesView.attr("height") - margin.top - margin.bottom,
		g: svgCapacitiesView.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	},
	mainview = {
		width: svgMainView.attr("width") - margin.left - margin.right,
		height: svgMainView.attr("height") - margin.top - margin.bottom,
		g: svgMainView.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	},
	heroesList = {},
	abilitiesList = {}
	itemsList = {};

var winRateScale = d3.scaleQuantile()
	.range(['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837'])
	.domain([0, 1]);

var tooltip = d3.select('body').append('div')
	.attr('class', 'hidden tooltip');

/* Format and conversion  functions */
var percentFormat = d3.format(",.0%");

function getWindowSize(margin){
	var w = window,
	    d = document,
	    e = d.documentElement,
	    g = d.getElementsByTagName('body')[0],
	    x = w.innerWidth || e.clientWidth || g.clientWidth,
	    y = w.innerHeight|| e.clientHeight|| g.clientHeight;


	return {width: x - margin.left - margin.right, height: y - margin.top - margin.bottom}
}

/* Setup functions */
function init(){
    d3.queue()
    	.defer(d3.csv, "data/hero_names.csv")
    	.defer(d3.csv, "data/ability_ids.csv")
    	.defer(d3.csv, "data/item_ids.csv")
    	.await(processData);

	initialDisplay()
}

function loadHeroData(heroId) {
	updateHero(heroId);

	d3.queue()
		.defer(d3.csv, "data/heroes/" + heroId + "_items.csv")
		.defer(d3.csv, "data/heroes/" + heroId + "_spells.csv")
		.await(heroDataReceived);
}

function heroDataReceived(error, items, spells) {
	if (error){
		display([], []);
	} else {
		var sortedItems = items.sort(function(a, b){ return b.total - a.total });
		var selectedItems = sortedItems.slice(0, Math.min(sortedItems.length, 10));
		selectedItems = selectedItems.sort(function(a, b){ return b.winfreq - a.winfreq });
		selectedItems = selectedItems.slice(0, Math.min(selectedItems.length, 5));
		// console.log(selectedItems);
		display(selectedItems, spells);
	}
}

function processData(error, heroes, abilities, items){
    if (error) throw error;

	heroes.forEach(function(d){
		heroesList[d.hero_id] = {
			name: d.localized_name,
			imageUrl: "http://cdn.dota2.com/apps/dota2/images/heroes/" + d.name.substring(14) + "_hphover.png"
		}
	});

	abilities.forEach(function(d){
		abilitiesList[d.ability_id] = {
			name: d.ability_name,
			imageUrl: "http://cdn.dota2.com/apps/dota2/images/abilities/" + d.ability_name + "_hp1.png"
		};
	});

	items.forEach(function(d){
		itemsList[d.item_id] = {
			name: d.item_name,
			imageUrl: "https://cdn.steamstatic.com/apps/dota2/images/items/" + d.item_name + "_lg.png"
		};
	});

	var selectHero = body
	    .append('select')
	        .attr('id','selectHero')
	        .attr('class','select')
	        .style("top", margin.top)
	        .style("left", margin.left + 200)
	        .on('change', function() {
				var selectNode = d3.select('#selectHero').node();
				var heroId = selectNode.options[selectNode.selectedIndex].id
				loadHeroData(heroId);
	        });

	selectHero
	    .selectAll('option')
	    .data(function(){
			var data = [];
			for( k in heroesList){
				data.push({id: k, name: heroesList[k].name})
			}
			return data;
		}).enter()
	    .append('option')
	        .attr("id", function (d) { return d.id; })
	        .text(function (d) { return d.name; });

	updateHero(1);
	loadHeroData(1);
}

function initialDisplay() {
	heroView.g.append("text")
		.classed("title", true)
		.attr("x", 0)
		.attr("y", 45)
		.text("Select a hero")

	capacitiesView.g.append("text")
		.classed("title", true)
		.attr("x", 0)
		.attr("y", 60)
		.text("Capacity builds")

	mainview.g.append("text")
		.classed("title", true)
		.attr("x", 0)
		.attr("y", 40)
		.text("Rare but efficient builds")
}

function display(items, spells) {
	/* Capacities */
	var spellsGs = capacitiesView.g.selectAll("g").data(spells);
	var t = spellsGs.exit().transition().duration(500)
	t.attr("transform", "translate(0, 1000)")
	t.remove();

	var gSpells = spellsGs.enter().append("g")
		.attr("transform", function(d, i){ return "translate(-500, " + (i * 70 + 80) + ")" })
	var imgs = gSpells.selectAll("image").data(function(d){ return d.items.split(";").filter(function(d2){ if (d2 != "?") return parseInt(d2)}); })
		.enter().append("svg:image")
			.attr('x', function(d, i){ return i * 66})
			.attr('y', 0)
			.attr('width', 64)
			.attr('height', 64)
			.attr("xlink:href", function(d){ return abilitiesList[d].imageUrl });

	imgs.on("mousemove", function(d){
		var ability = abilitiesList[d];
		displayTooltip([ability.name])
	});
	imgs.on("mouseout", function(d){ tooltip.classed('hidden', true); });

	gSpells.append("text")
		.classed("percent", true)
		.attr('x', function(d, i){ return 3 * 66 + 15})
		.attr('y', function(d, i){ return 40 + i * 2 })
		.text(function(d){ return percentFormat(parseFloat(d.freq)) })


	gSpells.transition().duration(500).attr("transform", function(d, i){ return "translate(0, " + (i * 70 + 80) + ")" })


	/* Capacities */
	var itemsGs = mainview.g.selectAll("g").data(items);
	var t = itemsGs.exit().transition().duration(500)
	t.attr("transform", "translate(0, 1000)")
	t.remove();

	var gItems = itemsGs.enter().append("g")
		.attr("transform", function(d, i){ return "translate(1000, " + (i * 70 + 80) + ")" })
	var imgs = gItems.selectAll("image").data(function(d){ console.log(d.items); return d.items.split(";").filter(function(d2){ if (d2 != "?") return parseInt(d2)}); })
		.enter().append("svg:image")
			.attr('x', function(d, i){ return i * 66})
			.attr('y', 0)
			.attr('width', 64)
			.attr('height', 64)
			.attr("xlink:href", function(d){ return itemsList[d].imageUrl });

	imgs.on("mousemove", function(d){
		displayTooltip([itemsList[d].name])
	});
	imgs.on("mouseout", function(d){ tooltip.classed('hidden', true); });

	gItems.append("text")
		.classed("percent", true)
		.attr('x', function(d, i){ return 3 * 66 + 15})
		.attr('y', function(d, i){ return 40 + i * 2 })
		.style('fill', function(d){ return winRateScale(d.winfreq) })
		.text(function(d){ return percentFormat(parseFloat(d.winfreq)) })


	gItems.transition().duration(500).attr("transform", function(d, i){ return "translate(0, " + (i * 70 + 80) + ")" })
}

function updateHero(selectedHeroId){
	var heroImg = heroView.g.selectAll("image").data([selectedHeroId])

	heroImg.enter()
		.append("svg:image")
			.attr('x', 200 -3)
			.attr('y', 15)
			.attr("xlink:href", function(d){ return heroesList[d].imageUrl })

	heroImg.exit()
			.style("opacity", 0)
		.remove();

	heroImg
		.attr("xlink:href", function(d){ return heroesList[d].imageUrl })
}

function displayTooltip(list){
	var mouse = d3.mouse(svgMainView.node()).map(function(d2) {
		return parseInt(d2);
	});

	var htmlTxt = list.map(function(d) {
		return "<tr><td>" + d + "</tr></td>";
	});

	tooltip.classed('hidden', false)
        .attr('style', 'left:' + (mouse[0] + 60 + mainview.width) + 'px; top:' + (mouse[1] + 30) + 'px')
        .html("<table>" + htmlTxt + "</table>");
}

function getTextWidth(text, fontSize, fontFace) {
        var a = document.createElement('canvas');
        var b = a.getContext('2d');
        b.font = fontSize + 'px ' + fontFace;
        var mesure = b.measureText(text);
        return mesure.width;
}

init();
