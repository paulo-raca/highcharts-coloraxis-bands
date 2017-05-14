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
	var ret = [];

	var min = 0;
	for (var i=0; i<=ticks.length; i++) {
		var min = i === 0 ? 0 : ticks[i-1],
			max = i === ticks.length ? 1 : ticks[i],
			bandMin = i == 0 ? min : banding / 2 * (max - min) + min,
			bandMax = i == ticks.length ? max : banding / 2 * (min - max) + max,
			subStops = stops.slice();

		if (min == max) continue;

		while (subStops.length >= 2 && subStops[1][0] <= min) {
			subStops.shift();
		}
		while (subStops.length >= 2 && subStops[subStops.length - 2][0] >= max) {
			subStops.pop();
		}

		if (subStops.length > 1) {
			if (subStops[0][0] < min) {
				subStops[0] = [
					min,
					ColorAxis.prototype.tweenColors(
						subStops[0].color,
						subStops[1].color,
						(min - subStops[0][0]) / (subStops[1][0] - subStops[0][0])
					)
				];
				subStops[0].color = color(subStops[0][1]);
			}
			if (subStops[subStops.length-1][0] > max) {
				subStops[subStops.length-1] = [
					max,
					ColorAxis.prototype.tweenColors(
						subStops[subStops.length-2].color,
						subStops[subStops.length-1].color,
						(max - subStops[subStops.length-2][0]) / (subStops[subStops.length-1][0] - subStops[subStops.length-2][0])
					)
				];
				subStops[subStops.length-1].color = color(subStops[subStops.length-1][1]);
			}
		}
		ret = ret.concat(remapStopRange(subStops, min, max, bandMin, bandMax));
	}
	return ret;
};

function remapStopRange (stops, min, max, newMin, newMax) {
	return stops.map(function (stop) {
		var rel = (stop[0] - min) / (max - min),
			newPos = rel * (newMax - newMin) + newMin;
		var ret = [ newPos, stop[1] ];
		ret.color = stop.color;
		return ret;
	});
}

}(Highcharts));
