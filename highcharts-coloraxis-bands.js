/**
* Highcharts plugin for contour curves
*
* Author: Paulo Costa
*/

(function (Highcharts) {

"use strict";

var ColorAxis = Highcharts.ColorAxis,
	wrap = Highcharts.wrap,
	color = Highcharts.color,
	each = Highcharts.each;

/**
* Default amount of bandinm. 0=no banding, 1=completely banded
*/
ColorAxis.prototype.defaultColorAxisOptions.banding = 0;

/**
 * Whenever tick positions change, also update the stops
 */
wrap(ColorAxis.prototype, 'setTickPositions', function (proceed) {
	proceed.apply(this, [].slice.call(arguments, 1));

	var oldStops = JSON.stringify(this.stops);

	this.initStops();

	// If the stops have changed, update series and the legend.
	if (JSON.stringify(this.stops) !== oldStops) {
		// Update series
		each(this.series, function (series) {
			series.isDirtyData = true; // Needed for Axis.update when choropleth colors change
		});
		// Update legend
		if (this.legendItem) {
			this.setLegendColor();
			this.chart.legend.colorizeItem(this, true);
		}
	}
});

/**
 * Pre-process the color stops to add banding
 */
wrap(ColorAxis.prototype, 'initStops', function (proceed) {
	var oldStops = (this.stops || []).slice();

	proceed.call(this);
	var banding = Math.max(0, Math.min(1, this.options.banding));

	if (this.stops.length >= 2 && banding != 0 && this.tickPositions && this.tickPositions.length > 1) {
		var ticks = this.tickPositions.map(this.normalizedValue.bind(this));
		this.stops = remapStops(this.stops, ticks, banding);
	}
});

function remapStops (stops, ticks, banding) {
	var ranges = [];
	for (var i=0; i<ticks.length; i++) {
		{ // Lower band
			var oldMin = i === 0 ? 0 : (ticks[i-1] + ticks[i]) / 2,
				oldMax = ticks[i],
				newMin = oldMin + banding * (oldMax - oldMin),
				newMax = oldMax;

			ranges.push({ oldMin: oldMin, oldMax: oldMax, newMin: newMin, newMax: newMax });
		}

		{ // Upper band
			var oldMin = ticks[i],
				oldMax = i === ticks.length - 1 ? 1 : (ticks[i] + ticks[i+1]) / 2,
				newMin = oldMin,
				newMax = oldMax + banding * (oldMin - oldMax);

			ranges.push({ oldMin: oldMin, oldMax: oldMax, newMin: newMin, newMax: newMax });
		}
	}

	var ret = [].concat.apply([], ranges.map( function(range) {
		if (range.oldMin === range.oldMax) {
			return [];
		}
		return remapStopRange(stops, range.oldMin, range.oldMax, range.newMin, range.newMax)
	}));

	return simplifyStops(ret);
};

function remapStopRange (stops, oldMin, oldMax, newMin, newMax) {
	stops = stops.slice();

	while (stops.length >= 2 && stops[1][0] <= oldMin) {
		stops.shift();
	}
	while (stops.length >= 2 && stops[stops.length - 2][0] >= oldMax) {
		stops.pop();
	}

	if (stops.length > 1) {
		if (stops[0][0] < oldMin) {
			stops[0] = [
				oldMin,
				stops[0].color.tweenTo(
					stops[1].color,
					(oldMin - stops[0][0]) / (stops[1][0] - stops[0][0])
				)
			];
			stops[0].color = color(stops[0][1]);
		}
		if (stops[stops.length-1][0] > oldMax) {
			stops[stops.length-1] = [
				oldMax,
				stops[stops.length-2].color.tweenTo(
					stops[stops.length-1].color,
					(oldMax - stops[stops.length-2][0]) / (stops[stops.length-1][0] - stops[stops.length-2][0])
				)
			];
			stops[stops.length-1].color = color(stops[stops.length-1][1]);
		}
	}

	return stops.map(function (stop) {
		var rel = (stop[0] - oldMin) / (oldMax - oldMin),
			newPos = rel * (newMax - newMin) + newMin;
		var ret = [ newPos, stop[1] ];
		ret.color = stop.color;
		return ret;
	});
}

/**
 * Remove redundant stops from the gradient
 */
function simplifyStops (stops) {
	var ret = [];
	for (var i=0; i<stops.length; i++) {
		var newStop = stops[i];

		if (ret.length >= 1) {
			// We can remove a stop if it has the same color and value as the previous
			var oldStop = ret[ret.length-1];
			if ( (oldStop[0] === newStop[0] && oldStop[1] === newStop[1]) ) {
 				// console.log('pop equal', newStop);
				ret.pop();
			}
		}

		if (ret.length >= 2) {
			var left = ret[ret.length-2],
				middle = ret[ret.length-1],
				right = newStop;

			// A stop can be discarded if it is between 2 other stops of the same color, of if it is between 2 other stops at the same position.
			if ( (middle[0] === left[0] && middle[0] === right[0]) ||
				 (middle[1] === left[1] && middle[1] === right[1]) ) {
 				// console.log('pop middle', left, middle, right);
				ret.pop();
			}
		}

		ret.push(newStop);
	}
	// console.log(stops.length, "->", ret.length);
	return ret;
}

}(Highcharts));
