/// <reference path="../../js/jquery.d.ts" />

import utils = require("../../utils");
import baseExtension = require("../coreplayer-shared-module/baseExtension");
import extension = require("../../extensions/coreplayer-seadragon-extension/extension");
import shell = require("../coreplayer-shared-module/shell");
import baseView = require("../coreplayer-shared-module/baseView");
import IProvider = require("../coreplayer-shared-module/iProvider");
import ISeadragonProvider = require("../../extensions/coreplayer-seadragon-extension/iSeadragonProvider");
import Thumb = require("../coreplayer-shared-module/thumb");

export class ThumbsView extends baseView.BaseView {

    $thumbs: JQuery;
    $selectedThumb: JQuery;

    lastThumbClickedIndex: number;

    static THUMB_SELECTED: string = 'thumbsView.onThumbSelected';

    public thumbs: Array<Thumb>;

    constructor($element: JQuery) {
        super($element, true, true);
    }

    create(): void {

        this.setConfig('treeViewLeftPanel');

        super.create();

        $.subscribe(baseExtension.BaseExtension.CANVAS_INDEX_CHANGED, (e, index) => {
            this.selectIndex(parseInt(index));
        });

        $.subscribe(extension.Extension.MODE_CHANGED, (e, mode) => {
            this.setLabel();
        });

        this.$thumbs = utils.Utils.createDiv('thumbs');
        this.$element.append(this.$thumbs);

        $.templates({
            thumbsTemplate: '<div class="thumb" data-src="{{>url}}" data-visible="{{>visible}}">\
                                <div class="wrap" style="height:{{>height + ~extraHeight()}}px"></div>\
                                <span class="index">{{:#index + 1}}</span>\
                                <span class="label">{{>label}}&nbsp;</span>\
                            </div>\
                            {{if ~isEven(#index + 1)}} \
                                <div class="separator"></div> \
                            {{/if}}'
        });

        var extraHeight = this.options.thumbsExtraHeight;

        $.views.helpers({
            isEven: function(num){
                return (num % 2 == 0) ? true : false;
            },
            extraHeight: function(){
                return extraHeight;
            }
        });

        // use unevent to detect scroll stop.
        this.$element.on('scroll', () => {
            this.scrollStop();
        }, 1000);

        this.resize();
    }

    public dataBind(): void{
        if (!this.thumbs) return;
        this.createThumbs();
    }

    createThumbs(): void{
        var that = this;

        if (!this.thumbs) return;

        this.$thumbs.link($.templates.thumbsTemplate, this.thumbs);

        this.$thumbs.delegate(".thumb", "click", function (e) {
            e.preventDefault();

            var data = $.view(this).data;

            that.lastThumbClickedIndex = data.index;

            $.publish(ThumbsView.THUMB_SELECTED, [data.index]);
        });

        this.selectIndex(this.provider.canvasIndex);

        this.setLabel();

        // do initial load to show padlocks
        this.loadThumbs(0);
    }

    scrollStop(): void {

        var scrollPos = 1 / ((this.$thumbs.height() - this.$element.height()) / this.$element.scrollTop());

        if (scrollPos > 1) scrollPos = 1;

        var thumbRangeMid = Math.floor((this.thumbs.length - 1) * scrollPos);

        this.loadThumbs(thumbRangeMid);
    }

    loadThumbs(index): void {

        if (!this.thumbs || !this.thumbs.length) return;

        index = parseInt(index);

        var thumbRangeMid = index;
        var thumbLoadRange = this.options.thumbsLoadRange;

        var thumbRange = {
            start: (thumbRangeMid > thumbLoadRange) ? thumbRangeMid - thumbLoadRange : 0,
            end: (thumbRangeMid < (this.thumbs.length - 1) - thumbLoadRange) ? thumbRangeMid + thumbLoadRange : this.thumbs.length - 1
        };

        //console.log('start: ' + thumbRange.start + ' end: ' + thumbRange.end);

        var fadeDuration = this.options.thumbsImageFadeInDuration;

        for (var i = thumbRange.start; i <= thumbRange.end; i++) {

            var thumbElem = $(this.$thumbs.find('.thumb')[i]);
            var imgCont = thumbElem.find('.wrap');

            // if no img has been added yet
            if (!imgCont.hasClass('loading') && !imgCont.hasClass('loaded')) {
                var visible = thumbElem.attr('data-visible');

                if (visible !== "false") {
                    imgCont.addClass('loading');
                    var src = thumbElem.attr('data-src');
                    //console.log(i, src);
                    var img = $('<img src="' + src + '" />');
                    // fade in on load.
                    $(img).hide().load(function () {
                        $(this).fadeIn(fadeDuration, function () {
                            $(this).parent().swapClass('loading', 'loaded');
                        });
                    });
                    imgCont.append(img);
                } else {
                    imgCont.addClass('hidden');
                }
            }
        }
    }

    show(): void {
        this.$element.show();

        setTimeout(() => {
            this.selectIndex(this.provider.canvasIndex);
        }, 1);

    }

    hide(): void {
        this.$element.hide();
    }

    isPDF(): boolean{
        return (this.provider.getSequenceType() === "application-pdf");
    }

    setLabel(): void {

        if (this.isPDF()){
            $(this.$thumbs).find('span.index').hide();
            $(this.$thumbs).find('span.label').hide();
        } else {
            if((<extension.Extension>this.extension).getMode() == extension.Extension.PAGE_MODE) {
                $(this.$thumbs).find('span.index').hide();
                $(this.$thumbs).find('span.label').show();
            } else {
                $(this.$thumbs).find('span.index').show();
                $(this.$thumbs).find('span.label').hide();
            }
        }

    }

    selectIndex(index): void {

        // may be authenticating
        if (index == -1) return;

        if (!this.thumbs || !this.thumbs.length) return;

        index = parseInt(index);

        if (this.$selectedThumb) {
            this.$selectedThumb.removeClass('selected');
        }

        this.$selectedThumb = $(this.$thumbs.find('.thumb')[index]);
        this.$selectedThumb.addClass('selected');

        // scroll to thumb if the index change didn't originate
        // within the thumbs view.
        if (this.lastThumbClickedIndex != index) {
            var scrollTop = this.$element.scrollTop() + this.$selectedThumb.position().top - (this.$selectedThumb.height() / 2);
            this.$element.scrollTop(scrollTop);
        }

        // make sure visible images are loaded.
        this.loadThumbs(index);
    }

    resize(): void {
        super.resize();

    }
}