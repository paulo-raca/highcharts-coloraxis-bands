This Highcharts plugin changes the gradient used on the ColorAxis and adds a continous color band between ticks.

## Motivation

A ColorAxis can be used to transmit accurate information.

Unfortunately, human eyes can get pretty confused by continuous gradients (e.g., [Checker shadow illusion](https://en.wikipedia.org/wiki/Checker_shadow_illusion)).

In these cases, it's better to only use a few discrete colors that can be easily distinguished, which means [colour banding](https://en.wikipedia.org/wiki/Colour_banding).

## Configuration

The amount of banding can be configured via `banding` property, where:
- `0` or `false` means no-banding, and is the same as not using this plugin
- `1` or `true` will result in completely discrete color bands
- Any number between 0 and 1 will result in continuous bands with smooth transitions in between

I've found that 40-60% works nicely on contour curve charts, but YMMV.

## Examples

- [3D Contour curve](https://jsfiddle.net/xt8zmabc/)
- [TreeMap](https://jsfiddle.net/c9t8eezj/)
- [Heatmap](https://jsfiddle.net/t3zwt91b/)
