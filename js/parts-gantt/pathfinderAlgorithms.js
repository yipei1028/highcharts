/**
 * (c) 2016 Highsoft AS
 * Author: Øystein Moseng
 *
 * License: www.highcharts.com/license
 */
'use strict';
import H from '../parts/Globals.js';
import '../parts/Utilities.js';

var min = Math.min,
	max = Math.max,
	abs = Math.abs,
	pick = H.pick;

/**
 * Get index of last obstacle before xMin. Employs a type of binary search, and
 * thus requires that obstacles are sorted by xMin value.
 *
 * @param {Array} obstacles Array of obstacles to search in.
 * @param {Number} xMin The xMin threshold.
 * @param {Number} startIx Starting index to search from. Must be within array
 *  range.
 *
 * @return {Number} result The index of the last obstacle element before xMin.
 */
function findLastObstacleBefore(obstacles, xMin, startIx) {
	var left = startIx || 0, // left limit
		right = obstacles.length - 1, // right limit
		min = xMin - 0.0000001, // Make sure we include all obstacles at xMin
		cursor,
		cmp;
	while (left <= right) {
		cursor = (right + left) >> 1;
		cmp = min - obstacles[cursor].xMin;
		if (cmp > 0) {
			left = cursor + 1;
		} else if (cmp < 0) {
			right = cursor - 1;
		} else {
			return cursor;
		}
	}
	return left > 0 ? left - 1 : 0;
}

/**
 * Test if a point lays within an obstacle. 
 *
 * @param {Object} obstacle Obstacle to test.
 * @param {Object} point Point with x/y props.
 *
 * @return {Boolean} result Whether point is within the obstacle or not.
 */
function pointWithinObstacle(obstacle, point) {
	return (
		point.x <= obstacle.xMax &&
		point.x >= obstacle.xMin &&
		point.y <= obstacle.yMax &&
		point.y >= obstacle.yMin
	);
}

/**
 * Find the index of an obstacle that wraps around a point. 
 * Returns -1 if not found.
 *
 * @param {Array} obstacles Obstacles to test.
 * @param {Object} point Point with x/y props.
 *
 * @return {Number} result Ix of the obstacle in the array, or -1 if not found.
 */
function findObstacleFromPoint(obstacles, point) {
	var i = findLastObstacleBefore(obstacles, point.x + 1) + 1;
	while (i--) {
		if (obstacles[i].xMax >= point.x && // optimization using lazy evaluation
			pointWithinObstacle(obstacles[i], point)) {
			return i;
		}
	}
	return -1;
}

/**
 * Get SVG path array from array of line segments.
 *
 * @param {Array} segments The segments to build the path from.
 *
 * @return {Array} result SVG path array as accepted by the SVG Renderer.
 */
function pathFromSegments(segments) {
	var path = [];
	if (segments.length) {
		path.push('M', segments[0].start.x, segments[0].start.y);
		for (var i = 0; i < segments.length; ++i) {
			path.push('L', segments[i].end.x, segments[i].end.y);
		}
	}
	return path;
}

/**
 * Decide in which direction to dodge or get out of an obstacle. Considers 
 * desired direction, which way is shortest, soft and hard bounds.
 *
 * Returns a string, either xMin, xMax, yMin or yMax.
 *
 * @param {Object} obstacle Obstacle to dodge/escape.
 * @param {Object} fromPoint Point with x/y props that's dodging/escaping.
 * @param {Object} toPoint Goal point.
 * @param {Boolean} dirIsX Dodge in X dimension.
 * @param {Object} bounds Hard and soft boundaries.
 *
 * @return {Boolean} result Use max or not.
 */
function getDodgeDirection(obstacle, fromPoint, toPoint, dirIsX, bounds) {
	var softBounds = bounds.soft,
		hardBounds = bounds.hard,
		dir = dirIsX ? 'x' : 'y',
		maxOutOfSoftBounds = obstacle[dir + 'Max'] >
							softBounds[dir + 'Max'],
		minOutOfSoftBounds = obstacle[dir + 'Min'] <
							softBounds[dir + 'Min'],
		maxOutOfHardBounds = obstacle[dir + 'Max'] >
							hardBounds[dir + 'Max'],
		minOutOfHardBounds = obstacle[dir + 'Min'] <
							hardBounds[dir + 'Min'],
		// Find out if we should prefer one direction over the other if we can
		// choose freely
		minDistance = abs(obstacle[dir + 'Min'] - fromPoint[dir]),
		maxDistance = abs(obstacle[dir + 'Max'] - fromPoint[dir]),
		// If it's a small difference, pick the one leading towards dest point.
		// Otherwise pick the shortest distance
		useMax = abs(minDistance - maxDistance) < 10 ?
				fromPoint[dir] < toPoint[dir] :
				maxDistance < minDistance;

	// useMax now contains our preferred choice, bounds not taken into account.
	// If both or neither direction is out of bounds we want to use this.

	// Deal with soft bounds
	useMax = minOutOfSoftBounds ?
		(maxOutOfSoftBounds ? useMax : true) : // Out on min
		(maxOutOfSoftBounds ? false : useMax); // Not out on min

	// Deal with hard bounds
	useMax = minOutOfHardBounds ?
		(maxOutOfHardBounds ? useMax : true) : // Out on min
		(maxOutOfHardBounds ? false : useMax); // Not out on min

	return useMax;
}

/**
 * Limits obstacle max/mins in all directions to bounds. Modifies input obstacle. 
 *
 * @param {Object} obstacle Obstacle to limit.
 * @param {Object} bounds Bounds to use as limit.
 */
function limitObstacleToBounds(obstacle, bounds) {
	obstacle.yMin = max(obstacle.yMin, bounds.yMin);
	obstacle.yMax = min(obstacle.yMax, bounds.yMax);	
	obstacle.xMin = max(obstacle.xMin, bounds.xMin);
	obstacle.xMax = min(obstacle.xMax, bounds.xMax);
}



// Define the available pathfinding algorithms.
// Algorithms take up to 3 arguments: starting point, ending point, and an 
// options object.
var algorithms = {

	/**
	 * Get an SVG path from a starting coordinate to an ending coordinate.
	 * Draws a straight line.		 
	 *
	 * @param {Object} start Starting coordinate, object with x/y props.
	 * @param {Object} end Ending coordinate, object with x/y props.
	 *
	 * @return {Object} result An object with the SVG path in Array form as
	 * 	accepted by the SVG renderer, as well as an array of new obstacles 
	 *  making up this path.
	 */
	straight: function (start, end) {
		return {
			path: ['M', start.x, start.y, 'L', end.x, end.y],
			obstacles: [{ start, end }]
		};
	},

	/**
	 * Find a path from a starting coordinate to an ending coordinate, taking 
	 * obstacles into consideration. Might not always find the optimal path, 
	 * but is fast, and usually good enough.
	 *
	 *  Options
	 *      - chartObstacles:   Array of chart obstacles to avoid
	 *      - lineObstacles:    Array of line obstacles to jump over
	 *		- obstacleMetrics:  Object with metrics of chartObstacles cached
	 *		- hardBounds:		Hard boundaries to not cross
	 *		- obstacleOptions:	Options for the obstacles, including margin
	 *
	 * @param {Object} start Starting coordinate, object with x/y props.
	 * @param {Object} end Ending coordinate, object with x/y props.
	 * @param {Object} options Options for the algorithm.
	 *
	 * @return {Object} result An object with the SVG path in Array form as
	 * 	accepted by the SVG renderer, as well as an array of new obstacles 
	 *  making up this path.
	 */
	fastAvoid: H.extend(function (start, end, options) {
		/*
			Algorithm rules/description
			- Find initial direction
			- Determine soft/hard max for each direction.
			- Move along initial direction until obstacle.
			- Change direction.
			- If hitting obstacle, first try to change length of previous line
			  before changing direction again.

			Soft min/max x = start/destination x +/- widest obstacle + margin
			Soft min/max y = start/destination y +/- tallest obstacle + margin

			TODO:
				- Make avoid the start/end obstacles in an intelligent way
				- Make retrospective, try changing prev segment to reduce 
				  corners
		*/
		var segments,
			// Boundaries to stay within. If beyond soft boundary, prefer to
			// change direction ASAP. If at hard max, always change immediately.
			metrics = options.obstacleMetrics,
			softMinX = min(start.x, end.x) - metrics.maxWidth - 30,
			softMaxX = max(start.x, end.x) + metrics.maxWidth + 30,
			softMinY = min(start.y, end.y) - metrics.maxHeight - 30,
			softMaxY = max(start.y, end.y) + metrics.maxHeight + 30,

			// Obstacles
			chartObstacles = options.chartObstacles,
			startObstacleIx = findLastObstacleBefore(chartObstacles, softMinX),
			endObstacleIx = findLastObstacleBefore(chartObstacles, softMaxX);

		// How far can you go between two points before hitting an obstacle?
		// Does not work for diagonal lines (because it doesn't have to).
		function pivotPoint(fromPoint, toPoint, directionIsX) {
			var firstPoint,
				lastPoint,
				highestPoint,
				lowestPoint,
				i,
				searchDirection = fromPoint.x < toPoint.x ? 1 : -1;

			if (fromPoint.x < toPoint.x) {
				firstPoint = fromPoint;
				lastPoint = toPoint;
			} else {
				firstPoint = toPoint;
				lastPoint = fromPoint;
			}

			if (fromPoint.y < toPoint.y) {
				lowestPoint = fromPoint;
				highestPoint = toPoint;
			} else {
				lowestPoint = toPoint;
				highestPoint = fromPoint;
			}

			// Go through obstacle range in reverse if toPoint is before 
			// fromPoint in the X-dimension.
			if (searchDirection > 0) {
				i = findLastObstacleBefore(chartObstacles, firstPoint.x);
			} else {
				i = min(findLastObstacleBefore(chartObstacles, lastPoint.x), 
						chartObstacles.length - 1);
			}

			// Go through obstacles in this X range
			while (chartObstacles[i] && (
				searchDirection > 0 && chartObstacles[i].xMin <= lastPoint.x ||
				searchDirection < 0 && chartObstacles[i].xMax >= firstPoint.x
			)) {
				// If this obstacle is between from and to points in a straight
				// line, pivot at the intersection.
				if (
					chartObstacles[i].xMin <= lastPoint.x &&
					chartObstacles[i].xMax >= firstPoint.x &&
					chartObstacles[i].yMin <= highestPoint.y &&
					chartObstacles[i].yMax >= lowestPoint.y
				) {
					if (directionIsX) {
						return {
							y: fromPoint.y,
							x: fromPoint.x < toPoint.x ? 
								chartObstacles[i].xMin - 1 :
								chartObstacles[i].xMax + 1,
							obstacle: chartObstacles[i]
						};
					}
					// else ...
					return {
						x: fromPoint.x,
						y: fromPoint.y < toPoint.y ?
							chartObstacles[i].yMin - 1 :
							chartObstacles[i].yMax + 1,
						obstacle: chartObstacles[i]
					};
				}

				i += searchDirection;
			}
			
			return toPoint;
		}

		// Find a clear path between points, optionally with a start direction 
		// parameter.
		function clearPathTo(fromPoint, toPoint, directionIsX) {
			// Don't waste time if we've hit goal
			if (fromPoint.x === toPoint.x && fromPoint.y === toPoint.y) {
				return [];
			}

			var dirIsX = pick(directionIsX, Math.abs(toPoint.x - fromPoint.x) >
							Math.abs(toPoint.y - fromPoint.y)),
				pivot,
				segments,
				waypoint,
				waypointUseMax,
				envelopingObstacle,
				secondEnvelopingObstacle,
				envelopWaypoint,
				obstacleMargin = options.obstacleOptions.margin,
				bounds = {
					soft: {
						xMin: softMinX,
						xMax: softMaxX,
						yMin: softMinY,
						yMax: softMaxY
					},
					hard: options.hardBounds
				};

			// If fromPoint is inside an obstacle we have a problem. Break out
			// by just going to the outside of this obstacle. We prefer to go to
			// the nearest edge in the chosen direction.
			envelopingObstacle = findObstacleFromPoint(chartObstacles, fromPoint);
			if (envelopingObstacle > -1) {
				envelopingObstacle = chartObstacles[envelopingObstacle];
				waypointUseMax = getDodgeDirection(
					envelopingObstacle, fromPoint, toPoint, dirIsX, bounds
				);

				// Cut obstacle to hard bounds to make sure we stay within
				limitObstacleToBounds(envelopingObstacle, options.hardBounds);

				envelopWaypoint = dirIsX ? {
					y: fromPoint.y,
					x: envelopingObstacle[waypointUseMax ? 'xMax' : 'xMin'] +
						(waypointUseMax ? 1 : -1)
				} : {
					x: fromPoint.x,
					y: envelopingObstacle[waypointUseMax ? 'yMax' : 'yMin'] +
						(waypointUseMax ? 1 : -1)
				};

				// If we crashed into another obstacle doing this, we put the
				// waypoint between them instead
				secondEnvelopingObstacle = findObstacleFromPoint(
					chartObstacles, envelopWaypoint);
				if (secondEnvelopingObstacle > -1) {
					secondEnvelopingObstacle = chartObstacles[
						secondEnvelopingObstacle
					];

					// Cut obstacle to hard bounds
					limitObstacleToBounds(secondEnvelopingObstacle, options.hardBounds);

					envelopWaypoint = dirIsX ? {
						y: fromPoint.y,
						x: waypointUseMax ?	max(
							envelopingObstacle.xMax - obstacleMargin + 1,
							(secondEnvelopingObstacle.xMin + envelopingObstacle.xMax) / 2
						) :
						min(
							envelopingObstacle.xMin + obstacleMargin - 1,
							(secondEnvelopingObstacle.xMax + envelopingObstacle.xMin) / 2
						)
					} : {
						x: fromPoint.x,
						y: waypointUseMax ?	max(
							envelopingObstacle.yMax - obstacleMargin + 1,
							(secondEnvelopingObstacle.yMin + envelopingObstacle.yMax) / 2
						) :
						min(
							envelopingObstacle.yMin + obstacleMargin - 1,
							(secondEnvelopingObstacle.yMax + envelopingObstacle.yMin) / 2
						)
					};
				}

				segments = [{
					start: fromPoint,
					end: envelopWaypoint
				}];

			} else { // If not enveloping, use standard pivot calculation

				pivot = pivotPoint(fromPoint, {
					x: dirIsX ? toPoint.x : fromPoint.x,
					y: dirIsX ? fromPoint.y : toPoint.y
				}, dirIsX);

				segments = [{
					start: fromPoint,
					end: {
						x: pivot.x,
						y: pivot.y
					}
				}];

				// Pivot before goal, use a waypoint to dodge obstacle
				if (pivot[dirIsX ? 'x' : 'y'] !== toPoint[dirIsX ? 'x' : 'y']) {
					// Find direction of waypoint
					waypointUseMax = getDodgeDirection(
						pivot.obstacle, pivot, toPoint, !dirIsX, bounds
					);

					// Cut waypoint to hard bounds
					limitObstacleToBounds(pivot.obstacle, options.hardBounds);

					waypoint = {
						x: dirIsX ?
							pivot.x :
							pivot.obstacle[waypointUseMax ? 'xMax' : 'xMin'] + 
								(waypointUseMax ? 1 : -1),
						y: dirIsX ?
							pivot.obstacle[waypointUseMax ? 'yMax' : 'yMin'] + 
								(waypointUseMax ? 1 : -1) :
							pivot.y
					};

					// We're changing direction here, store that to make sure we
					// also change direction when adding the last segment array
					// after handling waypoint.
					dirIsX = !dirIsX;

					segments = segments.concat(clearPathTo({
						x: pivot.x,
						y: pivot.y
					}, waypoint, dirIsX));
				}
			}

			// Get segments for the other direction too
			// Recursion is our friend
			segments = segments.concat(clearPathTo(
				segments[segments.length - 1].end, toPoint, !dirIsX
			));

			return segments;
		}

		// Cut the obstacle array for optimization in large datasets
		chartObstacles = chartObstacles.slice(startObstacleIx, endObstacleIx + 1);

		// Remove obstacles that envelop the start/end points
/*		while ((startObstacleIx = findObstacleFromPoint(chartObstacles, start,
			options.obstacleOptions)) > -1) {
			chartObstacles.splice(startObstacleIx, 1);
		}		
*/		
		// TODO: this one as well
		while ((endObstacleIx = findObstacleFromPoint(chartObstacles, end, 
			options, options.obstacleOptions)) > -1) {
			chartObstacles.splice(endObstacleIx, 1);
		}

		// Find the path
		segments = clearPathTo(start, end);

		return {
			path: pathFromSegments(segments),
			obstacles: segments
		};
	}, {
		requiresObstacles: true
	})
};

export default algorithms;
