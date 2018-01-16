//  Based on the three.js Curve classes created by [zz85](http://www.lab4games.net/zz85/blog)

var Class = require('../../utils/Class');
var FromPoints = require('../../geom/rectangle/FromPoints');
var Rectangle = require('../../geom/rectangle/Rectangle');
var Vector2 = require('../../math/Vector2');

//  Our Base Curve which all other curves extend

var Curve = new Class({

    initialize:

    /**
     * [description]
     *
     * @class Curve
     * @memberOf Phaser.Curves
     * @constructor
     * @since 3.0.0
     *
     * @param {string} type - [description]
     */
    function Curve (type)
    {
        /**
         * String based identifier
         *
         * @property {string} type
         */
        this.type = type;

        /**
         * [description]
         *
         * @property {integer} defaultDivisions
         * @default 5
         */
        this.defaultDivisions = 5;

        /**
         * [description]
         *
         * @property {integer} arcLengthDivisions
         * @default 100
         */
        this.arcLengthDivisions = 100;

        /**
         * [description]
         *
         * @property {array} cacheArcLengths
         * @default []
         */
        this.cacheArcLengths = [];

        /**
         * [description]
         *
         * @property {boolean} needsUpdate
         * @default true
         */
        this.needsUpdate = true;

        /**
         * [description]
         *
         * @property {boolean} active
         * @default true
         */
        this.active = true;

        /**
         * [description]
         *
         * @property {Phaser.Math.Vector2} _tmpVec2A
         * @private
         */
        this._tmpVec2A = new Vector2();

        /**
         * [description]
         *
         * @property {Phaser.Math.Vector2} _tmpVec2B
         * @private
         */
        this._tmpVec2B = new Vector2();
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#draw
     * @since 3.0.0
     *
     * @param {Phaser.GameObjects.Graphics} graphics - [description]
     * @param {integer} [pointsTotal=32] - [description]
     *
     * @return {Phaser.GameObjects.Graphics} [description]
     */
    draw: function (graphics, pointsTotal)
    {
        if (pointsTotal === undefined) { pointsTotal = 32; }

        //  So you can chain graphics calls
        return graphics.strokePoints(this.getPoints(pointsTotal));
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getBounds
     * @since 3.0.0
     *
     * @param {Phaser.Geom.Rectangle} out - [description]
     * @param {integer} [accuracy=16] - [description]
     *
     * @return {Phaser.Geom.Rectangle} [description]
     */
    getBounds: function (out, accuracy)
    {
        if (out === undefined) { out = new Rectangle(); }
        if (accuracy === undefined) { accuracy = 16; }

        var len = this.getLength();

        if (accuracy > len)
        {
            accuracy = len / 2;
        }

        //  The length of the curve in pixels
        //  So we'll have 1 spaced point per 'accuracy' pixels

        var spaced = Math.max(1, Math.round(len / accuracy));

        return FromPoints(this.getSpacedPoints(spaced), out);
    },

    //  Return an array of points, spaced out X distance pixels apart

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getDistancePoints
     * @since 3.0.0
     *
     * @param {integer} distance - [description]
     *
     * @return {Phaser.Geom.Point[]} [description]
     */
    getDistancePoints: function (distance)
    {
        var len = this.getLength();

        var spaced = Math.max(1, len / distance);

        return this.getSpacedPoints(spaced);
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getEndPoint
     * @since 3.0.0
     *
     * @param {Phaser.Math.Vector2} out - [description]
     *
     * @return {Phaser.Math.Vector2} [description]
     */
    getEndPoint: function (out)
    {
        if (out === undefined) { out = new Vector2(); }

        return this.getPointAt(1, out);
    },

    // Get total curve arc length

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getLength
     * @since 3.0.0
     *
     * @return {number} [description]
     */
    getLength: function ()
    {
        var lengths = this.getLengths();

        return lengths[lengths.length - 1];
    },

    // Get list of cumulative segment lengths

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getLengths
     * @since 3.0.0
     *
     * @param {integer} [divisions] - [description]
     *
     * @return {number[]} [description]
     */
    getLengths: function (divisions)
    {
        if (divisions === undefined) { divisions = this.arcLengthDivisions; }

        if ((this.cacheArcLengths.length === divisions + 1) && !this.needsUpdate)
        {
            return this.cacheArcLengths;
        }

        this.needsUpdate = false;

        var cache = [];
        var current;
        var last = this.getPoint(0, this._tmpVec2A);
        var sum = 0;

        cache.push(0);

        for (var p = 1; p <= divisions; p++)
        {
            current = this.getPoint(p / divisions, this._tmpVec2B);

            sum += current.distance(last);

            cache.push(sum);

            last.copy(current);
        }

        this.cacheArcLengths = cache;

        return cache; // { sums: cache, sum:sum }; Sum is in the last element.
    },

    // Get point at relative position in curve according to arc length

    // - u [0 .. 1]

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getPointAt
     * @since 3.0.0
     *
     * @param {float} u - [description]
     * @param {Phaser.Math.Vector2} [out] - [description]
     *
     * @return {Phaser.Math.Vector2} [description]
     */
    getPointAt: function (u, out)
    {
        var t = this.getUtoTmapping(u);

        return this.getPoint(t, out);
    },

    // Get sequence of points using getPoint( t )

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getPoints
     * @since 3.0.0
     *
     * @param {integer} [divisions] - [description]
     *
     * @return {Phaser.Math.Vector2[]} [description]
     */
    getPoints: function (divisions)
    {
        if (divisions === undefined) { divisions = this.defaultDivisions; }

        var points = [];

        for (var d = 0; d <= divisions; d++)
        {
            points.push(this.getPoint(d / divisions));
        }

        return points;
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getRandomPoint
     * @since 3.0.0
     *
     * @param {Phaser.Math.Vector2} [out] - [description]
     *
     * @return {Phaser.Math.Vector2} [description]
     */
    getRandomPoint: function (out)
    {
        if (out === undefined) { out = new Vector2(); }

        return this.getPoint(Math.random(), out);
    },

    // Get sequence of points using getPointAt( u )

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getSpacedPoints
     * @since 3.0.0
     *
     * @param {integer} [divisions] - [description]
     *
     * @return {Phaser.Math.Vector2[]} [description]
     */
    getSpacedPoints: function (divisions)
    {
        if (divisions === undefined) { divisions = this.defaultDivisions; }

        var points = [];

        for (var d = 0; d <= divisions; d++)
        {
            var t = this.getUtoTmapping(d / divisions, null, divisions);

            points.push(this.getPoint(t));
        }

        return points;
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getStartPoint
     * @since 3.0.0
     *
     * @param {Phaser.Math.Vector2} [out] - [description]
     *
     * @return {Phaser.Math.Vector2} [description]
     */
    getStartPoint: function (out)
    {
        if (out === undefined) { out = new Vector2(); }

        return this.getPointAt(0, out);
    },

    // Returns a unit vector tangent at t
    // In case any sub curve does not implement its tangent derivation,
    // 2 points a small delta apart will be used to find its gradient
    // which seems to give a reasonable approximation

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getTangent
     * @since 3.0.0
     *
     * @param {number} t - [description]
     * @param {Phaser.Math.Vector2} [out] - [description]
     *
     * @return {Phaser.Math.Vector2} [description]
     */
    getTangent: function (t, out)
    {
        if (out === undefined) { out = new Vector2(); }

        var delta = 0.0001;
        var t1 = t - delta;
        var t2 = t + delta;

        // Capping in case of danger

        if (t1 < 0)
        {
            t1 = 0;
        }

        if (t2 > 1)
        {
            t2 = 1;
        }

        this.getPoint(t1, this._tmpVec2A);
        this.getPoint(t2, out);

        return out.subtract(this._tmpVec2A).normalize();
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getTangentAt
     * @since 3.0.0
     *
     * @param {float} u - [description]
     * @param {Phaser.Math.Vector2} [out] - [description]
     *
     * @return {Phaser.Math.Vector2} [description]
     */
    getTangentAt: function (u, out)
    {
        var t = this.getUtoTmapping(u);

        return this.getTangent(t, out);
    },

    //  Given a distance in pixels, get a t to find p.
    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getTFromDistance
     * @since 3.0.0
     *
     * @param {integer} distance - [description]
     * @param {integer} [divisions] - [description]
     *
     * @return {float} [description]
     */
    getTFromDistance: function (distance, divisions)
    {
        if (distance <= 0)
        {
            return 0;
        }

        return this.getUtoTmapping(0, distance, divisions);
    },

    // Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#getUtoTmapping
     * @since 3.0.0
     *
     * @param {float} u - [description]
     * @param {integer} distance - [description]
     * @param {integer} [divisions] - [description]
     *
     * @return {number} [description]
     */
    getUtoTmapping: function (u, distance, divisions)
    {
        var arcLengths = this.getLengths(divisions);

        var i = 0;
        var il = arcLengths.length;

        var targetArcLength; // The targeted u distance value to get

        if (distance)
        {
            //  Cannot overshoot the curve
            targetArcLength = Math.min(distance, arcLengths[il - 1]);
        }
        else
        {
            targetArcLength = u * arcLengths[il - 1];
        }

        // binary search for the index with largest value smaller than target u distance

        var low = 0;
        var high = il - 1;
        var comparison;

        while (low <= high)
        {
            i = Math.floor(low + (high - low) / 2); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

            comparison = arcLengths[i] - targetArcLength;

            if (comparison < 0)
            {
                low = i + 1;
            }
            else if (comparison > 0)
            {
                high = i - 1;
            }
            else
            {
                high = i;
                break;
            }
        }

        i = high;

        if (arcLengths[i] === targetArcLength)
        {
            return i / (il - 1);
        }

        // we could get finer grain at lengths, or use simple interpolation between two points

        var lengthBefore = arcLengths[i];
        var lengthAfter = arcLengths[i + 1];

        var segmentLength = lengthAfter - lengthBefore;

        // determine where we are between the 'before' and 'after' points

        var segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

        // add that fractional amount to t

        return (i + segmentFraction) / (il - 1);
    },

    /**
     * [description]
     *
     * @method Phaser.Curves.Curve#updateArcLengths
     * @since 3.0.0
     */
    updateArcLengths: function ()
    {
        this.needsUpdate = true;

        this.getLengths();
    }

});

module.exports = Curve;
