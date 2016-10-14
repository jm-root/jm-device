/*
 *
 *   Copyright (c) 2001, Carlos E. Vidales. All rights reserved.
 *
 *   This sample program was written and put in the public domain
 *    by Carlos E. Vidales.  The program is provided "as is"
 *    without warranty of any kind, either expressed or implied.
 *   If you choose to use the program within your own products
 *    you do so at your own risk, and assume the responsibility
 *    for servicing, repairing or correcting the program should
 *    it prove defective in any manner.
 *   You may copy and distribute the program's source code in any
 *    medium, provided that you also include in each copy an
 *    appropriate copyright notice and disclaimer of warranty.
 *   You may also modify this program and distribute copies of
 *    it provided that you include prominent notices stating
 *    that you changed the file(s) and the date of any change,
 *    and that you do not charge any royalties or licenses for
 *    its use.
 *
 *
 *
 *   File Name:  calibrate
 *
 *
 *   This file contains functions that implement calculations
 *    necessary to obtain calibration factors for a touch screen
 *    that suffers from multiple distortion effects: namely,
 *    translation, scaling and rotation.
 *
 *   The following set of equations represent a valid display
 *    point given a corresponding set of touch screen points:
 *
 *
 *                                              /-     -\
 *              /-    -\     /-            -\   |       |
 *              |      |     |              |   |   Xs  |
 *              |  Xd  |     | A    B    C  |   |       |
 *              |      |  =  |              | * |   Ys  |
 *              |  Yd  |     | D    E    F  |   |       |
 *              |      |     |              |   |   1   |
 *              \-    -/     \-            -/   |       |
 *                                              \-     -/
 *
 *
 *    where:
 *
 *           (Xd,Yd) represents the desired display point
 *                    coordinates,
 *
 *           (Xs,Ys) represents the available touch screen
 *                    coordinates, and the matrix
 *
 *           /-   -\
 *           |A,B,C|
 *           |D,E,F| represents the factors used to translate
 *           \-   -/  the available touch screen point values
 *                    into the corresponding display
 *                    coordinates.
 *
 *
 *    Note that for practical considerations, the utilitities
 *     within this file do not use the matrix coefficients as
 *     defined above, but instead use the following
 *     equivalents, since floating point math is not used:
 *
 *            A = An/Divider
 *            B = Bn/Divider
 *            C = Cn/Divider
 *            D = Dn/Divider
 *            E = En/Divider
 *            F = Fn/Divider
 *
 *
 *
 *    The functions provided within this file are:
 *
 *          init() - calculates the set of factors
 *                                    in the above equation, given
 *                                    three sets of test points.
 *               transform() - returns the actual display
 *                                    coordinates, given a set of
 *                                    touch screen coordinates.
 *
 *
 */
var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {


    jm.device.Calibrate = jm.EventEmitter.extend({
        _className: 'calibrate',

        ctor: function () {
            this._super();
        },

        /**********************************************************************
         *
         *     Function: init()
         *
         *  Description: Calling this function with valid input data
         *                in the display and screen input arguments
         *                causes the calibration factors between the
         *                screen and display points to be calculated,
         *                and the output argument - m - to be
         *                populated.
         *
         *               This function needs to be called only when new
         *                calibration factors are desired.
         *
         *
         *  Argument(s): t (input) - Pointer to an array of three
         *                                     sample, reference points.
         *               s (input) - Pointer to the array of touch
         *                                    screen points corresponding
         *                                    to the reference display points.
         *               m (output) - Pointer to the calibration
         *                                     matrix computed for the set
         *                                     of points being provided.
         *
         *
         *  From the article text, recall that the matrix coefficients are
         *   resolved to be the following:
         *
         *
         *      Divider =  (Xs0 - Xs2)*(Ys1 - Ys2) - (Xs1 - Xs2)*(Ys0 - Ys2)
         *
         *
         *
         *                 (Xd0 - Xd2)*(Ys1 - Ys2) - (Xd1 - Xd2)*(Ys0 - Ys2)
         *            A = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 (Xs0 - Xs2)*(Xd1 - Xd2) - (Xd0 - Xd2)*(Xs1 - Xs2)
         *            B = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 Ys0*(Xs2*Xd1 - Xs1*Xd2) +
         *                             Ys1*(Xs0*Xd2 - Xs2*Xd0) +
         *                                           Ys2*(Xs1*Xd0 - Xs0*Xd1)
         *            C = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 (Yd0 - Yd2)*(Ys1 - Ys2) - (Yd1 - Yd2)*(Ys0 - Ys2)
         *            D = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 (Xs0 - Xs2)*(Yd1 - Yd2) - (Yd0 - Yd2)*(Xs1 - Xs2)
         *            E = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 Ys0*(Xs2*Yd1 - Xs1*Yd2) +
         *                             Ys1*(Xs0*Yd2 - Xs2*Yd0) +
         *                                           Ys2*(Xs1*Yd0 - Xs0*Yd1)
         *            F = ---------------------------------------------------
         *                                   Divider
         *
         *
         *       Return: OK - the calibration matrix was correctly
         *                     calculated and its value is in the
         *                     output argument.
         *               NOT_OK - an error was detected and the
         *                         function failed to return a valid
         *                         set of matrix values.
         *                        The only time this sample code returns
         *                        NOT_OK is when Divider == 0
         *
         *
         *
         *                 NOTE!    NOTE!    NOTE!
         *
         *  init() and transform() will do fine
         *  for you as they are, provided that your digitizer
         *  resolution does not exceed 10 bits (1024 values).  Higher
         *  resolutions may cause the integer operations to overflow
         *  and return incorrect values.  If you wish to use these
         *  functions with digitizer resolutions of 12 bits (4096
         *  values) you will either have to a) use 64-bit signed
         *  integer variables and math, or b) judiciously modify the
         *  operations to scale results by a factor of 2 or even 4.
         *
         *
         */
        init: function (s, t) {
            var m = {};
            m.Divider = ((s[0].x - s[2].x) * (s[1].y - s[2].y)) -
                ((s[1].x - s[2].x) * (s[0].y - s[2].y));

            if (m.Divider == 0) return false;

            m.An = ((t[0].x - t[2].x) * (s[1].y - s[2].y)) -
                ((t[1].x - t[2].x) * (s[0].y - s[2].y));

            m.Bn = ((s[0].x - s[2].x) * (t[1].x - t[2].x)) -
                ((t[0].x - t[2].x) * (s[1].x - s[2].x));

            m.Cn = (s[2].x * t[1].x - s[1].x * t[2].x) * s[0].y +
                (s[0].x * t[2].x - s[2].x * t[0].x) * s[1].y +
                (s[1].x * t[0].x - s[0].x * t[1].x) * s[2].y;

            m.Dn = ((t[0].y - t[2].y) * (s[1].y - s[2].y)) -
                ((t[1].y - t[2].y) * (s[0].y - s[2].y));

            m.En = ((s[0].x - s[2].x) * (t[1].y - t[2].y)) -
                ((t[0].y - t[2].y) * (s[1].x - s[2].x));

            m.Fn = (s[2].x * t[1].y - s[1].x * t[2].y) * s[0].y +
                (s[0].x * t[2].y - s[2].x * t[0].y) * s[1].y +
                (s[1].x * t[0].y - s[0].x * t[1].y) * s[2].y;

            this.matrix = m;
            return true;
        },

        /**********************************************************************
         *
         *     Function: transform()
         *
         *  Description: Given a valid set of calibration factors and a point
         *                value reported by the touch screen, this function
         *                calculates and returns the true (or closest to true)
         *                display point below the spot where the touch screen
         *                was touched.
         *
         *
         *
         *  Argument(s): t (output) - Pointer to the calculated
         *                                      (true) display point.
         *               s (input) - Pointer to the reported touch
         *                                    screen point.
         *               m (input) - Pointer to calibration factors
         *                                    matrix previously calculated
         *                                    from a call to
         *                                    init()
         *
         *
         *  The function simply solves for Xd and Yd by implementing the
         *   computations required by the translation matrix.
         *
         *                                              /-     -\
         *              /-    -\     /-            -\   |       |
         *              |      |     |              |   |   Xs  |
         *              |  Xd  |     | A    B    C  |   |       |
         *              |      |  =  |              | * |   Ys  |
         *              |  Yd  |     | D    E    F  |   |       |
         *              |      |     |              |   |   1   |
         *              \-    -/     \-            -/   |       |
         *                                              \-     -/
         *
         *  It must be kept brief to avoid consuming CPU cycles.
         *
         *
         *       Return: OK - the display point was correctly calculated
         *                     and its value is in the output argument.
         *               NOT_OK - an error was detected and the function
         *                         failed to return a valid point.
         *
         *
         *
         *                 NOTE!    NOTE!    NOTE!
         *
         *  init() and transform() will do fine
         *  for you as they are, provided that your digitizer
         *  resolution does not exceed 10 bits (1024 values).  Higher
         *  resolutions may cause the integer operations to overflow
         *  and return incorrect values.  If you wish to use these
         *  functions with digitizer resolutions of 12 bits (4096
         *  values) you will either have to a) use 64-bit signed
         *  integer variables and math, or b) judiciously modify the
         *  operations to scale results by a factor of 2 or even 4.
         *
         *
         */
        transform: function (s) {
            var m = this.matrix;
            if (!m || !m.Divider) return null;
            var t = {};

            /* Operation order is important since we are doing integer */
            /*  math. Make sure you add all terms together before      */
            /*  dividing, so that the remainder is not rounded off     */
            /*  prematurely.                                           */

            t.x = ( (m.An * s.x) +
                    (m.Bn * s.y) +
                    m.Cn
                ) / m.Divider;

            t.y = ( (m.Dn * s.x) +
                    (m.En * s.y) +
                    m.Fn
                ) / m.Divider;

            return t;
        }

    });

    jm.device.Calibrate.generateSamplePoints = function (width, height) {
        var w = width;
        var h = height;
        var w0 = w * 0.8;
        var h0 = h * 0.8;
        var dw = w * 0.1;
        var dh = h * 0.1;
        dx1 = dw - 1;
        dy1 = dh - 1;
        dx2 = dx1 + w0;
        dy2 = h / 2 - 1;
        dx3 = w / 2 - 1;
        dy3 = dy1 + h0;

        return [
            {
                x: dx1,
                y: dy1
            },
            {
                x: dx2,
                y: dy2
            },
            {
                x: dx3,
                y: dy3
            }
        ];
    };

})();