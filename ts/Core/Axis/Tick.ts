/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type CSSObject from '../Renderer/CSSObject';
import type PositionObject from '../Renderer/PositionObject';
import type { TickLike } from '../Axis/Types';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type TimeTicksInfoObject from './TimeTicksInfoObject';
import F from '../FormatUtilities.js';
import H from '../Globals.js';
const {
    deg2rad
} = H;
import U from '../Utilities.js';
const {
    clamp,
    correctFloat,
    defined,
    destroyObjectProperties,
    extend,
    fireEvent,
    isNumber,
    merge,
    objectEach,
    pick
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface AxisLabelsFormatterContextObject {
            tickPositionInfo?: TimeTicksInfoObject;
        }
        interface TickParametersObject {
            category?: string;
            options?: AnyRecord;
            tickmarkOffset?: number;
        }
        interface TickPositionObject extends PositionObject {
            opacity?: number;
        }
        interface Tick extends TickLike {}
        class Tick {
            public constructor(
                axis: Axis,
                pos: number,
                type?: string,
                noLabel?: boolean,
                parameters?: TickParametersObject
            );
            public axis: Axis;
            public gridLine?: SVGElement;
            public isActive?: boolean;
            public isFirst?: boolean;
            public isLast?: boolean;
            public isNew: boolean;
            public isNewLabel: boolean;
            public label?: SVGElement;
            public labelPos?: PositionObject;
            public mark?: SVGElement;
            public movedLabel?: SVGElement;
            public options?: DeepPartial<AxisOptions>;
            public parameters: TickParametersObject;
            public prevLabel?: SVGElement;
            public pos: number;
            public rotation?: number;
            public shortenLabel?: Function;
            public tickmarkOffset?: number;
            public type: string;
            public addLabel(): void;
            public createLabel(
                this: Highcharts.Tick,
                xy: PositionObject,
                str: string,
                labelOptions: XAxisLabelsOptions
            ): SVGElement|undefined;
            public destroy(): void;
            public getLabelPosition(
                x: number,
                y: number,
                label: SVGElement,
                horiz: boolean,
                labelOptions: PositionObject,
                tickmarkOffset: number,
                index: number,
                step: number
            ): PositionObject;
            public getLabelSize(): number;
            public getMarkPath(
                x: number,
                y: number,
                tickLength: number,
                tickWidth: number,
                horiz: boolean,
                renderer: Renderer
            ): SVGPath;
            public getPosition(
                horiz: boolean,
                tickPos: number,
                tickmarkOffset: number,
                old?: boolean
            ): PositionObject;
            public handleOverflow(xy: PositionObject): void;
            public moveLabel(
                str: string,
                labelOptions: XAxisLabelsOptions
            ): void;
            public replaceMovedLabel(): void;
            public render(index: number, old?: boolean, opacity?: number): void;
            public renderGridLine(
                old: boolean,
                opacity: number,
                reverseCrisp: number
            ): void;
            public renderLabel(
                xy: PositionObject,
                old: boolean,
                opacity: number,
                index: number
            ): void;
            public renderMark(
                xy: PositionObject,
                opacity: number,
                reverseCrisp: number
            ): void;
        }
    }
}

/**
 * Optional parameters for the tick.
 * @private
 * @interface Highcharts.TickParametersObject
 *//**
 * Set category for the tick.
 * @name Highcharts.TickParametersObject#category
 * @type {string|undefined}
 *//**
 * @name Highcharts.TickParametersObject#options
 * @type {Highcharts.Dictionary<any>|undefined}
 *//**
 * Set tickmarkOffset for the tick.
 * @name Highcharts.TickParametersObject#tickmarkOffset
 * @type {number|undefined}
 */

/**
 * Additonal time tick information.
 *
 * @interface Highcharts.TimeTicksInfoObject
 * @extends Highcharts.TimeNormalizedObject
 *//**
 * @name Highcharts.TimeTicksInfoObject#higherRanks
 * @type {Array<string>}
 *//**
 * @name Highcharts.TimeTicksInfoObject#totalRange
 * @type {number}
 */

''; // detach doclets above

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * The Tick class.
 *
 * @class
 * @name Highcharts.Tick
 *
 * @param {Highcharts.Axis} axis
 * The axis of the tick.
 *
 * @param {number} pos
 * The position of the tick on the axis in terms of axis values.
 *
 * @param {string} [type]
 * The type of tick, either 'minor' or an empty string
 *
 * @param {boolean} [noLabel=false]
 * Whether to disable the label or not. Defaults to false.
 *
 * @param {object} [parameters]
 * Optional parameters for the tick.
 */
class Tick {

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        axis: Highcharts.Axis,
        pos: number,
        type?: string,
        noLabel?: boolean,
        parameters?: Highcharts.TickParametersObject
    ) {
        /**
         * The related axis of the tick.
         * @name Highcharts.Tick#axis
         * @type {Highcharts.Axis}
         */
        this.axis = axis;
        /**
         * The logical position of the tick on the axis in terms of axis values.
         * @name Highcharts.Tick#pos
         * @type {number}
         */
        this.pos = pos;
        /**
         * The tick type, which can be `"minor"`, or an empty string.
         * @name Highcharts.Tick#type
         * @type {string}
         */
        this.type = type || '';
        this.parameters = parameters || {};
        /**
         * The mark offset of the tick on the axis. Usually `undefined`, numeric
         * for grid axes.
         * @name Highcharts.Tick#tickmarkOffset
         * @type {number|undefined}
         */
        this.tickmarkOffset = this.parameters.tickmarkOffset;

        this.options = this.parameters.options;

        fireEvent(this, 'init');

        if (!type && !noLabel) {
            this.addLabel();
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public axis: Highcharts.Axis;

    public gridLine?: SVGElement;

    public isActive?: boolean;

    public isFirst?: boolean;

    public isNew: boolean = true;

    public isNewLabel: boolean = true;

    public isLast?: boolean;

    public label?: SVGElement;

    public labelPos?: PositionObject;

    public mark?: SVGElement;

    public movedLabel?: SVGElement;

    public options?: DeepPartial<Highcharts.AxisOptions>;

    public parameters: Highcharts.TickParametersObject;

    public pos: number;

    public rotation?: number;

    public shortenLabel?: Function;

    public slotWidth?: number;

    public tickmarkOffset?: number;

    public type: string;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Write the tick label.
     *
     * @private
     * @function Highcharts.Tick#addLabel
     * @return {void}
     */
    public addLabel(): void {
        let tick = this,
            axis = tick.axis,
            options = axis.options,
            chart = axis.chart,
            categories = axis.categories,
            log = axis.logarithmic,
            names = axis.names,
            pos = tick.pos,
            labelOptions: Highcharts.XAxisLabelsOptions = pick(
                tick.options && tick.options.labels,
                options.labels
            ) as any,
            str: string,
            tickPositions = axis.tickPositions,
            isFirst = pos === tickPositions[0],
            isLast = pos === tickPositions[tickPositions.length - 1],
            label = tick.label,
            animateLabels = (!labelOptions.step || labelOptions.step === 1) &&
                axis.tickInterval === 1,
            tickPositionInfo = tickPositions.info,
            dateTimeLabelFormat,
            dateTimeLabelFormats,
            i,
            list: AnyRecord;

        // The context value
        let value = this.parameters.category || (
            categories ?
                pick(categories[pos], names[pos], pos) :
                pos
        );
        if (log && isNumber(value)) {
            value = correctFloat(log.lin2log(value));
        }


        // Set the datetime label format. If a higher rank is set for this
        // position, use that. If not, use the general format.
        if (axis.dateTime && tickPositionInfo) {
            dateTimeLabelFormats = chart.time.resolveDTLFormat(
                (options.dateTimeLabelFormats as any)[
                    (
                        !options.grid &&
                        tickPositionInfo.higherRanks[pos]
                    ) ||
                    tickPositionInfo.unitName
                ]
            );
            dateTimeLabelFormat = dateTimeLabelFormats.main;
        }

        // set properties for access in render method
        /**
         * True if the tick is the first one on the axis.
         * @name Highcharts.Tick#isFirst
         * @readonly
         * @type {boolean|undefined}
         */
        tick.isFirst = isFirst;
        /**
         * True if the tick is the last one on the axis.
         * @name Highcharts.Tick#isLast
         * @readonly
         * @type {boolean|undefined}
         */
        tick.isLast = isLast;

        // Get the string
        const ctx: Highcharts.AxisLabelsFormatterContextObject = {
            axis,
            chart,
            dateTimeLabelFormat: dateTimeLabelFormat as any,
            isFirst,
            isLast,
            pos,
            tick: tick as any,
            tickPositionInfo,
            value
        };

        // Fire an event that allows modifying the context for use in
        // `labels.format` and `labels.formatter`.
        fireEvent(this, 'labelFormat', ctx);

        // Label formatting. When `labels.format` is given, we first run the
        // defaultFormatter and append the result to the context as `text`.
        // Handy for adding prefix or suffix while keeping default number
        // formatting.
        const labelFormatter = (
            ctx: Highcharts.AxisLabelsFormatterContextObject
        ): string => {
            if (labelOptions.formatter) {
                return labelOptions.formatter.call(ctx, ctx);
            }
            if (labelOptions.format) {
                ctx.text = axis.defaultLabelFormatter.call(ctx);
                return F.format(labelOptions.format, ctx, chart);
            }
            return axis.defaultLabelFormatter.call(ctx, ctx);
        };
        str = labelFormatter.call(ctx, ctx);

        // Set up conditional formatting based on the format list if existing.
        list = dateTimeLabelFormats && dateTimeLabelFormats.list as any;
        if (list) {
            tick.shortenLabel = function (): void {
                for (i = 0; i < list.length; i++) {
                    extend(
                        ctx,
                        { dateTimeLabelFormat: list[i] }
                    );
                    (label as any).attr({
                        text: labelFormatter.call(ctx, ctx)
                    });
                    if (
                        (label as any).getBBox().width <
                        axis.getSlotWidth(tick as any) - 2 *
                            labelOptions.padding
                    ) {
                        return;
                    }
                }
                (label as any).attr({
                    text: ''
                });
            };
        }

        // Call only after first render
        if (animateLabels && axis._addedPlotLB) {
            tick.moveLabel(str, labelOptions);
        }
        // First call
        if (!defined(label) && !tick.movedLabel) {
            /**
             * The rendered text label of the tick.
             * @name Highcharts.Tick#label
             * @type {Highcharts.SVGElement|undefined}
             */
            tick.label = label = tick.createLabel(
                { x: 0, y: 0 },
                str,
                labelOptions
            );

            // Base value to detect change for new calls to getBBox
            tick.rotation = 0;

        // update
        } else if (label && label.textStr !== str && !animateLabels) {
            // When resetting text, also reset the width if dynamically set
            // (#8809)
            if (
                label.textWidth &&
                !labelOptions.style.width &&
                !(label.styles as any).width
            ) {
                label.css({ width: null as any });
            }

            label.attr({ text: str });

            label.textPxLength = label.getBBox().width;
        }
    }

    /**
     * Render and return the label of the tick.
     *
     * @private
     * @function Highcharts.Tick#createLabel
     * @param {Highcharts.PositionObject} xy
     * @param {string} str
     * @param {Highcharts.XAxisLabelsOptions} labelOptions
     * @return {Highcharts.SVGElement|undefined}
     */
    public createLabel(
        xy: PositionObject,
        str: string,
        labelOptions: Highcharts.XAxisLabelsOptions
    ): (SVGElement|undefined) {
        const axis = this.axis,
            chart = axis.chart,
            label = defined(str) && labelOptions.enabled ?
                chart.renderer
                    .text(
                        str,
                        xy.x,
                        xy.y,
                        labelOptions.useHTML
                    )
                    .add(axis.labelGroup) :
                null as any;

        // Un-rotated length
        if (label) {
            // Without position absolute, IE export sometimes is wrong
            if (!chart.styledMode) {
                label.css(merge(labelOptions.style));
            }

            label.textPxLength = label.getBBox().width;
        }

        return label;
    }

    /**
     * Destructor for the tick prototype
     *
     * @private
     * @function Highcharts.Tick#destroy
     * @return {void}
     */
    public destroy(): void {
        destroyObjectProperties(this, this.axis);
    }

    /**
     * Gets the x and y positions for ticks in terms of pixels.
     *
     * @private
     * @function Highcharts.Tick#getPosition
     *
     * @param {boolean} horiz
     * Whether the tick is on an horizontal axis or not.
     *
     * @param {number} tickPos
     * Position of the tick.
     *
     * @param {number} tickmarkOffset
     * Tickmark offset for all ticks.
     *
     * @param {boolean} [old]
     * Whether the axis has changed or not.
     *
     * @return {Highcharts.PositionObject}
     * The tick position.
     *
     * @fires Highcharts.Tick#event:afterGetPosition
     */
    public getPosition(
        horiz: boolean|undefined,
        tickPos: number,
        tickmarkOffset: number,
        old?: boolean
    ): PositionObject {
        let axis = this.axis,
            chart = axis.chart,
            cHeight = (old && chart.oldChartHeight) || chart.chartHeight,
            pos;

        pos = {
            x: horiz ?
                correctFloat(
                    (axis.translate(
                        tickPos + tickmarkOffset, null, null, old
                    ) as any) +
                    axis.transB
                ) :
                (
                    axis.left +
                    axis.offset +
                    (
                        axis.opposite ?
                            (
                                (
                                    (old && chart.oldChartWidth as any) ||
                                    (chart.chartWidth as any)
                                ) -
                                axis.right -
                                axis.left
                            ) :
                            0
                    )
                ),

            y: horiz ?
                (
                    (cHeight as any) -
                    axis.bottom +
                    axis.offset -
                    (axis.opposite ? axis.height : 0)
                ) :
                correctFloat(
                    (cHeight as any) -
                    (axis.translate(
                        tickPos + tickmarkOffset, null, null, old
                    ) as any) -
                    axis.transB
                )
        };

        // Chrome workaround for #10516
        pos.y = clamp(pos.y, -1e5, 1e5);

        fireEvent(this, 'afterGetPosition', { pos: pos });

        return pos;

    }

    /**
     * Get the x, y position of the tick label
     *
     * @private
     * @return {Highcharts.PositionObject}
     */
    public getLabelPosition(
        x: number,
        y: number,
        label: SVGElement,
        horiz: boolean,
        labelOptions: PositionObject,
        tickmarkOffset: number,
        index: number,
        step: number
    ): PositionObject {

        let axis = this.axis,
            transA = axis.transA,
            reversed = ( // #7911
                axis.isLinked && axis.linkedParent ?
                    axis.linkedParent.reversed :
                    axis.reversed
            ),
            staggerLines = axis.staggerLines,
            rotCorr = axis.tickRotCorr || { x: 0, y: 0 },
            yOffset = labelOptions.y,

            // Adjust for label alignment if we use reserveSpace: true (#5286)
            labelOffsetCorrection = (
                !horiz && !axis.reserveSpaceDefault ?
                    -(axis.labelOffset as any) * (
                        axis.labelAlign === 'center' ? 0.5 : 1
                    ) :
                    0
            ),
            line: number,
            pos = {} as PositionObject;

        if (!defined(yOffset)) {
            if (axis.side === 0) {
                yOffset = label.rotation ? -8 : -label.getBBox().height;
            } else if (axis.side === 2) {
                yOffset = rotCorr.y + 8;
            } else {
                // #3140, #3140
                yOffset = Math.cos((label.rotation as any) * deg2rad) *
                    (rotCorr.y - label.getBBox(false, 0).height / 2);
            }
        }

        x = x +
            labelOptions.x +
            labelOffsetCorrection +
            rotCorr.x -
            (
                tickmarkOffset && horiz ?
                    tickmarkOffset * transA * (reversed ? -1 : 1) :
                    0
            );
        y = y + yOffset - (tickmarkOffset && !horiz ?
            tickmarkOffset * transA * (reversed ? 1 : -1) : 0);

        // Correct for staggered labels
        if (staggerLines) {
            line = (index / (step || 1) % staggerLines);
            if (axis.opposite) {
                line = staggerLines - line - 1;
            }
            y += line * ((axis.labelOffset as any) / staggerLines);
        }

        pos.x = x;
        pos.y = Math.round(y);

        fireEvent(
            this,
            'afterGetLabelPosition',
            { pos: pos, tickmarkOffset: tickmarkOffset, index: index }
        );

        return pos;
    }

    /**
     * Get the offset height or width of the label
     *
     * @private
     * @function Highcharts.Tick#getLabelSize
     * @return {number}
     */
    public getLabelSize(): number {
        return this.label ?
            this.label.getBBox()[this.axis.horiz ? 'height' : 'width'] :
            0;
    }

    /**
     * Extendible method to return the path of the marker
     *
     * @private
     *
     */
    public getMarkPath(
        x: number,
        y: number,
        tickLength: number,
        tickWidth: number,
        horiz: boolean,
        renderer: Highcharts.Renderer
    ): SVGPath {
        return renderer.crispLine([[
            'M',
            x,
            y
        ], [
            'L',
            x + (horiz ? 0 : -tickLength),
            y + (horiz ? tickLength : 0)
        ]], tickWidth);
    }

    /**
     * Handle the label overflow by adjusting the labels to the left and right
     * edge, or hide them if they collide into the neighbour label.
     *
     * @private
     * @function Highcharts.Tick#handleOverflow
     * @param {Highcharts.PositionObject} xy
     * @return {void}
     */
    public handleOverflow(xy: PositionObject): void {
        let tick = this,
            axis = this.axis,
            labelOptions = axis.options.labels,
            pxPos = xy.x,
            chartWidth = axis.chart.chartWidth,
            spacing = axis.chart.spacing,
            leftBound = pick(
                axis.labelLeft,
                Math.min(axis.pos as any, spacing[3])
            ),
            rightBound = pick(
                axis.labelRight,
                Math.max(
                    !axis.isRadial ? (axis.pos as any) + axis.len : 0,
                    (chartWidth as any) - spacing[1]
                )
            ),
            label = this.label,
            rotation = this.rotation,
            factor = ({
                left: 0,
                center: 0.5,
                right: 1
            } as Record<string, number>)[
                axis.labelAlign || (label as any).attr('align')
            ],
            labelWidth = (label as any).getBBox().width,
            slotWidth = axis.getSlotWidth(tick as any),
            modifiedSlotWidth = slotWidth,
            xCorrection = factor,
            goRight = 1,
            leftPos,
            rightPos,
            textWidth,
            css: CSSObject = {};

        // Check if the label overshoots the chart spacing box. If it does, move
        // it. If it now overshoots the slotWidth, add ellipsis.
        if (!rotation && labelOptions.overflow === 'justify') {
            leftPos = pxPos - factor * labelWidth;
            rightPos = pxPos + (1 - factor) * labelWidth;

            if (leftPos < leftBound) {
                modifiedSlotWidth =
                    xy.x + modifiedSlotWidth * (1 - factor) - leftBound;
            } else if (rightPos > rightBound) {
                modifiedSlotWidth =
                    rightBound - xy.x + modifiedSlotWidth * factor;
                goRight = -1;
            }

            modifiedSlotWidth = Math.min(slotWidth, modifiedSlotWidth); // #4177
            if (modifiedSlotWidth < slotWidth && axis.labelAlign === 'center') {
                xy.x += (
                    goRight *
                    (
                        slotWidth -
                        modifiedSlotWidth -
                        xCorrection * (
                            slotWidth - Math.min(labelWidth, modifiedSlotWidth)
                        )
                    )
                );
            }
            // If the label width exceeds the available space, set a text width
            // to be picked up below. Also, if a width has been set before, we
            // need to set a new one because the reported labelWidth will be
            // limited by the box (#3938).
            if (
                labelWidth > modifiedSlotWidth ||
                (axis.autoRotation && ((label as any).styles || {}).width)
            ) {
                textWidth = modifiedSlotWidth;
            }

        // Add ellipsis to prevent rotated labels to be clipped against the edge
        // of the chart
        } else if (
            (rotation as any) < 0 &&
            pxPos - factor * labelWidth < leftBound
        ) {
            textWidth = Math.round(
                pxPos / Math.cos((rotation as any) * deg2rad) - leftBound
            );
        } else if (
            (rotation as any) > 0 &&
            pxPos + factor * labelWidth > rightBound
        ) {
            textWidth = Math.round(
                ((chartWidth as any) - pxPos) /
                Math.cos((rotation as any) * deg2rad)
            );
        }

        if (textWidth) {
            if (tick.shortenLabel) {
                tick.shortenLabel();
            } else {
                css.width = Math.floor(textWidth) + 'px';
                if (!(labelOptions.style || {}).textOverflow) {
                    css.textOverflow = 'ellipsis';
                }
                (label as any).css(css);

            }
        }
    }

    /**
     * Try to replace the label if the same one already exists.
     *
     * @private
     * @function Highcharts.Tick#moveLabel
     * @param {string} str
     * @param {Highcharts.XAxisLabelsOptions} labelOptions
     *
     * @return {void}
     */
    public moveLabel(str: string, labelOptions: Highcharts.XAxisLabelsOptions): void {
        let tick = this,
            label = tick.label,
            moved = false,
            axis = tick.axis,
            labelPos,
            reversed = axis.reversed,
            xPos,
            yPos;

        if (label && label.textStr === str) {
            tick.movedLabel = label;
            moved = true;
            delete tick.label;

        } else { // Find a label with the same string
            objectEach(axis.ticks, function (currentTick: Tick): void {
                if (
                    !moved &&
                    !currentTick.isNew &&
                    currentTick !== tick &&
                    currentTick.label &&
                    currentTick.label.textStr === str
                ) {
                    tick.movedLabel = currentTick.label;
                    moved = true;
                    currentTick.labelPos = tick.movedLabel.xy;
                    delete currentTick.label;
                }
            });
        }

        // Create new label if the actual one is moved
        if (!moved && (tick.labelPos || label)) {
            labelPos = tick.labelPos || (label as any).xy;
            xPos = axis.horiz ?
                (reversed ? 0 : axis.width + axis.left) : labelPos.x;
            yPos = axis.horiz ?
                labelPos.y : (reversed ? (axis.width + axis.left) : 0);

            tick.movedLabel = tick.createLabel(
                { x: xPos, y: yPos },
                str,
                labelOptions
            );

            if (tick.movedLabel) {
                tick.movedLabel.attr({ opacity: 0 });
            }
        }
    }

    /**
     * Put everything in place
     *
     * @private
     * @param {number} index
     * @param {boolean} [old]
     *        Use old coordinates to prepare an animation into new position
     * @param {number} [opacity]
     * @return {voids}
     */
    public render(
        index: number,
        old?: boolean,
        opacity?: number
    ): void {
        const tick = this,
            axis = tick.axis,
            horiz = axis.horiz,
            pos = tick.pos,
            tickmarkOffset = pick(tick.tickmarkOffset, axis.tickmarkOffset),
            xy = tick.getPosition(horiz, pos, tickmarkOffset, old),
            x = xy.x,
            y = xy.y,
            reverseCrisp = ((horiz && x === axis.pos + axis.len) ||
                (!horiz && y === axis.pos)) ? -1 : 1; // #1480, #1687

        const labelOpacity = pick(
            opacity,
            tick.label && tick.label.newOpacity, // #15528
            1
        );
        opacity = pick(opacity, 1);
        this.isActive = true;

        // Create the grid line
        this.renderGridLine(old, opacity, reverseCrisp);

        // create the tick mark
        this.renderMark(xy, opacity, reverseCrisp);

        // the label is created on init - now move it into place
        this.renderLabel(xy, old, labelOpacity, index);

        tick.isNew = false;

        fireEvent(this, 'afterRender');
    }

    /**
     * Renders the gridLine.
     *
     * @private
     * @param {boolean} old  Whether or not the tick is old
     * @param {number} opacity  The opacity of the grid line
     * @param {number} reverseCrisp  Modifier for avoiding overlapping 1 or -1
     * @return {void}
     */
    public renderGridLine(
        old: boolean|undefined,
        opacity: number,
        reverseCrisp: number
    ): void {
        let tick = this,
            axis = tick.axis,
            options = axis.options,
            gridLine = tick.gridLine,
            gridLinePath,
            attribs: SVGAttributes = {},
            pos = tick.pos,
            type = tick.type,
            tickmarkOffset = pick(tick.tickmarkOffset, axis.tickmarkOffset),
            renderer = axis.chart.renderer,
            gridLineWidth = options.gridLineWidth,
            gridLineColor = options.gridLineColor,
            dashStyle = options.gridLineDashStyle;

        if (tick.type === 'minor') {
            gridLineWidth = options.minorGridLineWidth;
            gridLineColor = options.minorGridLineColor;
            dashStyle = options.minorGridLineDashStyle;
        }

        if (!gridLine) {
            if (!axis.chart.styledMode) {
                attribs.stroke = gridLineColor;
                attribs['stroke-width'] = gridLineWidth || 0;
                attribs.dashstyle = dashStyle;
            }
            if (!type) {
                attribs.zIndex = 1;
            }
            if (old) {
                opacity = 0;
            }
            /**
             * The rendered grid line of the tick.
             * @name Highcharts.Tick#gridLine
             * @type {Highcharts.SVGElement|undefined}
             */
            tick.gridLine = gridLine = renderer.path()
                .attr(attribs)
                .addClass(
                    'highcharts-' + (type ? type + '-' : '') + 'grid-line'
                )
                .add(axis.gridGroup);

        }

        if (gridLine) {
            gridLinePath = axis.getPlotLinePath(
                {
                    value: pos + tickmarkOffset,
                    lineWidth: gridLine.strokeWidth() * reverseCrisp,
                    force: 'pass',
                    old: old
                }
            );

            // If the parameter 'old' is set, the current call will be followed
            // by another call, therefore do not do any animations this time
            if (gridLinePath) {
                gridLine[old || tick.isNew ? 'attr' : 'animate']({
                    d: gridLinePath,
                    opacity: opacity
                });
            }
        }
    }

    /**
     * Renders the tick mark.
     *
     * @private
     * @param {Highcharts.PositionObject} xy  The position vector of the mark
     * @param {number} opacity  The opacity of the mark
     * @param {number} reverseCrisp  Modifier for avoiding overlapping 1 or -1
     * @return {void}
     */
    public renderMark(
        xy: PositionObject,
        opacity: number,
        reverseCrisp: number
    ): void {
        let tick = this,
            axis = tick.axis,
            options = axis.options,
            renderer = axis.chart.renderer,
            type = tick.type,
            tickSize = axis.tickSize(type ? type + 'Tick' : 'tick'),
            mark = tick.mark,
            isNewMark = !mark,
            x = xy.x,
            y = xy.y,
            tickWidth = pick(
                options[type !== 'minor' ? 'tickWidth' : 'minorTickWidth'],
                !type && axis.isXAxis ? 1 : 0
            ), // X axis defaults to 1
            tickColor = options[
                type !== 'minor' ? 'tickColor' : 'minorTickColor'
            ];

        if (tickSize) {

            // negate the length
            if (axis.opposite) {
                tickSize[0] = -tickSize[0];
            }

            // First time, create it
            if (isNewMark) {
                /**
                 * The rendered mark of the tick.
                 * @name Highcharts.Tick#mark
                 * @type {Highcharts.SVGElement|undefined}
                 */
                tick.mark = mark = renderer.path()
                    .addClass('highcharts-' + (type ? type + '-' : '') + 'tick')
                    .add(axis.axisGroup);

                if (!axis.chart.styledMode) {
                    mark.attr({
                        stroke: tickColor,
                        'stroke-width': tickWidth
                    });
                }
            }
            (mark as any)[isNewMark ? 'attr' : 'animate']({
                d: tick.getMarkPath(
                    x,
                    y,
                    tickSize[0],
                    (mark as any).strokeWidth() * reverseCrisp,
                    axis.horiz as any,
                    renderer
                ),
                opacity: opacity
            });

        }
    }

    /**
     * Renders the tick label.
     * Note: The label should already be created in init(), so it should only
     * have to be moved into place.
     *
     * @private
     * @param {Highcharts.PositionObject} xy  The position vector of the label
     * @param {boolean} old  Whether or not the tick is old
     * @param {number} opacity  The opacity of the label
     * @param {number} index  The index of the tick
     * @return {void}
     */
    public renderLabel(
        xy: Highcharts.TickPositionObject,
        old: boolean|undefined,
        opacity: number,
        index: number
    ): void {
        let tick = this,
            axis = tick.axis,
            horiz = axis.horiz,
            options = axis.options,
            label = tick.label,
            labelOptions = options.labels,
            step = labelOptions.step,
            tickmarkOffset = pick(tick.tickmarkOffset, axis.tickmarkOffset),
            show = true,
            x = xy.x,
            y = xy.y;

        if (label && isNumber(x)) {
            label.xy = xy = tick.getLabelPosition(
                x,
                y,
                label,
                horiz as any,
                labelOptions as any,
                tickmarkOffset,
                index,
                step
            );
            // Apply show first and show last. If the tick is both first and
            // last, it is a single centered tick, in which case we show the
            // label anyway (#2100).
            if (
                (
                    tick.isFirst &&
                    !tick.isLast &&
                    !options.showFirstLabel
                ) ||
                (
                    tick.isLast &&
                    !tick.isFirst &&
                    !options.showLastLabel
                )
            ) {
                show = false;

            // Handle label overflow and show or hide accordingly
            } else if (
                horiz &&
                !labelOptions.step &&
                !labelOptions.rotation &&
                !old &&
                opacity !== 0
            ) {
                tick.handleOverflow(xy);
            }

            // apply step
            if (step && index % step) {
                // show those indices dividable by step
                show = false;
            }

            // Set the new position, and show or hide
            if (show && isNumber(xy.y)) {
                xy.opacity = opacity;
                label[tick.isNewLabel ? 'attr' : 'animate'](xy);
                tick.isNewLabel = false;
            } else {
                label.attr('y', -9999 as any); // #1338
                tick.isNewLabel = true;
            }
        }
    }

    /**
     * Replace labels with the moved ones to perform animation. Additionally
     * destroy unused labels.
     *
     * @private
     * @function Highcharts.Tick#replaceMovedLabel
     * @return {void}
     */
    public replaceMovedLabel(): void {
        let tick = this,
            label = tick.label,
            axis = tick.axis,
            reversed = axis.reversed,
            x,
            y;

        // Animate and destroy
        if (label && !tick.isNew) {
            x = axis.horiz ? (
                reversed ? axis.left : axis.width + axis.left
            ) : label.xy.x;
            y = axis.horiz ?
                label.xy.y :
                (reversed ? axis.width + axis.top : axis.top);

            label.animate(
                { x: x, y: y, opacity: 0 },
                void 0,
                label.destroy
            );

            delete tick.label;
        }

        axis.isDirty = true;
        tick.label = tick.movedLabel;
        delete tick.movedLabel;
    }
}

H.Tick = Tick as typeof Highcharts.Tick;

export default H.Tick;
